"use client";

import type { ReactNode } from "react";
import {
  Briefcase,
  CheckCircle2,
  FileText,
  Globe,
  Image as ImageIcon,
  Mail,
  Save,
  Settings,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { motion } from "framer-motion";

import {
  deleteWebsiteProjectAction,
  saveWebsiteHeroAction,
  saveWebsiteProjectAction,
  saveWebsiteServicesAction,
  uploadWebsiteMediaAction,
} from "@/app/actions";
import { resolveAdminAssetUrl } from "@/lib/asset-url";
import type { WebsiteCmsData, WebsiteSetting } from "@/lib/website-cms";

function setting<T>(settings: WebsiteSetting[], key: string, fallback: T): T {
  const found = settings.find((item) => item.key === key)?.value_json;
  return (found ?? fallback) as T;
}

function Panel({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="glass rounded-[2rem] border-white/5 p-6 md:rounded-[2.5rem] md:p-8">
      <div className="mb-7 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-cyan-100">
          {icon}
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-tight text-white">{title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-400">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      <input name={name} type={type} defaultValue={defaultValue} placeholder={placeholder} />
    </label>
  );
}

function TextArea({
  label,
  name,
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      <textarea name={name} defaultValue={defaultValue} placeholder={placeholder} rows={4} />
    </label>
  );
}

function SubmitButton({ children }: { children: ReactNode }) {
  return (
    <button type="submit" className="admin-primary-button">
      <Save className="mr-2 h-4 w-4" />
      {children}
    </button>
  );
}

export function WebsiteAdminDashboard({ data }: { data: WebsiteCmsData }) {
  const webBaseUrl = (process.env.NEXT_PUBLIC_WEB_APP_URL || "https://moalfarras.space").replace(/\/$/, "");
  const home = setting(data.settings, "home_content", {
    ar: {
      hero: {
        title: "أصمم وأبني مواقع وتجارب رقمية تساعد مشروعك على الظهور باحتراف",
        body: "مواقع ويب، واجهات استخدام، تطبيقات، ومحتوى تقني بتنفيذ واضح وتجربة سلسة.",
        primary: "ابدأ مشروعك",
        secondary: "شاهد الأعمال",
      },
    },
    en: {
      hero: {
        title: "I design and build premium websites and digital experiences.",
        body: "Websites, interfaces, apps, and technical content with clear execution and a smooth user journey.",
        primary: "Start Project",
        secondary: "See Work",
      },
    },
  });
  const services = setting(data.settings, "home_content", {
    ar: {
      services: {
        title: "خدمات رقمية واضحة من الفكرة إلى الإطلاق",
        body: "أساعدك في ترتيب الفكرة، تصميم التجربة، بناء الواجهة، وتحويل الموقع إلى أداة تواصل وبيع مفهومة.",
      },
    },
    en: {
      services: {
        title: "Clear digital services from idea to launch",
        body: "I help shape the offer, design the experience, build the interface, and turn the website into a useful conversion surface.",
      },
    },
  });

  return (
    <div className="space-y-8 md:space-y-10">
      <section className="glass relative overflow-hidden rounded-[2rem] border-white/5 p-6 sm:p-8 md:rounded-[3rem] md:p-14">
        <div className="absolute right-0 top-0 p-8 opacity-10 md:p-10">
          <Globe className="h-24 w-24 text-cyan-300 md:h-36 md:w-36" />
        </div>
        <div className="relative z-10 max-w-4xl space-y-6">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-300">Supabase Website CMS</p>
          </div>
          <h1 className="headline-display text-3xl font-black tracking-tight text-white sm:text-4xl md:text-6xl">Website Control</h1>
          <p className="max-w-2xl text-base leading-8 text-slate-400 md:text-lg">
            Real controls for homepage copy, services positioning, media assets, projects, and visitor requests. Every count below comes from Supabase.
          </p>
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              ["Settings", data.settings.length],
              ["Media", data.mediaAssets.length],
              ["Projects", data.projects.length],
              ["Messages", data.messages.length],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[1.35rem] border border-white/10 bg-white/[0.045] p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</p>
                <p className="mt-2 text-2xl font-black text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Panel
        title="Homepage Story"
        description="Controls the main value proposition. Keep it direct: what you build, who it helps, and the next action."
        icon={<FileText className="h-5 w-5" />}
      >
        <form action={saveWebsiteHeroAction} className="grid gap-5 lg:grid-cols-2">
          <TextArea label="Arabic headline" name="hero_ar_headline" defaultValue={home.ar?.hero?.title} />
          <TextArea label="English headline" name="hero_en_headline" defaultValue={home.en?.hero?.title} />
          <TextArea label="Arabic subheadline" name="hero_ar_subheadline" defaultValue={home.ar?.hero?.body} />
          <TextArea label="English subheadline" name="hero_en_subheadline" defaultValue={home.en?.hero?.body} />
          <Field label="Arabic primary CTA" name="hero_ar_primary_cta" defaultValue={home.ar?.hero?.primary} />
          <Field label="English primary CTA" name="hero_en_primary_cta" defaultValue={home.en?.hero?.primary} />
          <Field label="Arabic secondary CTA" name="hero_ar_secondary_cta" defaultValue={home.ar?.hero?.secondary} />
          <Field label="English secondary CTA" name="hero_en_secondary_cta" defaultValue={home.en?.hero?.secondary} />
          <div className="lg:col-span-2">
            <SubmitButton>Save homepage copy</SubmitButton>
          </div>
        </form>
      </Panel>

      <Panel
        title="Services Page"
        description="The services page now has a real content switch for the headline and positioning copy, while the visual service cards remain code-curated for quality."
        icon={<Settings className="h-5 w-5" />}
      >
        <form action={saveWebsiteServicesAction} className="grid gap-5 lg:grid-cols-2">
          <Field label="Arabic title" name="services_ar_title" defaultValue={services.ar?.services?.title} />
          <Field label="English title" name="services_en_title" defaultValue={services.en?.services?.title} />
          <TextArea label="Arabic body" name="services_ar_body" defaultValue={services.ar?.services?.body} />
          <TextArea label="English body" name="services_en_body" defaultValue={services.en?.services?.body} />
          <div className="lg:col-span-2">
            <SubmitButton>Save services copy</SubmitButton>
          </div>
        </form>
      </Panel>

      <Panel
        title="Media Library"
        description="Upload real assets to Supabase Storage and register them in media_assets. Use this for logos, hero images, project previews, and MoPlayer visuals."
        icon={<ImageIcon className="h-5 w-5" />}
      >
        <form action={uploadWebsiteMediaAction} className="mb-8 grid gap-5 lg:grid-cols-[1fr_1fr_0.8fr]">
          <Field label="Arabic alt text" name="alt_ar" placeholder="وصف الصورة بالعربية" />
          <Field label="English alt text" name="alt_en" placeholder="Describe the image in English" />
          <Field label="Kind" name="kind" defaultValue="site" />
          <label className="group relative flex min-h-20 cursor-pointer items-center justify-between overflow-hidden rounded-[1.5rem] border border-dashed border-cyan-200/20 bg-cyan-200/[0.035] px-6 py-5 transition hover:border-cyan-200/45 hover:bg-cyan-200/[0.06] lg:col-span-2">
            <span>
              <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-cyan-100">Select image</span>
              <span className="mt-1 block text-xs text-slate-500">Stored in Supabase Storage and indexed in media_assets.</span>
            </span>
            <UploadCloud className="h-6 w-6 text-cyan-100" />
            <input type="file" name="file" accept="image/*" className="absolute inset-0 cursor-pointer opacity-0" />
          </label>
          <SubmitButton>Upload media</SubmitButton>
        </form>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {data.mediaAssets.slice(0, 12).map((item) => (
            <article key={item.id} className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.035]">
              <div className="aspect-video bg-black/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={resolveAdminAssetUrl(item.path)} alt={item.alt_en || item.id} className="h-full w-full object-cover" />
              </div>
              <div className="space-y-2 p-4">
                <p className="truncate text-sm font-black text-white">{item.id}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-cyan-200">{item.kind}</p>
                <p className="line-clamp-2 text-xs leading-5 text-slate-500">{item.alt_en}</p>
              </div>
            </article>
          ))}
          {!data.mediaAssets.length ? <EmptyState label="No media assets yet." /> : null}
        </div>
      </Panel>

      <Panel
        title="Projects / Case Studies"
        description="Create, update, or remove real work_project rows. Existing detailed translations can keep living in the website content model."
        icon={<Briefcase className="h-5 w-5" />}
      >
        <form action={saveWebsiteProjectAction} className="mb-8 grid gap-5 lg:grid-cols-3">
          <Field label="ID" name="id" placeholder="optional-existing-id" />
          <Field label="Slug" name="slug" placeholder="project-slug" />
          <Field label="Sort order" name="sort_order" type="number" defaultValue={data.projects.length + 1} />
          <Field label="Project URL" name="project_url" placeholder="https://..." />
          <Field label="Repo URL" name="repo_url" placeholder="https://github.com/..." />
          <Field label="Cover media ID" name="cover_media_id" placeholder="media-id" />
          <label className="admin-toggle-card lg:col-span-2">
            <span>
              <strong>Active on site</strong>
              <small>When enabled, the project can appear in the public website lists.</small>
            </span>
            <input type="checkbox" name="is_active" defaultChecked />
            <i aria-hidden />
          </label>
          <SubmitButton>Save project</SubmitButton>
        </form>

        <div className="grid gap-4">
          {data.projects.map((project) => (
            <motion.article
              key={project.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5 md:grid-cols-[1fr_auto]"
            >
              <div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-cyan-200/15 bg-cyan-200/[0.06] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-cyan-100">
                    {project.is_active ? "Active" : "Hidden"}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">#{project.sort_order}</span>
                </div>
                <h3 className="text-lg font-black text-white">{project.slug}</h3>
                <p className="mt-2 text-xs leading-6 text-slate-500">{project.project_url || "No public URL"} / cover: {project.cover_media_id || "none"}</p>
              </div>
              <form action={deleteWebsiteProjectAction}>
                <input type="hidden" name="id" value={project.id} />
                <button className="admin-secondary-button text-red-200" type="submit">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </button>
              </form>
            </motion.article>
          ))}
          {!data.projects.length ? <EmptyState label="No projects in Supabase yet." /> : null}
        </div>
      </Panel>

      <Panel
        title="Messages / Requests"
        description="Incoming website contact messages from contact_messages. Secrets stay hidden; this is only the visitor-submitted business context."
        icon={<Mail className="h-5 w-5" />}
      >
        <div className="grid gap-4">
          {data.messages.map((message) => (
            <article key={message.id} className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="text-lg font-black text-white">{message.name}</h3>
                  <p className="mt-1 text-xs font-bold text-cyan-200">{message.email}{message.whatsapp ? ` / ${message.whatsapp}` : ""}</p>
                </div>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {new Date(message.created_at).toLocaleString("en-GB")}
                </span>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-300">{message.message}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-bold text-slate-500">
                <span>{message.locale || "unknown locale"}</span>
                <span>{message.project_type || message.subject || "general"}</span>
                <span>{message.budget || "no budget"}</span>
                <span>{message.timeline || "no timeline"}</span>
              </div>
            </article>
          ))}
          {!data.messages.length ? <EmptyState label="No messages received yet." /> : null}
        </div>
      </Panel>

      <section className="glass flex flex-col items-start justify-between gap-6 rounded-[2rem] border border-cyan-200/10 bg-cyan-200/[0.025] p-6 md:flex-row md:items-center md:rounded-[3rem] md:p-10">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-[1.35rem] border border-emerald-300/15 bg-emerald-300/[0.08] text-emerald-200">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-white">Supabase only</h2>
            <p className="mt-1 text-sm leading-7 text-slate-400">This CMS reads and writes Supabase tables and storage only.</p>
          </div>
        </div>
        <a href={`${webBaseUrl}/ar`} target="_blank" rel="noopener noreferrer" className="admin-secondary-button">
          Open live site
        </a>
      </section>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-white/[0.025] p-8 text-center text-sm font-bold text-slate-500">
      {label}
    </div>
  );
}
