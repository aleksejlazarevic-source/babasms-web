"""Point t/latest/ at the leaflet that is in the shops (babasms-web, EXECUTION.md T2.2).

Runs from .github/workflows/latest.yml just after midnight Europe/Ljubljana, and can be run by hand.
A leaflet starts on Thursday and runs through the next Wednesday. Thursday through Sunday, t/latest/
becomes that Thursday. Monday through Wednesday, it becomes that Monday. The next Monday is often
already on the site from the Wednesday publish, and it is not used before those deals start.
If that day's folder is missing, t/latest/ is cleared, so a setup does not receive the previous
leaflet (Aleksej, 4 Nov 2026). Standard library only.
Usage: python3 tools/latest.py [repo root]   (default: the current folder)
"""
from __future__ import annotations

import shutil
import sys
from datetime import date, datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

TZ = ZoneInfo('Europe/Ljubljana')  # Lidl SI and the send days run on Slovenian time (CLAUDE.md schedule)


def valid_send_day(today: date) -> date:
    """The Monday or Thursday whose deals are in the shops on today.

    Thursday is day 3. The leaflet in the shops started on the most recent Thursday,
    including today. Its Monday is four days later, and counts only once that Monday
    has arrived. (Aleksej, 4 Nov 2026.)
    """
    thursday = today - timedelta(days=(today.weekday() - 3) % 7)
    monday = thursday + timedelta(days=4)  # Monday is 4 days after Thursday
    return monday if monday <= today else thursday


def copy_latest(root: Path, today: date) -> bool:
    """Point t/latest/ at valid_send_day(today). True when that folder was copied.

    A missing folder clears t/latest/*.txt and returns False. Leaving the old files
    would send the previous leaflet (Aleksej, 4 Nov 2026).
    """
    src = Path(root) / 't' / valid_send_day(today).isoformat()
    dst = Path(root) / 't' / 'latest'
    dst.mkdir(parents=True, exist_ok=True)
    if not src.is_dir():
        for old in dst.glob('*.txt'):
            old.unlink()
        return False
    for old in dst.glob('*.txt'):
        old.unlink()
    for f in sorted(src.glob('*.txt')):
        shutil.copyfile(f, dst / f.name)
    return True


if __name__ == '__main__':
    root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('.')
    day = datetime.now(TZ).date()
    print(f'latest: {"copied " + valid_send_day(day).isoformat() if copy_latest(root, day) else "cleared"} ({day})')
