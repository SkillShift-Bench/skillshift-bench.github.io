import type { Metric } from "./constants";
import { formatNumber, getSlotValue } from "./cells";
import type { LeaderboardEntry } from "./submissions";

export type ExecDrop = {
  src: number | null;
  tgtExec: number | null;
  delta: number | null;
  srcPct: number | null;
  execPct: number | null;
};

function clipPct(value: number): number {
  return Math.min(100, Math.max(0, value));
}

export function execDrop(entry: LeaderboardEntry): ExecDrop {
  const src = getSlotValue(entry.json.metrics.SR, "src");
  const tgtExec = getSlotValue(entry.json.metrics.SR, "tgt-exec");
  const delta = src === null || tgtExec === null ? null : tgtExec - src;
  return {
    src,
    tgtExec,
    delta,
    srcPct: src === null ? null : clipPct(src),
    execPct: tgtExec === null ? null : clipPct(tgtExec),
  };
}

export function formatCell(value: number | null): string {
  return value === null ? "—" : formatNumber(value);
}

export function formatDelta(delta: number | null): string {
  if (delta === null) return "—";
  if (delta > 0) return `+${formatNumber(delta)}`;
  if (delta < 0) return `−${formatNumber(Math.abs(delta))}`;
  return formatNumber(0);
}

export function overallAttr(entry: LeaderboardEntry, metric: Metric): string {
  const v = getSlotValue(entry.json.metrics[metric], "overall");
  return v === null ? "" : String(v);
}

export function hasReceipt(entry: LeaderboardEntry): boolean {
  return entry.json.submission.provenance.label === "self-reported";
}
