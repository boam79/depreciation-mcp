import { ANNEX5_COMMON } from "../data/annex5.js";
import { ANNEX6_OVERRIDES, annex6LookupKey } from "../data/annex6.js";
import type { Annex5Row } from "../data/annex5.js";
import type {
  AssetType,
  BuildingStructure,
  KsicCode,
  UsefulLifeOutput,
} from "../types/index.js";

function rowToOutput(
  row: Annex5Row,
  asset_type: AssetType,
  applicable_table: "annex5" | "annex6",
  industry_code?: KsicCode,
  structure?: BuildingStructure,
): UsefulLifeOutput {
  return {
    asset_type,
    industry_code,
    structure,
    applicable_table,
    standard_life: row.standard_life,
    min_life: row.min_life,
    max_life: row.max_life,
    default_method: row.default_method,
    legal_basis: row.legal_basis,
    note: row.note,
  };
}

export function resolveUsefulLife(params: {
  asset_type: AssetType;
  industry_code?: KsicCode;
  structure?: BuildingStructure;
}): UsefulLifeOutput {
  const { asset_type, industry_code, structure } = params;

  if (asset_type === "building") {
    const s = structure ?? "steel_reinforced_concrete";
    const row = ANNEX5_COMMON.building_by_structure[s];
    return rowToOutput(row, asset_type, "annex5", industry_code, s);
  }

  if (industry_code && industry_code !== "COMMON") {
    const k = annex6LookupKey(industry_code, asset_type);
    const override = ANNEX6_OVERRIDES[k];
    if (override) {
      return rowToOutput(override, asset_type, "annex6", industry_code, structure);
    }
  }

  const common = ANNEX5_COMMON[asset_type];
  if (!common) {
    throw new Error(`자산유형 ${asset_type}에 대한 별표5 데이터가 없습니다.`);
  }
  const row = common;
  return rowToOutput(row, asset_type, "annex5", industry_code, structure);
}
