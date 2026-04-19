import { ANNEX5_COMMON } from "../data/annex5.js";
import { ANNEX6_OVERRIDES } from "../data/annex6.js";
import { getDecliningRate } from "../data/decliningRates.js";
import type { AssetCategoryItem } from "../types/index.js";
import type { AssetType, DepreciationMethod, KsicCode } from "../types/index.js";

export type AssetFilter = "machinery" | "vehicle" | "building" | "it" | "medical" | "all";

const FILTER_MAP: Record<Exclude<AssetFilter, "all">, AssetType[]> = {
  machinery: ["machinery", "construction_equipment"],
  vehicle: ["vehicle"],
  building: ["building", "building_fixture"],
  it: ["it_equipment", "software"],
  medical: ["medical_device"],
};

function matchesFilter(assetType: AssetType, filter: AssetFilter): boolean {
  if (filter === "all") return true;
  return FILTER_MAP[filter].includes(assetType);
}

function rowToCategoryItem(
  asset_type: string,
  row: {
    standard_life: number;
    min_life: number;
    max_life: number;
    default_method: DepreciationMethod;
    legal_basis: string;
  },
  show_rates: boolean,
): AssetCategoryItem {
  const default_methods: DepreciationMethod[] =
    row.default_method === "declining" ? ["declining", "straight"] : ["straight", "declining"];
  const declining_rate = show_rates ? getDecliningRate(row.standard_life) : undefined;
  return {
    asset_type,
    standard_life: row.standard_life,
    min_life: row.min_life,
    max_life: row.max_life,
    default_methods,
    declining_rate,
    straight_rate: 1 / row.standard_life,
    legal_basis: row.legal_basis,
  };
}

export function listAssetCategoriesCore(input: {
  industry_code?: KsicCode;
  asset_filter?: AssetFilter;
  show_rates?: boolean;
}): AssetCategoryItem[] {
  const { industry_code, asset_filter = "all", show_rates = true } = input;
  const items: AssetCategoryItem[] = [];

  const pushAnnex5 = () => {
    for (const at of Object.keys(ANNEX5_COMMON) as (keyof typeof ANNEX5_COMMON)[]) {
      if (at === "building_by_structure") {
        for (const [st, row] of Object.entries(ANNEX5_COMMON.building_by_structure)) {
          const pseudo = `building:${st}`;
          if (!(asset_filter === "all" || asset_filter === "building")) continue;
          items.push(rowToCategoryItem(pseudo, row, show_rates));
        }
        continue;
      }
      const assetType = at as AssetType;
      if (!matchesFilter(assetType, asset_filter)) continue;
      const row = ANNEX5_COMMON[assetType];
      if (row && "standard_life" in row) {
        items.push(rowToCategoryItem(assetType, row, show_rates));
      }
    }
  };

  if (!industry_code || industry_code === "COMMON") {
    pushAnnex5();
    return items.sort((a, b) => a.asset_type.localeCompare(b.asset_type));
  }

  for (const [key, row] of Object.entries(ANNEX6_OVERRIDES)) {
    if (!key.startsWith(`${industry_code}:`)) continue;
    if (!row) continue;
    const assetPart = key.split(":")[1] ?? "";
    if (!matchesFilter(assetPart as AssetType, asset_filter)) continue;
    items.push(rowToCategoryItem(`${key}`, row, show_rates));
  }

  if (items.length === 0) {
    pushAnnex5();
  }

  return items.sort((a, b) => a.asset_type.localeCompare(b.asset_type));
}
