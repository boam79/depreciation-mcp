import { describe, it, expect } from "vitest";
import { calcDepreciationSchedule } from "../src/utils/schedule.js";

describe("calcDepreciationSchedule straight", () => {
  it("2007 이후 취득은 잔존 0, 정액법 첫해 월비례", () => {
    const s = calcDepreciationSchedule({
      asset_name: "테스트",
      cost: 1_200_000,
      acquired_date: "2026-03-01",
      method: "straight",
      useful_life_years: 5,
    });
    expect(s.residual_value).toBe(0);
    expect(s.annual_schedule[0]?.year).toBe(2026);
    const months = 10;
    const annual = 1_200_000 / 5;
    expect(s.annual_schedule[0]?.depreciation).toBeCloseTo((annual * months) / 12, 0);
  });
});
