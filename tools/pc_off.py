"""Tell Telegram when today's Lidl file is missing after 09:30 Europe/Ljubljana.

The page can carry an older file. This only notices that the PC did not publish the
asked morning. It does not change t/latest (that job stays as it is).
Secrets: TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID. If they are unset, the run stays quiet.
Usage: python3 tools/pc_off.py [repo root]
"""
from __future__ import annotations

import os
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

TZ = ZoneInfo('Europe/Ljubljana')


def valid_send_day(today):
    """Same Monday/Thursday rule as tools/latest.py."""
    thursday = today - timedelta(days=(today.weekday() - 3) % 7)
    monday = thursday + timedelta(days=4)
    return monday if monday <= today else thursday


def missing(root: Path, day) -> bool:
    name = day.isoformat()
    legacy = root / 't' / name / 'brief-sl.txt'
    per_store = root / 't' / 'lidl' / name / 'brief-sl.txt'
    return not legacy.is_file() and not per_store.is_file()


def send(text: str) -> None:
    token = os.environ.get('TELEGRAM_BOT_TOKEN') or ''
    chat = os.environ.get('TELEGRAM_CHAT_ID') or ''
    if not token or not chat:
        print('TELEGRAM secrets are not set')
        return
    data = urllib.parse.urlencode({'chat_id': chat, 'text': text}).encode()
    url = f'https://api.telegram.org/bot{token}/sendMessage'
    try:
        urllib.request.urlopen(urllib.request.Request(url, data), timeout=20).read()
    except OSError:
        print('Telegram send failed')


def main(root: Path, now: datetime | None = None) -> int:
    now = now or datetime.now(TZ)
    if now.hour < 9 or (now.hour == 9 and now.minute < 30):
        print('before 09:30 Ljubljana')
        return 0
    day = valid_send_day(now.date())
    if day.weekday() not in (0, 3):
        return 0
    if not missing(root, day):
        print(f'{day} is on the site')
        return 0
    send(f'Babasms: the PC has not published Lidl for {day.isoformat()}.')
    print(f'missing {day}')
    return 0


if __name__ == '__main__':
    root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('.')
    sys.exit(main(root))
