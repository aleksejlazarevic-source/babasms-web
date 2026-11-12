# Plan workflow for Cursor: plans, waves, a ledger, and a progress dashboard

## Install (for the human)

1. Save this file at the root of your project as `AGENTS.md`. Cursor reads `AGENTS.md` in every chat in that project. If the project already has one, paste this file below its content.
2. In Cursor Settings, open Models and enable Fable 5.2, Opus 5.5, Grok 4.7 and Composer 2.5.
3. Pick the chat model before you send the first message of a chat (see "Models" below). Do not change the model in the middle of a chat.

## How it works in one minute (for the human)

Small jobs need no plan. Say what you want and the agent does it.

Larger jobs go through a plan:

```
"plan this: ..."            ->  the agent writes plans/<name>.md, split into waves
devil's advocate            ->  a second agent tries to break the plan; the holes get fixed in the plan
you approve                 ->  you read the plan and say "approved"
new chat: "execute plan <name>"
  wave 1: workers build items in parallel -> each item is reviewed -> merged
  wave 2: ...
done                        ->  the dashboard shows 100%
```

- A **wave** is a group of items that do not depend on each other, so workers can build them at the same time. Wave 2 starts when wave 1 is finished.
- The **orchestrator** is the chat you talk to. It plans, hands out work, checks results and keeps the records. It does not write the code of the plan itself.
- **Workers** are subagents that write the code. Each one gets one item.
- A **reviewer** is a fresh subagent that reads a finished item and says SHIP or FIX-THEN-SHIP.

Every plan has three files in `plans/`:

| File | What it is | Who reads it |
|---|---|---|
| `<name>.md` | The plan of record: goal, waves, items, decisions | You and the agent |
| `<name>-ledger.md` | The logbook: what is done (with proof), what is next, what waits on you | The agent, after every restart |
| `<name>-progress.html` | The progress dashboard. Open it in a browser and refresh it | You |

Three phrases drive it: `plan this: <what you want>`, `execute plan <name>`, and `status`.

---

# Rules for the agent

Everything below is an instruction to you, the Cursor agent.

## 1. When the plan workflow runs

Run the plan workflow only when one of these is true:

1. Cursor Plan mode is on.
2. The user asks for a plan in words: "plan this", "write a plan", "make a plan".
3. The user says "execute plan <name>" (or "continue plan <name>").

Everything else is a plain request. Do it yourself, in this chat, now: read what you need, make the change, run the tests, report in plain words. No plan file, no ledger, no dashboard, no reviewer, no worker subagents for work you can do in a few tool calls.

A "what would you change?" or "propose a fix" question is a chat answer, not a plan.

When a plain request turns out to be big (several days of work, or many parts that depend on each other), say so in two sentences and ask once whether the user wants a plan. Do not start a plan on your own.

## 2. Models

The session model is the orchestrator. The user picks it in the model picker before the first message. One model per chat: never switch in the middle, because a switch rebuilds the whole context at a high price. To change model, start a new chat.

| Role | Model | Used for |
|---|---|---|
| Orchestrator, big | **Fable 5.2** | A very difficult task, or an overarching big plan: many waves, several days, a hard design choice, a plan that splits into child plans |
| Orchestrator, small | **Opus 5.5** | A smaller plan or one chunk of a big plan: up to about three waves, about a day of work, no hard design choice |
| Worker, default | **Grok 4.7** | Writes code: features, bug fixes, tests, refactors |
| Worker, simple | **Composer 2.5** | Mechanical work with no hard reasoning: a rename, a repeated edit across files, scaffolding, "run the tests and summarize" |
| Reviewer and devil's advocate | Same model as the orchestrator | A fresh, read-only subagent. Never the worker that wrote the code |

Rules:

- Pass the worker's model on every `Task` call through the `model` field. Use the exact slug your `Task` tool lists for that model. Never guess a slug.
- If the tool does not list Grok 4.7 or Composer 2.5, stop that dispatch and tell the user which models are available. Do not substitute another model silently.
- At the start of a planning chat, judge the size. If the job is big and this chat is not on Fable 5.2 (or small and on Fable 5.2), say so in one sentence and let the user decide. Then continue on the model you have.
- A big plan may split into child plans. The Fable 5.2 session writes the parent plan and one child plan per chunk (`parent: <parent name>` in the child's header). Each child plan is executed in its own Opus 5.5 chat.
- A piece that is too hard for a worker is done by the orchestrator itself. Say so in chat and in the ledger.

## 3. Planning

1. **Research first.** Read the code the plan touches. Do not plan against code you did not open.
2. **Write the plan of record** at `plans/<short-kebab-description>-<YYYY-MM-DD>.md` from Template A. Give it a meaningful name, for example `plans/todo-app-offline-sync-2026-11-12.md`. Never a random or auto-generated name.
3. **Split the work into waves.**
   - Items in one wave do not depend on each other and do not edit the same files.
   - A later wave may depend on an earlier wave, never the reverse.
   - Each item has an id (`W1.1`, `W1.2`, `W2.1`), the files it owns, a worker model, and a "done when" that a command can check (a named test passes, a file exists, a page renders).
   - One item is one branch and one pull request.
4. **Devil's-advocate pass, before you show the plan.** Launch a fresh read-only subagent on the orchestrator's model, named `Devil's advocate — <plan name>`. Point it at the plan file; do not paste the plan into the brief. Its only job is to break the plan. For each wave and item it asks: what fails, what the user sees when it fails, which test is missing, what the plan assumes about code nobody verified, and what cannot be undone. It answers `SHIP` or `FIX-THEN-SHIP` with numbered findings and a severity (HIGH, MEDIUM, LOW).
5. **Fold every finding into the plan** under a dated `## Review fold` section: the finding, its severity, where it was fixed in the plan. A finding you decide not to fix is written down as a deferral with its impact. Nothing is dropped silently. If a fold changes the design, run a new pass with a new subagent. Stop when a pass returns only LOW findings.
6. **Present the plan** with the fold section visible. Set `status: approved` only when the user says so.
7. **Stop there.** Execution starts in a new chat with `execute plan <name>`. The plan and the ledger carry everything the new chat needs.

Plans are permanent. Never delete or overwrite a plan. Replace it with a new dated file and set the old one to `status: superseded`.

## 4. Executing a plan

Before any other work:

1. Read the plan. Read the ledger if it exists.
2. If `plans/<name>-ledger.md` is missing, create it from Template B. The TO-DO table lists every item of the whole plan.
3. If `plans/<name>-progress.html` is missing, create it from Template E and fill only the DATA block. `WAVES` lists every wave of the whole plan, unstarted ones included.
4. Set the plan header to `status: executing`.

Then drive the plan wave by wave:

1. Launch one worker per item of the current wave (section 5).
2. When a worker reports done, check its evidence yourself, then run the review gate (section 6).
3. Merge the item when the review says SHIP and the tests are green.
4. When every item of the wave is merged, update the ledger and the dashboard, read the plan and the ledger again, and start the next wave.
5. After the last wave: run the whole test suite on the main branch, set `status: done`, set the dashboard `RUN_STATE` to `done`, and report.

**The approved plan is the authorization.** Every step the plan names runs without a stop. Stop only for a product decision the plan does not answer, or for a destructive step the plan does not name. Record it under BLOCKED-ON-HUMAN and keep working on the items that do not depend on it.

**The ledger is the truth.** After a restart or a context compaction, read the ledger before you act or answer a status question. When the ledger and your memory disagree, the ledger wins.

**Scope changes** go into the plan's `## Change log` first, with a date, then into the ledger TO-DO and the dashboard `WAVES`. The overall percentage may go down; that is correct.

## 5. Workers

- Every worker is a `Task` with a human name in `description`, for example `W2.1 offline queue`. Never `agent`, `worker` or `helper`.
- Set `run_in_background: true` so the worker shows in the Cursor agents panel. In the same turn, say in chat what you launched and put it in the dashboard `LIVE_NOW`.
- Never do a whole plan item silently in the orchestrator chat. Never say "agents are running" when you only wait for CI or a timer; say what you wait for.
- Compose the brief from Template C. Keep it short: the task, the files in scope, what is out of scope, the "done when", the report format. Point the worker at files to read. Never paste the plan, the ledger or whole source files into a brief.
- Workers that run at the same time each work on their own branch in their own git worktree. Remove the worktree and the branch in the same turn the branch merges.
- A worker never merges and never commits to the main branch.
- When a worker finishes, start the next planned worker at once, or tell the user the agents list is empty and why.

## 6. Review gate

No item of a plan merges without an independent review.

1. After the worker's tests are green, launch a fresh read-only subagent on the orchestrator's model, named `Review <item id> — <title>`, with a brief from Template D.
2. The reviewer reads the diff and the code, runs the tests, and answers `SHIP` or `FIX-THEN-SHIP` for one exact commit. HIGH and MEDIUM findings block. LOW findings are listed and ship.
3. Write the verdict in the ledger STEP LOG in the same turn: `REVIEW SHIP <item> @<commit> r<round>` or `REVIEW FIX <item> @<commit> r<round>: <findings>`.
4. On FIX-THEN-SHIP, a worker fixes the findings on the same branch. Then a new reviewer runs a new round. Never reuse the earlier reviewer.
5. A push after a SHIP cancels that SHIP. Review the new commit.
6. After three rounds without a SHIP, stop that item and ask the user.

## 7. Ledger and dashboard: same-turn rule

Every event (a worker launched, a worker finished, a review verdict, a merge, a blocker) updates the ledger and the dashboard in the same turn as the event. Never batch updates for later.

Ledger:

- Overwrite the SNAPSHOT (three lines at most).
- Append one line to the STEP LOG. The STEP LOG is append-only.
- A DONE row needs evidence you verified in this turn: a commit SHA, a test result, a pull request state. Never evidence from memory.

Dashboard:

- Edit only the DATA block at the top of the file: `STAMP`, `LIVE_NOW`, and the affected `WAVES` rows. Never edit below `END DATA`.
- `LIVE_NOW` says what runs right now. It is empty only when nothing runs.
- `STAMP` is one line, overwritten each time. History lives in the ledger.
- Each wave's `pct` is set by hand and is honest about the effort left. The overall percentage is computed; never set it by hand. 100% means the whole plan is done.
- Use plain words on the dashboard. A person who never opened the plan must understand every line. Keep the item id as a prefix, then say what the thing is. Abbreviations and internal shorthand stay in the ledger.
- Do not open the HTML file or start a server for it. The file on disk is the dashboard; the user refreshes the browser.

## 8. Talking to the user

- Lead with what happened and why it matters, in one or two ordinary sentences. IDs and commit SHAs go at the end.
- When the user must decide something, ask with the `AskQuestion` tool: one question per decision, the full context in the prompt, the recommended option first and marked "(Recommended)". Never a wall of text that the user answers by typing.
- When the user asks `status`, read the ledger SNAPSHOT and answer from it.

## 9. Context discipline

- Run independent tool calls in one batch.
- Use quiet test flags. Send long output to a file under `/tmp` and read the end of it.
- Read large files in parts. Never print a whole large file into the chat.
- One orchestrator chat drives the whole plan from the first wave to the last. Hand off to a new chat only when the user says so or when everything left waits on the user.

## 10. Git

- Never commit to `main` directly. Each item gets a branch: `feat/<item>`, `fix/<item>`.
- With a GitHub remote: push the branch, open a pull request with `gh pr create`, wait for the checks, and merge with `gh pr merge <n> --merge` after the review says SHIP. Record the merge SHA in the ledger.
- Without a remote: the reviewer reads `git diff main...<branch>`, and the orchestrator merges the branch locally after the SHIP.
- Never force-push a shared branch.
- Run the project's full tests before you call an item done.

---

# Templates

Copy these exactly. Do not retype them from memory.

## Template A — plan of record (`plans/<name>.md`)

```markdown
---
plan: <file name without .md>
title: <human title>
status: draft
created: <YYYY-MM-DD>
approved:
orchestrator: <Fable 5.2 | Opus 5.5>
workers: <how many worker dispatches the plan expects>
estimate: <6h | 2d | 1w>
parent:
note:
---

# <title>

## Goal
<What exists when this plan is done, in the user's words. Two to five lines.>

## Out of scope
- <What this plan does not do.>

## Decisions
- <A choice made during planning, and the reason.>

## Waves

### Wave 1 — <plain name>
| id | item | files it owns | worker | done when |
|---|---|---|---|---|
| W1.1 | <what gets built> | <paths> | Grok 4.7 | <a check a command can run> |
| W1.2 | <what gets built> | <paths> | Composer 2.5 | <a check a command can run> |

### Wave 2 — <plain name> (needs wave 1)
| id | item | files it owns | worker | done when |
|---|---|---|---|---|

## Risks
- <What can go wrong, and how the plan notices it.>

## Review fold (devil's advocate, <date>)
| finding | severity | where it was folded |
|---|---|---|

## Change log
- <date> — plan created
```

`status` is one of: `draft`, `approved`, `executing`, `paused`, `blocked`, `done`, `cancelled`, `superseded`.

## Template B — ledger (`plans/<name>-ledger.md`)

```markdown
# <name> — Ledger

Plan of record: `plans/<name>.md`
Dashboard: `plans/<name>-progress.html`

## 0 · SNAPSHOT (3 lines at most, overwritten)

- <date time> — status: <one line> · next: <next action> · blocked-on-human: <n>

## 1 · DONE (evidence required)

| item | evidence (SHA / test result / PR state) | when |
|---|---|---|

## 2 · TO-DO (the whole plan)

| id | item | worker | depends on |
|---|---|---|---|

## 3 · IN REVIEW

| item | branch or PR | review state |
|---|---|---|

## 4 · WORKERS IN FLIGHT

| id | item | model | branch / worktree | status |
|---|---|---|---|---|

## 5 · BLOCKED-ON-HUMAN

| item | what is needed | since |
|---|---|---|

## 6 · STEP LOG (append-only)

- <date time> — ledger created from template
```

## Template C — worker brief

```markdown
# Worker brief — <item id>: <title>

## Task
<One outcome, as an instruction. Two to six lines.>

## Scope — exactly these files
- <paths this worker owns>
- Out of scope: <things next to it that it must not touch>

## Context you cannot infer
<Only what this task needs: conventions, decided trade-offs, traps. Point at files; do not paste them.>

## Done when
- <a condition a command can check>
- Verify with: <exact command, quiet flags>

## Report back (12 lines at most)
STATUS: done | blocked
FILES: <touched>
EVIDENCE: <end of the test output / commit SHA>
BLOCKERS: <what, and the smallest question that unblocks it>

## Worker discipline
- Work on branch <branch> in <worktree path>. Never commit to main. Never merge.
- Stay inside Scope. If the task needs something outside it, stop and report.
- Quiet test output. Send long output to a file under /tmp and read the end.
- Read large files in parts. Batch independent tool calls.
```

## Template D — review brief

```markdown
# Review brief — <item id>: <title>

## Under review
- Checkout to read: <path>
- Branch or PR: <branch / #n> · base: main · head commit: <full SHA>
- Round: <1 | 2 | 3> · Previous round: <none | the findings to confirm as fixed>

## What it must do
- Plan item: read `plans/<name>.md`, wave <n>, item <id>
- Done when: <the plan's condition, copied exactly>
- Out of scope for this item: <what you must not demand here>

## Verdict format (25 lines at most)
VERDICT: SHIP | FIX-THEN-SHIP — at commit <the SHA you reviewed>
FINDINGS: <n>. severity HIGH | MEDIUM | LOW · file:line · the issue · the input that triggers it · the fix
EVIDENCE: the commands you ran and the end of their output
NOT CHECKED: what you could not verify, and why

## Reviewer discipline
- Read-only: no edits, no commits, no merge.
- Check every claim against the diff and the code. Do not trust the worker's report.
- Run the tests yourself. New tests must fail on main and pass on the branch.
- A finding with no concrete trigger is LOW.
```

## Template E — progress dashboard (`plans/<name>-progress.html`)

```html
<!-- PROGRESS DASHBOARD. Edit ONLY the DATA block. Never read or edit below END DATA. -->
<meta charset="utf-8">
<title>Plan progress</title>
<script>
// ======================= DATA (edit ONLY this block) =======================
const PLAN = { name: 'PLAN NAME', file: 'plans/PLAN-NAME.md', ledger: 'plans/PLAN-NAME-ledger.md' };
const RUN_STATE = 'active';   // active | paused | blocked | done
const STAMP = 'YYYY-MM-DD HH:MM — the latest event in one plain sentence: what happened, what runs next';
const LIVE_NOW = [            // what runs RIGHT NOW; [] when nothing runs
  'W2.1 offline queue — a Grok 4.7 worker is writing the queue and its tests',
];
const WAVES = [
  // { id, name, effort (weight), pct (0-100, set by hand, honest), state, open (true = expanded),
  //   summary (one line), items: [ { name, state, evidence } ] }
  // state: todo | wip | pr | done | blocked.  Example rows: replace them on first fill.
  { id: 'W1', name: 'Wave 1 — example, finished', effort: 2, pct: 100, state: 'done', open: false,
    summary: 'One line of what this wave did.',
    items: [
      { name: 'W1.1 example item', state: 'done', evidence: 'PR #1 merged abc1234; 12 of 12 tests pass' },
    ] },
  { id: 'W2', name: 'Wave 2 — example, in progress', effort: 3, pct: 40, state: 'wip', open: true,
    summary: 'One line of what this wave does now.',
    items: [
      { name: 'W2.1 example item in review', state: 'pr', evidence: 'PR #2 open, checks green' },
      { name: 'W2.2 example item not started', state: 'todo', evidence: '' },
    ] },
  { id: 'W3', name: 'Wave 3 — example, not started', effort: 2, pct: 0, state: 'todo', open: false,
    summary: 'Unstarted waves stay on the board. The meter covers the whole plan.',
    items: [] },
];
const BLOCKED_ON_HUMAN = [    // { item, needed, since }; [] when nothing waits on a person
  { item: 'Example decision', needed: 'Pick the colour of the save button', since: '11-12 09:00' },
];
// == END DATA — everything below is frozen: never read or edit past here ==
</script>
<style>
  :root { --bg:#F7F5FB; --surface:#fff; --ink:#252932; --ink2:#5C5575; --ink3:#867DA6; --line:#E6E2F0;
    --accent:#8A6FC8; --track:#EAE6F3; --attn:#C25476; --attnbg:#FBEDF2; --ok:#1E7A4B; --chipink:#3A3550;
    --todo:#EDEAF4; --wip:#F7EACA; --pr:#E5D0F7; --done:#C9EEDC; --blocked:#F6C9D7; }
  @media (prefers-color-scheme: dark) { :root { --bg:#171A20; --surface:#252932; --ink:#E7E2F2; --ink2:#B1A9C9;
    --ink3:#867DA6; --line:#2D323E; --accent:#C9BAEE; --track:#2D323E; --attn:#EFADC0; --attnbg:#291B23;
    --ok:#ABDFC5; --chipink:#F1EDF9; --todo:#3A3F4C; --wip:#6B5A22; --pr:#5A3F7A; --done:#245A40; --blocked:#7A3145; } }
  body { margin:0; background:var(--bg); color:var(--ink); font:15px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif; }
  .wrap { max-width:900px; margin:0 auto; padding:28px 20px 48px; }
  h1 { font-size:26px; margin:0 10px 0 0; display:inline; }
  h2 { font-size:13px; letter-spacing:.1em; text-transform:uppercase; color:var(--ink3); margin:28px 0 10px; }
  .mono { font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:12.5px; color:var(--ink2); overflow-wrap:anywhere; }
  .chip { display:inline-block; font-size:11px; font-weight:600; letter-spacing:.05em; text-transform:uppercase;
    padding:2px 9px; border-radius:999px; color:var(--chipink); white-space:nowrap; vertical-align:4px; }
  .chip.todo{background:var(--todo)} .chip.wip{background:var(--wip)} .chip.pr{background:var(--pr)}
  .chip.done{background:var(--done)} .chip.blocked{background:var(--blocked)}
  .card { background:var(--surface); border:1px solid var(--line); border-radius:10px; padding:14px 18px; margin-top:10px; }
  .big { font-size:42px; font-weight:650; margin-right:12px; }
  .sub { font-size:13px; color:var(--ink2); }
  .meter { background:var(--track); border-radius:4px; overflow:hidden; height:10px; margin-top:8px; }
  .meter i { display:block; height:100%; background:var(--accent); }
  .live { margin:10px 0 0; padding-left:18px; font-size:13px; color:var(--ink2); }
  .attn { border-left:4px solid var(--attn); background:var(--attnbg); }
  .attn div { padding:6px 0; font-size:13.5px; }
  .calm { color:var(--ok); font-size:13.5px; }
  summary { cursor:pointer; display:flex; gap:12px; align-items:center; }
  summary b { flex:1; font-size:14.5px; }
  summary .meter { width:130px; margin:0; }
  summary .chip { vertical-align:0; }
  .item { display:grid; grid-template-columns:minmax(160px,260px) 84px 1fr; gap:12px; align-items:baseline;
    padding:7px 0; border-top:1px solid var(--line); font-size:13.5px; }
  .item .chip { vertical-align:0; }
  footer { margin-top:30px; font-size:12px; color:var(--ink3); }
</style>
<div class="wrap" id="app"></div>
<script>
const esc = s => String(s ?? '').replace(/[&<>"']/g,
  c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const chip = st => `<span class="chip ${esc(st)}">${esc(st)}</span>`;
const clamp = p => Math.max(0, Math.min(100, Math.round(p || 0)));
const meter = p => `<div class="meter"><i style="width:${clamp(p)}%"></i></div>`;
const RUN_CHIP = { active: 'wip', paused: 'todo', blocked: 'blocked', done: 'done' };
const totalEffort = WAVES.reduce((s, w) => s + (w.effort || 1), 0);
const overall = totalEffort
  ? Math.round(WAVES.reduce((s, w) => s + (w.effort || 1) * clamp(w.pct), 0) / totalEffort) : 0;
const doneWaves = WAVES.filter(w => w.state === 'done').length;
const waveHtml = w => `
  <details class="card"${w.open ? ' open' : ''}>
    <summary><b>${esc(w.name)}</b>${meter(w.pct)}<span class="mono">${clamp(w.pct)}%</span>${chip(w.state)}</summary>
    <p class="sub">${esc(w.summary || '')}</p>
    ${(w.items || []).map(i => `<div class="item"><div>${esc(i.name)}</div><div>${chip(i.state)}</div>
      <div class="mono">${esc(i.evidence || '')}</div></div>`).join('')}
  </details>`;
document.getElementById('app').innerHTML = `
  <header>
    <h1>${esc(PLAN.name)}</h1><span class="chip ${RUN_CHIP[RUN_STATE] || 'todo'}">${esc(RUN_STATE)}</span>
    <div class="mono">${esc(STAMP)}</div>
    ${LIVE_NOW.length ? `<ul class="live">${LIVE_NOW.map(l => `<li>${esc(l)}</li>`).join('')}</ul>` : ''}
  </header>
  <div class="card">
    <span class="big">${overall}%</span>
    <span class="sub">of the whole plan · ${doneWaves} of ${WAVES.length} waves done</span>
    ${meter(overall)}
  </div>
  <h2>Waiting on a person</h2>
  ${BLOCKED_ON_HUMAN.length
    ? `<div class="card attn">${BLOCKED_ON_HUMAN.map(b => `<div><b>${esc(b.item)}</b> — ${esc(b.needed)}
        <span class="mono">(${esc(b.since)})</span></div>`).join('')}</div>`
    : `<div class="card calm">Nothing waits on a person.</div>`}
  <h2>Waves</h2>
  ${WAVES.map(waveHtml).join('')}
  <footer>Plan <span class="mono">${esc(PLAN.file)}</span> · ledger <span class="mono">${esc(PLAN.ledger)}</span></footer>`;
</script>
```
