# FLOVA backend

FastAPI + SQLite. The plan is never stored; it's replayed from the payouts each time, so an undo can't leave a stale buffer behind.

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
uvicorn app.main:app --reload     # http://localhost:8000/docs
pytest -q
```

| Endpoint | What it does |
|---|---|
| `POST /riders` | Sign up: name, optional phone, weekly essentials |
| `POST /riders/demo?profile=full_time&weeks=10` | Rider pre-filled with simulated payouts |
| `POST /riders/{id}/payouts` | Log this week's payout, get the new plan back |
| `DELETE /riders/{id}/payouts/last` | Undo a mistyped payout |
| `GET /riders/{id}/plan` | Salary, buffer, history, 4-week outlook, "can help" check |
| `POST /sms` | Keypad-phone channel: `PAY 5200`, `STATUS`, `UNDO` |
| `GET /simulate/{profile}` | 52 simulated weeks with the rule applied |
| `GET /backtest?years=50` | Baseline vs FLOVA for all rider types |

Env: `FLOVA_DB` (SQLite path), `FLOVA_CORS` (comma-separated origins).
