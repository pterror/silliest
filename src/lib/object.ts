/** Safe only when `T` is an exact type, i.e. `value` has no extra keys. */
export function unsafeKeys<T extends object>(
  value: T,
): readonly (keyof T & string)[] {
  return Object.keys(value) as (keyof T & string)[];
}

/** Safe only when `T` is an exact type, i.e. `value` has no extra keys. */
export function unsafeEntries<T extends object>(
  value: T,
): readonly {
  readonly [K in keyof T]: readonly [K, T[K]];
}[keyof T][] {
  return Object.entries(value) as never[];
}

/** Safe only when `T` is an exact type, i.e. `value` has no extra keys. */
export function unsafeMapEntries<T extends object, V>(
  value: T,
  map: (entry: { [K in keyof T]: readonly [K, T[K]] }[keyof T]) => V,
) {
  return Object.fromEntries(
    unsafeEntries(value).map((entry) => [entry[0], map(entry)]),
  ) as { readonly [K in keyof T]: V };
}

export type Mutable<T> = {
  -readonly [K in keyof T]: T[K];
};

/**
 * Safe only when `T` is an exact type, i.e. `value` has no extra keys,
 * and `T` is mutable.
 */
export const unsafeMutable = <T extends object>(value: T): Mutable<T> => {
  return value as Mutable<T>;
};

export function filterOutUndefined<T extends object>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}

export type MethodNamesOf<
  T,
  ParameterListConstraint extends readonly any[] = never,
  ReturnTypeConstraint = any,
  K extends keyof T = keyof T,
> = K extends K
  ? T[K] extends (...args: ParameterListConstraint) => ReturnTypeConstraint
    ? K
    : never
  : never;
