import { z } from "zod";

export const localeSchema = z.enum(["ar", "en"]);
export const themeModeSchema = z.enum(["light", "dark"]);

export const themeTokenUpdateSchema = z.object({
  mode: themeModeSchema,
  tokenKey: z.string().min(1),
  tokenValue: z.string().min(1),
});

export const videoSchema = z.object({
  id: z.string().min(1),
  youtube_id: z.string().min(3),
  title_ar: z.string().min(1),
  title_en: z.string().min(1),
  description_ar: z.string().min(1),
  description_en: z.string().min(1),
  thumbnail: z.string().url(),
  duration: z.string().min(3),
  views: z.number().int().nonnegative(),
  published_at: z.string().datetime(),
  sort_order: z.number().int(),
  is_featured: z.boolean(),
  is_active: z.boolean(),
});
