"use client";

import { Archive, Bot, Mail, MessageCircle, Send, Trash2 } from "lucide-react";

import {
  deleteAiConversationAction,
  sendUserEmailAction,
  updateAiConversationStatusAction,
  updateWebsiteMessageStatusAction,
} from "@/app/actions";
import { ReplyComposer } from "@/components/admin/reply-composer";
import { useLocale } from "@/components/admin/locale-provider";
import { DonutChart, PageHeader, ProgressBar, StatCard } from "@/components/admin/ui";
import type { EmailInboxData } from "@/lib/email-center";

const C = { success: "#34d399", warning: "#fbbf24", danger: "#fb7185", accent: "#22d3ee", violet: "#a78bfa" };

export function EmailCenter({ data, smtpReady }: { data: EmailInboxData; smtpReady: boolean }) {
  const { t } = useLocale();
  const websiteOpen = data.websiteMessages.filter((message) => !message.status || message.status === "new").length;
  const appOpen = data.appMessages.filter((message) => message.status === "new").length;
  const aiOpen = data.aiConversations.filter((conversation) => conversation.status !== "archived").length;
  const total = data.websiteMessages.length + data.appMessages.length + data.aiConversations.length;
  const done = data.websiteMessages.filter((message) => message.status === "replied" || message.status === "resolved" || message.status === "archived").length
    + data.appMessages.filter((message) => message.status === "resolved" || message.status === "archived").length
    + data.aiConversations.filter((conversation) => conversation.status === "closed" || conversation.status === "archived").length;

  return (
    <>
      <PageHeader
        eyebrow={smtpReady ? t({ en: "Email ready", ar: "الإيميل جاهز" }) : t({ en: "Email needs setup", ar: "الإيميل يحتاج إعداد" })}
        title={t({ en: "Email Management", ar: "إدارة الإيميلات" })}
        subtitle={t({
          en: "One inbox for website messages, app issues, and AI conversations where visitors left an email.",
          ar: "صندوق واحد لرسائل الموقع، مشاكل التطبيقات، ومحادثات AI التي ترك صاحبها بريداً.",
        })}
        icon={<Mail className="h-7 w-7" />}
      />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label={t({ en: "Website", ar: "الموقع" })} value={websiteOpen} icon={<Mail className="h-5 w-5" />} tone="warning" />
        <StatCard label={t({ en: "Apps", ar: "التطبيقات" })} value={appOpen} icon={<MessageCircle className="h-5 w-5" />} tone="violet" />
        <StatCard label="AI" value={aiOpen} icon={<Bot className="h-5 w-5" />} tone="accent" />
        <StatCard label={t({ en: "Done", ar: "تمت" })} value={done} icon={<Archive className="h-5 w-5" />} tone="success" />
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="glass rounded-[24px] p-5">
          <h2 className="text-base font-black text-[var(--text-1)]">{t({ en: "Send direct reply", ar: "إرسال رد مباشر" })}</h2>
          <p className="mt-1 text-xs leading-6 text-[var(--text-3)]">
            {t({ en: "Use this when you want to reply manually to any person.", ar: "استخدم هذا عندما تريد الرد يدوياً على أي شخص." })}
          </p>
          <form action={sendUserEmailAction} className="mt-4 grid gap-3">
            <input type="hidden" name="redirect_to" value="/email" />
            <label className="field">
              <span>{t({ en: "To email", ar: "إلى بريد" })}</span>
              <input name="to" type="email" required placeholder="client@example.com" />
            </label>
            <label className="field">
              <span>{t({ en: "Subject", ar: "الموضوع" })}</span>
              <input name="subject" required placeholder={t({ en: "Reply from Moalfarras", ar: "رد من محمد الفراس" })} />
            </label>
            <label className="field">
              <span>{t({ en: "Message", ar: "الرسالة" })}</span>
              <textarea name="body" required placeholder={t({ en: "Write a clear reply...", ar: "اكتب رداً واضحاً..." })} />
            </label>
            <button type="submit" className="btn btn-primary">
              <Send className="h-4 w-4" />
              {t({ en: "Send email", ar: "إرسال الإيميل" })}
            </button>
          </form>
        </div>
        <div className="glass rounded-[24px] p-5">
          <h2 className="text-base font-black text-[var(--text-1)]">{t({ en: "Inbox health", ar: "حالة الصندوق" })}</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-[auto_1fr] md:items-center">
            <DonutChart
              segments={[
                { label: t({ en: "Website", ar: "الموقع" }), value: websiteOpen, color: C.warning },
                { label: t({ en: "Apps", ar: "التطبيقات" }), value: appOpen, color: C.violet },
                { label: "AI", value: aiOpen, color: C.accent },
                { label: t({ en: "Done", ar: "تمت" }), value: done, color: C.success },
              ]}
              centerValue={total}
              centerLabel={t({ en: "Total", ar: "الإجمالي" })}
            />
            <div className="grid gap-4">
              <ProgressBar label={t({ en: "Handled", ar: "تمت معالجته" })} value={done} total={Math.max(1, total)} color={C.success} />
              <ProgressBar label={t({ en: "Needs reply", ar: "يحتاج رد" })} value={websiteOpen + appOpen + aiOpen} total={Math.max(1, total)} color={C.warning} />
            </div>
          </div>
        </div>
      </section>

      <InboxSection title={t({ en: "Website messages", ar: "رسائل الموقع" })} empty={t({ en: "No website messages.", ar: "لا توجد رسائل موقع." })}>
        {data.websiteMessages.map((message) => (
          <article key={message.id} className="rounded-2xl border border-[var(--line)] bg-white/[0.02] p-4">
            <InboxHeader source={t({ en: "Website", ar: "الموقع" })} status={message.status || (message.read ? "read" : "new")} date={message.created_at} />
            <h3 className="text-sm font-black text-[var(--text-1)]">{message.name}</h3>
            <p className="text-xs font-bold text-[var(--accent)]">{message.email}</p>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[var(--text-2)]">{message.message}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <ReplyComposer to={message.email} defaultSubject={t({ en: "Re: your message", ar: "رد على رسالتك" })} redirectTo="/email" messageId={message.id} />
              <StatusForm id={message.id} action={updateWebsiteMessageStatusAction} statuses={["new", "read", "replied", "resolved", "archived"]} current={message.status || "new"} />
            </div>
          </article>
        ))}
      </InboxSection>

      <InboxSection title={t({ en: "App issues", ar: "مشاكل التطبيقات" })} empty={t({ en: "No app issue emails.", ar: "لا توجد مشاكل تطبيقات." })}>
        {data.appMessages.map((message) => (
          <article key={message.id} className="rounded-2xl border border-[var(--line)] bg-white/[0.02] p-4">
            <InboxHeader source={message.productName} status={message.status} date={message.created_at} />
            <h3 className="text-sm font-black text-[var(--text-1)]">{message.name}</h3>
            <p className="text-xs font-bold text-[var(--accent)]">{message.email}</p>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[var(--text-2)]">{message.message}</p>
            <div className="mt-3">
              <ReplyComposer to={message.email} defaultSubject={`Re: ${message.productName}`} redirectTo="/email" />
            </div>
          </article>
        ))}
      </InboxSection>

      <InboxSection title={t({ en: "AI conversations with email", ar: "محادثات AI مع بريد" })} empty={t({ en: "No AI conversations with visitor email.", ar: "لا توجد محادثات AI مرتبطة ببريد." })}>
        {data.aiConversations.map((conversation) => (
          <article key={conversation.id} className="rounded-2xl border border-[var(--line)] bg-white/[0.02] p-4">
            <InboxHeader source="AI" status={conversation.status || "open"} date={conversation.updated_at || conversation.created_at} />
            <h3 className="text-sm font-black text-[var(--text-1)]">{conversation.summary || conversation.intent || "AI conversation"}</h3>
            <p className="text-xs font-bold text-[var(--accent)]">{conversation.visitor_email}</p>
            <div className="mt-3 grid gap-2">
              {conversation.messages.slice(-6).map((message) => (
                <p key={message.id} className="rounded-xl bg-black/15 p-3 text-xs leading-6 text-[var(--text-2)]">
                  <strong className="text-[var(--accent)]">{message.role}: </strong>
                  {message.content}
                </p>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {conversation.visitor_email ? <ReplyComposer to={conversation.visitor_email} defaultSubject={t({ en: "Re: your AI question", ar: "رد على سؤالك مع AI" })} redirectTo="/email" /> : null}
              <StatusForm id={conversation.id} action={updateAiConversationStatusAction} statuses={["open", "lead", "support", "closed", "archived"]} current={conversation.status || "open"} />
              <form action={deleteAiConversationAction}>
                <input type="hidden" name="id" value={conversation.id} />
                <button type="submit" className="btn btn-sm btn-danger">
                  <Trash2 className="h-4 w-4" />
                  {t({ en: "Delete AI log", ar: "حذف محادثة AI" })}
                </button>
              </form>
            </div>
          </article>
        ))}
      </InboxSection>
    </>
  );
}

function InboxSection({ title, empty, children }: { title: string; empty: string; children: React.ReactNode }) {
  return (
    <section className="glass rounded-[24px] p-5">
      <h2 className="text-base font-black text-[var(--text-1)]">{title}</h2>
      <div className="mt-4 grid gap-3">
        {children || <p className="rounded-2xl border border-dashed border-[var(--line)] p-5 text-sm text-[var(--text-3)]">{empty}</p>}
      </div>
    </section>
  );
}

function InboxHeader({ source, status, date }: { source: string; status: string; date: string }) {
  return (
    <div className="mb-2 flex flex-wrap gap-2">
      <span className="badge">{source}</span>
      <span className="badge">{status}</span>
      <span className="badge">{new Date(date).toLocaleString("en-GB")}</span>
    </div>
  );
}

function StatusForm({
  id,
  action,
  statuses,
  current,
}: {
  id: string;
  action: (formData: FormData) => void | Promise<void>;
  statuses: string[];
  current: string;
}) {
  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <select name="status" defaultValue={current} className="input h-9 w-auto min-w-32">
        {statuses.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>
      <button type="submit" className="btn btn-sm">Save</button>
    </form>
  );
}
