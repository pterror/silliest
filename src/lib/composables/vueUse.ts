import type { UrlParams } from "@vueuse/core";
import { computed } from "vue";
import { wrapPossibleSingleton } from "../array";

export type ComputedSearchParameterOptions<T> = {
  searchParams: UrlParams;
  name: string;
  defaultValue: T;
  hideWhenDefault?: boolean | undefined;
  sanitize: (value: string | readonly string[] | undefined) => T;
  onSet?: ((value: T) => void) | undefined;
};

export function computedSearchParameter<
  T extends string | number | boolean | undefined,
>({
  searchParams,
  name,
  defaultValue,
  hideWhenDefault = true,
  sanitize,
  onSet,
}: ComputedSearchParameterOptions<T>) {
  return computed({
    get() {
      const sanitized = sanitize(searchParams[name]);
      return sanitized === undefined ? defaultValue : sanitized;
    },
    set(value) {
      if (value === defaultValue && hideWhenDefault) {
        delete searchParams[name];
      } else {
        searchParams[name] = String(value);
      }
      onSet?.(value);
    },
  });
}

export type ComputedArraySearchParameterOptions<T> = {
  searchParams: UrlParams;
  name: string;
  defaultValue: T[];
  sanitize: (value: string) => T;
  onSet?: ((value: readonly T[]) => void) | undefined;
};

export function computedArraySearchParameter<
  T extends string | number | boolean | undefined,
>({
  searchParams,
  name,
  defaultValue,
  sanitize,
  onSet,
}: ComputedArraySearchParameterOptions<T>) {
  return computed({
    get() {
      const sanitized = wrapPossibleSingleton(searchParams[name]).map(sanitize);
      return sanitized === undefined ? defaultValue : sanitized;
    },
    set(value) {
      if (value === defaultValue) {
        delete searchParams[name];
      } else {
        searchParams[name] = Array.isArray(value)
          ? value.map((item) => String(item))
          : String(value);
      }
      onSet?.(value);
    },
  });
}

export type ComputedBooleanSearchParameterOptions = {
  searchParams: UrlParams;
  name: string;
  defaultValue?: boolean | undefined;
  hideWhenDefault?: boolean | undefined;
  onSet?: ((value: boolean) => void) | undefined;
};

export function computedBooleanSearchParameter({
  searchParams,
  name,
  defaultValue = true,
  hideWhenDefault,
  onSet,
}: ComputedBooleanSearchParameterOptions) {
  return computedSearchParameter({
    searchParams,
    name,
    defaultValue,
    hideWhenDefault,
    sanitize: (value) => (value ?? String(defaultValue)) === "true",
    onSet,
  });
}
