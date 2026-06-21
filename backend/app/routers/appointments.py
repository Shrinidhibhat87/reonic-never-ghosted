"""Installer week + appointments (Pillar 5).

ponytail: in-memory demo store, no DB table. Manuel's (installer 1) week is
seeded packed except one open slot; POST drops a strategy step into that gap.
Ceiling: resets on server restart and single-process only — promote to a real
``Appointment`` SQLModel table if persistence or multi-worker is needed.
"""

from datetime import date, timedelta
from itertools import count

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(tags=["appointments"])

# Demo grid: Mon–Fri, four 1h slots a day.
_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"]
_SLOTS = [9, 11, 14, 16]  # start hours
_OPEN_DAY, _OPEN_HOUR = 1, 14  # Tue 14:00 — the one gap "Add to calendar" fills


class Appointment(BaseModel):
    id: int
    installer_id: int
    deal_id: int | None = None
    title: str
    day: int  # 0=Mon … 4=Fri
    start_hour: int
    end_hour: int


class AppointmentIn(BaseModel):
    deal_id: int | None = None
    title: str


class WeekOut(BaseModel):
    week_label: str
    days: list[str]
    slots: list[int]
    appointments: list[Appointment]


_ids = count(1)
_store: dict[int, list[Appointment]] = {}

_SEED_TITLES = [
    "Site survey — roof measurement",
    "Heat-pump install (day 1)",
    "Customer handover & sign-off",
    "Follow-up call: financing options",
    "Battery commissioning",
    "Quote walkthrough on site",
]


def _monday(today: date) -> date:
    return today - timedelta(days=today.weekday())


def _week_label() -> str:
    mon = _monday(date.today())
    fri = mon + timedelta(days=4)
    return f"{mon:%a %d %b} – {fri:%a %d %b %Y}"


def _seed(installer_id: int) -> list[Appointment]:
    appts: list[Appointment] = []
    t = 0
    for day in range(len(_DAYS)):
        for hour in _SLOTS:
            if day == _OPEN_DAY and hour == _OPEN_HOUR:
                continue  # leave the gap
            appts.append(Appointment(
                id=next(_ids), installer_id=installer_id, title=_SEED_TITLES[t % len(_SEED_TITLES)],
                day=day, start_hour=hour, end_hour=hour + 1,
            ))
            t += 1
    return appts


def _for(installer_id: int) -> list[Appointment]:
    if installer_id not in _store:
        _store[installer_id] = _seed(installer_id)
    return _store[installer_id]


@router.get("/installers/{installer_id}/appointments", response_model=WeekOut)
def get_week(installer_id: int) -> WeekOut:
    return WeekOut(
        week_label=_week_label(), days=_DAYS, slots=_SLOTS,
        appointments=_for(installer_id),
    )


@router.post("/appointments", response_model=Appointment)
def add_appointment(body: AppointmentIn) -> Appointment:
    """Drop a new appointment into the installer's first open slot (the gap)."""
    appts = _for(1)
    taken = {(a.day, a.start_hour) for a in appts}
    for day in range(len(_DAYS)):
        for hour in _SLOTS:
            if (day, hour) not in taken:
                appt = Appointment(
                    id=next(_ids), installer_id=1, deal_id=body.deal_id,
                    title=body.title, day=day, start_hour=hour, end_hour=hour + 1,
                )
                appts.append(appt)
                return appt
    # Week full — append to Friday end as a fallback so the call never fails.
    appt = Appointment(id=next(_ids), installer_id=1, deal_id=body.deal_id,
                       title=body.title, day=4, start_hour=18, end_hour=19)
    appts.append(appt)
    return appt
