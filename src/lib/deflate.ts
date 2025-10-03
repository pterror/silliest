import * as z from "zod/v4";
import { deflate, inflate } from "fflate";
import { getMessageOrToString } from "./error";

export function parseFromUnknown<Type>(
  data: unknown,
  Type: z.ZodType<Type>,
): Type {
  const parsed = Type.safeParse(data);
  if (!parsed.success) {
    console.error("Invalid data:", parsed.error);
    throw new Error(
      `Invalid data: ${z.formatError(parsed.error)._errors.join(", ")}`,
    );
  }
  return parsed.data;
}

function uint8ArrayToBase64(array: Uint8Array): string {
  return btoa(String.fromCharCode(...array));
}

export async function parseFromBase64<Type>(
  base64: string,
  Type: z.ZodType<Type>,
): Promise<Type> {
  return new Promise((resolve, reject) => {
    const array = Uint8Array.fromBase64(base64);
    inflate(array, { consume: true }, (error, result) => {
      try {
        if (error) {
          reject("Failed to inflate data: " + getMessageOrToString(error));
        }
        const json = JSON.parse(new TextDecoder().decode(result));
        resolve(parseFromUnknown(json, Type));
      } catch (error) {
        reject("Failed to parse data: " + getMessageOrToString(error));
      }
    });
  });
}

export async function serializeToBase64<Type>(data: Type): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const json = JSON.stringify(data);
      const array = new TextEncoder().encode(json);
      deflate(array, { consume: true }, (error, result) => {
        if (error) {
          reject("Failed to compress data: " + getMessageOrToString(error));
        }
        resolve(uint8ArrayToBase64(result));
      });
    } catch (error) {
      reject("Failed to serialize data: " + getMessageOrToString(error));
    }
  });
}
