# SkillShift-Bench leaderboard

Submissions and the CI that checks them, for
**[SkillShift-Bench](https://github.com/SkillShift-Bench/skillshift-bench)** —
a benchmark for how well a web agent's *learned skills* survive a website
changing underneath them.

This repository currently holds the **data and validation layer** of the
leaderboard: the entries themselves and the checks a pull request has to pass.
The site that renders them is not built yet.

## What is on the leaderboard

Each entry is ten numbers per metric — three website marginals, six condition
marginals, and an overall macro-average — exactly the shape of Table 1 in the
paper. It is not an 18-cell cross product, and it is not per-task data.

| metric | |
| --- | --- |
| **SR** | success rate (%) |
| **AS** | average steps per task |
| **ASC** | average learned-skill calls per task |
| **SFR** | skill failure rate (%) — a diagnostic, **never a sort key** |

The default ordering is by **SR**. See
[Reading SFR](#reading-sfr-the-warning-mark) below.

**Entries are not automatically comparable across backbones.** The `Model`
column is part of the entry, not decoration: the four Table 1 baselines pool
three backbones, while the Table 3 entries use GPT-5 mini alone. Read the
ranking as a listing, not as a head-to-head.

## What is deliberately absent

SkillShift-Bench publishes **aggregate numbers only**. Per-task pass/fail
judgements and execution traces are never submitted, never stored here, and
never rendered — so that the benchmark cannot be overfitted task by task and
keeps its diagnostic value. A submission instead ships a **run receipt** that
commits to its per-task result vector by SHA-256, and the maintainers may ask
for that file *privately* if an entry is disputed.

See [`docs/results-policy.md`](https://github.com/SkillShift-Bench/skillshift-bench/blob/main/docs/results-policy.md)
in the main repository.

## Submitting

Full instructions:
[`docs/submit.md`](https://github.com/SkillShift-Bench/skillshift-bench/blob/main/docs/submit.md).
The short version:

```bash
pip install -e 'skillshift-bench[run]'
skillshift calibrate                       # check your environment first
skillshift run --agent your_module:Factory --all --out runs/latest
skillshift report runs/latest --out submission/ --name "Your Method" --model <model-id>
skillshift validate submission/results.json
```

Then open a pull request adding `submission/results.json` and
`submission/run_receipt.json` to [`submissions/`](submissions/), renamed per
[the naming rules](submissions/README.md). **Do not add `per_task.jsonl`.**

## Three labels

| label | what it means | receipt |
| --- | --- | --- |
| `reported-only` | numbers taken from a paper whose code is not released | none |
| `verified-paper` | numbers from the SkillShift-Bench paper, produced by its authors | none |
| `self-reported` | an external run of this harness | **required** |

The six launch entries are all transcribed from the paper: four baselines
(AWM, ASI, SkillWeaver, WALT) from Table 1, and MPCR and ASI from Table 3.
None of them carries a receipt, because a receipt commits to a per-task vector
produced by this harness and these numbers predate it. Every external
submission from here on must carry one.

## Reading SFR: the warning mark

The paper measures roughly **0.06–0.15 skill calls per task**. SFR's
denominator is therefore tiny, and a raw SFR ranking would be ranking noise.

The leaderboard makes that constraint mechanical:

- ordering is by **SR**; SFR cannot be selected as a sort key at all;
- an SFR value resting on fewer than **30** skill invocations is rendered
  `0.32 ⚠︎`, with the invocation count shown.

The threshold is `skillshift.eval.metrics.SFR_MIN_SKILL_CALLS` — one constant,
imported by both the harness and this repository's CI.

## Repository layout

```
submissions/                     one JSON file per entry (+ optional receipt)
  README.md                      naming rules and the required fields
.github/workflows/
  validate-submission.yml        the five checks, on every pull request
  comment-submission.yml         posts the rendered preview back to the PR
Makefile                         `make check` runs locally exactly what CI runs
```

## Citation

See [`CITATION.cff`](https://github.com/SkillShift-Bench/skillshift-bench/blob/main/CITATION.cff)
in the main repository.
