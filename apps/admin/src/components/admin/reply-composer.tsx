"use client";

import { useState } from "react";
import { Send, X } from "lucide-react";

import { sendUserEmailAction } from "@/app/actions";
import { useLocale } from "@/components/admin/locale-provider";

export function ReplyComposer({
  to,
  defaultSubject,
  redirectTo,
  messageId,
}: {
  to: string;
  defaultSubject: string;
  redirectTo: string;
  messageId?: string;
}) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button type="button" className="btn btn-sm" onClick={() => setOpen(true)}>
        <Send className="h-3.5 w-3.5" />
        {t({ en: "Reply by email", ar: "رد بالبريد" })}
      </button>
    );
  }

  return (
    <form action={sendUserEmailAction} className="mt-4 space-y-3 rounded-2xl border border-[var(--line-strong)] bg-[var(--accent-soft)] p-4">
      <input type="hidden" name="to" value={to} />
      <input type="hidden" name="redirect_to" value={redirectTo} />
      {messageId ? <input type="hidden" name="message_id" value={messageId} /> : null}
      <div className="flex items-center justify-between">
        <p className="text-xs font-black text-[var(--text-1)]">
          {t({ en: "To", ar: "إلى" })}: <span className="text-[var(--accent)]">{to}</span>
        </p>
        <button type="button" className="btn btn-sm" onClick={() => setOpen(false)} aria-label="Close">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <label className="field">
        <span>{t({ en: "Subject", ar: "الموضوع" })}</span>
        <input name="subject" defaultValue={defaultSubject} required />
      </label>
      <label className="field">
        <span>{t({ en: "Message", ar: "الرسالة" })}</span>
        <textarea name="body" required placeholder={t({ en: "Write your reply...", ar: "اكتب ردك..." })} />
      </label>
      <button type="submit" className="btn btn-primary btn-sm">
        <Send className="h-3.5 w-3.5" />
        {t({ en: "Send email", ar: "إرسال" })}
      </button>
    </form>
  );
}
