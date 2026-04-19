import type { TaxAdjustmentOutput } from "../types/index.js";

const DISCLAIMER =
  "본 계산은 법인세법상 손금부인·시인부족·추인 개념을 단순화한 참고값입니다. 실제 세무조정은 신고 기준·이월액·사실관계에 따라 달라질 수 있습니다.";

export function calcTaxAdjustmentCore(input: {
  book_depreciation: number;
  tax_limit: number;
  carried_over_denial?: number;
}): TaxAdjustmentOutput {
  const { book_depreciation, tax_limit, carried_over_denial = 0 } = input;
  if (book_depreciation < 0 || tax_limit < 0 || carried_over_denial < 0) {
    throw new Error("book_depreciation, tax_limit, carried_over_denial는 0 이상이어야 합니다.");
  }
  const tax_denial_amount = Math.max(0, book_depreciation - tax_limit);
  const approval_shortage = Math.max(0, tax_limit - book_depreciation);
  const prior_approval_used = Math.min(carried_over_denial, approval_shortage);
  const net_tax_expense = tax_denial_amount - prior_approval_used;

  const adjustment_memo = [
    `손금부인액 = max(0, 회계감가상각비(${book_depreciation}) - 세무상각범위액(${tax_limit})) = ${tax_denial_amount}`,
    `시인부족액 = max(0, 세무한도(${tax_limit}) - 회계비용(${book_depreciation})) = ${approval_shortage}`,
    `추인사용액 = min(전기이월손금부인(${carried_over_denial}), 당기시인부족(${approval_shortage})) = ${prior_approval_used}`,
    `순세무효과(단순) = ${net_tax_expense}`,
    DISCLAIMER,
  ].join("\n");

  return {
    tax_denial_amount,
    approval_shortage,
    prior_approval_used,
    net_tax_expense,
    adjustment_memo,
  };
}
