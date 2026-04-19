import type { KsicCode } from "../types/index.js";

export const KSIC_NAMES: Record<KsicCode, string> = {
  Q86: "보건업 및 사회복지 서비스업",
  C26: "전자부품·컴퓨터·영상·음향·통신장비 제조업",
  J62: "컴퓨터 프로그래밍·시스템 통합·자문업",
  J63: "정보서비스업",
  C29: "기타 기계장비 제조업",
  COMMON: "공통(별표5)",
};

export function isKsicCode(s: string): s is KsicCode {
  return s in KSIC_NAMES;
}

export function listKsicCodes(): KsicCode[] {
  return Object.keys(KSIC_NAMES) as KsicCode[];
}
