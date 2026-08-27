import type { Bank } from "./constants";
import { CONDITIONS } from "./constants";
import { getSlotValue } from "./cells";
import type { LeaderboardEntry } from "./submissions";

export type SlopeChartPayload = {
  title: string;
  filename: string;
  conditions: string[];
  series: { name: string; data: Array<number | null> }[];
};

export function slopeChartPayload(
  entries: LeaderboardEntry[],
  title: string,
  filename: string,
): SlopeChartPayload {
  return {
    title,
    filename,
    conditions: [...CONDITIONS],
    series: entries.map((e) => ({
      name: e.json.submission.name,
      data: CONDITIONS.map((c) => getSlotValue(e.json.metrics.SR, c)),
    })),
  };
}

export function slopeCaption(bank: Bank): string {
  return bank === "mixed"
    ? "Mixed backbones (Table 1). Oxide bands mark src-exec and tgt-exec. Drawn from launch submissions, not a new aggregation."
    : "gpt-5-mini (Table 3 comparison). Same six conditions. Drawn from the ASI and MPCR launch submissions.";
}
