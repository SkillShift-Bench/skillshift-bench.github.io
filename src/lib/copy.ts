export const SITE_TITLE = "SkillShift-Bench";

export const HERO_SENTENCE =
  "SkillShift-Bench measures whether a web agent’s learned skills still execute after the website itself has evolved.";

export const BOUNDARY =
  "SkillShift-Bench publishes the harness, tasks, environments, reproduction commands, and aggregate results; it does not publish per-task judgements or execution traces, so the benchmark cannot be overfitted task-by-task and keeps its long-term diagnostic value.";

export const GETTING_STARTED = `pip install -e 'skillshift-bench[run]'
skillshift calibrate
skillshift run --agent your_module:Factory --all --out runs/latest`;

export const BIBTEX = `@inproceedings{skillshift-bench-2026,
  title     = {SkillShift-Bench: Diagnosing Learned-Skill Executability of Web Agents under Controlled Website Evolution},
  author    = {{SkillShift-Bench Authors}},
  booktitle = {Proceedings of the 2026 Conference on Empirical Methods in Natural Language Processing},
  year      = {2026},
  note      = {arXiv identifier not assigned yet}
}`;

export const PAPER_TITLE =
  "SkillShift-Bench: Diagnosing Learned-Skill Executability of Web Agents under Controlled Website Evolution";

export const PAPER_AUTHORS = "SkillShift-Bench Authors";

export const SFR_SORT_HELPER =
  "SFR is not a sort key (sample size not verified on launch entries).";

export const INCOMPARABLE =
  "Entries are not automatically comparable across backbones.";

export const MODEL_LISTING_HELP =
  "One ranking per chip. Mixed has no MPCR. MPCR is listed under GPT-5 mini.";

export const ARXIV_STAMP = "arXiv identifier not assigned yet";

export const NAV = [
  { href: "/", label: "Home" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/docs", label: "Docs" },
  { href: "/paper", label: "Paper" },
] as const;

export const DOC_LINKS = [
  { href: "/docs/quickstart", label: "Quickstart" },
  { href: "/docs/environments", label: "Environments" },
  { href: "/docs/custom-agent", label: "Custom agent" },
  { href: "/docs/metrics", label: "Metrics" },
  { href: "/docs/baselines", label: "Baselines" },
  { href: "/docs/results-policy", label: "Results policy" },
  { href: "/docs/submit", label: "Submit" },
  { href: "/docs/calibration", label: "Calibration" },
] as const;
