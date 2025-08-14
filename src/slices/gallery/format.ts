import { parseFromBase64, serializeToBase64 } from "../../lib/deflate";
import { Gallery, type GalleryItem } from "./types";

export function newEmptyGallery(): Gallery {
  return { items: [] };
}

export function newEmptyGalleryItem(): GalleryItem {
  return {};
}

export async function parseGalleryFromBase64(base64: string): Promise<Gallery> {
  return parseFromBase64<Gallery>(base64, Gallery);
}

export async function serializeGalleryToBase64(
  gallery: Gallery
): Promise<string> {
  return serializeToBase64<Gallery>(gallery);
}
