#!/usr/bin/env python3
"""Transcribe experiment_results/results.md into submissions/*.json."""

from __future__ import annotations

import json
import sys
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

WEBSITES = ("gitlab", "magento", "wordpress")
CONDITIONS = ("src", "src-perc", "src-exec", "tgt", "tgt-perc", "tgt-exec")

METRIC_HEADINGS = {
    "成功率数据": "SR",
    "平均步骤数": "AS",
    "Skill平均调用次数": "ASC",
    "Skill失败率": "SFR",
}
MODEL_HEADINGS = {
    "DeepSeek-v3.2": "deepseek-v3.2",
    "GPT-5-mini": "gpt-5-mini",
    "Claude": "claude",
}
SITE_HEADINGS = {
    "Gitlab": "gitlab",
    "Magento": "magento",
    "Wordpress": "wordpress",
}
COL_MAP = {
    "v1": "src",
    "v1+drift": "src-perc",
    "v1+anomaly": "src-exec",
    "v2": "tgt",
    "v2+drift": "tgt-perc",
    "v2+anomaly": "tgt-exec",
}
METHOD_SLUG = {
    "AWM": "awm",
    "ASI": "asi",
    "SkillWeaver": "skillweaver",
    "WALT": "walt",
}
MODEL_ID = {
    "deepseek-v3.2": "DeepSeek-V3.2",
    "gpt-5-mini": "gpt-5-mini",
    "claude": "Claude Haiku 4.5",
}

N = {
    "websites": {"gitlab": 162, "magento": 114, "wordpress": 79},
    "conditions": {c: 355 for c in CONDITIONS},
    "skill_calls": None,
}

AWM_REASONS = {
    "ASC": (
        "Not applicable to AWM: it reuses prompted textual workflows rather "
        "than executable skill invocations, so there is nothing to count "
        "(experiment results.md, empty cells)."
    ),
    "SFR": (
        "Not applicable to AWM: no executable skill invocations, so the ratio "
        "has no denominator (experiment results.md, empty cells)."
    ),
}

DATE = "2026-08-26"


def r2(value: float) -> float:
    return float(Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


def parse_cell(raw: str) -> float | None:
    text = raw.strip()
    if not text:
        return None
    text = text.replace("%", "").replace(",", "")
    return float(text)


def split_row(line: str) -> list[str]:
    return [cell.strip() for cell in line.strip().strip("|").split("|")]


def parse_md(path: Path) -> dict:
    cells: dict = {}
    metric = model = site = None
    lines = path.read_text().splitlines()
    i = 0
    while i < len(lines):
        line = lines[i].rstrip()
        stripped = line.strip()
        if stripped.startswith("### ") and not stripped.startswith("####"):
            metric = METRIC_HEADINGS.get(stripped[4:].strip())
        elif stripped.startswith("#### "):
            model = MODEL_HEADINGS.get(stripped[5:].strip())
        elif stripped.startswith("##### "):
            site = SITE_HEADINGS.get(stripped[6:].strip())
        elif stripped.startswith("|") and "方法" in stripped:
            headers = split_row(stripped)
            conds = [COL_MAP[h] for h in headers[1:]]
            i += 1
            if i < len(lines) and set(lines[i].replace("|", "").strip()) <= set("-: "):
                i += 1
            while i < len(lines) and lines[i].strip().startswith("|"):
                row = split_row(lines[i])
                method = row[0]
                if method in METHOD_SLUG:
                    if metric is None or model is None or site is None:
                        raise SystemExit(f"missing context at line {i + 1}")
                    for cond, raw in zip(conds, row[1:], strict=True):
                        cells.setdefault(metric, {}).setdefault(model, {}).setdefault(
                            method, {}
                        ).setdefault(site, {})[cond] = parse_cell(raw)
                i += 1
            continue
        i += 1
    return cells


def aggregate(site_cond: dict) -> dict | None:
    grid = []
    for site in WEBSITES:
        row = [site_cond[site][cond] for cond in CONDITIONS]
        grid.append(row)
    flat = [value for row in grid for value in row]
    if all(value is None for value in flat):
        return None
    if any(value is None for value in flat):
        missing = [
            f"{site}.{cond}"
            for site, row in zip(WEBSITES, grid, strict=True)
            for cond, value in zip(CONDITIONS, row, strict=True)
            if value is None
        ]
        raise SystemExit(f"partial nulls: {missing}")
    websites = {
        site: r2(sum(row) / len(row)) for site, row in zip(WEBSITES, grid, strict=True)
    }
    conditions = {
        cond: r2(sum(grid[i][j] for i in range(3)) / 3)
        for j, cond in enumerate(CONDITIONS)
    }
    overall = r2(sum(flat) / 18)
    mean_sites = sum(websites.values()) / 3
    mean_conds = sum(conditions.values()) / 6
    if abs(mean_sites - overall) > 0.02 or abs(mean_conds - overall) > 0.02:
        raise SystemExit(
            f"identity failed: sites={mean_sites:.4f} conds={mean_conds:.4f} oa={overall}"
        )
    return {"websites": websites, "conditions": conditions, "overall": overall}


def null_block() -> dict:
    return {
        "websites": {site: None for site in WEBSITES},
        "conditions": {cond: None for cond in CONDITIONS},
        "overall": None,
    }


def load_methods(submissions: Path) -> dict:
    names = {
        "AWM": "2026-08-23--awm--mixed.json",
        "ASI": "2026-08-23--asi--mixed.json",
        "SkillWeaver": "2026-08-23--skillweaver--mixed.json",
        "WALT": "2026-08-23--walt--mixed.json",
    }
    out = {}
    for name, filename in names.items():
        payload = json.loads((submissions / filename).read_text())
        out[name] = payload["submission"]["method"]
    return out


def build_entry(
    method: str,
    model: str,
    metrics: dict,
    methods: dict,
) -> dict:
    reasons = dict(AWM_REASONS) if method == "AWM" else {}
    notes = (
        "Transcribed from experiment_results/results.md. Website and condition "
        "values are unweighted means of the same eighteen cells, so they agree "
        "with the overall value by construction."
    )
    if method == "ASI" and model == "gpt-5-mini":
        notes += (
            " Condition-level SR and ASC reproduce paper Table 3; this file adds "
            "the per-website breakdown plus AS and SFR from the same run."
        )
    return {
        "schema_version": "1.0",
        "submission": {
            "name": method,
            "date": DATE,
            "contact": None,
            "method": methods[method],
            "model": {
                "id": MODEL_ID[model],
                "temperature": None,
                "vision": None,
            },
            "provenance": {
                "label": "reported-only",
                "source": "experiment results.md",
                "code_released": False,
            },
            "repro_command": None,
        },
        "harness_version": "n/a",
        "metrics": metrics,
        "n": N,
        "reasons": reasons,
        "notes": notes,
    }


def check_ranges(method: str, model: str, metrics: dict) -> None:
    for metric, block in metrics.items():
        values = [
            *block["websites"].values(),
            *block["conditions"].values(),
            block["overall"],
        ]
        for value in values:
            if value is None:
                continue
            if metric in ("SR", "SFR") and not 0 <= value <= 100:
                raise SystemExit(f"{method} {model} {metric} out of range: {value}")
            if metric == "AS" and not value > 0:
                raise SystemExit(f"{method} {model} AS must be > 0: {value}")
            if metric == "ASC" and value < 0:
                raise SystemExit(f"{method} {model} ASC < 0: {value}")


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("usage: import-experiment-results.py PATH/to/results.md")
    md_path = Path(sys.argv[1])
    root = Path(__file__).resolve().parents[1]
    submissions = root / "submissions"
    cells = parse_md(md_path)
    methods = load_methods(submissions)

    expected = 4 * 3 * 4 * 3 * 6
    got = sum(
        1
        for metric in cells.values()
        for model in metric.values()
        for method in model.values()
        for site in method.values()
        for _ in site
    )
    if got != expected:
        raise SystemExit(f"expected {expected} cells, parsed {got}")

    written = []
    for model in MODEL_ID:
        for method, slug in METHOD_SLUG.items():
            metrics = {}
            for metric in ("SR", "AS", "ASC", "SFR"):
                block = aggregate(cells[metric][model][method])
                if block is None:
                    if method != "AWM" or metric not in ("ASC", "SFR"):
                        raise SystemExit(f"unexpected empty {metric} for {method} {model}")
                    metrics[metric] = null_block()
                else:
                    metrics[metric] = block
            check_ranges(method, model, metrics)
            payload = build_entry(method, model, metrics, methods)
            filename = f"{DATE}--{slug}--{model}.json"
            dest = submissions / filename
            dest.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n")
            written.append(filename)

    stale = submissions / "2026-08-23--asi--gpt-5-mini.json"
    if stale.exists():
        stale.unlink()
        print("removed", stale.name)

    print("wrote", len(written), "files")
    for name in written:
        print(" ", name)


if __name__ == "__main__":
    main()
