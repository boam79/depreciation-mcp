import { describe, it, expect } from "vitest";
import { calcTaxAdjustmentCore } from "../src/utils/taxAdjustment.js";

describe("calcTaxAdjustmentCore", () => {
  it("손금부인: 회계 > 세무한도", () => {
    const r = calcTaxAdjustmentCore({ book_depreciation: 100, tax_limit: 80 });
    expect(r.tax_denial_amount).toBe(20);
    expect(r.approval_shortage).toBe(0);
    expect(r.prior_approval_used).toBe(0);
  });

  it("시인부족: 세무한도 > 회계", () => {
    const r = calcTaxAdjustmentCore({ book_depreciation: 50, tax_limit: 80 });
    expect(r.tax_denial_amount).toBe(0);
    expect(r.approval_shortage).toBe(30);
  });

  it("추인: 전기이월 손금부인과 시인부족의 min", () => {
    const r = calcTaxAdjustmentCore({
      book_depreciation: 50,
      tax_limit: 80,
      carried_over_denial: 10,
    });
    expect(r.prior_approval_used).toBe(10);
  });
});
