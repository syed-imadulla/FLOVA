"""Synthetic weekly-income generator for gig delivery riders.

Every number here is either taken from a published source or marked ASSUMED,
so the team (and the judges) can see exactly what the backtest rests on.

Sources
-------
[IDI] IDInsight 2024 study of 2,547 delivery drivers, reported by IDR
      (20 Jan 2026): ~Rs 170/h gross, ~Rs 115/h after work costs,
      ~Rs 75/h net for consistent drivers.
[ES]  Economic Survey 2025-26 via Upstox (29 Jan 2026): ~40% of gig
      workers earn under Rs 15,000 a month.
"""

from __future__ import annotations

import random
from dataclasses import dataclass, field

WEEKS_PER_YEAR = 52


@dataclass(frozen=True)
class RiderProfile:
    key: str
    label: str
    hours_per_week: float
    rate_per_hour: float  # take-home after fuel and phone costs, Rs/h
    essentials_per_week: float  # rent share, food, EMI, school fees: Rs/week
    hours_noise: float  # weekly std-dev of hours as a share of the mean
    notes: str = ""

    @property
    def mean_weekly_income(self) -> float:
        return self.hours_per_week * self.rate_per_hour


# Rates come from [IDI]: Rs 115/h after costs is the middle case. Hours and
# essentials are ASSUMED and should be checked in rider interviews.
PROFILES: dict[str, RiderProfile] = {
    "full_time": RiderProfile(
        key="full_time",
        label="Full-time rider (family of 4)",
        hours_per_week=56,
        rate_per_hour=105,
        essentials_per_week=4600,
        hours_noise=0.18,
        notes="~Rs 25k/month. Hours and essentials ASSUMED; rate near [IDI].",
    ),
    "part_time": RiderProfile(
        key="part_time",
        label="Part-time student rider",
        hours_per_week=24,
        rate_per_hour=115,
        essentials_per_week=2000,
        hours_noise=0.30,
        notes="Under Rs 15k/month like ~40% of gig workers [ES]. Hours ASSUMED.",
    ),
    "new_rider": RiderProfile(
        key="new_rider",
        label="New rider, low rating",
        hours_per_week=42,
        rate_per_hour=80,
        essentials_per_week=3500,
        hours_noise=0.25,
        notes="Fewer orders while rating builds; near the Rs 75/h net in [IDI].",
    ),
}


# ASSUMED seasonal demand multipliers by month (1 = Jan). Festive Oct-Nov and
# wedding season up; post-festival Jan-Feb and peak summer heat down.
SEASONAL_BY_MONTH = {
    1: 0.85, 2: 0.88, 3: 0.97, 4: 0.92, 5: 0.90, 6: 1.00,
    7: 1.05, 8: 1.03, 9: 1.02, 10: 1.18, 11: 1.15, 12: 1.05,
}


def month_of_week(week: int) -> int:
    """Map week index 0..51 to a calendar month 1..12."""
    return min(12, int(week * 12 / WEEKS_PER_YEAR) + 1)


def seasonal_factor(week: int) -> float:
    return SEASONAL_BY_MONTH[month_of_week(week % WEEKS_PER_YEAR)]


@dataclass(frozen=True)
class Shock:
    name: str
    weekly_probability: float  # ASSUMED
    income_multiplier: float = 1.0
    extra_cost: float = 0.0


# ASSUMED shock rates. They are what makes income irregular beyond seasonality.
SHOCKS = (
    Shock("illness week", 0.04, income_multiplier=0.2),
    Shock("bike repair", 0.04, extra_cost=1800),
    Shock("account blocked by platform", 0.015, income_multiplier=0.0),
    Shock("heavy rain, few shifts", 0.05, income_multiplier=0.6),
)


@dataclass
class WeekIncome:
    week: int
    income: float
    events: list[str] = field(default_factory=list)


def generate_year(profile: RiderProfile, seed: int = 0, weeks: int = WEEKS_PER_YEAR) -> list[WeekIncome]:
    """Generate `weeks` of take-home income for one rider. Same seed, same year."""
    rng = random.Random(f"{profile.key}:{seed}")
    out: list[WeekIncome] = []
    for w in range(weeks):
        hours = max(0.0, rng.gauss(profile.hours_per_week, profile.hours_per_week * profile.hours_noise))
        income = hours * profile.rate_per_hour * seasonal_factor(w)
        events: list[str] = []
        for shock in SHOCKS:
            if rng.random() < shock.weekly_probability:
                income = income * shock.income_multiplier - shock.extra_cost
                events.append(shock.name)
        out.append(WeekIncome(week=w, income=round(income, 2), events=events))
    return out
