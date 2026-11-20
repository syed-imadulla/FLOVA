"""Print the backtest table: python -m udaan_engine"""

from .backtest import backtest_all


def main() -> None:
    rows = backtest_all()
    print(f"{'Rider':32} {'borrow wks':>18} {'interest Rs':>20} {'spend CV':>14}  can help")
    for r in rows:
        b, u = r["baseline"], r["udaan"]
        print(
            f"{r['label']:32} "
            f"{b['weeks_borrowing']:>7.1f} -> {u['weeks_borrowing']:<7.1f} "
            f"{b['interest_paid']:>8.0f} -> {u['interest_paid']:<8.0f} "
            f"{b['spending_volatility']:>5.2f} -> {u['spending_volatility']:<5.2f} "
            f"{r['share_of_years_smoothing_can_help']:>6.0%}"
        )


if __name__ == "__main__":
    main()
