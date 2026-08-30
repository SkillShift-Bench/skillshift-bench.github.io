export const SITE_TITLE = "SkillShift-Bench";

export const HERO_SENTENCE =
  "SkillShift-Bench measures whether a web agent’s learned skills still execute after the website itself has evolved.";

export const BOUNDARY =
  "SkillShift-Bench publishes the harness, tasks, environments, reproduction commands, and aggregate results; it does not publish per-task judgements or execution traces, so the benchmark cannot be overfitted task-by-task and keeps its long-term diagnostic value.";

export const GETTING_STARTED = `pip install -e 'skillshift-bench[run]'
skillshift calibrate
skillshift run --agent your_module:Factory --all --out runs/latest`;

export const BIBTEX = `@unpublished{chen2026skillshift,
  title  = {SkillShift-Bench: Benchmarking Skill Learning under Environment Evolution for Web Agents},
  author = {Chen, Bo-Yu and Zhou, Zhi and Li, Yu-Feng},
  year   = {2026},
  note   = {Code, tasks, environments, and leaderboard: https://skillshift-bench.github.io/}
}`;

export const PAPER_TITLE =
  "SkillShift-Bench: Benchmarking Skill Learning under Environment Evolution for Web Agents";

export type PaperAuthor = {
  name: string;
  marks: string;
  corresponding: boolean;
};

export const PAPER_AUTHORS: PaperAuthor[] = [
  { name: "Bo-Yu Chen", marks: "1,2", corresponding: false },
  { name: "Zhi Zhou", marks: "1,2", corresponding: true },
  { name: "Yu-Feng Li", marks: "1,2", corresponding: true },
];

export const PAPER_AFFILIATIONS = [
  "School of Artificial Intelligence, Nanjing University",
  "National Key Laboratory for Novel Software Technology, Nanjing University",
] as const;

export const PAPER_EMAIL = "{chenby, zhouz, liyf}@lamda.nju.edu.cn";

export const CONTACT_EMAIL = "chenby@lamda.nju.edu.cn";

export const PAPER_CORRESPONDING = "Corresponding authors.";

export const PAPER_ABSTRACT =
  "Skill learning enables web agents to reuse prior experience for long-horizon interactive tasks. However, learned skills are typically evaluated in closed environments, overlooking the fact that real-world web deployment involves continuous shifts in invocation context, perceptual grounding, and execution feasibility. To this end, we introduce SkillShift-Bench, the first benchmark for evaluating skill learning with controlled open-environment shifts. SkillShift-Bench simulates Contextual Shift, Perceptual Shift, and Execution Shift across three self-hosted web systems, and evaluates agents with diagnostics covering task success, interaction cost, skill use, and skill failure. Comprehensive experiments reveal systematic robustness degradation under controlled shifts, characterized by lower success rates, higher interaction costs, and more frequent skill failures, with Execution Shift exerting the strongest pressure. We further formulate shifted skill execution as a nonstationary local executability problem and provide both a dynamic-regret analysis and a practical test-time adaptation method, demonstrating the feasibility of improving learned-skill execution without relearning the skill library. Code, tasks, environments, documentation, and the leaderboard are available at https://skillshift-bench.github.io/.";

export const PAPER_CONTRIBUTIONS = [
  {
    tag: "Bench",
    text: "We introduce SkillShift-Bench, a controlled benchmark for learned skill executability under Contextual, Perceptual, and Execution Shifts.",
  },
  {
    tag: "SWOP",
    text: "We formulate shifted skill execution as nonstationary local executability and analyze SWOP with a variation-dependent dynamic regret guarantee.",
  },
  {
    tag: "MPCR",
    text: "We propose MPCR, a test-time, fixed-library executor-side reranker that improves transfer through feasibility-aware action selection.",
  },
] as const;

export const PAPER_FIGURE_CAPTION =
  "Three controlled shift modes in SkillShift-Bench. Aligned variants preserve task intent, task-critical entities, required functionality, and success criteria, while Contextual, Perceptual, and Execution Shifts respectively target skill invocation, grounding evidence, and runtime feasibility.";

export const PAPER_FINDINGS = {
  pooled: [
    { label: "Base", sr: "40.97" },
    { label: "Perceptual", sr: "35.23" },
    { label: "Execution", sr: "18.69" },
  ],
  mpcr: {
    asi: "37.90",
    mpcr: "41.26",
    relative: "8.87",
  },
  lede: "Success decreases from 40.97% in the Base view to 35.23% in Perceptual and 18.69% in Execution, with Execution Shift exerting the strongest pressure. On a frozen ASI library, MPCR raises overall SR from 37.90% to 41.26% (relative +8.87%).",
} as const;

export const PAPER_METHODS = [
  {
    name: "SWOP",
    expand: "Sliding-Window Optimistic Prior-Guided Planning",
    badge: "Analysis",
    text: "An idealized prior-guided adaptation model with a variation-dependent dynamic-regret guarantee. The learned library is the prior; recent feasibility evidence updates which actions remain reliable.",
  },
  {
    name: "MPCR",
    expand: "Masked Prior-Guided Candidate Reranking",
    badge: "Executor",
    text: "A test-time, fixed-library executor-side method that reranks candidate actions using current-page feasibility evidence. Gains reflect action selection, not additional skill acquisition.",
  },
] as const;

export const SFR_SORT_HELPER =
  "SFR is not a sort key (sample size not verified on launch entries).";

export const INCOMPARABLE =
  "Entries are not automatically comparable across backbones.";

export const MODEL_LISTING_HELP =
  "Per-model ranks each method on each backbone. Mixed is pooled. MPCR is GPT-5 mini only.";

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
