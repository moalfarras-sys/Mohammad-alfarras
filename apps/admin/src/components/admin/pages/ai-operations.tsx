"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  Archive,
  Bot,
  ExternalLink,
  Inbox,
  MessageSquareText,
  Route,
  ShieldCheck,
  Trash2,
  Workflow,
} from "lucide-react";

import {
  deleteAiConversationAction,
  deleteAiFeedbackAction,
  deleteAssistantEventAction,
  updateAiConversationStatusAction,
  updateAutomationEventStatusAction,
} from "@/app/actions";
import { useLocale } from "@/components/admin/locale-provider";
import { Accordion, PageHeader, StatCard } from "@/components/admin/ui";
import type { AiConversationRow } from "@/lib/ai-ops";

type Health = {
  ok?: boolean;
  generatedAt?: string;
  checks?: Record<string, { ok?: boolean; detail?: string }>;
};

type AiOpsViewData = {
  conversations: AiConversationRow[];
  automationEvents: Array<{
    id: string;
    event_type: string | null;
    source: string | null;
    product_slug: string | null;
    status: string | null;
    priority: string | null;
    error_message: string | null;
    created_at: string;
  }>;
  feedback: Array<{ id: string; rating: string | null; comment: string | null; created_at: string }>;
  assistantEvents: Array<{
    key: string;
    updated_at: string;
    value: { locale?: string; message?: string; provider?: string; fallback?: boolean; retentionDays?: number } | null;
  }>;
  settings?: { enabled?: boolean; provider?: string; gemini_model?: string; model?: string } | null;
};

export function AiOperationsView({
  health,
  ops,
  webBase,
}: {
  health: Health;
  ops: AiOpsViewData;
  webBase: string;
}) {
  const { t } = useLocale();
  const openConversations = ops.conversations.filter((item) => item.status !== "archived").length;
  const archivedConversations = ops.conversations.filter((item) => item.status === "archived").length;
  const failedAutomation = ops.automationEvents.filter((item) => item.status === "failed" || item.error_message).length;
  const temporaryEvents = ops.assistantEvents.length;

  return (
    <>
      <PageHeader
        eyebrow={health.ok ? t({ en: "AI and automation", ar: "الذكاء والأتمتة" }) : t({ en: "Needs review", ar: "تحتاج مراجعة" })}
        title={t({ en: "AI inbox", ar: "صندوق المساعد" })}
        subtitle={t({
          en: "A light panel for assistant conversations, feedback, automation events, and short temporary logs. Archive what is done, delete noise, keep real work visible.",
          ar: "لوحة خفيفة لمحادثات المساعد، التقييمات، أحداث الأتمتة، والسجلات المؤقتة. أرشف المنتهي، احذف الضوضاء، وأبقِ العمل الحقيقي ظاهراً.",
        })}
        icon={<Bot className="h-7 w-7" />}
        actions={
          <Link href={`${webBase}/en`} target="_blank" className="btn btn-sm">
            <ExternalLink className="h-4 w-4" />
            {t({ en: "Open live site", ar: "فتح الموقع" })}
          </Link>
        }
      />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label={t({ en: "Open chats", ar: "محادثات مفتوحة" })}
          value={openConversations}
          icon={<MessageSquareText className="h-5 w-5" />}
          tone="accent"
          hint={t({ en: "Active", ar: "نشطة" })}
        />
        <StatCard
          label={t({ en: "Archived", ar: "مؤرشفة" })}
          value={archivedConversations}
          icon={<Archive className="h-5 w-5" />}
          tone="success"
          hint={t({ en: "Done", ar: "تمت" })}
        />
        <StatCard
          label={t({ en: "Feedback", ar: "تقييمات" })}
          value={ops.feedback.length}
          icon={<Inbox className="h-5 w-5" />}
          tone="violet"
        />
        <StatCard
          label={t({ en: "Automation", ar: "الأتمتة" })}
          value={failedAutomation || ops.automationEvents.length}
          icon={<Workflow className="h-5 w-5" />}
          tone={failedAutomation > 0 ? "danger" : "success"}
          hint={failedAutomation ? t({ en: "Need review", ar: "تحتاج مراجعة" }) : t({ en: "Clean", ar: "نظيفة" })}
        />
      </section>

      <section className="grid gap-3 lg:grid-cols-4">
        <ActionTile
          icon={<MessageSquareText className="h-5 w-5" />}
          title={t({ en: "Reply path", ar: "مسار الرد" })}
          body={t({
            en: "Useful requests should move to Website messages or Support. AI does not send private promises by itself.",
            ar: "الطلبات المفيدة تُنقل إلى رسائل الموقع أو الدعم. المساعد لا يرسل وعوداً خاصة من تلقاء نفسه.",
          })}
        />
        <ActionTile
          icon={<Archive className="h-5 w-5" />}
          title={t({ en: "Archive", ar: "الأرشفة" })}
          body={t({
            en: "Use when a chat or automation event is reviewed and no longer needs attention.",
            ar: "استخدمها عند مراجعة المحادثة أو حدث الأتمتة وعدم الحاجة لمتابعة.",
          })}
        />
        <ActionTile
          icon={<Trash2 className="h-5 w-5" />}
          title={t({ en: "Delete noise", ar: "حذف الضوضاء" })}
          body={t({
            en: "Remove test events, duplicate feedback, or temporary assistant events that are no longer useful.",
            ar: "احذف الأحداث التجريبية، أو التقييمات المكررة، أو السجلات المؤقتة غير المفيدة.",
          })}
        />
        <ActionTile
          icon={<ShieldCheck className="h-5 w-5" />}
          title={t({ en: "Safe actions", ar: "إجراءات آمنة" })}
          body={t({
            en: "No destructive action runs automatically. Buttons here change status or remove selected records only.",
            ar: "لا توجد إجراءات تخريبية تلقائية. الأزرار هنا تغيّر الحالة أو تحذف سجلات محددة فقط.",
          })}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Accordion
          id="conversations"
          title={t({ en: "Conversation inbox", ar: "صندوق المحادثات" })}
          description={t({
            en: "Review what visitors asked. Archive done items or delete test noise.",
            ar: "راجع ما سأل عنه الزوار. أرشف المنتهي أو احذف الضوضاء التجريبية.",
          })}
          icon={<Inbox className="h-5 w-5" />}
          count={ops.conversations.length}
          defaultOpen
        >
          <div className="grid gap-3">
            {ops.conversations.map((conversation) => (
              <ConversationCard key={conversation.id} conversation={conversation} />
            ))}
            {!ops.conversations.length ? (
              <EmptyPanel
                title={t({ en: "No conversations yet", ar: "لا محادثات بعد" })}
                body={t({
                  en: "AI conversations will appear here after visitors use the assistant.",
                  ar: "ستظهر محادثات المساعد هنا بعد استخدام الزوار له.",
                })}
              />
            ) : null}
          </div>
        </Accordion>

        <div className="grid gap-4">
          <div className="glass fade-up rounded-[24px] p-5">
            <SectionHead
              icon={<ShieldCheck className="h-5 w-5" />}
              title={t({ en: "Assistant state", ar: "حالة المساعد" })}
              detail={t({ en: "Current provider and health checks.", ar: "المزوّد الحالي والفحوصات." })}
            />
            <div className="mt-4 grid gap-2">
              <MiniRow label={t({ en: "Enabled", ar: "مفعّل" })} value={ops.settings?.enabled ? t({ en: "Yes", ar: "نعم" }) : t({ en: "Check", ar: "افحص" })} />
              <MiniRow label={t({ en: "Provider", ar: "المزوّد" })} value={ops.settings?.provider || t({ en: "env / default", ar: "env / افتراضي" })} />
              <MiniRow label={t({ en: "Model", ar: "النموذج" })} value={ops.settings?.gemini_model || ops.settings?.model || t({ en: "env / default", ar: "env / افتراضي" })} />
              <MiniRow label={t({ en: "Health", ar: "الصحة" })} value={health.ok ? t({ en: "OK", ar: "سليم" }) : t({ en: "Check", ar: "افحص" })} />
              <MiniRow label={t({ en: "Temporary events", ar: "أحداث مؤقتة" })} value={String(temporaryEvents)} />
            </div>
          </div>

          <div className="glass fade-up rounded-[24px] p-5">
            <SectionHead
              icon={<Route className="h-5 w-5" />}
              title={t({ en: "Route checks", ar: "فحوصات المسارات" })}
              detail={t({ en: "Small live status list.", ar: "قائمة حالة مباشرة قصيرة." })}
            />
            <div className="mt-4 grid gap-2">
              {Object.entries(health.checks ?? {}).slice(0, 10).map(([key, value]) => (
                <MiniRow key={key} label={labelForCheck(key)} value={value.ok ? t({ en: "OK", ar: "سليم" }) : t({ en: "Check", ar: "افحص" })} />
              ))}
              {!Object.keys(health.checks ?? {}).length ? (
                <p className="rounded-2xl border border-dashed border-[var(--line)] p-3 text-xs text-[var(--text-3)]">
                  {t({ en: "Live route data appears here once the website route is reachable.", ar: "ستظهر بيانات المسارات هنا فور توفر مسار الموقع." })}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Accordion
          id="automation"
          title={t({ en: "Automation events", ar: "أحداث الأتمتة" })}
          description={t({
            en: "n8n / app events. Mark reviewed or archive when done.",
            ar: "أحداث n8n والتطبيقات. ضع علامة مراجَع أو أرشف عند الانتهاء.",
          })}
          icon={<Workflow className="h-5 w-5" />}
          count={ops.automationEvents.length}
        >
          <div className="grid gap-3">
            {ops.automationEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
            {!ops.automationEvents.length ? (
              <EmptyPanel
                title={t({ en: "No automation events", ar: "لا أحداث أتمتة" })}
                body={t({
                  en: "Automation events will appear here when the website receives them.",
                  ar: "ستظهر أحداث الأتمتة هنا فور استقبال الموقع لها.",
                })}
              />
            ) : null}
          </div>
        </Accordion>

        <Accordion
          id="temp"
          title={t({ en: "Temporary logs & feedback", ar: "سجلات مؤقتة وتقييمات" })}
          description={t({
            en: "Short assistant logs are temporary. Delete noise when needed.",
            ar: "سجلات المساعد قصيرة المدى. احذف الضوضاء عند الحاجة.",
          })}
          icon={<Trash2 className="h-5 w-5" />}
          count={ops.feedback.length + ops.assistantEvents.length}
        >
          <div className="grid gap-3">
            {ops.feedback.map((item) => (
              <FeedbackCard key={item.id} item={item} />
            ))}
            {ops.assistantEvents.map((item) => (
              <AssistantEventCard key={item.key} item={item} />
            ))}
            {!ops.feedback.length && !ops.assistantEvents.length ? (
              <EmptyPanel
                title={t({ en: "No temporary items", ar: "لا عناصر مؤقتة" })}
                body={t({
                  en: "Feedback and temporary assistant logs will appear here.",
                  ar: "ستظهر التقييمات والسجلات المؤقتة هنا.",
                })}
              />
            ) : null}
          </div>
        </Accordion>
      </section>
    </>
  );
}

function ActionTile({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <article className="fade-up rounded-[22px] border border-[var(--line-strong)] bg-[linear-gradient(135deg,rgba(34,211,238,0.08),rgba(99,102,241,0.04))] p-4">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--accent-soft)] text-[var(--accent)]">{icon}</div>
      <h2 className="text-sm font-black text-[var(--text-1)]">{title}</h2>
      <p className="mt-1 text-xs leading-6 text-[var(--text-3)]">{body}</p>
    </article>
  );
}

function SectionHead({ icon, title, detail }: { icon: ReactNode; title: string; detail: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--accent-soft)] text-[var(--accent)]">{icon}</span>
      <span>
        <h2 className="text-base font-black text-[var(--text-1)]">{title}</h2>
        <p className="mt-1 text-xs leading-6 text-[var(--text-3)]">{detail}</p>
      </span>
    </div>
  );
}

function EmptyPanel({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--line)] bg-white/[0.015] p-5">
      <p className="text-sm font-black text-[var(--text-1)]">{title}</p>
      <p className="mt-1 text-xs leading-6 text-[var(--text-3)]">{body}</p>
    </div>
  );
}

function MiniRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-white/[0.02] px-3 py-2">
      <span className="truncate text-xs font-bold text-[var(--text-3)]">{label}</span>
      <span className="badge shrink-0">{value}</span>
    </div>
  );
}

function ConversationCard({ conversation }: { conversation: AiConversationRow }) {
  const { t } = useLocale();
  const lastMessage = conversation.messages.at(-1);
  return (
    <article className="rounded-2xl border border-[var(--line)] bg-white/[0.025] p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap gap-2">
            <span className="badge">{conversation.status || "open"}</span>
            <span className="badge">{conversation.locale || "locale"}</span>
            <span className="badge">{conversation.channel || "site"}</span>
            {conversation.lead_score !== null ? <span className="badge">score {conversation.lead_score}</span> : null}
          </div>
          <p className="text-sm font-black text-[var(--text-1)]">{conversation.summary || conversation.intent || t({ en: "Visitor conversation", ar: "محادثة زائر" })}</p>
          <p className="mt-1 line-clamp-2 text-xs leading-6 text-[var(--text-3)]">
            {lastMessage?.content || conversation.page_path || t({ en: "No message preview", ar: "لا توجد معاينة" })}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <StatusForm id={conversation.id} action={updateAiConversationStatusAction} statuses={["open", "reviewed", "archived"]} current={conversation.status || "open"} />
          <DeleteForm id={conversation.id} action={deleteAiConversationAction} label={t({ en: "Delete chat", ar: "حذف المحادثة" })} />
        </div>
      </div>
      {conversation.messages.length ? (
        <details className="mt-3 rounded-2xl border border-[var(--line)] bg-black/15 p-3">
          <summary className="cursor-pointer text-xs font-black text-[var(--accent)]">{t({ en: "Show messages", ar: "عرض الرسائل" })}</summary>
          <div className="mt-3 grid gap-2">
            {conversation.messages.slice(-6).map((message) => (
              <p key={message.id} className="rounded-xl bg-white/[0.03] p-3 text-xs leading-6 text-[var(--text-2)]">
                <strong className="text-[var(--accent)]">{message.role}: </strong>
                {message.content}
              </p>
            ))}
          </div>
        </details>
      ) : null}
    </article>
  );
}

function EventCard({
  event,
}: {
  event: {
    id: string;
    event_type: string | null;
    source: string | null;
    product_slug: string | null;
    status: string | null;
    priority: string | null;
    error_message: string | null;
    created_at: string;
  };
}) {
  const { t } = useLocale();
  return (
    <article className="rounded-2xl border border-[var(--line)] bg-white/[0.025] p-4">
      <div className="mb-2 flex flex-wrap gap-2">
        <span className="badge">{event.status || "new"}</span>
        <span className="badge">{event.priority || "normal"}</span>
        {event.product_slug ? <span className="badge">{event.product_slug}</span> : null}
      </div>
      <p className="text-sm font-black text-[var(--text-1)]">{event.event_type || t({ en: "Automation event", ar: "حدث أتمتة" })}</p>
      <p className="mt-1 text-xs leading-6 text-[var(--text-3)]">{event.error_message || event.source || new Date(event.created_at).toLocaleString("en-GB")}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <StatusForm id={event.id} action={updateAutomationEventStatusAction} statuses={["new", "reviewed", "archived", "failed"]} current={event.status || "new"} />
      </div>
    </article>
  );
}

function FeedbackCard({ item }: { item: { id: string; rating: string | null; comment: string | null; created_at: string } }) {
  const { t } = useLocale();
  return (
    <article className="rounded-2xl border border-[var(--line)] bg-white/[0.025] p-4">
      <div className="mb-2 flex flex-wrap gap-2">
        <span className="badge">{item.rating || t({ en: "feedback", ar: "تقييم" })}</span>
        <span className="badge">{new Date(item.created_at).toLocaleDateString("en-GB")}</span>
      </div>
      <p className="text-sm leading-6 text-[var(--text-2)]">{item.comment || t({ en: "No comment", ar: "لا يوجد تعليق" })}</p>
      <div className="mt-3">
        <DeleteForm id={item.id} action={deleteAiFeedbackAction} label={t({ en: "Delete feedback", ar: "حذف التقييم" })} />
      </div>
    </article>
  );
}

function AssistantEventCard({
  item,
}: {
  item: {
    key: string;
    updated_at: string;
    value: { locale?: string; message?: string; provider?: string; fallback?: boolean; retentionDays?: number } | null;
  };
}) {
  const { t } = useLocale();
  return (
    <article className="rounded-2xl border border-[var(--line)] bg-white/[0.025] p-4">
      <div className="mb-2 flex flex-wrap gap-2">
        <span className="badge">{item.value?.provider || t({ en: "assistant", ar: "مساعد" })}</span>
        <span className="badge">{item.value?.locale || "locale"}</span>
        <span className="badge">{item.value?.retentionDays ?? 7} {t({ en: "days", ar: "يوم" })}</span>
      </div>
      <p className="line-clamp-2 text-sm leading-6 text-[var(--text-2)]">
        {item.value?.message || t({ en: "Temporary assistant event", ar: "حدث مساعد مؤقت" })}
      </p>
      <form action={deleteAssistantEventAction} className="mt-3">
        <input type="hidden" name="key" value={item.key} />
        <button type="submit" className="btn btn-sm btn-danger">
          <Trash2 className="h-4 w-4" />
          {t({ en: "Delete temp log", ar: "حذف السجل المؤقت" })}
        </button>
      </form>
    </article>
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
  const { t } = useLocale();
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
      <button type="submit" className="btn btn-sm">{t({ en: "Save", ar: "حفظ" })}</button>
    </form>
  );
}

function DeleteForm({
  id,
  action,
  label,
}: {
  id: string;
  action: (formData: FormData) => void | Promise<void>;
  label: string;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="btn btn-sm btn-danger">
        <Trash2 className="h-4 w-4" />
        {label}
      </button>
    </form>
  );
}

function labelForCheck(key: string) {
  const labels: Record<string, string> = {
    automation: "Automation / n8n",
    assistant: "Website assistant",
    app_assistant: "App assistant",
    supabase: "Supabase env",
    smtp: "Email sending",
    weather: "Weather route",
    football: "Football route",
    youtube: "YouTube route",
    config_moplayer: "Classic config",
    download_moplayer: "Classic download",
    config_moplayer2: "Pro config",
    download_moplayer2: "Pro download",
  };
  return labels[key] ?? key.replaceAll("_", " ");
}
