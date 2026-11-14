#!/usr/bin/env python3
"""pc_off.send must not print Telegram URL or bot token when the request fails."""
from __future__ import annotations

import importlib.util
import io
import os
import sys
import unittest
import urllib.error
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parent.parent
FAKE_TOKEN = '000:FAKE'


def load_pc_off():
    spec = importlib.util.spec_from_file_location('pc_off', ROOT / 'tools' / 'pc_off.py')
    mod = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(mod)
    return mod


class SendRedactionTest(unittest.TestCase):
    def test_send_does_not_leak_token_on_request_error(self):
        pc_off = load_pc_off()
        leak = (
            f'connection failed https://api.telegram.org/bot{FAKE_TOKEN}/sendMessage'
        )
        buf = io.StringIO()
        with patch.dict(
            os.environ,
            {'TELEGRAM_BOT_TOKEN': FAKE_TOKEN, 'TELEGRAM_CHAT_ID': '12345'},
            clear=False,
        ):
            with patch('urllib.request.urlopen', side_effect=urllib.error.URLError(leak)):
                with redirect_stdout(buf), redirect_stderr(buf):
                    pc_off.send('Babasms: test alert.')

        combined = buf.getvalue()
        self.assertNotIn(FAKE_TOKEN, combined, msg=combined)
        self.assertNotIn('api.telegram.org', combined, msg=combined)
        self.assertIn('Telegram send failed', combined)

    def test_send_does_not_leak_token_with_trailing_newline(self):
        self._assert_only_failure_line('000:FAKE\n')

    def test_send_does_not_leak_token_with_trailing_space(self):
        self._assert_only_failure_line('000:FAKE ')

    def _assert_only_failure_line(self, token: str) -> None:
        pc_off = load_pc_off()
        buf = io.StringIO()
        with patch.dict(
            os.environ,
            {'TELEGRAM_BOT_TOKEN': token, 'TELEGRAM_CHAT_ID': '12345'},
            clear=False,
        ):
            with redirect_stdout(buf), redirect_stderr(buf):
                pc_off.send('Babasms: test alert.')
        combined = buf.getvalue()
        self.assertEqual(combined, 'Telegram send failed\n')
        self.assertNotIn(FAKE_TOKEN, combined)
        self.assertNotIn(token, combined)
        self.assertNotIn('api.telegram.org', combined)
        self.assertNotIn('/bot', combined)


if __name__ == '__main__':
    unittest.main(verbosity=2)
