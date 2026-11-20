"""FLOVA API: steady weekly salary for gig workers with irregular income."""

from __future__ import annotations

import os
import sqlite3
from contextlib import asynccontextmanager
from functools import lru_cache

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from udaan_engine import PROFILES, backtest_all, generate_year, run_rule

from . import service
from .db import get_conn, init_db
from .schemas import MAX_PAYOUT, MIN_PAYOUT, PayoutIn, Rider, RiderIn, SmsIn


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(title="FLOVA API", version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("FLOVA_CORS", "http://localhost:5173").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


def _rider_or_404(conn: sqlite3.Connection, rider_id: int) -> dict:
    try:
        return service.get_rider(conn, rider_id)
    except service.NotFound as e:
        raise HTTPException(404, str(e)) from e


@app.get("/health")
def health() -> dict:
    return {"ok": True}


@app.get("/profiles")
def profiles() -> list[dict]:
    return [
        {"key": p.key, "label": p.label, "mean_weekly_income": round(p.mean_weekly_income, 2),
         "essentials_per_week": p.essentials_per_week, "notes": p.notes}
        for p in PROFILES.values()
    ]


@app.post("/riders", response_model=Rider, status_code=201)
def create_rider(body: RiderIn) -> dict:
    with get_conn() as conn:
        try:
            cur = conn.execute(
                "INSERT INTO riders (name, phone, essentials_per_week, start_buffer, start_week) VALUES (?, ?, ?, ?, ?)",
                (body.name, body.phone, body.essentials_per_week, body.start_buffer, body.start_week),
            )
        except sqlite3.IntegrityError as e:
            raise HTTPException(409, "phone number already registered") from e
        return service.get_rider(conn, cur.lastrowid)


@app.post("/riders/demo", response_model=Rider, status_code=201)
def create_demo_rider(profile: str = Query("full_time"), weeks: int = Query(10, ge=1, le=52), seed: int = 0) -> dict:
    """A rider pre-filled with simulated payouts, for the demo."""
    p = PROFILES.get(profile)
    if p is None:
        raise HTTPException(404, f"unknown profile {profile!r}")
    year = generate_year(p, seed)
    start_week = 52 - weeks if weeks < 52 else 0  # end the history in late December
    incomes = [w.income for w in year[start_week:start_week + weeks]]
    with get_conn() as conn:
        cur = conn.execute(
            "INSERT INTO riders (name, essentials_per_week, start_week) VALUES (?, ?, ?)",
            (f"Demo: {p.label}", p.essentials_per_week, start_week),
        )
        rid = cur.lastrowid
        conn.executemany("INSERT INTO payouts (rider_id, amount, note) VALUES (?, ?, 'simulated')",
                         [(rid, x) for x in incomes])
        return service.get_rider(conn, rid)


@app.get("/riders/{rider_id}", response_model=Rider)
def get_rider(rider_id: int) -> dict:
    with get_conn() as conn:
        return _rider_or_404(conn, rider_id)


@app.post("/riders/{rider_id}/payouts", status_code=201)
def add_payout(rider_id: int, body: PayoutIn) -> dict:
    with get_conn() as conn:
        _rider_or_404(conn, rider_id)
        conn.execute("INSERT INTO payouts (rider_id, amount, note) VALUES (?, ?, ?)",
                     (rider_id, body.amount, body.note))
        rider = service.get_rider(conn, rider_id)
        return service.build_plan(rider, service.payouts(conn, rider_id))


@app.delete("/riders/{rider_id}/payouts/last")
def undo_last_payout(rider_id: int) -> dict:
    with get_conn() as conn:
        _rider_or_404(conn, rider_id)
        row = conn.execute("SELECT id FROM payouts WHERE rider_id = ? ORDER BY id DESC LIMIT 1",
                           (rider_id,)).fetchone()
        if row is None:
            raise HTTPException(409, "no payouts to undo")
        conn.execute("DELETE FROM payouts WHERE id = ?", (row["id"],))
        rider = service.get_rider(conn, rider_id)
        return service.build_plan(rider, service.payouts(conn, rider_id))


@app.get("/riders/{rider_id}/plan")
def get_plan(rider_id: int) -> dict:
    with get_conn() as conn:
        rider = _rider_or_404(conn, rider_id)
        return service.build_plan(rider, service.payouts(conn, rider_id))


@app.post("/sms")
def sms_inbound(body: SmsIn) -> dict:
    """Keypad-phone channel: one SMS a week. Plug a gateway webhook in here."""
    with get_conn() as conn:
        row = conn.execute("SELECT id FROM riders WHERE phone = ?", (body.phone,)).fetchone()
        if row is None:
            return {"reply": "Number not registered. Ask your FLOVA helper to sign you up."}
        rid = row["id"]
        if m := service.SMS_PAY.match(body.text):
            amount = float(m.group(1).replace(",", ""))
            if not MIN_PAYOUT <= amount <= MAX_PAYOUT:
                return {"reply": f"Rs {amount:,.0f} looks wrong. Check and send again."}
            conn.execute("INSERT INTO payouts (rider_id, amount, note) VALUES (?, ?, 'sms')", (rid, amount))
        elif service.SMS_UNDO.match(body.text):
            last = conn.execute("SELECT id FROM payouts WHERE rider_id = ? ORDER BY id DESC LIMIT 1",
                                (rid,)).fetchone()
            if last is None:
                return {"reply": "Nothing to undo."}
            conn.execute("DELETE FROM payouts WHERE id = ?", (last["id"],))
        elif not service.SMS_STATUS.match(body.text):
            return {"reply": service.SMS_HELP}
        rider = service.get_rider(conn, rid)
        plan = service.build_plan(rider, service.payouts(conn, rid))
        return {"reply": service.sms_reply_for_plan(plan)}


@app.get("/simulate/{profile}")
def simulate(profile: str, seed: int = 0) -> dict:
    p = PROFILES.get(profile)
    if p is None:
        raise HTTPException(404, f"unknown profile {profile!r}")
    year = generate_year(p, seed)
    plans = run_rule([w.income for w in year], p.essentials_per_week)
    return {
        "profile": profile,
        "essentials_per_week": p.essentials_per_week,
        "weeks": [{**plan.as_dict(), "events": w.events} for w, plan in zip(year, plans)],
    }


@lru_cache(maxsize=4)
def _backtest(years: int) -> list[dict]:
    return backtest_all(range(years))


@app.get("/backtest")
def backtest(years: int = Query(50, ge=5, le=200)) -> list[dict]:
    return _backtest(years)
