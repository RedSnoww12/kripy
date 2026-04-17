export function ema(values: readonly number[], span: number): number[] {
  if (values.length === 0) return [];
  const k = 2 / (span + 1);
  const out: number[] = [values[0]];
  for (let i = 1; i < values.length; i++) {
    out.push(values[i] * k + out[i - 1] * (1 - k));
  }
  return out;
}
