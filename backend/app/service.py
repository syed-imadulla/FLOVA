"""Glue between storage and the engine."""

from __future__ import annotations

import re
import sqlite3

from udaan_engine import can_smoothing_help, lean_outlook, run_rule


class NotFound(Exception):
    pass


def get_rider(conn: sqlite3.Connection, rider_id: int) -> dict:
    row = conn.execute(
        "SELECT r.*, (SELECT COUNT(*) FROM payouts p WHERE p.rider_id = r.id) AS weeks_logged "
        "FROM riders r WHERE r.id = ?",
        (rider_id,),
    ).fetchone()
    if row is None:
        raise NotFound(f"rider {rider_id} not found")
    return {k: row[k] for k in row.keys() if k != "created_at"}


def payouts(conn: sqlite3.Connection, rider_id: int) -> list[float]:
    return [r["amount"] for r in conn.execute(
        "SELECT amount FROM payouts WHERE rider_id = ? ORDER BY id", (rider_id,))]


def build_plan(rider: dict, incomes: list[float]) -> dict:
    essentials = rider["essentials_per_week"]
    plans = run_rule(incomes, essentials, rider["start_buffer"])
    buffer = plans[-1].buffer if plans else rider["start_buffer"]
    next_week = rider["start_week"] + len(incomes)
    help_ok, help_msg = can_smoothing_help(incomes, essentials) if len(incomes) >= 4 else (True, "")
    return {
        "rider": rider,
        "current": plans[-1].as_dict() if plans else None,
        "history": [p.as_dict() for p in plans],
        "buffer_weeks": round(buffer / essentials, 2),
        "target_buffer": round(3 * essentials, 2),
        "outlook": lean_outlook(incomes, essentials, buffer, next_week),
        "can_help": help_ok,
        "can_help_message": help_msg,
    }


SMS_PAY = re.compile(r"^\s*(?:pay|p)\s+(-?\d[\d,]*(?:\.\d+)?)\s*$", re.IGNORECASE)
SMS_STATUS = re.compile(r"^\s*(?:status|s|bal)\s*$", re.IGNORECASE)
SMS_UNDO = re.compile(r"^\s*undo\s*$", re.IGNORECASE)

SMS_HELP = "Send PAY 5200 for this week's payout, STATUS for your salary, UNDO to remove the last entry."


def sms_reply_for_plan(plan: dict) -> str:
    cur = plan["current"]
    if cur is None:
        return "No payouts yet. " + SMS_HELP
    msg = (f"Salary this week: Rs {cur['salary']:,.0f}. "
           f"Saved: Rs {max(cur['saved'], 0):,.0f}. "
           f"Buffer: Rs {cur['buffer']:,.0f} ({plan['buffer_weeks']:g} wks).")
    out = plan["outlook"]
    if out.get("ready") and out["overall"] == "warning":
        msg += " Slow weeks ahead may pass your buffer."
    return msg[:160]
