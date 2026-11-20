"""Backtest: does the self-salary rule actually help, and for whom?

Compares two ways of living on the same year of income:

* baseline  - spend what comes in; when a week falls short of essentials,
              borrow the gap from an informal lender.
* udaan     - follow the self-salary rule; borrow only when the buffer is empty.

Both borrow at the same ASSUMED informal rate, so the difference in interest
paid and in borrowing weeks is down to the rule alone.
"""

from __future__ import annotations

import statistics
from dataclasses import asdict, dataclass

from .profiles import PROFILES, RiderProfile, generate_year
from .smoother import SelfSalary

# ASSUMED: informal lenders / pay-day apps commonly charge 3-10% a month.
# 5% a month, compounded weekly, is a middle case.
INFORMAL_RATE_PER_MONTH = 0.05
WEEKLY_RATE = (1 + INFORMAL_RATE_PER_MONTH) ** (12 / 52) - 1


@dataclass
class StrategyResult:
    weeks_borrowing: int
    total_borrowed: float
    interest_paid: float
    peak_debt: float
    end_debt: float
    spending_volatility: float  # coefficient of variation of weekly spending
    end_buffer: float

    def rounded(self) -> dict:
        return {k: round(v, 3) if isinstance(v, float) else v for k, v in asdict(self).items()}


def _cv(xs: list[float]) -> float:
    mean = statistics.fmean(xs)
    return statistics.pstdev(xs) / mean if mean > 0 else 0.0


def run_baseline(incomes: list[float], essentials: float) -> StrategyResult:
    debt = borrowed = interest = peak = 0.0
    weeks_borrowing = 0
    spending: list[float] = []
    for income in incomes:
        accrued = debt * WEEKLY_RATE
        debt += accrued
        interest += accrued
        if income < essentials:
            gap = essentials - income
            debt += gap
            borrowed += gap
            weeks_borrowing += 1
            spending.append(essentials)
        else:
            repay = min(debt, income - essentials)
            debt -= repay
            spending.append(income - repay)
        peak = max(peak, debt)
    return StrategyResult(weeks_borrowing, borrowed, interest, peak, debt, _cv(spending), 0.0)


def run_udaan(incomes: list[float], essentials: float) -> StrategyResult:
    rule = SelfSalary(essentials)
    debt = borrowed = interest = peak = 0.0
    weeks_borrowing = 0
    spending: list[float] = []
    for income in incomes:
        accrued = debt * WEEKLY_RATE
        debt += accrued
        interest += accrued
        plan = rule.step(income)
        spend = plan.salary
        if spend < essentials:
            gap = essentials - spend
            debt += gap
            borrowed += gap
            weeks_borrowing += 1
            spend = essentials
        elif debt > 0 and rule.buffer > essentials:
            # Pay debt down with buffer above one week of essentials.
            repay = min(debt, rule.buffer - essentials)
            debt -= repay
            rule.buffer -= repay
        spending.append(spend)
        peak = max(peak, debt)
    return StrategyResult(weeks_borrowing, borrowed, interest, peak, debt, _cv(spending), rule.buffer)


def can_smoothing_help(incomes: list[float], essentials: float) -> tuple[bool, str]:
    """Smoothing moves money across weeks; it cannot create money.

    If the year's average is below essentials, the problem is low income, not
    timing, and we say so instead of pretending the rule fixes it.
    """
    mean = statistics.fmean(incomes)
    ratio = mean / essentials
    if ratio < 1.0:
        return False, (
            f"Average income is {ratio:.0%} of essentials. This is a low-income problem, "
            "not a timing problem: point the rider to e-Shram and welfare schemes."
        )
    if ratio < 1.08:
        return True, f"Average income is only {ratio:.0%} of essentials, so the buffer fills slowly."
    return True, f"Average income is {ratio:.0%} of essentials; there is room to build a buffer."


def backtest_profile(profile: RiderProfile, seeds: range = range(50)) -> dict:
    """Run both strategies over many simulated years and average the results."""
    base_runs, udaan_runs = [], []
    help_votes = 0
    for seed in seeds:
        incomes = [w.income for w in generate_year(profile, seed)]
        base_runs.append(run_baseline(incomes, profile.essentials_per_week))
        udaan_runs.append(run_udaan(incomes, profile.essentials_per_week))
        help_votes += can_smoothing_help(incomes, profile.essentials_per_week)[0]

    def avg(runs: list[StrategyResult]) -> dict:
        fields = asdict(runs[0]).keys()
        return {f: round(statistics.fmean(getattr(r, f) for r in runs), 3) for f in fields}

    b, u = avg(base_runs), avg(udaan_runs)

    def change(key: str) -> float | None:
        return round((u[key] - b[key]) / b[key], 3) if b[key] else None

    return {
        "profile": profile.key,
        "label": profile.label,
        "years_simulated": len(seeds),
        "essentials_per_week": profile.essentials_per_week,
        "mean_weekly_income": round(profile.mean_weekly_income, 2),
        "share_of_years_smoothing_can_help": round(help_votes / len(seeds), 3),
        "baseline": b,
        "udaan": u,
        "change": {
            "weeks_borrowing": change("weeks_borrowing"),
            "interest_paid": change("interest_paid"),
            "peak_debt": change("peak_debt"),
            "spending_volatility": change("spending_volatility"),
        },
    }


def backtest_all(seeds: range = range(50)) -> list[dict]:
    return [backtest_profile(p, seeds) for p in PROFILES.values()]
