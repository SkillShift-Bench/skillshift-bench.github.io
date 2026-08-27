#!/usr/bin/env python3
"""Build-time snapshots: 355-family index, rewritten docs, env digests."""

from __future__ import annotations

import json
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ORG = ROOT.parent
TASKS = ORG / "skillshift-bench" / "data" / "tasks"
DOCS_SRC = ORG / "skillshift-bench" / "docs"
DIGESTS_SRC = ORG / "skillshift-envs" / "DIGESTS.json"
OUT_DATA = ROOT / "src" / "data"
OUT_DOCS = ROOT / "src" / "content" / "docs"

DOC_META = [
    ("quickstart", 1, "Quickstart"),
    ("environments", 2, "Environments"),
    ("custom-agent", 3, "Custom agent"),
    ("metrics", 4, "Metrics"),
    ("baselines", 5, "Baselines"),
    ("results-policy", 6, "Results policy"),
    ("submit", 7, "Submit"),
    ("calibration", 8, "Calibration"),
]

MD_LINK = re.compile(r"\[([^\]]+)\]\(([^)]+)\)")


def load_tasks(path: Path) -> list[dict]:
    return json.loads(path.read_text())


SITE_MAP = {
    "gitlab": "gitlab",
    "magento": "magento",
    "shopping_admin": "magento",
    "wordpress": "wordpress",
}


def slim(task: dict) -> dict:
    eval_block = task.get("eval") or {}
    types = list(eval_block.get("eval_types") or [])
    raw_site = (task.get("sites") or [None])[0]
    site = SITE_MAP.get(raw_site, raw_site)
    return {
        "family_id": task["family_id"],
        "legacy_id": task.get("legacy_id"),
        "site": site,
        "intent": task.get("intent") or "",
        "intent_template": task.get("intent_template") or "",
        "eval_types": types,
    }


def merge_pair(v1: dict, v2: dict | None) -> dict:
    row = {
        "family_id": v1["family_id"],
        "legacy_id": v1["legacy_id"],
        "site": v1["site"],
        "intent": v1["intent"],
        "intent_template": v1["intent_template"],
        "eval_types": sorted(set(v1["eval_types"])),
        "versions": ["v1", "v2"],
    }
    if v2:
        if v2["intent"] and v2["intent"] != v1["intent"]:
            row["intent_v2"] = v2["intent"]
        if v2["intent_template"] and v2["intent_template"] != v1["intent_template"]:
            row["intent_template_v2"] = v2["intent_template"]
        extra = [t for t in v2["eval_types"] if t not in row["eval_types"]]
        if extra:
            row["eval_types"] = sorted(set(row["eval_types"] + extra))
    return row


def build_families() -> list[dict]:
    gitlab_v1 = {t["family_id"]: slim(t) for t in load_tasks(TASKS / "gitlab" / "v1.json")}
    gitlab_v2 = {t["family_id"]: slim(t) for t in load_tasks(TASKS / "gitlab" / "v2.json")}
    magento_v1 = {t["family_id"]: slim(t) for t in load_tasks(TASKS / "magento" / "v1.json")}
    magento_v2 = {t["family_id"]: slim(t) for t in load_tasks(TASKS / "magento" / "v2.json")}
    wordpress = [slim(t) for t in load_tasks(TASKS / "wordpress" / "tasks.json")]

    families: list[dict] = []
    for fid, row in gitlab_v1.items():
        families.append(merge_pair(row, gitlab_v2.get(fid)))
    for fid, row in magento_v1.items():
        families.append(merge_pair(row, magento_v2.get(fid)))
    for row in wordpress:
        families.append(merge_pair(row, None))

    families.sort(key=lambda r: r["family_id"])
    if len(families) != 355:
        raise SystemExit(f"expected 355 families, got {len(families)}")
    by_site = {}
    for r in families:
        by_site[r["site"]] = by_site.get(r["site"], 0) + 1
    if by_site != {"gitlab": 162, "magento": 114, "wordpress": 79}:
        raise SystemExit(f"unexpected site counts: {by_site}")
    return families


def rewrite_href(href: str) -> str:
    if href.startswith(("http://", "https://", "mailto:", "#")):
        return href
    if href.startswith("../"):
        rest = href[3:]
        return f"https://github.com/SkillShift-Bench/skillshift-bench/blob/main/{rest}"
    m = re.match(r"^([\w.-]+)\.md(#[\w.-]+)?$", href)
    if m:
        slug = m.group(1)
        frag = m.group(2) or ""
        return f"/docs/{slug}{frag}"
    return href


def rewrite_markdown(text: str) -> str:
    def repl(match: re.Match[str]) -> str:
        label, href = match.group(1), match.group(2)
        return f"[{label}]({rewrite_href(href)})"

    return MD_LINK.sub(repl, text)


def copy_docs() -> None:
    OUT_DOCS.mkdir(parents=True, exist_ok=True)
    for slug, order, title in DOC_META:
        src = DOCS_SRC / f"{slug}.md"
        body = src.read_text()
        if body.startswith("# "):
            _, _, rest = body.partition("\n")
            body = rest.lstrip("\n")
        body = rewrite_markdown(body)
        front = f"---\ntitle: {json.dumps(title)}\norder: {order}\nslug: {slug}\n---\n\n"
        (OUT_DOCS / f"{slug}.md").write_text(front + body)


def main() -> None:
    OUT_DATA.mkdir(parents=True, exist_ok=True)
    families = build_families()
    (OUT_DATA / "families.json").write_text(json.dumps(families, indent=2) + "\n")
    shutil.copyfile(DIGESTS_SRC, OUT_DATA / "digests.json")
    copy_docs()
    print(f"wrote {len(families)} families, docs, digests")


if __name__ == "__main__":
    main()
