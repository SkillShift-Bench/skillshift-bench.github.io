import { EXPECTED_FAMILY_COUNT, type WebsiteId } from "./constants";
import raw from "../data/families.json";

export type Family = {
  family_id: string;
  legacy_id: string | null;
  site: WebsiteId;
  intent: string;
  intent_v2?: string;
  intent_template: string;
  intent_template_v2?: string;
  eval_types: string[];
  versions: Array<"v1" | "v2">;
};

export const FAMILIES = raw as Family[];

if (FAMILIES.length !== EXPECTED_FAMILY_COUNT) {
  throw new Error(
    `Family index must contain ${EXPECTED_FAMILY_COUNT} families, got ${FAMILIES.length}`,
  );
}

export const SITE_COUNTS: Record<WebsiteId, number> = {
  gitlab: FAMILIES.filter((f) => f.site === "gitlab").length,
  magento: FAMILIES.filter((f) => f.site === "magento").length,
  wordpress: FAMILIES.filter((f) => f.site === "wordpress").length,
};
