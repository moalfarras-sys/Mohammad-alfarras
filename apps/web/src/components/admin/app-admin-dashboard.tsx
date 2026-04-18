import Link from "next/link";
import {
  Activity,
  Box,
  Image as ImageIcon,
  MessageSquare,
  LogOut,
  Download,
  AlertCircle,
  CheckCircle2,
  Settings,
  Plus
} from "lucide-react";

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
} from "@/app/admin/actions";
import type { AppFaq, AppProduct, AppRelease, AppScreenshot, AppSupportRequest } from "@/types/app-ecosystem";

function structuredLines(items: Array<{ title: string; body: string }>) {
  return items.map((item) => `${item.title} :: ${item.body}`).join("\n");
}

function simpleLines(items: string[]) {
  return items.join("\n");
}

function formatBytes(size?: number | null) {
  if (!size) return "No file";
  const mb = size / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

function AdminSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="mb-12 rounded-2xl border border-white/5 bg-[#0A0F1A] p-6 shadow-sm ring-1 ring-white/5 sm:p-8">
      <div className="mb-8 border-b border-white/5 pb-5">
        <h2 className="text-xl font-bold tracking-tight text-white">{title}</h2>
        <p className="mt-1 text-sm text-white/50">{description}</p>
      </div>
      {children}
    </section>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, ...rest } = props;
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-white/50">{label}</span>
      <input
        {...rest}
        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white transition-colors focus:border-[#00E5FF] focus:bg-white/10 focus:outline-none"
      />
    </label>
  );
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  const { label, ...rest } = props;
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-white/50">{label}</span>
      <textarea
        {...rest}
        className="min-h-[120px] w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition-colors focus:border-[#00E5FF] focus:bg-white/10 focus:outline-none resize-y"
      />
    </label>
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
  const statCards = [
    { label: "Active Releases", value: releases.length, icon: Box },
    { label: "App Screenshots", value: screenshots.length, icon: ImageIcon },
    { label: "FAQ Entries", value: faqs.length, icon: MessageSquare },
    { label: "Support Tickets", value: supportRequests.length, icon: Activity },
  ];

  return (
    <div className="font-sans antialiased text-white selection:bg-[#00E5FF]/30 space-y-8">
      
      {/* --- HEADER --- */}
      <header className="flex flex-col items-start justify-between gap-6 border-b border-white/10 pb-8 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">MoPlayer Admin</h1>
          <div className="flex items-center gap-3 text-sm text-white/50">
            <span className="flex items-center gap-1.5"><Settings className="h-4 w-4 shrink-0" /> {adminEmail}</span>
            <span className="h-4 w-[1px] bg-white/10" />
            <span className="uppercase tracking-widest text-xs font-bold text-[#00E5FF]">{role}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link href="/app" className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-white/10 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/20 sm:flex-none">
            View Live
          </Link>
          <form action={logoutAdminAction} className="flex-1 sm:flex-none">
            <button type="submit" className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-6 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/20">
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </form>
        </div>
      </header>

      {updated && (
        <div className="flex items-center gap-3 rounded-xl border border-[#00E5FF]/30 bg-[#00E5FF]/10 p-4 text-sm font-medium text-[#00E5FF]">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          {updated}
        </div>
      )}

      {/* --- METRICS BENTO --- */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-white/5 bg-[#0A0F1A] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/50">{stat.label}</span>
              <stat.icon className="h-5 w-5 text-white/30" />
            </div>
            <p className="text-4xl font-bold tracking-tighter text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* --- SUPPORT TICKETS TRAY --- */}
      {supportRequests.length > 0 && (
        <AdminSection title="Inbox" description="Recent incoming support requests from the portal.">
          <div className="rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white/5 border-b border-white/10 text-xs uppercase tracking-wider text-white/50">
                <tr>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">From</th>
                  <th className="px-6 py-4 font-semibold w-full">Message</th>
                  <th className="px-6 py-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 bg-[#0A0F1A]">
                {supportRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                       <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${req.status === 'new' ? 'bg-[#00E5FF]/10 text-[#00E5FF]' : 'bg-white/10 text-white/50'}`}>
                         {req.status}
                       </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-white">{req.name} <span className="block text-xs text-white/40">{req.email}</span></td>
                    <td className="px-6 py-4 text-white/60 text-wrap min-w-[200px] leading-relaxed">{req.message}</td>
                    <td className="px-6 py-4">
                      <form action={updateSupportRequestAction} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={req.id} />
                        <select
                          name="status"
                          defaultValue={req.status}
                          className="rounded-lg border border-white/10 bg-black px-3 py-1.5 text-xs text-white outline-none"
                        >
                          <option value="new">New</option>
                          <option value="resolved">Resolved</option>
                        </select>
                        <button type="submit" className="text-xs font-semibold text-[#00E5FF] hover:underline">Save</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminSection>
      )}

      {/* --- RELEASE MANAGEMENT --- */}
      <AdminSection title="Releases & Updates" description="Distribute new APK versions natively through your infrastructure.">
        <form action={saveReleaseAction} encType="multipart/form-data" className="mb-8 grid gap-6 sm:grid-cols-2 rounded-xl bg-white/5 p-6 border border-white/5">
          <TextInput label="Release version (Slug)" name="slug" placeholder="v2.1.0" required />
          <TextInput label="Display Name" name="version_name" placeholder="2.1.0" required />
          <TextInput label="Build Code" name="version_code" type="number" defaultValue="2" required />
          <TextInput label="Target Architecture" name="abi" defaultValue="universal" required />
          <TextInput label="Publish Date" name="published_at" type="datetime-local" />
          
          <label className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#0A0F1A] px-4 py-2.5 text-sm font-semibold text-white">
            <input type="checkbox" name="is_published" defaultChecked className="accent-[#00E5FF] h-4 w-4" />
            Make Public Immediately
          </label>
          
          <div className="sm:col-span-2">
            <TextArea label="Release Notes" name="release_notes" placeholder="Fixed playback issues..." required />
          </div>
          <div className="sm:col-span-2">
             <TextArea label="Compatibility" name="compatibility_notes" placeholder="Requires Android 9+" required />
          </div>
          <label className="flex flex-col gap-2 sm:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/50">Upload APK</span>
            <input type="file" name="file" accept=".apk,application/vnd.android.package-archive" className="w-full rounded-lg border border-dashed border-white/20 bg-white/5 p-4 text-sm text-white/70 file:mr-4 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2 file:text-xs file:font-bold file:text-black hover:file:bg-gray-200" />
          </label>
          
          <div className="sm:col-span-2 flex justify-end">
             <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-2.5 text-sm font-bold text-black transition-colors hover:bg-gray-200">
               <Plus className="h-4 w-4" /> Add Release
             </button>
          </div>
        </form>

        <div className="grid gap-4">
           {releases.map((item) => {
             const primary = item.assets.find((asset) => asset.is_primary) ?? item.assets[0];
             return (
               <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-white/10 bg-[#0A0F1A] p-5">
                   <div>
                       <div className="flex items-center gap-3 mb-1">
                           <span className="inline-block rounded bg-[#00E5FF]/20 px-2 py-0.5 text-xs font-bold text-[#00E5FF]">{item.version_name}</span>
                           <h3 className="text-base font-bold text-white">{item.slug}</h3>
                       </div>
                       <p className="text-sm text-white/50">{new Date(item.published_at).toLocaleDateString()} · {formatBytes(primary?.file_size_bytes)}</p>
                   </div>
                   <div className="flex items-center gap-3">
                       <Link href={`/api/app/releases/${item.slug}/download`} className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20">
                           <Download className="h-4 w-4" /> Download
                       </Link>
                       <form action={deleteReleaseAction}>
                           <input type="hidden" name="id" value={item.id} />
                           <button className="rounded-lg bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/20">Delete</button>
                       </form>
                   </div>
               </div>
             )
           })}
        </div>
      </AdminSection>

      {/* --- CONTENT CONFIGURATION --- */}
      <AdminSection title="Core Logic & Configuration" description="Directly modify the marketing copy and parameters of your product page.">
        <form action={saveProductAction} className="grid gap-6 sm:grid-cols-2">
          {/* Main info */}
          <TextInput label="Product Name" name="product_name" defaultValue={product.product_name} required />
          <TextInput label="Hero Badge" name="hero_badge" defaultValue={product.hero_badge} required />
          <div className="sm:col-span-2"><TextInput label="Primary Tagline" name="tagline" defaultValue={product.tagline} required /></div>
          
          <div className="h-[1px] w-full bg-white/5 sm:col-span-2 my-2" />

          {/* Links & IDs */}
          <TextInput label="Bundle ID" name="package_name" defaultValue={product.package_name} required />
          <TextInput label="CTA Button Label" name="default_download_label" defaultValue={product.default_download_label} required />
          <TextInput label="Support Email" name="support_email" type="email" defaultValue={product.support_email} required />
          <TextInput label="Support WhatsApp" name="support_whatsapp" defaultValue={product.support_whatsapp} required />
          <TextInput label="Play Store URL (Optional)" name="play_store_url" defaultValue={product.play_store_url ?? ""} />
          
          <div className="h-[1px] w-full bg-white/5 sm:col-span-2 my-2" />

          {/* Details */}
          <TextInput label="Min SDK" name="android_min_sdk" type="number" defaultValue={String(product.android_min_sdk)} required />
          <TextInput label="Target SDK" name="android_target_sdk" type="number" defaultValue={String(product.android_target_sdk)} required />
          <label className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white sm:col-span-2">
            <input type="checkbox" name="android_tv_ready" defaultChecked={product.android_tv_ready} className="accent-[#00E5FF] h-4 w-4" />
            Optimized for Android TV Surfaces
          </label>

          <div className="sm:col-span-2"><TextArea label="Short Summary" name="short_description" defaultValue={product.short_description} required /></div>
          <div className="sm:col-span-2"><TextArea label="Full Manifesto" name="long_description" defaultValue={product.long_description} required /></div>
          
          <div className="sm:col-span-2 flex justify-end pt-4 border-t border-white/5">
             <button type="submit" className="rounded-lg bg-white px-8 py-2.5 text-sm font-bold text-black transition-colors hover:bg-gray-200">
               Save Configuration
             </button>
          </div>
        </form>
      </AdminSection>
    </div>
  );
}
