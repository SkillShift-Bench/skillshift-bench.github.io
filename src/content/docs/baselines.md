---
title: "Baselines"
order: 5
slug: baselines
---

The paper compares four learned-skill methods: **AWM**, **ASI**, **SkillWeaver**
and **WALT**. Their integrations are **not** released here.

Stating that plainly is the honest thing to do. The cards below name the
upstream repositories we started from. Commit pins, harness attachments, and
the libraries as we ran them are not recorded here.

## What is and is not released

| | Released |
| --- | --- |
| The four methods' code as we ran them | **no** |
| The four methods' per-task results and traces | **no** ([results-policy.md](/docs/results-policy)) |
| Their aggregate numbers | yes — transcribed from the paper's Table 1, labelled `verified-paper` |
| Upstream repository | yes — below |
| MPCR, including all six ablation variants | **yes**, `src/skillshift/agents/mpcr/` |
| The frozen skill library ASI and MPCR share | **yes**, `src/skillshift/agents/mpcr/actions/` and `workflows/` |

Leaderboard entries transcribed from a paper carry the `verified-paper` label and
no run receipt. They are not claims about this harness; they are the published
numbers, reproduced verbatim, with their source named. See
[results-policy.md](/docs/results-policy).

## Method cards

### AWM — Agent Workflow Memory

Skills are **prompted textual workflows**: induced task/action-trajectory pairs
injected into the agent's context. There is no executable invocation, so
Average Skill Calls and Skill Failure Rate are undefined for AWM and Table 1
prints `--`.

- Upstream: [zorazrw/agent-workflow-memory](https://github.com/zorazrw/agent-workflow-memory)

### ASI — Inducing Programmatic Skills for Agentic Tasks

Skills are **executable Python functions**, verified for correctness, usage and
validity, then exposed as callable high-level actions alongside the primitives.

- Upstream: [zorazrw/agent-skill-induction](https://github.com/zorazrw/agent-skill-induction)

### SkillWeaver

- Upstream: [OSU-NLP-Group/SkillWeaver](https://github.com/OSU-NLP-Group/SkillWeaver)

### WALT

- Upstream: [SalesforceAIResearch/WALT](https://github.com/SalesforceAIResearch/WALT)

## The fixed-library protocol

For the MPCR comparison, ASI first learns a library on `src`. The library is
then **frozen** and shared: ASI uses its own selector, MPCR changes only
test-time selection over the same skills and primitives. This isolates
executor-side adaptation from additional skill acquisition, and it is why the
comparison in the paper's Table 3 is attributable to selection rather than to
learning.

## Reference agent

The paper has no no-skill baseline — all four methods carry a library. The
built-in `reference` agent fills that gap: plain ReAct over the primitive action
set only, `ASC = 0` and `SFR = null` by construction. Its purpose is
calibration, not comparison, and it does not appear on the leaderboard. See
[calibration.md](/docs/calibration) for what `skillshift calibrate` does with it,
and [metrics.md](/docs/metrics) for the metric definitions.
