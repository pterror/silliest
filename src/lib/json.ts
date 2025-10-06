export type JsonString<T> = string & {
  readonly __type: "ToJson";
  readonly __jsonType: T;
};

export const jsonStringify = <T>(obj: T): JsonString<T> =>
  JSON.stringify(obj) as JsonString<T>;

export const jsonParse = <T>(json: JsonString<T>): T => JSON.parse(json) as T;
