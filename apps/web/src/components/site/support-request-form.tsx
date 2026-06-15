"use client";

import { Send } from "lucide-react";
import { type FormEvent, useRef, useState } from "react";

type SupportOption = readonly [string, string];

type SupportFormCopy = {
  formTitle: string;
  product: string;
  issue: string;
  device: string;
  version: string;
  name: string;
  email: string;
  whatsapp: string;
  screenshot: string;
  message: string;
  messageHelp: string;
  submit: string;
  sent: string;
};

type SubmitState =
  | { status: "idle" | "sending" | "success"; message?: string }
  | { status: "error"; message: string };

const stateCopy = {
  en: {
    sending: "Sending...",
    newRequest: "Send another request",
    error: "The support request could not be sent. Please review the form and try again.",
  },
  ar: {
    sending: "جاري الإرسال...",
    newRequest: "إرسال طلب جديد",
    error: "تعذر إرسال طلب الدعم. راجع النموذج ثم حاول مرة أخرى.",
  },
} as const;

export function SupportRequestForm({
  locale,
  copy,
  productOptions,
  issueOptions,
  deviceOptions,
}: {
  locale: "ar" | "en";
  copy: SupportFormCopy;
  productOptions: SupportOption[];
  issueOptions: SupportOption[];
  deviceOptions: SupportOption[];
}) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [state, setState] = useState<SubmitState>({ status: "idle" });
  const disabled = state.status === "sending";
  const actionCopy = stateCopy[locale];

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ status: "sending" });

    try {
      const response = await fetch("/api/app/support", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "X-Requested-With": "fetch",
        },
        body: new FormData(event.currentTarget),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || actionCopy.error);
      }

      formRef.current?.reset();
      setState({ status: "success", message: copy.sent });
    } catch (error) {
      setState({ status: "error", message: error instanceof Error ? error.message : actionCopy.error });
    }
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} encType="multipart/form-data" className="fresh-form" noValidate>
      <input type="hidden" name="locale" value={locale} />
      <div className="sr-only" aria-hidden>
        <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-label="Honeypot" />
      </div>

      <div className="min-h-[56px]" aria-live="polite" aria-atomic="true">
        {state.status === "success" ? (
          <div className="rounded-[1rem] border border-blue-400/25 bg-blue-500/10 px-4 py-3 text-sm text-blue-100">{state.message}</div>
        ) : state.status === "error" ? (
          <div className="rounded-[1rem] border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">{state.message}</div>
        ) : null}
      </div>

      <p className="fresh-eyebrow">{copy.formTitle}</p>

      <label className="fresh-field">
        <span className="fresh-field-label">{copy.product}</span>
        <select name="support_product" required className="fresh-input" defaultValue="moplayer2" disabled={disabled}>
          {productOptions.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <label className="fresh-field">
        <span className="fresh-field-label">{copy.issue}</span>
        <select name="issue_type" required className="fresh-input" defaultValue="activation" disabled={disabled}>
          {issueOptions.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <label className="fresh-field">
        <span className="fresh-field-label">{copy.device}</span>
        <select name="device_type" required className="fresh-input" defaultValue="android-tv" disabled={disabled}>
          {deviceOptions.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <label className="fresh-field">
        <span className="fresh-field-label">{copy.version}</span>
        <input name="app_version" className="fresh-input" inputMode="text" maxLength={80} disabled={disabled} />
      </label>

      <label className="fresh-field">
        <span className="fresh-field-label">{copy.name}</span>
        <input name="name" required className="fresh-input" maxLength={120} disabled={disabled} />
      </label>

      <label className="fresh-field">
        <span className="fresh-field-label">{copy.email}</span>
        <input name="email" type="email" required className="fresh-input" maxLength={160} disabled={disabled} />
      </label>

      <label className="fresh-field">
        <span className="fresh-field-label">{copy.whatsapp}</span>
        <input name="whatsapp" className="fresh-input" maxLength={80} disabled={disabled} />
      </label>

      <label className="fresh-field">
        <span className="fresh-field-label">{copy.screenshot}</span>
        <input name="screenshot" type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="fresh-input" disabled={disabled} />
      </label>

      <label className="fresh-field">
        <span className="fresh-field-label">{copy.message}</span>
        <textarea name="message" required rows={8} className="fresh-input fresh-textarea" placeholder={copy.messageHelp} disabled={disabled} />
      </label>

      <div className="flex flex-wrap gap-3">
        <button type="submit" className="fresh-button fresh-button-primary min-w-[190px] justify-center" disabled={disabled}>
          <Send className="h-4 w-4" />
          {disabled ? actionCopy.sending : copy.submit}
        </button>
        {state.status === "success" ? (
          <button type="button" className="fresh-button" onClick={() => setState({ status: "idle" })}>
            {actionCopy.newRequest}
          </button>
        ) : null}
      </div>
    </form>
  );
}
