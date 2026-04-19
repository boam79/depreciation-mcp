import type { AssetType, DepreciationMethod, KsicCode } from "../types/index.js";
import { resolveUsefulLife } from "./resolveUsefulLife.js";
import { calcDepreciationSchedule } from "./schedule.js";
import { depreciationInCalendarYear, bookValueAfterCalendarYear } from "./fiscal.js";
import { calcTaxAdjustmentCore } from "./taxAdjustment.js";

const MAX_BULK = 100;

export interface BulkAssetInput {
  asset_name: string;
  asset_type: AssetType;
  industry_code?: KsicCode;
  cost: number;
  acquired_date: string;
  method?: DepreciationMethod;
  useful_life_years?: number;
}

export interface BulkDepreciationOutput {
  fiscal_year: number;
  total_assets: number;
  total_book_depreciation: number;
  total_tax_limit: number;
  total_denial: number;
  total_shortage: number;
  asset_details: {
    asset_name: string;
    annual_depreciation: number;
    tax_limit: number;
    denial_amount: number;
    book_value_eoy: number;
  }[];
  annual_summary_table: string;
  memo?: string;
}

export function calcBulkDepreciationCore(input: {
  assets: BulkAssetInput[];
  fiscal_year: number;
  output_format?: "summary" | "detailed" | "tax_adjustment";
}): BulkDepreciationOutput {
  const { assets, fiscal_year, output_format = "summary" } = input;
  if (assets.length > MAX_BULK) {
    throw new Error(`일괄 입력은 최대 ${MAX_BULK}건까지 허용됩니다. (현재 ${assets.length}건)`);
  }

  const asset_details: BulkDepreciationOutput["asset_details"] = [];
  let total_book_depreciation = 0;
  let total_tax_limit = 0;
  let total_denial = 0;
  let total_shortage = 0;

  for (const a of assets) {
    const resolved = resolveUsefulLife({
      asset_type: a.asset_type,
      industry_code: a.industry_code,
    });
    const bookLife = a.useful_life_years ?? resolved.standard_life;
    const bookMethod = a.method ?? resolved.default_method;

    const bookSched = calcDepreciationSchedule({
      asset_name: a.asset_name,
      cost: a.cost,
      acquired_date: a.acquired_date,
      method: bookMethod,
      useful_life_years: bookLife,
    });

    const taxSched = calcDepreciationSchedule({
      asset_name: a.asset_name,
      cost: a.cost,
      acquired_date: a.acquired_date,
      method: resolved.default_method,
      useful_life_years: resolved.standard_life,
    });

    const annual_depreciation = depreciationInCalendarYear(bookSched, fiscal_year);
    const tax_limit = depreciationInCalendarYear(taxSched, fiscal_year);
    const adj = calcTaxAdjustmentCore({
      book_depreciation: annual_depreciation,
      tax_limit,
    });

    total_book_depreciation += annual_depreciation;
    total_tax_limit += tax_limit;
    total_denial += adj.tax_denial_amount;
    total_shortage += adj.approval_shortage;

    asset_details.push({
      asset_name: a.asset_name,
      annual_depreciation,
      tax_limit,
      denial_amount: adj.tax_denial_amount,
      book_value_eoy: bookValueAfterCalendarYear(bookSched, fiscal_year),
    });
  }

  const lines = [
    "| 자산명 | 당기감가상각 | 세무한도 | 손금부인 | 기말장부 |",
    "|---|---:|---:|---:|---:|",
    ...asset_details.map(
      (d) =>
        `| ${d.asset_name} | ${d.annual_depreciation.toFixed(2)} | ${d.tax_limit.toFixed(2)} | ${d.denial_amount.toFixed(2)} | ${d.book_value_eoy.toFixed(2)} |`,
    ),
    "| **합계** | **" +
      total_book_depreciation.toFixed(2) +
      "** | **" +
      total_tax_limit.toFixed(2) +
      "** | **" +
      total_denial.toFixed(2) +
      "** | — |",
  ];
  const annual_summary_table = lines.join("\n");

  const memo =
    output_format === "tax_adjustment"
      ? "tax_adjustment: 자산별 손금부인은 당기 회계상각과 세무상각한도(별표 기준 내용연수·기본 상각방식) 비교 단순모형입니다."
      : undefined;

  return {
    fiscal_year,
    total_assets: assets.length,
    total_book_depreciation: Math.round(total_book_depreciation * 1e6) / 1e6,
    total_tax_limit: Math.round(total_tax_limit * 1e6) / 1e6,
    total_denial: Math.round(total_denial * 1e6) / 1e6,
    total_shortage: Math.round(total_shortage * 1e6) / 1e6,
    asset_details,
    annual_summary_table,
    memo,
  };
}
