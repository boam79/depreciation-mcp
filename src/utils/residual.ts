const CUTOFF = new Date("2007-01-01T00:00:00.000Z");

export function residualValue(cost: number, acquiredDateIso: string): number {
  const d = new Date(acquiredDateIso);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`acquired_date 형식 오류: YYYY-MM-DD 형식으로 입력해 주세요. (입력값: ${acquiredDateIso})`);
  }
  if (d >= CUTOFF) return 0;
  return Math.round(cost * 0.1 * 1e6) / 1e6;
}
