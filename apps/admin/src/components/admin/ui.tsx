"use client";

import Link from "next/link";
import { useEffect, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { Check, ChevronDown, Copy } from "lucide-react";

import { cn } from "@/lib/cn";

/* ───────────────────────── Layout ───────────────────────── */

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  icon,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="glass fade-up relative overflow-hidden rounded-[26px] p-6 md:p-8">
      <div className="pointer-events-none absolute -top-16 end-[-40px] h-56 w-56 rounded-full bg-[var(--accent-soft)] blur-3xl" />
      <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="flex items-start gap-4">
          {icon ? (
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[var(--line-strong)] bg-[var(--accent-soft)] text-[var(--accent)]">
              {icon}
            </span>
          ) : null}
          <div className="min-w-0">
            {eyebrow ? (
              <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-[var(--accent)]">
                <span className="live-dot" />
                {eyebrow}
              </p>
            ) : null}
            <h1 className="headline mt-2 text-2xl font-black text-[var(--text-1)] md:text-4xl">{title}</h1>
            {subtitle ? <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--text-2)]">{subtitle}</p> : null}
          </div>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}

export function Accordion({
  id,
  title,
  description,
  icon,
  count,
  defaultOpen = false,
  tone = "default",
  children,
}: {
  id?: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  count?: number | string;
  defaultOpen?: boolean;
  tone?: "default" | "accent";
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (!id) return;
    const openFromHash = () => {
      if (window.location.hash === `#${id}`) setOpen(true);
    };
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, [id]);

  return (
    <section id={id} className="acc fade-up scroll-mt-6" data-open={open}>
      <button type="button" className="acc-head" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        {icon ? <span className={cn("acc-icon", tone === "accent" && "text-[var(--accent)]")}>{icon}</span> : null}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-base font-black text-[var(--text-1)]">{title}</span>
          {description ? <span className="mt-0.5 block truncate text-xs text-[var(--text-3)]">{description}</span> : null}
        </span>
        {count !== undefined ? (
          <span className="badge tnum me-1">{count}</span>
        ) : null}
        <ChevronDown className={cn("h-5 w-5 shrink-0 text-[var(--text-3)] transition-transform duration-300", open && "rotate-180")} />
      </button>
      {open ? <div className="acc-body">{children}</div> : null}
    </section>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("glass rounded-[20px] p-5", className)}>{children}</div>;
}

export function EmptyState({ icon, title, body }: { icon: ReactNode; title: string; body?: string }) {
  return (
    <div className="rounded-[20px] border border-dashed border-[var(--line)] bg-white/[0.015] p-8 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--line)] bg-white/[0.03] text-[var(--text-3)]">
        {icon}
      </div>
      <p className="text-sm font-black text-[var(--text-2)]">{title}</p>
      {body ? <p className="mx-auto mt-1.5 max-w-md text-xs leading-6 text-[var(--text-3)]">{body}</p> : null}
    </div>
  );
}

/* ───────────────────────── Inputs ───────────────────────── */

export function Field({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input {...props} />
    </label>
  );
}

export function TextAreaField({ label, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea {...props} />
    </label>
  );
}

export function SelectField({
  label,
  options,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: Array<{ value: string; label: string }> }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select {...props}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Toggle({
  name,
  label,
  description,
  checked,
}: {
  name: string;
  label: string;
  description?: string;
  checked: boolean;
}) {
  return (
    <label className="switch">
      <span>
        <strong>{label}</strong>
        {description ? <small>{description}</small> : null}
      </span>
      <input type="checkbox" name={name} defaultChecked={checked} />
      <i aria-hidden />
    </label>
  );
}

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-sm"
      onClick={() => {
        void navigator.clipboard?.writeText(value);
        setDone(true);
        setTimeout(() => setDone(false), 1400);
      }}
    >
      {done ? <Check className="h-3.5 w-3.5 text-[var(--success)]" /> : <Copy className="h-3.5 w-3.5" />}
      {label}
    </button>
  );
}

/* ───────────────────────── Status ───────────────────────── */

const OK = new Set(["resolved", "archived", "active", "published", "imported", "fetched", "activated", "online", "success"]);
const DANGER = new Set(["expired", "failed", "revoked", "blocked", "offline"]);

export function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  const tone = OK.has(s) ? "badge-ok" : DANGER.has(s) ? "badge-danger" : "badge-warn";
  return <span className={cn("badge", tone)}>{status}</span>;
}

/* ───────────────────────── Stats ───────────────────────── */

export function StatCard({
  label,
  value,
  icon,
  hint,
  tone = "accent",
  href,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  hint?: string;
  tone?: "accent" | "success" | "warning" | "danger" | "violet";
  href?: string;
}) {
  const color =
    tone === "success"
      ? "var(--success)"
      : tone === "warning"
        ? "var(--warning)"
        : tone === "danger"
          ? "var(--danger)"
          : tone === "violet"
            ? "var(--violet)"
            : "var(--accent)";
  const content = (
    <div className="glass fade-up rounded-[20px] p-5 transition hover:-translate-y-0.5 hover:border-[var(--line-strong)]">
      <div className="mb-4 flex items-center justify-between">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--line)]"
          style={{ color, background: "rgba(255,255,255,0.03)" }}
        >
          {icon}
        </span>
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--text-3)]">{label}</p>
      <p className="tnum mt-1 text-3xl font-black text-[var(--text-1)]">{value}</p>
      {hint ? <p className="mt-1 text-xs text-[var(--text-3)]">{hint}</p> : null}
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

export function ProgressBar({
  label,
  value,
  total,
  display,
  color = "var(--accent)",
}: {
  label: string;
  value: number;
  total?: number;
  display?: string;
  color?: string;
}) {
  const pct = total && total > 0 ? Math.min(100, Math.round((value / total) * 100)) : Math.min(100, value);
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="font-bold text-[var(--text-2)]">{label}</span>
        <span className="tnum font-black text-[var(--text-1)]">{display ?? `${pct}%`}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full transition-[width] duration-700"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, var(--accent-2))` }}
        />
      </div>
    </div>
  );
}

/* ───────────────────────── Charts (SVG, no deps) ───────────────────────── */

export function BarChart({
  data,
  height = 150,
}: {
  data: Array<{ label: string; value: number }>;
  height?: number;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {data.map((d, i) => {
        const h = Math.round((d.value / max) * (height - 28));
        return (
          <div key={`${d.label}-${i}`} className="flex flex-1 flex-col items-center justify-end gap-1.5">
            <span className="tnum text-[10px] font-black text-[var(--text-2)]">{d.value || ""}</span>
            <div
              className="w-full rounded-t-lg transition-[height] duration-700"
              style={{
                height: Math.max(3, h),
                background: "linear-gradient(180deg, var(--accent), var(--accent-2))",
                opacity: 0.55 + (d.value / max) * 0.45,
              }}
            />
            <span className="truncate text-[9px] font-bold uppercase tracking-wide text-[var(--text-3)]">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export function DonutChart({
  segments,
  size = 150,
  centerLabel,
  centerValue,
}: {
  segments: Array<{ label: string; value: number; color: string }>;
  size?: number;
  centerLabel?: string;
  centerValue?: string | number;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const radius = size / 2 - 12;
  const circ = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <div className="flex items-center gap-5">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={14} />
        {total > 0
          ? segments.map((s, i) => {
              const len = (s.value / total) * circ;
              const el = (
                <circle
                  key={`${s.label}-${i}`}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={14}
                  strokeDasharray={`${len} ${circ - len}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="round"
                />
              );
              offset += len;
              return el;
            })
          : null}
      </svg>
      <div className="space-y-2">
        {centerValue !== undefined ? (
          <div className="mb-2">
            <p className="tnum text-2xl font-black text-[var(--text-1)]">{centerValue}</p>
            {centerLabel ? <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-3)]">{centerLabel}</p> : null}
          </div>
        ) : null}
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
            <span className="text-[var(--text-2)]">{s.label}</span>
            <span className="tnum ms-auto font-black text-[var(--text-1)]">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
