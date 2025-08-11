import * as z from "zod/v4";

export type GalleryItem = z.infer<typeof GalleryItem>;
export const GalleryItem = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  type: z.enum(["image", "video", "audio"]).optional(),
  url: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  link: z.string().optional(),
  tags: z.array(z.string()).optional(),
  date: z.iso.datetime().optional(),
  authorName: z.string().optional(),
  authorUrl: z.string().optional(),
  authorImage: z.string().optional(),
  customCss: z.string().optional(),
});

export type Gallery = z.infer<typeof Gallery>;
export const Gallery = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  items: z.array(GalleryItem),
  customCss: z.string().optional(),
});
