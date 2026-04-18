import Link from "next/link";

import {
  deleteFaqAction,
  deleteReleaseAction,
  deleteScreenshotAction,
  logoutAdminAction,
  saveFaqAction,
  saveProductAction,
  saveReleaseAction,
  saveScreenshotAction,
  updateSupportRequestAction,
} from "@/app/actions";
import type { AppFaq, AppProduct, AppRelease, AppScreenshot, AppSupportRequest } from "@/types/app-ecosystem";

const webBaseUrl = process.env.NEXT_PUBLIC_WEB_APP_URL || "https://moalfarras.space";

function structuredLines(items: Array<{ title: string; body: string }>) {
  return items.map((item) => `${item.title} :: ${item.body}`).join("\n");
}

function simpleLines(items: string[]) {
  return items.join("\n");
}

function formatBytes(size?: number | null) {
  if (!size) return "Not uploaded";
  const mb = size / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

function PrimaryShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-[rgba(8,10,20,0.82)] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.3)] backdrop-blur-2xl">
      <div className="mb-5 space-y-2">
        <h2 className="text-2xl font-black text-foreground">{title}</h2>
        <p className="max-w-3xl text-sm leading-7 text-foreground-muted">{description}</p>
      </div>
      {children}
    </section>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, ...rest } = props;
  return (
    <label className="grid gap-2">
      <span className="text-[11px] font-black uppercase tracking-[0.22em] text-foreground-soft">{label}</span>
      <input
        {...rest}
        className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary/40"
      />
    </label>
  );
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  const { label, ...rest } = props;
  return (
    <label className="grid gap-2">
      <span className="text-[11px] font-black uppercase tracking-[0.22em] text-foreground-soft">{label}</span>
      <textarea
        {...rest}
        className="min-h-28 rounded-[1.5rem] border border-white/10 bg-black/20 px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary/40"
      />
    </label>
  );
}

function FaqCard({ item }: { item: AppFaq }) {
  return (
    <div className="rounded-[1.5rem] border border-white/8 bg-black/15 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">FAQ #{item.sort_order}</p>
          <h3 className="text-base font-black text-foreground">{item.question}</h3>
          <p className="text-sm leading-7 text-foreground-muted">{item.answer}</p>
        </div>
        <form action={deleteFaqAction}>
          <input type="hidden" name="id" value={item.id} />
          <button type="submit" className="rounded-full border border-red-400/25 px-3 py-2 text-xs font-bold text-red-300">
            Delete
          </button>
        </form>
      </div>
    </div>
  );
}

function ScreenshotCard({ item }: { item: AppScreenshot }) {
  return (
    <div className="rounded-[1.5rem] border border-white/8 bg-black/15 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">{item.device_frame}</p>
          <h3 className="text-base font-black text-foreground">{item.title}</h3>
          <p className="text-sm text-foreground-muted">{item.image_path}</p>
        </div>
        <form action={deleteScreenshotAction}>
          <input type="hidden" name="id" value={item.id} />
          <button type="submit" className="rounded-full border border-red-400/25 px-3 py-2 text-xs font-bold text-red-300">
            Delete
          </button>
        </form>
      </div>
    </div>
  );
}

function ReleaseCard({ item }: { item: AppRelease }) {
  const primary = item.assets.find((asset) => asset.is_primary) ?? item.assets[0];
  return (
    <div className="rounded-[1.5rem] border border-white/8 bg-black/15 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">{item.version_name}</p>
          <h3 className="text-base font-black text-foreground">{item.slug}</h3>
          <p className="text-sm leading-7 text-foreground-muted whitespace-pre-line">{item.release_notes}</p>
          <p className="text-xs text-foreground-soft">
            {new Date(item.published_at).toLocaleDateString("en-GB")} · {formatBytes(primary?.file_size_bytes)}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Link
            href={`${webBaseUrl}/api/app/releases/${item.slug}/download`}
            className="rounded-full border border-primary/25 px-3 py-2 text-xs font-bold text-primary"
          >
            Download
          </Link>
          <form action={deleteReleaseAction}>
            <input type="hidden" name="id" value={item.id} />
            <button type="submit" className="rounded-full border border-red-400/25 px-3 py-2 text-xs font-bold text-red-300">
              Delete
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function SupportCard({ item }: { item: AppSupportRequest }) {
  return (
    <div className="rounded-[1.5rem] border border-white/8 bg-black/15 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">{item.status}</p>
          <h3 className="text-base font-black text-foreground">{item.name}</h3>
          <p className="text-sm text-foreground-soft">{item.email}</p>
          <p className="text-sm leading-7 text-foreground-muted">{item.message}</p>
        </div>
        <form action={updateSupportRequestAction} className="flex items-center gap-2">
          <input type="hidden" name="id" value={item.id} />
          <select
            name="status"
            defaultValue={item.status}
            className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs font-bold text-foreground"
          >
            <option value="new">new</option>
            <option value="resolved">resolved</option>
          </select>
          <button type="submit" className="rounded-full border border-primary/25 px-3 py-2 text-xs font-bold text-primary">
            Save
          </button>
        </form>
      </div>
    </div>
  );
}

export function AppAdminDashboard({
  adminEmail,
  role,
  updated,
  product,
  faqs,
  screenshots,
  releases,
  supportRequests,
}: {
  adminEmail: string;
  role: string;
  updated?: string;
  product: AppProduct;
  faqs: AppFaq[];
  screenshots: AppScreenshot[];
  releases: AppRelease[];
  supportRequests: AppSupportRequest[];
}) {
  return (
    <div className="space-y-8">
      <section className="rounded-[2.5rem] border border-white/10 bg-[linear-gradient(135deg,rgba(0,255,135,0.08),rgba(8,10,20,0.95))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.35)] backdrop-blur-2xl md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">Unified admin surface</p>
            <h1 className="text-3xl font-black text-foreground md:text-4xl">MoPlayer Control Center</h1>
            <p className="max-w-2xl text-sm leading-7 text-foreground-muted">
              Product content, release packaging, screenshots, FAQs, and support requests now run from one protected admin surface.
            </p>
            <p className="text-xs text-foreground-soft">
              Signed in as {adminEmail} · role: {role}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={`${webBaseUrl}/app`} className="rounded-full border border-primary/25 px-4 py-3 text-sm font-bold text-primary">
              Open app page
            </Link>
            <form action={logoutAdminAction}>
              <button type="submit" className="rounded-full border border-white/10 px-4 py-3 text-sm font-bold text-foreground">
                Sign out
              </button>
            </form>
          </div>
        </div>
        {updated ? (
          <div className="mt-5 rounded-[1.25rem] border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-foreground-muted">
            Update completed: {updated}
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Screenshots", value: screenshots.length },
          { label: "FAQs", value: faqs.length },
          { label: "Releases", value: releases.length },
          { label: "Support", value: supportRequests.length },
        ].map((item) => (
          <div key={item.label} className="rounded-[1.6rem] border border-white/8 bg-black/15 p-5">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-foreground-soft">{item.label}</p>
            <p className="mt-2 text-3xl font-black text-foreground">{item.value}</p>
          </div>
        ))}
      </section>

      <PrimaryShell
        title="Product Content"
        description="This controls the hero copy, support details, install flow, compatibility notes, and the content model used by /app."
      >
        <form action={saveProductAction} className="grid gap-4 lg:grid-cols-2">
          <TextInput label="Product name" name="product_name" defaultValue={product.product_name} required />
          <TextInput label="Hero badge" name="hero_badge" defaultValue={product.hero_badge} required />
          <TextInput label="Tagline" name="tagline" defaultValue={product.tagline} required />
          <TextInput label="Package name" name="package_name" defaultValue={product.package_name} required />
          <TextInput label="Support email" name="support_email" type="email" defaultValue={product.support_email} required />
          <TextInput label="Support WhatsApp" name="support_whatsapp" defaultValue={product.support_whatsapp} required />
          <TextInput label="Privacy path" name="privacy_path" defaultValue={product.privacy_path} required />
          <TextInput label="Play Store URL" name="play_store_url" defaultValue={product.play_store_url ?? ""} />
          <TextInput label="Support URL" name="support_url" defaultValue={product.support_url ?? ""} />
          <TextInput label="Download button label" name="default_download_label" defaultValue={product.default_download_label} required />
          <TextInput label="Logo path" name="logo_path" defaultValue={product.logo_path ?? ""} />
          <TextInput label="Hero image path" name="hero_image_path" defaultValue={product.hero_image_path ?? ""} />
          <TextInput label="TV banner path" name="tv_banner_path" defaultValue={product.tv_banner_path ?? ""} />
          <TextInput label="Min SDK" name="android_min_sdk" type="number" defaultValue={String(product.android_min_sdk)} required />
          <TextInput label="Target SDK" name="android_target_sdk" type="number" defaultValue={String(product.android_target_sdk)} required />
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-sm font-bold text-foreground lg:col-span-2">
            <input type="checkbox" name="android_tv_ready" defaultChecked={product.android_tv_ready} />
            Android TV ready
          </label>
          <div className="lg:col-span-2">
            <TextArea label="Short description" name="short_description" defaultValue={product.short_description} required />
          </div>
          <div className="lg:col-span-2">
            <TextArea label="Long description" name="long_description" defaultValue={product.long_description} required />
          </div>
          <TextArea
            label="Feature highlights"
            name="feature_highlights"
            defaultValue={structuredLines(product.feature_highlights)}
            placeholder="Title :: Body"
          />
          <TextArea label="How it works" name="how_it_works" defaultValue={structuredLines(product.how_it_works)} placeholder="Title :: Body" />
          <TextArea label="Install steps" name="install_steps" defaultValue={structuredLines(product.install_steps)} placeholder="Title :: Body" />
          <TextArea label="Compatibility notes" name="compatibility_notes" defaultValue={simpleLines(product.compatibility_notes)} />
          <TextArea label="Legal notes" name="legal_notes" defaultValue={simpleLines(product.legal_notes)} />
          <TextArea label="Changelog intro" name="changelog_intro" defaultValue={product.changelog_intro} />
          <div className="lg:col-span-2">
            <button type="submit" className="rounded-full bg-primary px-5 py-3 text-sm font-black text-black">
              Save product content
            </button>
          </div>
        </form>
      </PrimaryShell>

      <PrimaryShell
        title="Release Management"
        description="Upload the production APK here to keep the download flow on the same domain through /api/app/releases/[slug]/download."
      >
        <form action={saveReleaseAction} className="grid gap-4 lg:grid-cols-2" encType="multipart/form-data">
          <TextInput label="Release slug" name="slug" placeholder="moplayer-v2-0-0" required />
          <TextInput label="Version name" name="version_name" placeholder="2.0.0" required />
          <TextInput label="Version code" name="version_code" type="number" defaultValue="2" required />
          <TextInput label="ABI" name="abi" defaultValue="arm64-v8a" required />
          <TextInput label="Published at" name="published_at" type="datetime-local" />
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-sm font-bold text-foreground">
            <input type="checkbox" name="is_published" defaultChecked />
            Published
          </label>
          <div className="lg:col-span-2">
            <TextArea label="Release notes" name="release_notes" placeholder={"Line 1\nLine 2"} required />
          </div>
          <div className="lg:col-span-2">
            <TextArea label="Compatibility notes" name="compatibility_notes" placeholder="arm64 recommended, Android 7.0+" required />
          </div>
          <label className="grid gap-2 lg:col-span-2">
            <span className="text-[11px] font-black uppercase tracking-[0.22em] text-foreground-soft">APK file</span>
            <input type="file" name="file" accept=".apk,application/vnd.android.package-archive" className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-foreground" />
          </label>
          <div className="lg:col-span-2">
            <button type="submit" className="rounded-full bg-primary px-5 py-3 text-sm font-black text-black">
              Save release
            </button>
          </div>
        </form>

        <div className="mt-6 grid gap-4">
          {releases.length ? releases.map((item) => <ReleaseCard key={item.id} item={item} />) : <p className="text-sm text-foreground-muted">No releases published yet.</p>}
        </div>
      </PrimaryShell>

      <PrimaryShell
        title="Screenshots"
        description="Upload real product captures and TV banners. These are rendered directly on /app."
      >
        <form action={saveScreenshotAction} className="grid gap-4 lg:grid-cols-2" encType="multipart/form-data">
          <TextInput label="Title" name="title" required />
          <TextInput label="Alt text" name="alt_text" required />
          <TextInput label="Image path" name="image_path" placeholder="/images/..." />
          <TextInput label="Sort order" name="sort_order" type="number" defaultValue="1" required />
          <label className="grid gap-2">
            <span className="text-[11px] font-black uppercase tracking-[0.22em] text-foreground-soft">Device frame</span>
            <select name="device_frame" className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-foreground">
              <option value="phone">phone</option>
              <option value="tv">tv</option>
              <option value="landscape">landscape</option>
            </select>
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-sm font-bold text-foreground">
            <input type="checkbox" name="is_featured" />
            Featured screenshot
          </label>
          <label className="grid gap-2 lg:col-span-2">
            <span className="text-[11px] font-black uppercase tracking-[0.22em] text-foreground-soft">Upload image</span>
            <input type="file" name="file" accept="image/*" className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-foreground" />
          </label>
          <div className="lg:col-span-2">
            <button type="submit" className="rounded-full bg-primary px-5 py-3 text-sm font-black text-black">
              Save screenshot
            </button>
          </div>
        </form>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {screenshots.map((item) => (
            <ScreenshotCard key={item.id} item={item} />
          ))}
        </div>
      </PrimaryShell>

      <PrimaryShell
        title="FAQ"
        description="Maintain the launch-facing answers shown near the lower conversion area on /app."
      >
        <form action={saveFaqAction} className="grid gap-4">
          <TextInput label="Question" name="question" required />
          <TextArea label="Answer" name="answer" required />
          <TextInput label="Sort order" name="sort_order" type="number" defaultValue="1" required />
          <div>
            <button type="submit" className="rounded-full bg-primary px-5 py-3 text-sm font-black text-black">
              Save FAQ
            </button>
          </div>
        </form>
        <div className="mt-6 grid gap-4">
          {faqs.map((item) => (
            <FaqCard key={item.id} item={item} />
          ))}
        </div>
      </PrimaryShell>

      <PrimaryShell
        title="Support Inbox"
        description="Requests sent from the support form on /app appear here. Admins can mark them resolved without exposing private logic to the client."
      >
        <div className="grid gap-4">
          {supportRequests.length ? supportRequests.map((item) => <SupportCard key={item.id} item={item} />) : <p className="text-sm text-foreground-muted">No support requests yet.</p>}
        </div>
      </PrimaryShell>
    </div>
  );
}
