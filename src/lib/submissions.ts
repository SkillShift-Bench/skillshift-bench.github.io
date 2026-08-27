import type { Bank, Label, Metric, SubmissionJson } from "./constants";
import { getSlotValue } from "./cells";

export type LeaderboardEntry = {
  slug: string;
  filename: string;
  bank: Bank;
  model: string;
  json: SubmissionJson;
};

const files = import.meta.glob<SubmissionJson>("../../submissions/*.json", {
  eager: true,
  import: "default",
});

function parsePath(path: string): {
  filename: string;
  slug: string;
  model: string;
  bank: Bank;
} {
  const filename = path.split("/").pop() ?? path;
  const base = filename.replace(/\.json$/, "");
  const parts = base.split("--");
  const method = parts[1] ?? "unknown";
  const model = parts.slice(2).join("--");
  const slug = `${method}--${model}`;
  const bank: Bank = model === "mixed" ? "mixed" : "mini";
  return { filename, slug, model, bank };
}

function loadEntries(): LeaderboardEntry[] {
  const entries: LeaderboardEntry[] = [];
  for (const [path, json] of Object.entries(files)) {
    if (!path.endsWith(".json")) continue;
    const { filename, slug, model, bank } = parsePath(path);
    entries.push({ slug, filename, model, bank, json });
  }
  return entries;
}

export const ENTRIES: LeaderboardEntry[] = loadEntries();

export function entriesForBank(bank: Bank): LeaderboardEntry[] {
  return ENTRIES.filter((e) => e.bank === bank);
}

export function sortEntries(
  entries: LeaderboardEntry[],
  metric: Metric,
  dir: "asc" | "desc" = "desc",
): LeaderboardEntry[] {
  return [...entries].sort((a, b) => {
    const av = getSlotValue(a.json.metrics[metric], "overall");
    const bv = getSlotValue(b.json.metrics[metric], "overall");
    const aMissing = av === null;
    const bMissing = bv === null;
    if (aMissing && bMissing) return a.filename.localeCompare(b.filename);
    if (aMissing) return 1;
    if (bMissing) return -1;
    const diff = (av as number) - (bv as number);
    const ordered = dir === "desc" ? -diff : diff;
    if (ordered !== 0) return ordered;
    return a.filename.localeCompare(b.filename);
  });
}

export function displayLabel(label: Label): string {
  if (label === "verified-paper") return "verified (paper)";
  return label;
}

export const MIXED_ENTRIES = sortEntries(entriesForBank("mixed"), "SR");

const LAUNCH_MINI_SLUGS = new Set(["asi--gpt-5-mini", "mpcr--gpt-5-mini"]);
export const MINI_ENTRIES = sortEntries(
  ENTRIES.filter((e) => LAUNCH_MINI_SLUGS.has(e.slug)),
  "SR",
);

const MODEL_CHIP_ORDER = [
  "mixed",
  "deepseek-v3.2",
  "gpt-5-mini",
  "claude",
];

export function entryRowId(entry: LeaderboardEntry): string {
  return entry.filename.replace(/\.json$/, "");
}

export function displayModel(model: string): string {
  if (model === "mixed") return "Mixed";
  if (model === "deepseek-v3.2") return "DeepSeek-V3.2";
  if (model === "gpt-5-mini") return "GPT-5 mini";
  if (model === "claude") return "Claude";
  return model;
}

export type ModelListing = {
  model: string;
  label: string;
  title: string;
  lede: string;
  entries: LeaderboardEntry[];
};

function listingLede(model: string): string {
  if (model === "mixed") {
    return "AWM, ASI, SkillWeaver, WALT. Pooled backbones; MPCR is not in this listing.";
  }
  if (model === "gpt-5-mini") {
    return "AWM, ASI, SkillWeaver, WALT, and MPCR on GPT-5 mini. Not ranked against Mixed.";
  }
  if (model === "deepseek-v3.2" || model === "claude") {
    return `AWM, ASI, SkillWeaver, WALT on ${displayModel(model)}. Not ranked against Mixed.`;
  }
  return `Single-model runs of ${displayModel(model)}. Not ranked against Mixed.`;
}

function listingTitle(model: string): string {
  if (model === "mixed") return "Mixed backbones — Table 1 listing";
  return `${displayModel(model)} listing`;
}

export const MODEL_LISTINGS: ModelListing[] = (() => {
  const mixed: ModelListing = {
    model: "mixed",
    label: displayModel("mixed"),
    title: listingTitle("mixed"),
    lede: listingLede("mixed"),
    entries: MIXED_ENTRIES,
  };
  const others = [
    ...new Set(ENTRIES.map((e) => e.model).filter((m) => m !== "mixed")),
  ]
    .sort((a, b) => {
      const ai = MODEL_CHIP_ORDER.indexOf(a);
      const bi = MODEL_CHIP_ORDER.indexOf(b);
      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    })
    .map((model) => ({
      model,
      label: displayModel(model),
      title: listingTitle(model),
      lede: listingLede(model),
      entries: sortEntries(
        ENTRIES.filter((e) => e.model === model),
        "SR",
      ),
    }));
  return mixed.entries.length > 0 ? [mixed, ...others] : others;
})();
