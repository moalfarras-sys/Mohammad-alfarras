"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { useMemo, useState, useTransition } from "react";

import { cn } from "@/lib/cn";

export type ActionTone = "idle" | "saving" | "success" | "error";

export function useControlCenterAction<T extends unknown[]>(
  action: (...args: T) => Promise<unknown>,
  successMessage: string,
) {
  const router = useRouter();
  const [tone, setTone] = useState<ActionTone>("idle");
  const [message, setMessage] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const run = (...args: T) => {
    setTone("saving");
    setMessage("");

    startTransition(async () => {
      try {
        await action(...args);
        setTone("success");
        setMessage(successMessage);
        router.refresh();
      } catch (error) {
        setTone("error");
        setMessage(error instanceof Error ? error.message : "Unexpected error");
      }
    });
  };

  return {
    isPending: isPending || tone === "saving",
    tone,
    message,
    run,
    reset: () => {
      setTone("idle");
      setMessage("");
    },
  };
}

export function StudioShell({
  eyebrow,
  title,
  body,
  actions,
  children,
}: {
  eyebrow: string;
  title: string;
  body: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02)),rgba(7,10,18,0.82)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.3)] backdrop-blur-2xl md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-3xl">
          <span className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.28em] text-primary">
            {eyebrow}
          </span>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-foreground md:text-4xl">{title}</h1>
          <p className="mt-3 text-sm leading-8 text-foreground-muted md:text-base">{body}</p>
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>

      <div className="mt-5">{children}</div>
    </section>
  );
}

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <article className={cn("rounded-[1.6rem] border border-white/8 bg-white/[0.04] p-5", className)}>{children}</article>;
}

export function SectionTitle({
  title,
  body,
  aside,
}: {
  title: string;
  body?: string;
  aside?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="max-w-3xl">
        <h2 className="text-xl font-black text-foreground">{title}</h2>
        {body ? <p className="mt-2 text-sm leading-7 text-foreground-muted">{body}</p> : null}
      </div>
      {aside ? <div className="shrink-0">{aside}</div> : null}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-black uppercase tracking-[0.18em] text-foreground-soft">{label}</span>
      {children}
      {hint ? <span className="text-xs leading-6 text-foreground-soft">{hint}</span> : null}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "min-h-12 w-full rounded-[1.1rem] border border-white/10 bg-black/10 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-foreground-soft focus:border-primary/25 focus:bg-white/[0.06]",
        props.className,
      )}
    />
  );
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "min-h-28 w-full rounded-[1.1rem] border border-white/10 bg-black/10 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-foreground-soft focus:border-primary/25 focus:bg-white/[0.06]",
        props.className,
      )}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "min-h-12 w-full rounded-[1.1rem] border border-white/10 bg-black/10 px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary/25 focus:bg-white/[0.06]",
        props.className,
      )}
    />
  );
}

export function Checkbox({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "flex w-full items-start gap-3 rounded-[1.2rem] border px-4 py-3 text-start transition",
        checked ? "border-primary/25 bg-primary/10" : "border-white/10 bg-black/10 hover:bg-white/[0.04]",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[10px] font-black",
          checked ? "border-primary bg-primary text-black" : "border-white/15 text-transparent",
        )}
      >
        ✓
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-bold text-foreground">{label}</span>
        {hint ? <span className="mt-1 block text-xs leading-6 text-foreground-muted">{hint}</span> : null}
      </span>
    </button>
  );
}

export function LocaleGrid({
  ar,
  en,
}: {
  ar: React.ReactNode;
  en: React.ReactNode;
}) {
  return <div className="grid gap-4 xl:grid-cols-2">{ar}{en}</div>;
}

export function BilingualPane({
  title,
  dir,
  children,
}: {
  title: string;
  dir: "rtl" | "ltr";
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[1.4rem] border border-white/8 bg-black/10 p-4" dir={dir}>
      <h3 className="text-sm font-black uppercase tracking-[0.18em] text-foreground-soft">{title}</h3>
      <div className="mt-4 grid gap-4">{children}</div>
    </div>
  );
}

export function StatusPill({
  tone,
  message,
}: {
  tone: ActionTone;
  message?: string;
}) {
  const config = useMemo(() => {
    if (tone === "success") return "border-emerald-400/20 bg-emerald-500/10 text-emerald-200";
    if (tone === "error") return "border-red-400/20 bg-red-500/10 text-red-200";
    if (tone === "saving") return "border-primary/20 bg-primary/10 text-primary";
    return "border-white/10 bg-white/[0.04] text-foreground-soft";
  }, [tone]);

  return (
    <div className={cn("inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-xs font-bold", config)}>
      {tone === "saving" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
      <span>{message || (tone === "saving" ? "Saving..." : "Ready")}</span>
    </div>
  );
}

export function PrimaryButton({
  children,
  className,
  disabled,
  onClick,
  type = "button",
}: {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--primary),#57ffb5)] px-5 text-sm font-black text-black transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  className,
  disabled,
  onClick,
  type = "button",
}: {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-5 text-sm font-bold text-foreground transition hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function DangerButton({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex min-h-11 items-center justify-center rounded-full border border-red-400/20 bg-red-500/10 px-5 text-sm font-bold text-red-200 transition hover:bg-red-500/16 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  );
}

export function PreviewImage({
  src,
  alt,
  className,
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  return src ? (
    <Image
      src={src}
      alt={alt}
      width={640}
      height={420}
      unoptimized
      className={cn("h-full w-full rounded-[1.2rem] object-cover", className)}
    />
  ) : (
    <div className={cn("flex h-full min-h-28 w-full items-center justify-center rounded-[1.2rem] border border-dashed border-white/10 bg-black/10 text-xs text-foreground-soft", className)}>
      No preview
    </div>
  );
}

export function moveListItem<T>(items: T[], from: number, to: number) {
  if (to < 0 || to >= items.length || from === to) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
