"use client";

import { Send } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { budgetRanges, contactMessageSchema, projectTypes, timelines, type ContactMessageInput } from "@/lib/contact-schema";
import { cn } from "@/lib/cn";
import { repairMojibakeDeep } from "@/lib/text-cleanup";

type FormValues = Omit<ContactMessageInput, "consent"> & { consent: boolean };

type SubmitState =
  | { status: "idle" | "sending" | "success"; message?: string; fieldErrors?: Partial<Record<keyof FormValues, string>> }
  | { status: "error"; message: string; fieldErrors?: Partial<Record<keyof FormValues, string>> };

const copy = {
  en: {
    title: "Project inquiry",
    hint: "Pick the request type first so the form can stay focused.",
    name: "Name",
    email: "Email",
    whatsapp: "WhatsApp, optional",
    projectType: "Project type",
    budgetRange: "Budget range",
    timeline: "Timeline",
    message: "Project brief",
    namePh: "Your full name",
    emailPh: "you@example.com",
    whatsappPh: "+49 ...",
    messagePh: "Tell me what exists now, what needs to change, and what outcome matters most.",
    consent: "I agree that Mohammad may use the submitted information only to reply to this request.",
    submit: "Send inquiry",
    sending: "Sending...",
    success: "Message sent successfully. The request is now ready for follow-up.",
    error: "The message could not be sent. Please review the form and try again.",
    privacy: "Only send information that is actually needed to understand the request.",
    newMessage: "Send another inquiry",
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
      email: "Please enter a valid email address.",
      projectType: "Choose a project type.",
      budgetRange: "Choose a budget range.",
      timeline: "Choose a timeline.",
      message: "Please write at least 20 characters.",
      consent: "Consent is required before sending.",
    },
  },
  ar: {
    title: "طلب مشروع",
    hint: "اختر نوع الطلب أولاً حتى يبقى النموذج واضحاً ومختصراً.",
    name: "الاسم",
    email: "البريد الإلكتروني",
    whatsapp: "واتساب، اختياري",
    projectType: "نوع الطلب",
    budgetRange: "نطاق الميزانية",
    timeline: "المدة الزمنية",
    message: "تفاصيل الطلب",
    namePh: "اسمك الكامل",
    emailPh: "you@example.com",
    whatsappPh: "+49 ...",
    messagePh: "اشرح ما الموجود حالياً، ما الذي يحتاج تغييراً، وما النتيجة الأهم بالنسبة لك.",
    consent: "أوافق على أن يستخدم محمد المعلومات المرسلة فقط للرد على هذا الطلب.",
    submit: "إرسال الطلب",
    sending: "جارٍ الإرسال...",
    success: "تم إرسال الرسالة بنجاح، وأصبح الطلب جاهزاً للمتابعة.",
    error: "تعذر إرسال الرسالة. راجع النموذج ثم حاول مرة أخرى.",
    privacy: "أرسل فقط المعلومات اللازمة فعلاً لفهم الطلب.",
    newMessage: "إرسال طلب جديد",
    continue: "متابعة",
    back: "رجوع",
    projectTypes: {
      website: "موقع / حضور رقمي",
      product: "صفحة منتج أو تطبيق",
      moplayer: "دعم MoPlayer",
      "case-study": "دراسة حالة / معرض أعمال",
      consulting: "استشارة",
      other: "أخرى",
    },
    budgetRanges: {
      "not-sure": "غير محددة بعد",
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
      email: "اكتب بريداً إلكترونياً صحيحاً.",
      projectType: "اختر نوع الطلب.",
      budgetRange: "اختر نطاق الميزانية.",
      timeline: "اختر المدة الزمنية.",
      message: "اكتب رسالة لا تقل عن 20 حرفاً.",
      consent: "الموافقة مطلوبة قبل الإرسال.",
    },
  },
} as const;

const inputClass = "fresh-input text-base placeholder:text-[var(--text-4)]";

export function LiquidContactForm({ locale }: { locale: "ar" | "en" }) {
  const t = repairMojibakeDeep(copy[locale]);
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

  function fieldMessage(key: keyof FormValues) {
    if (key in t.validation) return t.validation[key as keyof typeof t.validation];
    return t.error;
  }

  async function onSubmit(values: FormValues) {
    setState({ status: "idle" });
    const parsed = contactMessageSchema.safeParse({ ...values, locale, consent: values.consent === true });

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FormValues | undefined;
        if (key) setError(key, { message: fieldMessage(key) });
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
          <div className="rounded-[1rem] border border-blue-400/25 bg-blue-500/10 px-4 py-3 text-sm text-blue-100">{state.message}</div>
        ) : state.status === "error" ? (
          <div className="rounded-[1rem] border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">{state.message}</div>
        ) : null}
      </div>

      {step === 1 ? (
        <div className="space-y-5">
          <div>
            <h2 className="text-base font-black text-[var(--text-1)]">{t.title}</h2>
            <p className="mt-1 text-sm text-[var(--text-3)]">{t.hint}</p>
          </div>
          <Field label={t.projectType} error={errors.projectType?.message}>
            <select className="fresh-input" aria-invalid={Boolean(errors.projectType)} {...register("projectType")}>
              {projectTypes.map((value) => (
                <option key={value} value={value}>
                  {t.projectTypes[value]}
                </option>
              ))}
            </select>
          </Field>
          <button type="button" className="fresh-button fresh-button-primary min-w-[180px] justify-center" onClick={() => setStep(2)}>
            {t.continue}
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button type="button" className="text-sm font-bold text-[var(--brand-blue)] hover:underline" onClick={() => setStep(1)}>
              {t.back}
            </button>
            <p className="text-xs text-[var(--text-3)]">
              {t.projectType}:{" "}
              <span className="font-bold text-[var(--text-2)]">{t.projectTypes[selectedProjectType as keyof typeof t.projectTypes]}</span>
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label={t.name} error={errors.name?.message}>
              <input className={inputClass} placeholder={t.namePh} autoComplete="name" aria-invalid={Boolean(errors.name)} {...register("name")} />
            </Field>
            <Field label={t.email} error={errors.email?.message}>
              <input className={inputClass} type="email" placeholder={t.emailPh} autoComplete="email" aria-invalid={Boolean(errors.email)} {...register("email")} />
            </Field>
          </div>

          <Field label={t.whatsapp} error={errors.whatsapp?.message}>
            <input className={inputClass} placeholder={t.whatsappPh} autoComplete="tel" aria-invalid={Boolean(errors.whatsapp)} {...register("whatsapp")} />
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label={t.budgetRange} error={errors.budgetRange?.message}>
              <select className="fresh-input" aria-invalid={Boolean(errors.budgetRange)} {...register("budgetRange")}>
                {budgetRanges.map((value) => (
                  <option key={value} value={value}>
                    {t.budgetRanges[value]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t.timeline} error={errors.timeline?.message}>
              <select className="fresh-input" aria-invalid={Boolean(errors.timeline)} {...register("timeline")}>
                {timelines.map((value) => (
                  <option key={value} value={value}>
                    {t.timelines[value]}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label={t.message} error={errors.message?.message}>
            <textarea className={cn("fresh-textarea", inputClass)} rows={6} placeholder={t.messagePh} aria-invalid={Boolean(errors.message)} {...register("message")} />
          </Field>

          <label className="fresh-note text-sm leading-7">
            <input type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-[var(--brand-blue)]" {...register("consent")} />
            <span>
              {t.consent}
              {errors.consent ? <span className="mt-1 block text-xs text-red-300">{errors.consent.message}</span> : null}
            </span>
          </label>

          <p className="text-xs leading-6 text-[var(--text-3)]">{t.privacy}</p>

          <div className="flex flex-wrap gap-3">
            <button type="submit" className="fresh-button fresh-button-primary min-w-[180px] justify-center" disabled={disabled}>
              <Send className="h-4 w-4" />
              {disabled ? t.sending : t.submit}
            </button>
            {state.status === "success" ? (
              <button
                type="button"
                className="fresh-button"
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

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="fresh-field">
      <span className="fresh-field-label">{label}</span>
      {children}
      {error ? <p className="text-xs text-red-300">{error}</p> : null}
    </label>
  );
}
