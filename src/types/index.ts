export const ASSET_TYPES = [
  "building",
  "building_fixture",
  "machinery",
  "medical_device",
  "vehicle",
  "it_equipment",
  "software",
  "furniture",
  "construction_equipment",
  "intangible_goodwill",
  "intangible_development",
  "other",
] as const;

export type AssetType = (typeof ASSET_TYPES)[number];

export const DEPRECIATION_METHODS = [
  "straight",
  "declining",
  "units_of_production",
] as const;

export type DepreciationMethod = (typeof DEPRECIATION_METHODS)[number];

export const BUILDING_STRUCTURES = [
  "steel_reinforced_concrete",
  "brick_stone",
  "wood_metal_other",
] as const;

export type BuildingStructure = (typeof BUILDING_STRUCTURES)[number];

/** KSIC(한국표준산업분류) 대표 코드 — annex6 매핑용 */
export const KSIC_CODES = [
  "Q86", // 보건업 및 사회복지 서비스업
  "C26", // 전자부품·컴퓨터·영상·음향·통신장비 제조업
  "J62", // 컴퓨터 프로그래밍·시스템 통합·자문업
  "J63", // 정보서비스업
  "C29", // 기타 기계장비 제조업
  "COMMON", // 별표5 공통
] as const;

export type KsicCode = (typeof KSIC_CODES)[number];

export interface UsefulLifeOutput {
  asset_type: AssetType;
  industry_code?: KsicCode;
  structure?: BuildingStructure;
  applicable_table: "annex5" | "annex6";
  standard_life: number;
  min_life: number;
  max_life: number;
  default_method: DepreciationMethod;
  legal_basis: string;
  note?: string;
}

export interface DepreciationScheduleRow {
  year: number;
  depreciation: number;
  book_value: number;
  cumulative: number;
}

export interface DepreciationScheduleOutput {
  asset_name: string;
  method: DepreciationMethod;
  useful_life: number;
  residual_value: number;
  annual_schedule: DepreciationScheduleRow[];
  total_depreciation: number;
  memo?: string;
}

export interface TaxAdjustmentOutput {
  tax_denial_amount: number;
  approval_shortage: number;
  prior_approval_used: number;
  net_tax_expense: number;
  adjustment_memo: string;
}

export interface AssetCategoryItem {
  asset_type: string;
  standard_life: number;
  min_life: number;
  max_life: number;
  default_methods: DepreciationMethod[];
  declining_rate?: number;
  straight_rate: number;
  legal_basis: string;
}
