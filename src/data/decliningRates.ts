/** 법인세법 시행령 별표 기준 정률법 상각률 (내용연수별) — PRD 표와 동일 */
export const DECLINING_RATE_BY_LIFE: Record<number, number> = {
  4: 0.438,
  5: 0.369,
  6: 0.319,
  8: 0.25,
  10: 0.206,
  15: 0.15,
  20: 0.116,
  30: 0.08,
};

export function getDecliningRate(usefulLifeYears: number): number | undefined {
  return DECLINING_RATE_BY_LIFE[usefulLifeYears];
}

export function supportedDecliningLives(): number[] {
  return Object.keys(DECLINING_RATE_BY_LIFE).map(Number).sort((a, b) => a - b);
}
