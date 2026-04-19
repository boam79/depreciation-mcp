import type { AssetType, BuildingStructure, DepreciationMethod } from "../types/index.js";

export interface Annex5Row {
  standard_life: number;
  min_life: number;
  max_life: number;
  default_method: DepreciationMethod;
  legal_basis: string;
  note?: string;
}

/** 시행규칙 별표5 — 유형고정자산(공통) 기준내용연수 요약. 실무 보조용 샘플 데이터이며 법령 개정 시 갱신 필요 */
export const ANNEX5_COMMON: Partial<Record<AssetType, Annex5Row>> & {
  building_by_structure: Record<BuildingStructure, Annex5Row>;
} = {
  building_by_structure: {
    steel_reinforced_concrete: {
      standard_life: 40,
      min_life: 40,
      max_life: 40,
      default_method: "straight",
      legal_basis: "법인세법 시행규칙 별표5 (건물·철근콘크리트조 등)",
    },
    brick_stone: {
      standard_life: 30,
      min_life: 30,
      max_life: 30,
      default_method: "straight",
      legal_basis: "법인세법 시행규칙 별표5 (건물·벽돌·석조 등)",
    },
    wood_metal_other: {
      standard_life: 20,
      min_life: 20,
      max_life: 20,
      default_method: "straight",
      legal_basis: "법인세법 시행규칙 별표5 (건물·목조·기타)",
    },
  },
  building_fixture: {
    standard_life: 15,
    min_life: 8,
    max_life: 20,
    default_method: "declining",
    legal_basis: "법인세법 시행규칙 별표5 (건물부속설비)",
    note: "내용연수 범위 내 선택 시 정액법 적용 가능",
  },
  machinery: {
    standard_life: 8,
    min_life: 4,
    max_life: 20,
    default_method: "declining",
    legal_basis: "법인세법 시행규칙 별표5 (기계장치)",
  },
  medical_device: {
    standard_life: 5,
    min_life: 4,
    max_life: 8,
    default_method: "declining",
    legal_basis: "법인세법 시행규칙 별표5 (의료·정밀기기 등)",
  },
  vehicle: {
    standard_life: 5,
    min_life: 4,
    max_life: 6,
    default_method: "declining",
    legal_basis: "법인세법 시행규칙 별표5 (차량운반구)",
  },
  it_equipment: {
    standard_life: 5,
    min_life: 4,
    max_life: 6,
    default_method: "declining",
    legal_basis: "법인세법 시행규칙 별표5 (전자·통신기기 등)",
  },
  software: {
    standard_life: 5,
    min_life: 2,
    max_life: 5,
    default_method: "straight",
    legal_basis: "법인세법 시행규칙 별표5 (무형고정자산 중 소프트웨어)",
  },
  furniture: {
    standard_life: 6,
    min_life: 4,
    max_life: 8,
    default_method: "declining",
    legal_basis: "법인세법 시행규칙 별표5 (비품)",
  },
  construction_equipment: {
    standard_life: 6,
    min_life: 4,
    max_life: 8,
    default_method: "declining",
    legal_basis: "법인세법 시행규칙 별표5 (건설용 장비)",
  },
  intangible_goodwill: {
    standard_life: 5,
    min_life: 5,
    max_life: 20,
    default_method: "straight",
    legal_basis: "법인세법 시행규칙 별표5 (영업권 등)",
    note: "실무상 별도 검토 필요",
  },
  intangible_development: {
    standard_life: 5,
    min_life: 2,
    max_life: 10,
    default_method: "straight",
    legal_basis: "법인세법 시행규칙 별표5 (개발비 등)",
  },
  other: {
    standard_life: 5,
    min_life: 4,
    max_life: 8,
    default_method: "declining",
    legal_basis: "법인세법 시행규칙 별표5 (기타)",
    note: "자산 실체에 맞는 세목 재분류 권장",
  },
};
