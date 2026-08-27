import {
  CONDITIONS,
  SFR_MIN_SKILL_CALLS,
  SLOT_IDS,
  SLOT_LABELS,
  WEBSITES,
  type Cell,
  type Metric,
  type MetricBlock,
  type SlotId,
  type SubmissionJson,
} from "./constants";

function isWebsite(slot: SlotId): slot is (typeof WEBSITES)[number] {
  return (WEBSITES as readonly string[]).includes(slot);
}

function isCondition(slot: SlotId): slot is (typeof CONDITIONS)[number] {
  return (CONDITIONS as readonly string[]).includes(slot);
}

export function slotGroup(slot: SlotId): "website" | "condition" | "overall" {
  if (slot === "overall") return "overall";
  if (isWebsite(slot)) return "website";
  return "condition";
}

export function isExecSlot(slot: SlotId): boolean {
  return slot === "src-exec" || slot === "tgt-exec";
}

export function getSlotValue(block: MetricBlock, slot: SlotId): number | null {
  if (slot === "overall") return block.overall;
  if (isWebsite(slot)) return block.websites[slot];
  if (isCondition(slot)) return block.conditions[slot];
  return null;
}

export function formatNumber(value: number): string {
  return value.toFixed(2);
}

function reasonFor(
  reasons: Record<string, string>,
  metric: Metric,
  slot: SlotId,
): string {
  const keys: string[] = [];
  if (slot === "overall") keys.push(`${metric}.overall`);
  else if (isWebsite(slot)) keys.push(`${metric}.websites.${slot}`);
  else keys.push(`${metric}.conditions.${slot}`);
  keys.push(metric);
  for (const key of keys) {
    if (reasons[key]) return reasons[key];
  }
  return "";
}

function isNotApplicable(reason: string): boolean {
  return /not applicable/i.test(reason) || /'--'/.test(reason) || /\bN\/A\b/i.test(reason);
}

export function resolveCell(
  entry: SubmissionJson,
  metric: Metric,
  slot: SlotId,
): Cell {
  const value = getSlotValue(entry.metrics[metric], slot);
  const reason = reasonFor(entry.reasons, metric, slot);
  const label = SLOT_LABELS[slot];

  if (value === null) {
    if (isNotApplicable(reason)) {
      return {
        kind: "na",
        value: null,
        text: "--",
        a11y: `${label}: not applicable`,
      };
    }
    return {
      kind: "unmeasured",
      value: null,
      text: "",
      a11y: `${label}: unmeasured`,
    };
  }

  const text = formatNumber(value);
  const skillCalls = entry.n.skill_calls;
  const unverified =
    metric === "SFR" &&
    (skillCalls === null || skillCalls < SFR_MIN_SKILL_CALLS);

  if (unverified) {
    return {
      kind: "sfr-unverified",
      value,
      text,
      a11y: `${label}: ${text} percent, n unverified`,
    };
  }

  return {
    kind: "number",
    value,
    text,
    a11y: `${label}: ${text}`,
  };
}

export function cellsForMetric(entry: SubmissionJson, metric: Metric): Cell[] {
  return SLOT_IDS.map((slot) => resolveCell(entry, metric, slot));
}
