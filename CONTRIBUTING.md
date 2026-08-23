# Contributing to the SkillShift-Bench leaderboard

This repository accepts two kinds of pull request.

## 1. A leaderboard entry

Read
[`docs/submit.md`](https://github.com/SkillShift-Bench/skillshift-bench/blob/main/docs/submit.md)
first — it is the authoritative version of everything below.

1. **Calibrate before you measure.** `skillshift calibrate` runs the built-in
   no-skill reference agent over a fixed 30-family subset and tells you whether
   your deployment behaves like the one the published numbers came from. An
   uncalibrated run can only tell you that a number came out, not that it means
   anything.
2. **Run the full benchmark.** All three websites, all six conditions. Partial
   sweeps are rejected by the denominator check, deliberately.
3. **`skillshift report`** produces three files. Submit two of them:
   `results.json` and `run_receipt.json`. The third, `per_task.jsonl`, stays on
   your machine — the receipt already commits to its contents by SHA-256.
4. **`skillshift validate`** locally, then `make check` here.
5. Rename both files per [`submissions/README.md`](submissions/README.md) and
   open the pull request.

CI posts a comment with your ranking position, the full breakdown, and the
labels your entry will carry. A maintainer then checks one thing by hand: that
the method description is accurate. Everything else is automated.

### What we will ask you for later

If an entry is disputed, we may ask you **privately** for that run's
`per_task.jsonl` so it can be hashed against the `per_task_commitment` in your
receipt. It is used for verification only and is never published. An entry
whose submitter declines is marked `unverifiable` or removed from the
leaderboard.

## 2. A fix to the leaderboard itself

Naming rules, CI, documentation. Please open an issue first if it changes what
a submission has to contain — the schemas are shared with the harness and are
versioned there.

## What never belongs in a pull request

Per-task pass/fail judgements, execution traces, screenshots, or logs.
SkillShift-Bench publishes aggregate numbers only, so that the benchmark cannot
be overfitted task by task. CI refuses them, and `.gitignore` is a second line
of defence, not the first.
