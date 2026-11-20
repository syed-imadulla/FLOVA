"""Lean-week outlook: warn a rider ahead of a lean stretch, as a range with reasons.

We give a range, not a single number, so a warning doesn't push someone into
cutting food or fuel over a guess (ASSUMPTIONS #7).
"""

from __future__ import annotations

import calendar

from .profiles import SEASONAL_BY_MONTH, month_of_week, seasonal_factor
from .smoother import LOOKBACK_WEEKS, percentile


def lean_outlook(
    history: list[float],
    essentials: float,
    buffer: float,
    next_week: int,
    horizon: int = 4,
) -> dict:
    """Forecast the next `horizon` weeks from recent history and the season.

    `history` holds past weekly incomes, the last of which is week next_week-1.
    """
    recent = history[-LOOKBACK_WEEKS:]
    if len(recent) < 3:
        return {
            "ready": False,
            "message": "Need at least 3 weeks of payouts before we can warn about lean weeks.",
            "weeks": [],
        }

    # Remove the season from past weeks so a festive week isn't read as normal.
    start = next_week - len(recent)
    deseason = [x / seasonal_factor(start + i) for i, x in enumerate(recent)]
    low_base = percentile(deseason, 0.25)
    mid_base = percentile(deseason, 0.50)
    high_base = percentile(deseason, 0.75)

    weeks = []
    running_buffer = buffer
    for k in range(horizon):
        w = next_week + k
        f = seasonal_factor(w)
        low, mid, high = low_base * f, mid_base * f, high_base * f
        reasons = []
        month = calendar.month_name[month_of_week(w % 52)]
        if f < 0.95:
            reasons.append(f"{month} is usually slow (about {1 - f:.0%} fewer orders).")
        elif f > 1.05:
            reasons.append(f"{month} is usually busy (about {f - 1:.0%} more orders).")
        gap_if_low = max(0.0, essentials - low)
        running_buffer -= gap_if_low
        if low >= essentials:
            level = "ok"
        elif running_buffer >= 0:
            level = "covered"
            reasons.append("A slow week here is covered by your buffer.")
        else:
            level = "warning"
            reasons.append("A slow week here could run past your buffer. Consider an extra shift earlier.")
        weeks.append({
            "week": w,
            "month": month,
            "low": round(low, 2),
            "expected": round(mid, 2),
            "high": round(high, 2),
            "level": level,
            "reasons": reasons,
        })

    worst = "warning" if any(x["level"] == "warning" for x in weeks) else (
        "covered" if any(x["level"] == "covered" for x in weeks) else "ok")
    return {"ready": True, "overall": worst, "weeks": weeks}


__all__ = ["lean_outlook", "SEASONAL_BY_MONTH"]
