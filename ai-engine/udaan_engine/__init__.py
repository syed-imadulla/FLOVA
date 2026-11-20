"""Udaan engine: self-salary rule, lean-week outlook and backtest for gig riders."""

from .backtest import backtest_all, backtest_profile, can_smoothing_help, run_baseline, run_udaan
from .forecast import lean_outlook
from .profiles import PROFILES, RiderProfile, generate_year
from .smoother import SelfSalary, WeekPlan, run_rule, sustainable_estimate

__all__ = [
    "PROFILES",
    "RiderProfile",
    "SelfSalary",
    "WeekPlan",
    "backtest_all",
    "backtest_profile",
    "can_smoothing_help",
    "generate_year",
    "lean_outlook",
    "run_baseline",
    "run_rule",
    "run_udaan",
    "sustainable_estimate",
]
