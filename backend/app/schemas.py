from __future__ import annotations

from pydantic import BaseModel, Field

# A week's take-home can be negative (a repair cost more than the week paid),
# but anything outside these bounds is almost certainly a typing mistake.
MIN_PAYOUT = -50_000
MAX_PAYOUT = 200_000


class RiderIn(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    phone: str | None = Field(default=None, pattern=r"^\+?\d{10,13}$")
    essentials_per_week: float = Field(gt=0, le=100_000)
    start_buffer: float = Field(default=0, ge=0, le=1_000_000)
    start_week: int = Field(default=0, ge=0, le=51, description="Week of year (0 = first week of Jan) of the first payout")


class Rider(RiderIn):
    id: int
    weeks_logged: int


class PayoutIn(BaseModel):
    amount: float = Field(ge=MIN_PAYOUT, le=MAX_PAYOUT)
    note: str | None = Field(default=None, max_length=200)


class SmsIn(BaseModel):
    phone: str = Field(pattern=r"^\+?\d{10,13}$")
    text: str = Field(min_length=1, max_length=160)
