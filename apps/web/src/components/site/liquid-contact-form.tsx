"use client";

import { Send } from "lucide-react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import {
  budgetRanges,
  contactMessageSchema,
  projectTypes,
  timelines,
  type ContactMessageInput,
} from "@/lib/contact-schema";
import { cn } from "@/lib/cn";

type FormValues = Omit<ContactMessageInput, "consent"> & {
  consent: boolean;
};

type SubmitState =
  | { status: "idle" | "sending" | "success"; message?: string; fieldErrors?: Partial<Record<keyof FormValues, string>> }
  | { status: "error"; message: string; fieldErrors?: Partial<Record<keyof FormValues, string>> };

const copy = {
  en: {
    name: "Name",
    namePh: "Your full name",
    email: "Email",
    emailPh: "you@example.com",
    whatsapp: "WhatsApp, optional",
    whatsappPh: "+49 ...",
    projectType: "Project type",
    budgetRange: "Budget range",
    timeline: "Timeline",
    message: "Message",
    messagePh: "Tell me what exists, what needs to change, and what the first useful outcome should be.",
    consent:
      "I agree that Mohammad may use my submitted information to respond to this request. I understand this is not a public comment.",
    submit: "Send message",
    sending: "Sending...",
    success: "Message sent. The request is now available for follow-up.",
    error: "The message could not be sent. Please review the fields or try again.",
    privacy: "Privacy note: only send information needed to evaluate the request.",
    newMessage: "Send another message",
    step1Title: "What kind of request is this?",
    step1Hint: "Choose a category so the right details show next.",
    continue: "Continue",
    back: "Back",
    projectTypes: {
      website: "Website / digital presence",
      product: "Product or app surface",
      moplayer: "MoPlayer support",
      "case-study": "Case study / portfolio",
      consulting: "Consulting",
      other: "Other",
    },
    budgetRanges: {
      "not-sure": "Not sure yet",
      "under-1000": "Under EUR 1,000",
      "1000-3000": "EUR 1,000 - 3,000",
      "3000-7000": "EUR 3,000 - 7,000",
      "7000-plus": "EUR 7,000+",
    },
    timelines: {
      "this-month": "This month",
      "one-three-months": "1-3 months",
      flexible: "Flexible",
      "support-only": "Support only",
    },
    validation: {
      name: "Please enter your name.",
      email: "Please enter a valid email.",
      projectType: "Choose a project type.",
      budgetRange: "Choose a budget range.",
      timeline: "Choose a timeline.",
      message: "Write at least 20 characters.",
      consent: "Consent is required before sending.",
    },
  },
  ar: {
    name: "الاسم",
    namePh: "اسمك الكامل",
    email: "البريد الإلكتروني",
    emailPh: "you@example.com",
    whatsapp: "واتساب، اختياري",
    whatsappPh: "+49 ...",
    projectType: "نوع المشروع",
    budgetRange: "نطاق الميزانية",
    timeline: "الجدول الزمني",
    message: "الرسالة",
    messagePh: "اكتب ما الموجود حالياً، ما الذي يحتاج تغييراً، وما أول نتيجة مفيدة تريد الوصول إليها.",
    consent:
      "أوافق على أن يستخدم محمد المعلومات التي أرسلها للرد على هذا الطلب فقط. أفهم أن هذه الرسالة ليست تعليقاً عاماً.",
    submit: "إرسال الرسالة",
    sending: "جارٍ الإرسال...",
    success: "تم إرسال الرسالة. الطلب أصبح جاهزاً للمتابعة.",
    error: "تعذر إرسال الرسالة. راجع الحقول أو حاول مرة أخرى.",
    privacy: "ملاحظة خصوصية: أرسل فقط المعلومات اللازمة لتقييم الطلب.",
    newMessage: "إرسال رسالة جديدة",
    step1Title: "ما نوع الطلب؟",
    step1Hint: "اختر الفئة لنعرض الحقول المناسبة في الخطوة التالية.",
    continue: "متابعة",
    back: "رجوع",
    projectTypes: {
      website: "موقع / حضور رقمي",
      product: "صفحة منتج أو تطبيق",
      moplayer: "دعم MoPlayer",
      "case-study": "دراسة حالة / بورتفوليو",
      consulting: "استشارة",
      other: "أخرى",
    },
    budgetRanges: {
      "not-sure": "غير محدد بعد",
      "under-1000": "أقل من 1,000 يورو",
      "1000-3000": "1,000 - 3,000 يورو",
      "3000-7000": "3,000 - 7,000 يورو",
      "7000-plus": "أكثر من 7,000 يورو",
    },
    timelines: {
      "this-month": "هذا الشهر",
      "one-three-months": "من شهر إلى ثلاثة أشهر",
      flexible: "مرن",
      "support-only": "دعم فقط",
    },
    validation: {
      name: "اكتب اسمك.",
      email: "اكتب بريداً صحيحاً.",
      projectType: "اختر نوع المشروع.",
      budgetRange: "اختر نطاق الميزانية.",
      timeline: "اختر الجدول الزمني.",
      message: "اكتب رسالة لا تقل عن 20 حرفاً.",
      consent: "الموافقة مطلوبة قبل الإرسال.",
    },
  },
} as const;

const inputClass =
  "w-full min-h-12 rounded-[var(--radius-md)] border border-[var(--glass-border)] bg-[var(--bg-elevated)] px-4 py-3 text-base text-[var(--text-1)] outline-none transition placeholder:text-[var(--text-3)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]";

export function LiquidContactForm({ locale }: { locale: "ar" | "en" }) {
  const t = copy[locale];
  const [state, setState] = useState<SubmitState>({ status: "idle" });
  const [step, setStep] = useState<1 | 2>(1);
  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    shouldUnregister: false,
    defaultValues: {
      name: "",
      email: "",
      whatsapp: "",
      projectType: "website",
      budgetRange: "not-sure",
      timeline: "flexible",
      message: "",
      consent: false,
      honeypot: "",
      locale,
      subject: "",
    },
  });

  const selectedProjectType = useWatch({ control, name: "projectType" }) ?? "website";

  async function onSubmit(values: FormValues) {
    setState({ status: "idle" });
    const parsed = contactMessageSchema.safeParse({ ...values, locale, consent: values.consent === true });

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FormValues | undefined;
        if (key) {
          setError(key, { message: fieldMessage(key) });
        }
      }
      setState({ status: "error", message: t.error });
      return;
    }

    setState({ status: "sending" });

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = (await response.json().catch(() => null)) as
        | { error?: string; fieldErrors?: Partial<Record<keyof FormValues, string>> }
        | null;

      if (!response.ok) {
        if (data?.fieldErrors) {
          for (const [key, message] of Object.entries(data.fieldErrors)) {
            setError(key as keyof FormValues, { message });
          }
        }
        throw new Error(data?.error || t.error);
      }

      reset();
      setStep(1);
      setState({ status: "success", message: t.success });
    } catch (error) {
      setState({ status: "error", message: error instanceof Error ? error.message : t.error });
    }
  }

  function fieldMessage(key: keyof FormValues) {
    if (key in t.validation) return t.validation[key as keyof typeof t.validation];
    return t.error;
  }

  const disabled = state.status === "sending";

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="sr-only" aria-hidden>
        <label>
          Company website
          <input tabIndex={-1} autoComplete="off" {...register("honeypot")} />
        </label>
      </div>

      <div className="min-h-[56px]" aria-live="polite" aria-atomic="true">
        {state.status === "success" ? (
          <div className="rounded-[var(--radius-md)] border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            {state.message}
          </div>
        ) : state.status === "error" ? (
          <div className="rounded-[var(--radius-md)] border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {state.message}
          </div>
        ) : null}
      </div>

      {step === 1 ? (
        <div className="space-y-5">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-1)]">{t.step1Title}</h2>
            <p className="mt-1 text-sm text-[var(--text-3)]">{t.step1Hint}</p>
          </div>
          <Field label={t.projectType} error={errors.projectType?.message}>
            <select className={inputClass} aria-invalid={Boolean(errors.projectType)} {...register("projectType")}>
              {projectTypes.map((value) => (
                <option key={value} value={value}>
                  {t.projectTypes[value]}
                </option>
              ))}
            </select>
          </Field>
          <button
            type="button"
            className="button-liquid-primary min-w-[180px] justify-center"
            onClick={() => setStep(2)}
          >
            {t.continue}
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button type="button" className="text-sm font-medium text-[var(--accent)] hover:underline" onClick={() => setStep(1)}>
              ← {t.back}
            </button>
            <p className="text-xs text-[var(--text-3)]">
              {t.projectType}:{" "}
              <span className="font-medium text-[var(--text-2)]">
                {t.projectTypes[selectedProjectType as keyof typeof t.projectTypes]}
              </span>
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label={t.name} error={errors.name?.message}>
              <input className={inputClass} placeholder={t.namePh} autoComplete="name" aria-invalid={Boolean(errors.name)} {...register("name")} />
            </Field>
            <Field label={t.email} error={errors.email?.message}>
              <input
                className={inputClass}
                type="email"
                placeholder={t.emailPh}
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
                {...register("email")}
              />
            </Field>
          </div>

          <Field label={t.whatsapp} error={errors.whatsapp?.message}>
            <input className={inputClass} placeholder={t.whatsappPh} autoComplete="tel" aria-invalid={Boolean(errors.whatsapp)} {...register("whatsapp")} />
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label={t.budgetRange} error={errors.budgetRange?.message}>
              <select className={inputClass} aria-invalid={Boolean(errors.budgetRange)} {...register("budgetRange")}>
                {budgetRanges.map((value) => (
                  <option key={value} value={value}>
                    {t.budgetRanges[value]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t.timeline} error={errors.timeline?.message}>
              <select className={inputClass} aria-invalid={Boolean(errors.timeline)} {...register("timeline")}>
                {timelines.map((value) => (
                  <option key={value} value={value}>
                    {t.timelines[value]}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label={t.message} error={errors.message?.message}>
            <textarea
              className={cn(inputClass, "min-h-40 resize-y")}
              rows={6}
              placeholder={t.messagePh}
              aria-invalid={Boolean(errors.message)}
              {...register("message")}
            />
          </Field>

          <label className="flex gap-3 rounded-[var(--radius-md)] border border-[var(--glass-border)] bg-[var(--bg-elevated)] p-4 text-sm leading-7 text-[var(--text-2)]">
            <input type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-[var(--accent)]" {...register("consent")} />
            <span>
              {t.consent}
              {errors.consent ? <span className="mt-1 block text-xs text-red-300">{errors.consent.message}</span> : null}
            </span>
          </label>

          <p className="text-xs leading-6 text-[var(--text-3)]">{t.privacy}</p>

          <div className="flex flex-wrap gap-3">
            <button type="submit" className="button-liquid-primary min-w-[180px] justify-center" disabled={disabled}>
              <Send className="h-4 w-4" />
              {disabled ? t.sending : t.submit}
            </button>
            {state.status === "success" ? (
              <button
                type="button"
                className="button-liquid-secondary"
                onClick={() => {
                  setState({ status: "idle" });
                  setStep(1);
                }}
              >
                {t.newMessage}
              </button>
            ) : null}
          </div>
        </>
      )}
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-[var(--text-2)]">{label}</span>
      {children}
      {error ? <p className="text-xs text-red-300">{error}</p> : null}
    </label>
  );
}
