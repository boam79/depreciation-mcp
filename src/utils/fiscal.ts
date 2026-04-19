import type { DepreciationScheduleOutput } from "../types/index.js";

export function depreciationInCalendarYear(
  schedule: DepreciationScheduleOutput,
  calendarYear: number,
): number {
  const rows = schedule.annual_schedule.filter((r) => r.year === calendarYear);
  return rows.reduce((s, r) => s + r.depreciation, 0);
}

export function bookValueAfterCalendarYear(
  schedule: DepreciationScheduleOutput,
  calendarYear: number,
): number {
  const rows = schedule.annual_schedule.filter((r) => r.year <= calendarYear);
  if (rows.length === 0) return schedule.annual_schedule[0]?.book_value ?? 0;
  return rows[rows.length - 1]!.book_value;
}
