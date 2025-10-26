interface MagnitudeSuffix {
  readonly suffix: string;
  readonly factor: number;
}

const MAGNITUDE_SUFFIXES: readonly MagnitudeSuffix[] = [
  { suffix: "t", factor: 1e12 },
  { suffix: "b", factor: 1e9 },
  { suffix: "m", factor: 1e6 },
  { suffix: "k", factor: 1e3 },
];

export function formatNumberWithMagnitude(
  value: number,
  decimalPlaces = 1,
): string {
  const absValue = Math.abs(value);
  for (const { suffix, factor } of MAGNITUDE_SUFFIXES) {
    if (absValue >= factor) {
      const formattedValue = (value / factor)
        .toFixed(decimalPlaces)
        .replace(/[.]0+$/, "");
      return `${formattedValue}${suffix}`;
    }
  }
  return String(value);
}
