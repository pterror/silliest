import type { MaybeRef } from "vue";

/** An array or object with all its values wrapped in {@link MaybeRef}. */
export type MaybeRefs<T> = { [K in keyof T]: MaybeRef<T[K]> };
