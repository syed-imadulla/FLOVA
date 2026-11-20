"""Self-salary rule: turn uneven weekly payouts into a steady weekly salary.

The rider tells us one number a week (that week's payout). The rule pays a
steady "salary" into their spending money, puts the rest into a buffer in
good weeks, and draws from the buffer in lean weeks.

It is a plain rule rather than a model, on purpose: a rider (or an NGO helper)
should be able to understand why this week's salary is what it is.
"""

from __future__ import annotations

from dataclasses import dataclass, field

LOOKBACK_WEEKS = 8
TARGET_BUFFER_WEEKS = 3.0  # aim to hold 3 weeks of essentials
MAX_WEEKLY_CHANGE = 0.15  # salary moves at most 15% a week, so it stays steady
REFILL_SHARE = 0.10  # in a good week below target, save an extra 10% of essentials
RELEASE_WEEKS = 4  # spread money above target over 4 weeks of raises


@dataclass
class WeekPlan:
    week: int
    income: float
    salary: float
    saved: float  # positive = into buffer, negative = drawn from buffer
    buffer: float
    status: str  # "healthy", "building", "lean", "shortfall"
    reasons: list[str] = field(default_factory=list)

    def as_dict(self) -> dict:
        return {
            "week": self.week,
            "income": round(self.income, 2),
            "salary": round(self.salary, 2),
            "saved": round(self.saved, 2),
            "buffer": round(self.buffer, 2),
            "status": self.status,
            "reasons": self.reasons,
        }


def percentile(values: list[float], q: float) -> float:
    """Linear-interpolated percentile, q in [0, 1]. No numpy needed."""
    if not values:
        raise ValueError("percentile of empty list")
    s = sorted(values)
    pos = (len(s) - 1) * q
    lo = int(pos)
    hi = min(lo + 1, len(s) - 1)
    return s[lo] + (s[hi] - s[lo]) * (pos - lo)


def sustainable_estimate(history: list[float]) -> float:
    """A cautious guess of what the rider can count on earning each week.

    Uses the 30th percentile of recent weeks, so one great festival week
    doesn't inflate the salary. With under 3 weeks of data we take 85% of the
    average instead, because a percentile of 1-2 points means little.
    """
    recent = history[-LOOKBACK_WEEKS:]
    if not recent:
        return 0.0
    if len(recent) < 3:
        return max(0.0, 0.85 * sum(recent) / len(recent))
    return max(0.0, percentile(recent, 0.30))


class SelfSalary:
    """Stateful rule for one rider. Call `step(income)` once per week."""

    def __init__(self, essentials: float, start_buffer: float = 0.0):
        if essentials <= 0:
            raise ValueError("essentials must be positive")
        self.essentials = essentials
        self.buffer = start_buffer
        self.salary: float | None = None
        self.history: list[float] = []
        self.week = 0

    @property
    def target_buffer(self) -> float:
        return TARGET_BUFFER_WEEKS * self.essentials

    def step(self, income: float) -> WeekPlan:
        self.history.append(income)
        reasons: list[str] = []
        base = sustainable_estimate(self.history)
        target = self.target_buffer

        desired = base
        if self.buffer > target:
            raise_by = (self.buffer - target) / RELEASE_WEEKS
            desired += raise_by
            reasons.append(f"Buffer is above {TARGET_BUFFER_WEEKS:g} weeks, so salary rises by Rs {raise_by:,.0f}.")
        elif base > self.essentials:
            desired -= REFILL_SHARE * self.essentials
            reasons.append("Good earnings and buffer below target, so a little extra is saved.")

        # Essentials come first: if the buffer can cover it, never pay less.
        if desired < self.essentials:
            desired = self.essentials
            reasons.append("Salary held at essentials; the buffer covers the gap.")

        # Keep it steady: limit how fast the salary moves, but never let the
        # limit push it below essentials.
        if self.salary is not None:
            lo = self.salary * (1 - MAX_WEEKLY_CHANGE)
            hi = self.salary * (1 + MAX_WEEKLY_CHANGE)
            desired = max(min(max(desired, lo), hi), self.essentials)

        available = income + self.buffer
        salary = max(0.0, min(desired, available))
        if salary < desired:
            reasons.append("Buffer is empty, so the salary is only what came in this week.")

        saved = income - salary
        self.buffer = self.buffer + saved
        self.salary = salary

        if salary < self.essentials:
            status = "shortfall"
        elif saved < 0:
            status = "lean"
        elif self.buffer < target:
            status = "building"
        else:
            status = "healthy"

        plan = WeekPlan(self.week, income, salary, saved, self.buffer, status, reasons)
        self.week += 1
        return plan


def run_rule(incomes: list[float], essentials: float, start_buffer: float = 0.0) -> list[WeekPlan]:
    rule = SelfSalary(essentials, start_buffer)
    return [rule.step(x) for x in incomes]
