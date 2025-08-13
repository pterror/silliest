/** Warning: Unsafe when `T` is itself an array type. */
export function unwrapPossibleSingleton<T>(
  value: T | readonly T[]
): T | undefined {
  return Array.isArray(value) ? value[0] : (value as T);
}
