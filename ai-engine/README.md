# udaan-engine

Core logic for Udaan: a self-salary rule for gig workers with irregular weekly income.

- `profiles.py`: synthetic 52-week income for 3 rider types. Each number is either cited (IDInsight 2024, Economic Survey 2025-26) or marked ASSUMED.
- `smoother.py`: the self-salary rule. A cautious weekly estimate (30th percentile of the last 8 weeks), a 3-week buffer target, essentials protected first, and the salary moves at most 15% a week.
- `forecast.py`: lean-week outlook for the next 4 weeks, given as a low / expected / high range with reasons.
- `backtest.py`: compares "spend what comes in, borrow the gap" with the Udaan rule over 50 simulated years per rider type, and says when smoothing can't help (average income below essentials).

```bash
pip install -e ".[test]"
python -m udaan_engine   # backtest table
pytest -q
```
