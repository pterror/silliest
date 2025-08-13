/** Safe only when `T` is an exact type, i.e. value has no extra keys. */
export function unsafeKeys<T extends object>(
  value: T
): readonly (keyof T & string)[] {
  return Object.keys(value) as (keyof T & string)[];
}

/** Safe only when `T` is an exact type, i.e. value has no extra keys. */
export function unsafeEntries<T extends object>(
  object: T
): readonly {
  readonly [K in keyof T]: readonly [K, T[K]];
}[keyof T][] {
  return Object.entries(object) as never[];
}

/** Safe only when `T` is an exact type, i.e. value has no extra keys. */
export function unsafeMapEntries<T extends object, V>(
  object: T,
  map: (entry: { [K in keyof T]: readonly [K, T[K]] }[keyof T]) => V
) {
  return Object.fromEntries(
    unsafeEntries(object).map((entry) => [entry[0], map(entry)])
  ) as { readonly [K in keyof T]: V };
}
