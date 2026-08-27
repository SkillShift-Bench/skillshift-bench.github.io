export const WEBSITES = ["gitlab", "magento", "wordpress"] as const;
export const CONDITIONS = [
  "src",
  "src-perc",
  "src-exec",
  "tgt",
  "tgt-perc",
  "tgt-exec",
] as const;
export const SLOT_IDS = [...WEBSITES, ...CONDITIONS, "overall"] as const;

export type WebsiteId = (typeof WEBSITES)[number];
export type ConditionId = (typeof CONDITIONS)[number];
export type SlotId = (typeof SLOT_IDS)[number];
export type Metric = "SR" | "AS" | "ASC" | "SFR";
export type Bank = "mixed" | "mini";
export type Label = "reported-only" | "verified-paper" | "self-reported";

export type MetricBlock = {
  websites: Record<WebsiteId, number | null>;
  conditions: Record<ConditionId, number | null>;
  overall: number | null;
};

export type SubmissionJson = {
  schema_version: string;
  submission: {
    name: string;
    date: string;
    contact: string | null;
    method: {
      name: string;
      description: string;
      paper_url: string | null;
      code_url: string | null;
    };
    model: {
      id: string;
      temperature: number | null;
      vision: boolean | null;
    };
    provenance: {
      label: Label;
      source: string;
      code_released: boolean;
    };
    repro_command: string | null;
  };
  harness_version: string;
  metrics: Record<Metric, MetricBlock>;
  n: {
    websites: Record<WebsiteId, number>;
    conditions: Record<ConditionId, number>;
    skill_calls: number | null;
  };
  reasons: Record<string, string>;
  notes: string;
};

export type CellKind = "number" | "unmeasured" | "na" | "sfr-unverified";

export type Cell = {
  kind: CellKind;
  value: number | null;
  text: string;
  a11y: string;
};

export const SLOT_LABELS: Record<SlotId, string> = {
  gitlab: "GitLab",
  magento: "Magento",
  wordpress: "WordPress",
  src: "src",
  "src-perc": "src-perc",
  "src-exec": "src-exec",
  tgt: "tgt",
  "tgt-perc": "tgt-perc",
  "tgt-exec": "tgt-exec",
  overall: "overall",
};

export const SFR_MIN_SKILL_CALLS = 30;
export const EXPECTED_FAMILY_COUNT = 355;
