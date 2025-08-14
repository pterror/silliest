/** @file Global interface merge declarations. */

declare global {
  interface ArrayConstructor {
    /** Warning: This overload is unsafe when `T` is itself an array type. */
    isArray(value: unknown): value is any[] | readonly any[];
  }
}

export {};
