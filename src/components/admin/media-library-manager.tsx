"use client";

import { useMemo, useState } from "react";

import { deleteMediaAction, uploadMediaAction } from "@/lib/admin-actions";
import type { MediaAsset } from "@/types/cms";

type Props = {
  locale: "ar" | "en";
  mediaAssets: MediaAsset[];
  labels: {
    title: string;
    add: string;
    replaceMedia: string;
    updateMedia: string;
    delete: string;
  };
};

export function MediaLibraryManager({ locale, mediaAssets, labels }: Props) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<"all" | "image" | "video">("all");
  const [copied, setCopied] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return mediaAssets.filter((asset) => {
      const typeOk =
        kind === "all" ? true : kind === "image" ? asset.type.startsWith("image") : asset.type.startsWith("video");
      if (!typeOk) return false;
      if (!q) return true;
      return (
        asset.id.toLowerCase().includes(q) ||
        asset.path.toLowerCase().includes(q) ||
        asset.alt_ar.toLowerCase().includes(q) ||
        asset.alt_en.toLowerCase().includes(q)
      );
    });
  }, [kind, mediaAssets, query]);

  async function copyText(value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(value);
    setTimeout(() => setCopied(null), 1400);
  }

  return (
    <>
      <article>
        <h3>
          {labels.add} {labels.title}
        </h3>
        <form action={uploadMediaAction}>
          <label>
            <span>file</span>
            <input name="file" type="file" accept="image/*,video/*" />
          </label>
          <label>
            <span>path</span>
            <input name="path" placeholder="https://..." />
          </label>
          <label>
            <span>alt_ar</span>
            <input name="alt_ar" required />
          </label>
          <label>
            <span>alt_en</span>
            <input name="alt_en" required />
          </label>
          <label>
            <span>width</span>
            <input name="width" type="number" defaultValue={0} />
          </label>
          <label>
            <span>height</span>
            <input name="height" type="number" defaultValue={0} />
          </label>
          <label>
            <span>type</span>
            <input name="type" defaultValue="image" />
          </label>
          <button type="submit">{labels.add}</button>
        </form>
      </article>

      <article>
        <div className="grid gap-3 md:grid-cols-[1fr_12rem]">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={locale === "ar" ? "ابحث عبر المعرّف أو النص البديل أو المسار..." : "Search by id, alt, or path..."}
          />
          <select value={kind} onChange={(event) => setKind(event.target.value as "all" | "image" | "video")}>
            <option value="all">{locale === "ar" ? "الكل" : "All"}</option>
            <option value="image">{locale === "ar" ? "صور" : "Images"}</option>
            <option value="video">{locale === "ar" ? "فيديو" : "Videos"}</option>
          </select>
        </div>
        <small>{locale === "ar" ? `عدد العناصر: ${filtered.length}` : `Items: ${filtered.length}`}</small>
      </article>

      <div className="grid gap-5">
        {filtered.map((asset) => (
          <article key={asset.id}>
            <h3>{asset.id}</h3>
            <p>
              {asset.type} · {asset.width}x{asset.height}
            </p>

            {asset.type.startsWith("image") ? (
              <div className="relative aspect-[16/10] overflow-hidden rounded-[1.25rem]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={asset.path} alt={asset.alt_en || asset.alt_ar || asset.id} className="h-full w-full object-cover object-center" />
              </div>
            ) : null}

            <a href={asset.path} target="_blank" rel="noopener noreferrer">
              {asset.path}
            </a>

            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => copyText(asset.id)}>
                {locale === "ar" ? "نسخ المعرّف" : "Copy ID"}
              </button>
              <button type="button" onClick={() => copyText(asset.path)}>
                {locale === "ar" ? "نسخ المسار" : "Copy path"}
              </button>
            </div>

            {copied === asset.id || copied === asset.path ? (
              <small>{locale === "ar" ? "تم النسخ" : "Copied"}</small>
            ) : null}

            <form action={uploadMediaAction}>
              <input type="hidden" name="id" value={asset.id} />
              <input type="hidden" name="path" value={asset.path} />
              <input type="hidden" name="type" value={asset.type} />
              <label>
                <span>{labels.replaceMedia}</span>
                <input name="file" type="file" accept="image/*,video/*" />
              </label>
              <label>
                <span>alt_ar</span>
                <input name="alt_ar" defaultValue={asset.alt_ar} />
              </label>
              <label>
                <span>alt_en</span>
                <input name="alt_en" defaultValue={asset.alt_en} />
              </label>
              <label>
                <span>width</span>
                <input name="width" type="number" defaultValue={asset.width} />
              </label>
              <label>
                <span>height</span>
                <input name="height" type="number" defaultValue={asset.height} />
              </label>
              <button type="submit">{labels.updateMedia}</button>
            </form>

            <form action={deleteMediaAction}>
              <input type="hidden" name="id" value={asset.id} />
              <button type="submit">{labels.delete}</button>
            </form>
          </article>
        ))}
      </div>
    </>
  );
}
