import {
  useUrlSearchParams,
  type UrlParams,
  type UseUrlSearchParamsOptions,
} from "@vueuse/core";
import { computed, type WritableComputedRef } from "vue";
import { unwrapPossibleSingleton, wrapPossibleSingleton } from "../array";

export type ComputedSearchParameterOptions<T> = {
  searchParams: UrlParams;
  name: string;
  defaultValue: T;
  hideWhenDefault?: boolean | undefined;
  sanitize: (value: string | string[] | undefined) => T;
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

interface ComputedSearchParameterMetaOptionsBase<Type extends string, T> {
  readonly type: Type;
  readonly hideWhenDefault?: boolean | undefined;
  readonly defaultValue?: T | undefined;
  readonly sanitize?: (value: string | string[] | undefined) => T;
  readonly onSet?: ((value: T) => void) | undefined;
}

interface ComputedSearchParameterTypeMap {
  readonly string: string;
  readonly number: number;
  readonly boolean: boolean;
  readonly "string[]": string[];
}

type AnyComputedSearchParameterMetaOptions =
  | ComputedSearchParameterMetaOptionsBase<"string", string>
  | ComputedSearchParameterMetaOptionsBase<"number", number>
  | ComputedSearchParameterMetaOptionsBase<"boolean", boolean>
  | ComputedSearchParameterMetaOptionsBase<"string[]", string[]>;

export type ComputedSearchParameterMetaOptions<
  T extends AnyComputedSearchParameterMetaOptions["type"] = AnyComputedSearchParameterMetaOptions["type"],
> = Extract<AnyComputedSearchParameterMetaOptions, { type: T }>;

export interface UseComputedSearchParamsOptions {
  readonly onSet?: (key: string, value: unknown) => void;
}

export function useComputedSearchParams<
  T extends Record<K, ComputedSearchParameterMetaOptions>,
  K extends PropertyKey = keyof T,
>(
  shape: T & Record<K, ComputedSearchParameterMetaOptions>,
  mode?: "history" | "hash" | "hash-params",
  options?: UseUrlSearchParamsOptions<UrlParams> | undefined,
  { onSet }: UseComputedSearchParamsOptions = {},
) {
  const searchParams = useUrlSearchParams(mode, options);
  const computedParams = {} as Record<string, any>;

  for (const key in shape) {
    const options = shape[
      key as never
    ] as AnyComputedSearchParameterMetaOptions;
    const defaultValue =
      options.defaultValue ??
      (() => {
        switch (options.type) {
          case "string":
            return "";
          case "number":
            return 0;
          case "boolean":
            return false;
          case "string[]":
            return [];
        }
      })();
    const sanitize =
      options.sanitize ??
      (() => {
        switch (options.type) {
          case "string": {
            return (value: string | string[] | undefined) => {
              const text = unwrapPossibleSingleton(value);
              return text === undefined ? defaultValue : text;
            };
          }
          case "number": {
            return (value: string | string[] | undefined) => {
              const num = Number(unwrapPossibleSingleton(value));
              return isNaN(num) ? defaultValue : num;
            };
          }
          case "boolean": {
            return (value: string | string[] | undefined) => {
              const text = unwrapPossibleSingleton(value);
              return text === undefined ? defaultValue : text === "true";
            };
          }
          case "string[]": {
            return (value: string | undefined) => {
              const text = unwrapPossibleSingleton(value);
              return text === undefined ? defaultValue : text;
            };
          }
        }
      })();
    switch (options.type) {
      case "string":
      case "number":
      case "boolean": {
        computedParams[key] = computedSearchParameter({
          searchParams,
          name: key,
          defaultValue: defaultValue as never,
          sanitize: sanitize as never,
          onSet: (value) => {
            onSet?.(key, value);
            options.onSet?.(value);
          },
        });
        break;
      }
      case "string[]": {
        computedParams[key] = computedArraySearchParameter({
          searchParams,
          name: key,
          defaultValue: defaultValue as never,
          sanitize: sanitize as never,
          onSet: (value) => {
            onSet?.(key, value);
            options.onSet?.(value as never);
          },
        });
        break;
      }
    }
  }

  return {
    searchParams,
    params: computedParams as {
      [K2 in keyof T]: WritableComputedRef<
        T[K2]["sanitize"] extends (...args: never) => unknown
          ? ReturnType<T[K2]["sanitize"]>
          : ComputedSearchParameterTypeMap[T[K2]["type"]]
      >;
    },
  };
}
