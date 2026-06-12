import type { Category, ContentType, LibraryData, MediaItem } from "../../shared/types";
import { byNewest } from "./hash";

export function withLocalFlags(library: LibraryData | null, favorites: Record<string, boolean>, watch: Record<string, { positionMs: number; durationMs: number; updatedAt: number }>) {
  if (!library) return null;
  return {
    ...library,
    media: library.media.map((item) => ({
      ...item,
      favorite: Boolean(favorites[item.id]),
      watchPositionMs: watch[item.id]?.positionMs ?? item.watchPositionMs ?? 0,
      watchDurationMs: watch[item.id]?.durationMs ?? item.watchDurationMs ?? 0,
      lastPlayedAt: watch[item.id]?.updatedAt ?? item.lastPlayedAt ?? 0,
    })),
  };
}

const adultTokens = ["adult", "adults", "xxx", "18+", "porn", "erotic", "للكبار", "اباحي", "إباحي"];

function isAdultLabel(value: string) {
  const lower = value.toLowerCase();
  return adultTokens.some((token) => lower.includes(token));
}

export function applyParentalFilter(library: LibraryData | null, enabled: boolean): LibraryData | null {
  if (!library || !enabled) return library;
  const blockedCategories = new Set(
    library.categories.filter((category) => isAdultLabel(category.name)).map((category) => category.id),
  );
  return {
    ...library,
    categories: library.categories.filter((category) => !blockedCategories.has(category.id)),
    media: library.media.filter(
      (item) => !blockedCategories.has(item.categoryId) && !isAdultLabel(item.categoryName) && !isAdultLabel(item.title),
    ),
  };
}

/** Drops categories the user explicitly hid (and their items) everywhere. */
export function applyHiddenCategories(library: LibraryData | null, hiddenIds: string[]): LibraryData | null {
  if (!library || !hiddenIds.length) return library;
  const hidden = new Set(hiddenIds);
  return {
    ...library,
    categories: library.categories.filter((category) => !hidden.has(category.id)),
    media: library.media.filter((item) => !hidden.has(item.categoryId)),
  };
}

export function mediaByType(library: LibraryData | null, type: ContentType) {
  return library?.media.filter((item) => item.type === type) ?? [];
}

export function categoriesByType(library: LibraryData | null, type: ContentType, hideEmpty = false) {
  return (library?.categories.filter((item) => item.type === type && (!hideEmpty || item.count > 0)) ?? [])
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function featuredRows(library: LibraryData | null) {
  const media = library?.media ?? [];
  return {
    live: byNewest(media.filter((item) => item.type === "live")).slice(0, 20),
    movies: byNewest(media.filter((item) => item.type === "movie")).slice(0, 20),
    series: byNewest(media.filter((item) => item.type === "series")).slice(0, 20),
    continueWatching: media.filter((item) => (item.watchPositionMs ?? 0) > 0).sort((a, b) => (b.lastPlayedAt ?? 0) - (a.lastPlayedAt ?? 0)).slice(0, 12),
  };
}

export function searchMedia(library: LibraryData | null, query: string, type: ContentType | "" = "") {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  return (library?.media ?? [])
    .filter((item) => (!type || item.type === type) && item.type !== "episode")
    .filter((item) => `${item.title} ${item.categoryName} ${item.description ?? ""}`.toLowerCase().includes(needle))
    .slice(0, 400);
}

export function favorites(library: LibraryData | null) {
  return (library?.media ?? []).filter((item) => item.favorite);
}

export function filterByCategory(items: MediaItem[], categoryId: string) {
  if (!categoryId) return items;
  return items.filter((item) => item.categoryId === categoryId);
}

export function categoryLabel(categories: Category[], id: string) {
  return categories.find((item) => item.id === id)?.name ?? "All";
}

