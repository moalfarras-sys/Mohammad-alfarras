"use client";

import { Image as ImageIcon, Search, X } from "lucide-react";
import { useState } from "react";

import { useLocale } from "@/components/admin/locale-provider";
import { resolveAdminAssetUrl } from "@/lib/asset-url";
import type { WebsiteMediaAsset } from "@/lib/website-cms";

/**
 * Shared "choose from the media library" modal. Calls onSelect with the chosen
 * asset so the caller can use its public `path` directly (no server round-trip).
 */
export function MediaPicker({
  assets,
  onSelect,
  label,
  selectedPath,
}: {
  assets: WebsiteMediaAsset[];
  onSelect: (asset: WebsiteMediaAsset) => void;
  label?: string;
  selectedPath?: string;
}) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = assets.filter((asset) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [asset.id, asset.path, asset.alt_ar, asset.alt_en, asset.type].some((value) =>
      String(value ?? "").toLowerCase().includes(q),
    );
  });

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn btn-sm">
        <ImageIcon className="h-4 w-4" />
        {label || t({ en: "Choose from library", ar: "اختيار من المكتبة" })}
      </button>
      {open ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/72 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex max-h-[86vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-[var(--line-strong)] bg-[var(--panel-2)] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] p-4">
              <div>
                <p className="text-sm font-black text-[var(--text-1)]">{t({ en: "Media library", ar: "مكتبة الصور" })}</p>
                <p className="text-xs text-[var(--text-3)]">
                  {filtered.length} {t({ en: "images", ar: "صورة" })}
                </p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="btn btn-sm" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-2 border-b border-[var(--line)] p-3">
              <Search className="h-4 w-4 text-[var(--accent)]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-9 flex-1 bg-transparent text-sm outline-none"
                placeholder={t({ en: "Search images...", ar: "ابحث في الصور..." })}
              />
            </div>
            <div className="grid flex-1 gap-3 overflow-y-auto p-4 sm:grid-cols-2 md:grid-cols-3">
              {filtered.map((asset) => {
                const src = resolveAdminAssetUrl(asset.path);
                const active = Boolean(selectedPath) && asset.path === selectedPath;
                return (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => {
                      onSelect(asset);
                      setOpen(false);
                    }}
                    className={`rounded-2xl border p-2 text-start transition ${active ? "border-[var(--accent)] ring-1 ring-[var(--accent)]" : "border-[var(--line)] hover:border-[var(--line-strong)]"}`}
                  >
                    <div className="overflow-hidden rounded-xl bg-black/25">
                      <div className="aspect-video">
                        {src ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={src} alt={asset.alt_en || asset.id} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-black/30 text-xs font-black text-[var(--text-3)]">
                            {asset.id}
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="mt-2 truncate text-[10px] font-bold text-[var(--text-3)]">
                      {asset.alt_en || asset.alt_ar || asset.id}
                    </p>
                  </button>
                );
              })}
              {!filtered.length ? <p className="text-sm text-[var(--text-3)]">{t({ en: "No images found.", ar: "لا توجد صور." })}</p> : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
