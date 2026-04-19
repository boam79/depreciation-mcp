import type { AssetType, DepreciationMethod, KsicCode } from "../types/index.js";
import type { Annex5Row } from "./annex5.js";

export interface Annex6Key {
  industry: KsicCode;
  asset_type: AssetType;
}

/** 시행규칙 별표6 — 업종별 내용연수(요약). annex5와 상이할 때만 정의 */
export const ANNEX6_OVERRIDES: Partial<Record<string, Annex5Row>> = {
  "Q86:medical_device": {
    standard_life: 5,
    min_life: 4,
    max_life: 8,
    default_method: "declining",
    legal_basis: "법인세법 시행규칙 별표6 (보건업 등 — 의료장비)",
    note: "MRI 등 고가 의료장비도 동일 세목으로 조회 후 실무·세무 검토",
  },
  "J62:it_equipment": {
    standard_life: 5,
    min_life: 4,
    max_life: 6,
    default_method: "declining",
    legal_basis: "법인세법 시행규칙 별표6 (소프트웨어업 등 — 전산장비)",
  },
  "J63:it_equipment": {
    standard_life: 5,
    min_life: 4,
    max_life: 6,
    default_method: "declining",
    legal_basis: "법인세법 시행규칙 별표6 (정보서비스업 — 전산장비)",
  },
  "C26:machinery": {
    standard_life: 8,
    min_life: 4,
    max_life: 20,
    default_method: "declining",
    legal_basis: "법인세법 시행규칙 별표6 (전자장비 제조업 — 기계장치)",
  },
};

export function annex6LookupKey(industry: KsicCode, assetType: AssetType): string {
  return `${industry}:${assetType}`;
}
