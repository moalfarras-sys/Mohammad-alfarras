"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { uploadMediaWithResult } from "@/lib/admin-actions";
import type { MediaAsset } from "@/types/cms";

type Props = {
  name: string;
  initialValue?: string;
  mediaAssets: MediaAsset[];
  locale: "ar" | "en";
};

export function MediaPickerField({ name, initialValue = "", mediaAssets, locale }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [value, setValue] = useState(initialValue);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, startUploadTransition] = useTransition();

  const selected = mediaAssets.find((item) => item.id === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return mediaAssets.filter((asset) => {
      if (!asset.type.startsWith("image")) return false;
      if (!q) return true;
      return (
        asset.id.toLowerCase().includes(q) ||
        asset.alt_ar.toLowerCase().includes(q) ||
        asset.alt_en.toLowerCase().includes(q) ||
        asset.path.toLowerCase().includes(q)
      );
    });
  }, [mediaAssets, query]);

  return (
    <div>
      <input type="hidden" name={name} value={value} />
      <div>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="media-..."
          aria-label={name}
        />
        <button type="button" onClick={() => setOpen(true)}>
          {locale === "ar" ? "اختيار صورة" : "Pick image"}
        </button>
      </div>
      {selected ? (
        <small>
          {locale === "ar" ? "الصورة الحالية:" : "Selected:"} {selected.id}
        </small>
      ) : null}

      {open ? (
        <div role="dialog" aria-modal="true">
          <div onClick={() => setOpen(false)} />
          <div>
            <div>
              <h4>{locale === "ar" ? "اختر صورة للمشروع" : "Select project image"}</h4>
              <button type="button" onClick={() => setOpen(false)}>
                {locale === "ar" ? "إغلاق" : "Close"}
              </button>
            </div>
            <div>
              <p>
                {locale === "ar" ? "ارفع صورة واختيارها تلقائياً" : "Upload an image and select it"}
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setUploadError(null);
                  const form = e.currentTarget;
                  const fd = new FormData(form);
                  startUploadTransition(async () => {
                    try {
                      const result = await uploadMediaWithResult(fd);
                      setValue(result.id);
                      form.reset();
                      router.refresh();
                      setOpen(false);
                    } catch (err) {
                      setUploadError(err instanceof Error ? err.message : "Upload failed");
                    }
                  });
                }}
              >
                <label>
                  <span>{locale === "ar" ? "ملف" : "File"}</span>
                  <input name="file" type="file" accept="image/*" required />
                </label>
                <label>
                  <span>alt_ar</span>
                  <input name="alt_ar" required defaultValue="" />
                </label>
                <label>
                  <span>alt_en</span>
                  <input name="alt_en" required defaultValue="" />
                </label>
                <input type="hidden" name="type" value="image" />
                <input type="hidden" name="width" value="0" />
                <input type="hidden" name="height" value="0" />
                <button type="submit" disabled={isUploading}>
                  {isUploading
                    ? locale === "ar"
                      ? "جاري الرفع…"
                      : "Uploading…"
                    : locale === "ar"
                      ? "رفع واستخدام"
                      : "Upload & use"}
                </button>
              </form>
              {uploadError ? (
                <p role="alert">
                  {uploadError}
                </p>
              ) : null}
            </div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={locale === "ar" ? "ابحث بالاسم أو الوصف..." : "Search by id or alt text..."}
            />
            <div>
              {filtered.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => {
                    setValue(asset.id);
                    setOpen(false);
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={asset.path} alt={asset.alt_en || asset.alt_ar || asset.id} />
                  <span>{asset.id}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
