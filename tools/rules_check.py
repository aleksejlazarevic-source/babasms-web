"""Fail when a rule file clashes with AGENTS.md.

AGENTS.md is the rulebook. This check reads the other files that give agents
rules: README, docs, .cursor/rules, any CLAUDE.md, and .github/workflows.
It fails if a line does any of these:

- says it wins over AGENTS.md
- tells an agent to use Claude, Opus, Sonnet, Haiku or Fable outside the
  Claude Code planning phase of an AGENTS.md plan
- asks for a yes before a push, merge or go-live
- says to work or push on main
- caps workers below one worker per item, which is what AGENTS.md allows

A line that forbids the same thing is allowed. Privacy, no-outside-links
and never-message-Grandma lines are not part of this check.

Usage: python3 tools/rules_check.py [repo root]
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

# A forbid-word in front of a match keeps the line. "no" is not in this list:
# "no more than 2 workers" is a cap, not a forbid.
NEG = re.compile(
    "\\b(do not|don't|don\u2019t|dont|never|must not|cannot|can't|can\u2019t)\\b",
    re.IGNORECASE,
)
MODEL = re.compile(r'\b(claude|opus|sonnet|haiku|fable)\b', re.IGNORECASE)
MODEL_VERB = re.compile(
    r'\b(use|using|run|running|launch|call|invoke|switch|pick|prefer|dispatch)\b',
    re.IGNORECASE,
)
WINS = re.compile(
    r'\b('
    r'wins? over agents\.md'
    r'|overrides? agents\.md'
    r'|overrules? agents\.md'
    r'|supersedes agents\.md'
    r'|ignore agents\.md'
    r'|disregard agents\.md'
    r'|(?:takes|has) (?:precedence|priority) over agents\.md'
    r')\b',
    re.IGNORECASE,
)
YES_WORD = re.compile(r'\b(yes|approval|approve|confirm)\b', re.IGNORECASE)
YES_ACT = re.compile(r'\b(push\w*|merg\w*|go-?live|going live)\b', re.IGNORECASE)
ASK = re.compile(r'\bask\w*\b', re.IGNORECASE)
MAIN_ACT = re.compile(
    r'\b(work\w*|push\w*|commit\w*)\b.{0,40}\b(?:on|to|onto) (?:the )?main\b'
    r'|\b(?:on|to|onto) (?:the )?main\b.{0,40}\b(work\w*|push\w*|commit\w*)\b',
    re.IGNORECASE,
)
WORKER_CAP = re.compile(
    r'\b(?:at most|no more than|maximum of|maximum|max|limit of|limited to|up to)'
    r'\s+(?:\d+|one|two|three|four)\s+(?:workers?|subagents?)\b'
    r'|\b(?:only|just) one (?:worker|subagent)\b'
    r'|\b(?:a )?single (?:worker|subagent)\b'
    r'|\bone (?:worker|subagent) at a time\b'
    r'|\bcap(?:s|ped|ping)?\b.{0,30}\b(?:workers?|subagents?)\b'
    r'|\b(?:workers?|subagents?)\b.{0,30}\bcap(?:s|ped)?\b'
    r'|\bno parallel (?:workers?|subagents?)\b'
    r'|\b(?:workers?|subagents?) (?:must|should) (?:run |be )?sequentially\b',
    re.IGNORECASE,
)

# Lines the check must reject, and lines it must allow. The allow list is the
# same ideas written as forbids, plus the planning-phase exception.
FORBIDDEN = [
    'The older rules win over AGENTS.md.',
    'Ignore AGENTS.md when the two disagree.',
    'Use Claude to edit the page.',
    'Use Opus for the worker.',
    'Run Sonnet on this change.',
    'Switch to Haiku.',
    'Prefer Fable for the fix.',
    'uses: anthropics/claude-code-action@v1',
    'Ask for a yes before a push, merge or go-live.',
    'Confirm before you merge.',
    'Do not push until I say yes.',
    'Work on main.',
    'Push on main.',
    'Commit to main.',
    'Cap workers at 2.',
    'At most one worker.',
    'Only one worker.',
    'No parallel workers.',
    'Workers must run sequentially.',
    'model: opus',
]
ALLOWED = [
    'The older rules do not win over AGENTS.md.',
    'Never ignore AGENTS.md.',
    'AGENTS.md wins over the older rules.',
    'Do not use Claude, Opus, Sonnet, Haiku or Fable.',
    'Never run Opus, Sonnet, Haiku or Fable outside planning.',
    'In the Claude Code planning phase of an AGENTS.md plan, use Fable or Opus.',
    'Do not ask for a yes before a push, merge or go-live.',
    'Don\u2019t ask for a yes before you merge.',
    'Merge without asking for a yes.',
    'Never work or push on main.',
    'Never commit to main.',
    'Do not push to main.',
    'Do not work on main.',
    'Do not cap workers below what AGENTS.md allows.',
    'One worker per item.',
    'git push',
    'Never message Grandma.',
    'No outside links.',
    'Keep the privacy rules as they are.',
    'CLAUDE.md schedule: Monday and Thursday.',
]


def _negated(line: str, start: int) -> bool:
    window = line[max(0, start - 80):start]
    return NEG.search(window) is not None


def _planning_phase(line: str) -> bool:
    low = line.lower()
    return 'planning phase' in low and 'agents.md' in low


def _asks_for_yes(line: str) -> bool:
    """True when the line asks for a yes before a push, merge or go-live.

    "Do not ask before you merge" forbids the question, so it is allowed.
    "Do not push until I say yes" still waits for a yes, so it is a clash.
    """
    if YES_ACT.search(line) is None:
        return False
    if YES_WORD.search(line) is None and ASK.search(line) is None:
        return False
    if re.search(r'\bwithout asking\b', line, re.IGNORECASE):
        return False
    forbid_ask = re.search(
        "\\b(do not|don't|don\u2019t|dont|never|must not|cannot|can't|can\u2019t)\\b"
        "(?:(?!\\b(?:until|unless)\\b).){0,60}"
        "\\b(ask\\w*|confirm\\w*|approval)\\b",
        line,
        re.IGNORECASE,
    )
    return forbid_ask is None


def clashes(line: str) -> list[str]:
    """Reasons this line clashes with AGENTS.md. Empty when the line is fine."""
    found: list[str] = []

    for match in WINS.finditer(line):
        if not _negated(line, match.start()):
            found.append('says it wins over AGENTS.md')
            break

    if not _planning_phase(line):
        for match in MODEL.finditer(line):
            if _negated(line, match.start()):
                continue
            before = line[max(0, match.start() - 70):match.start()]
            after = line[match.end():match.end() + 40]
            # "uses:" / "run:" count only when the model is in that command.
            # A comment that merely names CLAUDE.md on a checkout step does not.
            command = re.search(
                r'\b(?:uses|run)\s*:\s*([^#\n]*)',
                line,
                re.IGNORECASE,
            )
            runs = (
                MODEL_VERB.search(before) is not None
                or MODEL_VERB.search(after) is not None
                or re.search(r'\bmodel\b', before, re.IGNORECASE) is not None
                or re.search(r'\bmodel\b', after, re.IGNORECASE) is not None
                or (
                    command is not None
                    and MODEL.search(command.group(1)) is not None
                )
            )
            if runs:
                found.append(
                    'uses Claude, Opus, Sonnet, Haiku or Fable outside the planning phase'
                )
                break

    if _asks_for_yes(line):
        found.append('asks for a yes before a push, merge or go-live')

    for match in MAIN_ACT.finditer(line):
        if not _negated(line, match.start()):
            found.append('says to work or push on main')
            break

    if re.search(r'\bper item\b', line, re.IGNORECASE) is None:
        for match in WORKER_CAP.finditer(line):
            if not _negated(line, match.start()):
                found.append('caps workers below what AGENTS.md allows')
                break

    return found


def _self_test() -> None:
    problems: list[str] = []
    for line in FORBIDDEN:
        if not clashes(line):
            problems.append('allowed a forbidden line: ' + line)
    for line in ALLOWED:
        why = clashes(line)
        if why:
            problems.append('rejected an allowed line: ' + line + ' (' + '; '.join(why) + ')')
    if problems:
        for item in problems:
            print(item, file=sys.stderr)
        raise SystemExit(1)


def rule_files(root: Path) -> list[Path]:
    """Files that give agents rules. Pages under site/ are not rule files."""
    found: list[Path] = []
    for path in (root / 'README.md', root / 'README', root / 'readme.md'):
        if path.is_file():
            found.append(path)
    docs = root / 'docs'
    if docs.is_dir():
        found.extend(_text_files(docs))
    rules = root / '.cursor' / 'rules'
    if rules.is_dir():
        found.extend(p for p in rules.rglob('*') if p.is_file())
    for path in root.rglob('*'):
        if not path.is_file():
            continue
        if 'site' in path.parts:
            continue
        if path.name.lower() == 'claude.md':
            found.append(path)
    workflows = root / '.github' / 'workflows'
    if workflows.is_dir():
        found.extend(_text_files(workflows))
    unique = sorted({p.resolve() for p in found})
    return unique


def _text_files(folder: Path) -> list[Path]:
    keep = {'.md', '.mdc', '.txt', '.yml', '.yaml', '.json'}
    out: list[Path] = []
    for path in folder.rglob('*'):
        if path.is_file() and (path.suffix.lower() in keep or path.suffix == ''):
            out.append(path)
    return out


def scan(root: Path) -> list[str]:
    hits: list[str] = []
    for path in rule_files(root):
        text = path.read_text(encoding='utf-8', errors='replace')
        for number, line in enumerate(text.splitlines(), start=1):
            why = clashes(line)
            if not why:
                continue
            rel = path.relative_to(root.resolve()) if path.is_absolute() else path
            hits.append(f'{rel}:{number}: {"; ".join(why)}: {line.strip()}')
    return hits


def main(argv: list[str]) -> int:
    _self_test()
    root = Path(argv[1]) if len(argv) > 1 else Path('.')
    hits = scan(root)
    if hits:
        print(f'rules check: {len(hits)} clash(es) with AGENTS.md')
        for hit in hits:
            print(hit)
        return 1
    print('rules check: no clash with AGENTS.md')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv))
