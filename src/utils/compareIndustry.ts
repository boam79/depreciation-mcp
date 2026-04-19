import { resolveUsefulLife } from "./resolveUsefulLife.js";
import { calcDepreciationSchedule } from "./schedule.js";
import type { AssetType, DepreciationMethod, KsicCode } from "../types/index.js";
import { KSIC_NAMES } from "../data/ksicMapping.js";
import { getDecliningRate } from "../data/decliningRates.js";

export interface IndustryComparisonOutput {
  asset_type: AssetType;
  cost: number;
  comparison: {
    industry_code: KsicCode;
    industry_name: string;
    useful_life: number;
    method: DepreciationMethod;
    annual_depreciation_yr1: number;
    total_5yr_depreciation: number;
    applicable_table: "annex5" | "annex6";
  }[];
}

export function compareIndustryLifeCore(input: {
  asset_type: AssetType;
  cost: number;
  industry_codes: KsicCode[];
  method?: DepreciationMethod;
}): IndustryComparisonOutput {
  const { asset_type, cost, industry_codes, method } = input;
  if (industry_codes.length === 0) {
    throw new Error("industry_codes에 최소 1개 업종코드가 필요합니다.");
  }
  const comparison: IndustryComparisonOutput["comparison"] = [];

  for (const industry_code of industry_codes) {
    const resolved = resolveUsefulLife({ asset_type, industry_code });
    let m: DepreciationMethod = method ?? resolved.default_method;
    if (m === "declining" && getDecliningRate(resolved.standard_life) == null) {
      m = "straight";
    }
    const schedule = calcDepreciationSchedule({
      asset_name: "comparison",
      cost,
      acquired_date: "2026-01-01",
      method: m,
      useful_life_years: resolved.standard_life,
    });
    const y1 = schedule.annual_schedule.find((r) => r.year === 2026)?.depreciation ?? 0;
    let total5 = 0;
    for (let y = 2026; y <= 2030; y++) {
      total5 += schedule.annual_schedule.find((r) => r.year === y)?.depreciation ?? 0;
    }
    comparison.push({
      industry_code,
      industry_name: KSIC_NAMES[industry_code] ?? industry_code,
      useful_life: resolved.standard_life,
      method: m,
      annual_depreciation_yr1: Math.round(y1 * 1e6) / 1e6,
      total_5yr_depreciation: Math.round(total5 * 1e6) / 1e6,
      applicable_table: resolved.applicable_table,
    });
  }

  return { asset_type, cost, comparison };
}
