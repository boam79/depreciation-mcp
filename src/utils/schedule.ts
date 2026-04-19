import { getDecliningRate, supportedDecliningLives } from "../data/decliningRates.js";
import type { DepreciationMethod, DepreciationScheduleOutput } from "../types/index.js";
import { residualValue } from "./residual.js";

const EPS = 1e-6;

function monthsInFirstCalendarYear(acquired: Date): number {
  const m = acquired.getMonth() + 1;
  return 13 - m;
}

function parseDate(s: string): Date {
  const d = new Date(s + "T00:00:00.000Z");
  if (Number.isNaN(d.getTime())) {
    throw new Error(`acquired_date 형식 오류: YYYY-MM-DD 형식으로 입력해 주세요. (입력값: ${s})`);
  }
  return d;
}

export function calcDepreciationSchedule(params: {
  asset_name: string;
  cost: number;
  acquired_date: string;
  method: DepreciationMethod;
  useful_life_years: number;
  total_units?: number;
  current_units?: number;
}): DepreciationScheduleOutput {
  const { asset_name, cost, acquired_date, method, useful_life_years } = params;
  if (cost <= 0) throw new Error("취득가액(cost)은 0보다 커야 합니다.");
  if (useful_life_years <= 0) throw new Error("내용연수는 0보다 커야 합니다.");

  const acquired = parseDate(acquired_date);
  const residual = residualValue(cost, acquired_date);
  const depreciable = Math.max(0, cost - residual);

  if (method === "units_of_production") {
    const { total_units, current_units } = params;
    if (total_units == null || current_units == null) {
      throw new Error(
        "생산량비례법(units_of_production)은 total_units와 current_units가 필요합니다.",
      );
    }
    if (total_units <= 0) throw new Error("total_units는 0보다 커야 합니다.");
    if (current_units < 0) throw new Error("current_units는 0 이상이어야 합니다.");
    return unitsOfProductionSchedule({
      asset_name,
      cost,
      residual,
      depreciable,
      useful_life_years,
      total_units,
      current_units,
    });
  }

  if (method === "declining") {
    const rate = getDecliningRate(useful_life_years);
    if (rate == null) {
      throw new Error(
        `정률법 상각률이 정의되지 않은 내용연수입니다: ${useful_life_years}년. 사용 가능: ${supportedDecliningLives().join(", ")}년`,
      );
    }
    return decliningSchedule({
      asset_name,
      cost,
      residual,
      acquired,
      useful_life_years,
      rate,
    });
  }

  return straightSchedule({
    asset_name,
    cost,
    residual,
    depreciable,
    acquired,
    useful_life_years,
  });
}

function straightSchedule(input: {
  asset_name: string;
  cost: number;
  residual: number;
  depreciable: number;
  acquired: Date;
  useful_life_years: number;
}): DepreciationScheduleOutput {
  const { asset_name, cost, residual, depreciable, acquired, useful_life_years } = input;
  const annualFull = depreciable / useful_life_years;
  let book = cost;
  let cumulative = 0;
  const annual_schedule: DepreciationScheduleOutput["annual_schedule"] = [];
  let calendarYear = acquired.getFullYear();
  let isFirst = true;
  const maxYears = useful_life_years + 5;

  for (let i = 0; i < maxYears && book > residual + EPS; i++) {
    const months = isFirst ? monthsInFirstCalendarYear(acquired) : 12;
    isFirst = false;
    let dep = annualFull * (months / 12);
    dep = Math.min(dep, book - residual);
    if (dep < EPS) break;
    dep = Math.round(dep * 1e6) / 1e6;
    cumulative = Math.round((cumulative + dep) * 1e6) / 1e6;
    book = Math.round((book - dep) * 1e6) / 1e6;
    annual_schedule.push({
      year: calendarYear,
      depreciation: dep,
      book_value: book,
      cumulative,
    });
    calendarYear += 1;
  }

  const memo =
    "정액법: 연간감가상각비 = (취득가액-잔존가액)/내용연수×(당기 사용월수/12). 세무·회계 최종 판단은 전문가 검토를 권장합니다.";

  return {
    asset_name,
    method: "straight",
    useful_life: useful_life_years,
    residual_value: residual,
    annual_schedule,
    total_depreciation: cumulative,
    memo,
  };
}

function decliningSchedule(input: {
  asset_name: string;
  cost: number;
  residual: number;
  acquired: Date;
  useful_life_years: number;
  rate: number;
}): DepreciationScheduleOutput {
  const { asset_name, cost, residual, acquired, useful_life_years, rate } = input;
  let book = cost;
  let cumulative = 0;
  const annual_schedule: DepreciationScheduleOutput["annual_schedule"] = [];
  let calendarYear = acquired.getFullYear();
  let isFirst = true;
  const maxYears = useful_life_years * 3;

  for (let i = 0; i < maxYears && book > residual + EPS; i++) {
    const months = isFirst ? monthsInFirstCalendarYear(acquired) : 12;
    isFirst = false;
    let dep = book * rate * (months / 12);
    dep = Math.min(dep, book - residual);
    if (dep < EPS) break;
    dep = Math.round(dep * 1e6) / 1e6;
    cumulative = Math.round((cumulative + dep) * 1e6) / 1e6;
    book = Math.round((book - dep) * 1e6) / 1e6;
    annual_schedule.push({
      year: calendarYear,
      depreciation: dep,
      book_value: book,
      cumulative,
    });
    calendarYear += 1;
  }

  const memo =
    `정률법: 연간감가상각비 = 기초장부가액×상각률(${rate})×(사용월수/12). 결과는 세무 검토 보조용입니다.`;

  return {
    asset_name,
    method: "declining",
    useful_life: useful_life_years,
    residual_value: residual,
    annual_schedule,
    total_depreciation: cumulative,
    memo,
  };
}

function unitsOfProductionSchedule(input: {
  asset_name: string;
  cost: number;
  residual: number;
  depreciable: number;
  useful_life_years: number;
  total_units: number;
  current_units: number;
}): DepreciationScheduleOutput {
  const { asset_name, cost, residual, depreciable, useful_life_years, total_units, current_units } =
    input;
  const annualDep = depreciable * (current_units / total_units);
  let book = cost;
  let cumulative = 0;
  const annual_schedule: DepreciationScheduleOutput["annual_schedule"] = [];
  const startYear = new Date().getFullYear();
  const maxYears = Math.min(100, useful_life_years * 20);
  for (let y = 0; y < maxYears && book > residual + EPS; y++) {
    let dep = Math.min(annualDep, book - residual);
    dep = Math.round(dep * 1e6) / 1e6;
    if (dep < EPS) break;
    cumulative = Math.round((cumulative + dep) * 1e6) / 1e6;
    book = Math.round((book - dep) * 1e6) / 1e6;
    annual_schedule.push({
      year: startYear + y,
      depreciation: dep,
      book_value: book,
      cumulative,
    });
  }

  return {
    asset_name,
    method: "units_of_production",
    useful_life: useful_life_years,
    residual_value: residual,
    annual_schedule,
    total_depreciation: cumulative,
    memo:
      "생산량비례법: 당기감가상각비 = (취득가액-잔존가액)×(당기생산량/총추정생산량). 스케줄은 동일 생산량 가정으로 반복 채움(실무 입력 보정 필요).",
  };
}
