import { cellsForMetric, formatNumber } from "./cells";
import {
  execDrop,
  formatCell,
  formatDelta,
  hasReceipt,
  overallAttr,
} from "./board";
import { displayLabel, entryRowId, MODEL_LISTINGS } from "./submissions";
import type { Cell, Metric } from "./constants";

export const BOARD_METRICS = ["SR", "AS", "ASC", "SFR"] as const;

export type BoardBar = {
  srcPct: number;
  execPct: number;
  label: string;
};

export type BoardEntryPayload = {
  slug: string;
  fileId: string;
  bank: string;
  model: string;
  name: string;
  modelId: string;
  label: string;
  source: string;
  harness: string;
  notes: string;
  paperUrl: string | null;
  skillCalls: string;
  nWebsites: string;
  receipt: string;
  sr: string;
  as: string;
  asc: string;
  srText: string;
  asText: string;
  ascText: string;
  srcText: string;
  execText: string;
  deltaText: string;
  deltaKind: "empty" | "drop" | "gain";
  bar: BoardBar | null;
  cells: Record<(typeof BOARD_METRICS)[number], Cell[]>;
};

export type BoardListingPayload = {
  id: string;
  title: string;
  lede: string;
  slugs: string[];
};

export type BoardPayload = {
  listings: BoardListingPayload[];
  entries: Record<string, BoardEntryPayload>;
};

function numOrEmpty(raw: string): number | null {
  return raw === "" ? null : Number(raw);
}

function packEntry(
  entry: (typeof MODEL_LISTINGS)[number]["entries"][number],
): BoardEntryPayload {
  const drop = execDrop(entry);
  const sr = overallAttr(entry, "SR");
  const as = overallAttr(entry, "AS");
  const asc = overallAttr(entry, "ASC");
  const deltaKind =
    drop.delta === null ? "empty" : drop.delta < 0 ? "drop" : "gain";
  const cells = {} as BoardEntryPayload["cells"];
  for (const metric of BOARD_METRICS) {
    cells[metric] = cellsForMetric(entry.json, metric as Metric);
  }
  const bar =
    drop.srcPct === null || drop.execPct === null
      ? null
      : {
          srcPct: drop.srcPct,
          execPct: drop.execPct,
          label: `src ${formatNumber(drop.src as number)} percent, tgt-exec ${formatNumber(drop.tgtExec as number)} percent`,
        };
  return {
    slug: entry.slug,
    fileId: entryRowId(entry),
    bank: entry.bank,
    model: entry.model,
    name: entry.json.submission.name,
    modelId: entry.json.submission.model.id,
    label: displayLabel(entry.json.submission.provenance.label),
    source: entry.json.submission.provenance.source,
    harness: entry.json.harness_version,
    notes: entry.json.notes,
    paperUrl: entry.json.submission.method.paper_url,
    skillCalls:
      entry.json.n.skill_calls === null
        ? "null"
        : String(entry.json.n.skill_calls),
    nWebsites: `GitLab ${entry.json.n.websites.gitlab} · Magento ${entry.json.n.websites.magento} · WordPress ${entry.json.n.websites.wordpress}`,
    receipt: hasReceipt(entry) ? "Harness receipt" : "No harness receipt",
    sr,
    as,
    asc,
    srText: formatCell(numOrEmpty(sr)),
    asText: formatCell(numOrEmpty(as)),
    ascText: formatCell(numOrEmpty(asc)),
    srcText: formatCell(drop.src),
    execText: formatCell(drop.tgtExec),
    deltaText: formatDelta(drop.delta),
    deltaKind,
    bar,
    cells,
  };
}

export function toBoardPayload(): BoardPayload {
  const entries: Record<string, BoardEntryPayload> = {};
  const listings = MODEL_LISTINGS.map((listing) => {
    const slugs = listing.entries.map((entry) => {
      if (!entries[entry.slug]) entries[entry.slug] = packEntry(entry);
      return entry.slug;
    });
    return {
      id: listing.model,
      title: listing.title,
      lede: listing.lede,
      slugs,
    };
  });
  return { listings, entries };
}

export function safeJson(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
