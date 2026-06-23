"use client";

import { ArrowLeft, ArrowRight, Check, Globe, Building2, Smartphone, Monitor, HelpCircle, Send, Loader2, PartyPopper } from "lucide-react";
import { useState } from "react";

import type { Locale } from "@/types/cms";

type Answers = {
  projectType: string;
  goal: string;
  goalTags: string[];
  audience: string;
  features: string[];
  featuresOther: string;
  style: string[];
  colors: string;
  reference: string;
  hasReady: string[];
  oldSite: string;
  name: string;
  contact: string;
  budget: string;
  timeline: string;
  notes: string;
};

const empty: Answers = {
  projectType: "",
  goal: "",
  goalTags: [],
  audience: "",
  features: [],
  featuresOther: "",
  style: [],
  colors: "",
  reference: "",
  hasReady: [],
  oldSite: "",
  name: "",
  contact: "",
  budget: "",
  timeline: "",
  notes: "",
};

const typeIcons: Record<string, typeof Globe> = {
  website: Globe,
  "company-system": Building2,
  "android-app": Smartphone,
  "pc-app": Monitor,
  "not-sure": HelpCircle,
};

const featuresByType: Record<string, { ar: string[]; en: string[] }> = {
  website: {
    ar: ["صفحة تواصل", "معرض أعمال/صور", "متجر وبيع أونلاين", "حجز مواعيد", "خريطة وموقع", "مدوّنة/أخبار", "تسجيل دخول", "دعم لغتين"],
    en: ["Contact page", "Work/photo gallery", "Online store", "Appointment booking", "Map & location", "Blog/news", "Login", "Two languages"],
  },
  "company-system": {
    ar: ["لوحة تحكم", "إدارة عملاء", "تقارير", "صلاحيات مستخدمين", "فواتير", "تكامل مع أنظمة", "إشعارات"],
    en: ["Dashboard", "Customer management", "Reports", "User roles", "Invoices", "Integrations", "Notifications"],
  },
  "android-app": {
    ar: ["تسجيل دخول", "إشعارات", "دفع إلكتروني", "لوحة تحكم", "خرائط", "رفع/مشاركة صور", "دردشة", "يعمل بدون نت"],
    en: ["Login", "Notifications", "Payments", "Dashboard", "Maps", "Photo upload", "Chat", "Offline mode"],
  },
  "pc-app": {
    ar: ["تسجيل دخول", "إشعارات", "تقارير", "لوحة تحكم", "حفظ ملفات", "طباعة", "يعمل بدون نت"],
    en: ["Login", "Notifications", "Reports", "Dashboard", "File saving", "Printing", "Offline mode"],
  },
};

function copyFor(locale: Locale) {
  const isAr = locale === "ar";
  return {
    isAr,
    eyebrow: isAr ? "معالج المشروع" : "Project wizard",
    title: isAr ? "صمّم مشروعك خطوة بخطوة" : "Design your project, step by step",
    lead: isAr
      ? "جاوب على أسئلة بسيطة، وأنا أرتّب فكرتك كاملة وأبدأ بتصميم ما تحتاجه بالضبط. لا تحتاج أي خبرة تقنية."
      : "Answer a few simple questions and I'll shape your idea into a clear brief and start building exactly what you need — no tech experience required.",
    start: isAr ? "ابدأ الآن" : "Start now",
    next: isAr ? "التالي" : "Next",
    back: isAr ? "رجوع" : "Back",
    send: isAr ? "أرسل الطلب" : "Send request",
    sending: isAr ? "جارٍ الإرسال…" : "Sending…",
    step: isAr ? "خطوة" : "Step",
    of: isAr ? "من" : "of",
    optional: isAr ? "(اختياري)" : "(optional)",
    doneTitle: isAr ? "وصلني طلبك! 🎉" : "Got your request! 🎉",
    doneBody: isAr ? "رتّبت كل تفاصيلك وأرسلتها لمحمد. سيتواصل معك شخصياً قريباً لنتفق على التصميم." : "I've organized all your details and sent them to Mohammad. He'll contact you personally soon to align on the design.",
    again: isAr ? "إرسال طلب آخر" : "Send another",
    steps: [
      {
        key: "type",
        title: isAr ? "شو نوع مشروعك؟" : "What do you want to build?",
        hint: isAr ? "اختر الأقرب لفكرتك" : "Pick what's closest to your idea",
        options: [
          { v: "website", ar: "موقع إلكتروني", en: "Website" },
          { v: "company-system", ar: "نظام لشركة", en: "Company system" },
          { v: "android-app", ar: "تطبيق أندرويد", en: "Android app" },
          { v: "pc-app", ar: "تطبيق كمبيوتر", en: "Desktop app" },
          { v: "not-sure", ar: "مش متأكد، ساعدني", en: "Not sure, help me" },
        ],
      },
      {
        key: "idea",
        title: isAr ? "احكِ لي فكرتك" : "Tell me your idea",
        hint: isAr ? "بكلماتك البسيطة — شو بدك يعمل هالمشروع؟" : "In your own words — what should it do?",
        goalTags: isAr
          ? ["أعرّف بنشاطي", "أبيع منتجات", "أستقبل طلبات/حجوزات", "أعرض أعمالي", "أنظّم شغل شركتي"]
          : ["Introduce my business", "Sell products", "Take orders/bookings", "Showcase my work", "Run my company"],
      },
      {
        key: "features",
        title: isAr ? "شو بدك يحتوي؟" : "What should it include?",
        hint: isAr ? "اختر كل اللي بتحتاجه — وما يهمّك إذا ما كنت متأكد" : "Pick what you need — it's fine if you're unsure",
      },
      {
        key: "look",
        title: isAr ? "الشكل والمحتوى" : "Look & content",
        hint: isAr ? "كيف تحب يكون شكله، وشو عندك جاهز" : "How it should look, and what you already have",
      },
      {
        key: "you",
        title: isAr ? "معلوماتك" : "Your details",
        hint: isAr ? "حتى يوصلك ردّي وأتواصل معك" : "So I can reply and reach you",
      },
      {
        key: "review",
        title: isAr ? "مراجعة سريعة" : "Quick review",
        hint: isAr ? "تأكد من طلبك ثم أرسله" : "Check your request, then send",
      },
    ],
    labels: {
      goal: isAr ? "فكرتك" : "Your idea",
      goalPh: isAr ? "مثال: بدي موقع لمطعمي يعرض المنيو ويستقبل طلبات…" : "e.g. I want a site for my restaurant that shows the menu and takes orders…",
      audience: isAr ? "لمين هذا المشروع؟" : "Who is it for?",
      audiencePh: isAr ? "مثال: زبائن محليين، شركات…" : "e.g. local customers, businesses…",
      featuresOther: isAr ? "أي شي تاني تحبه؟" : "Anything else you'd like?",
      style: isAr ? "شو الستايل اللي يعجبك؟" : "Which style do you like?",
      styleOpts: isAr ? ["عصري", "فخم", "بسيط ونظيف", "ملوّن وحيوي"] : ["Modern", "Luxury", "Simple & clean", "Colorful"],
      colors: isAr ? "ألوان تحبها؟" : "Colors you like?",
      colorsPh: isAr ? "مثال: أزرق وأبيض، ذهبي…" : "e.g. blue & white, gold…",
      reference: isAr ? "موقع/تطبيق يعجبك نأخذ منه إلهام؟" : "A site/app you like for inspiration?",
      referencePh: isAr ? "الصق الرابط هنا" : "Paste a link here",
      hasReady: isAr ? "شو جاهز عندك؟" : "What do you have ready?",
      hasReadyOpts: isAr ? ["شعار", "نصوص", "صور", "ولا شي بعد"] : ["Logo", "Texts", "Photos", "Nothing yet"],
      oldSite: isAr ? "عندك موقع/تطبيق قديم؟ (الصق الرابط إن وجد)" : "An old site/app? (paste the link if any)",
      oldSitePh: isAr ? "اتركه فارغاً إذا ما في" : "Leave empty if none",
      name: isAr ? "اسمك" : "Your name",
      namePh: isAr ? "الاسم" : "Name",
      contact: isAr ? "إيميل أو رقم واتساب" : "Email or WhatsApp number",
      contactPh: isAr ? "حتى أتواصل معك" : "So I can reach you",
      budget: isAr ? "ميزانية تقريبية" : "Rough budget",
      budgetOpts: isAr ? ["غير محددة", "محدودة", "متوسطة", "مرنة"] : ["Not set", "Limited", "Medium", "Flexible"],
      timeline: isAr ? "متى تحب تطلق؟" : "When do you want to launch?",
      timelineOpts: isAr ? ["بأسرع وقت", "خلال شهر", "مرن"] : ["ASAP", "Within a month", "Flexible"],
      notes: isAr ? "أي ملاحظة أخيرة؟" : "Any final note?",
    },
  };
}

export function ProjectWizard({ locale }: { locale: Locale }) {
  const t = copyFor(locale);
  const { isAr } = t;
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [a, setA] = useState<Answers>(empty);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const total = t.steps.length;
  const set = (patch: Partial<Answers>) => setA((prev) => ({ ...prev, ...patch }));
  const toggle = (key: "features" | "style" | "hasReady" | "goalTags", value: string) =>
    setA((prev) => ({ ...prev, [key]: prev[key].includes(value) ? prev[key].filter((x) => x !== value) : [...prev[key], value] }));

  const canNext = () => {
    if (step === 0) return Boolean(a.projectType);
    if (step === 1) return Boolean(a.goal.trim() || a.goalTags.length);
    if (step === 4) return Boolean(a.name.trim() && a.contact.trim());
    return true;
  };

  async function submit() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/project-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...a, locale }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error || (isAr ? "تعذّر الإرسال" : "Could not send"));
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : isAr ? "تعذّر الإرسال" : "Could not send");
    } finally {
      setLoading(false);
    }
  }

  const features = a.projectType && featuresByType[a.projectType] ? featuresByType[a.projectType][locale] : featuresByType.website[locale];
  const cur = t.steps[step] as {
    key: string;
    title: string;
    hint: string;
    options?: Array<{ v: string; ar: string; en: string }>;
    goalTags?: string[];
  };
  const typeOptions = (t.steps[0] as { options?: Array<{ v: string; ar: string; en: string }> }).options ?? [];
  const selectedTypeLabel = typeOptions.find((o) => o.v === a.projectType)?.[isAr ? "ar" : "en"] ?? "—";

  if (done) {
    return (
      <section className="pw-card pw-done" dir={isAr ? "rtl" : "ltr"}>
        <span className="pw-done-icon"><PartyPopper size={30} /></span>
        <h3>{t.doneTitle}</h3>
        <p>{t.doneBody}</p>
        <button type="button" className="pw-btn pw-btn-ghost" onClick={() => { setA(empty); setStep(0); setDone(false); setStarted(false); }}>
          {t.again}
        </button>
      </section>
    );
  }

  if (!started) {
    return (
      <section className="pw-card pw-intro" dir={isAr ? "rtl" : "ltr"}>
        <span className="pw-eyebrow">{t.eyebrow}</span>
        <h2 className="pw-title">{t.title}</h2>
        <p className="pw-lead">{t.lead}</p>
        <button type="button" className="pw-btn pw-btn-primary pw-start" onClick={() => setStarted(true)}>
          {t.start} <ArrowRight className="pw-rtl-flip" size={18} />
        </button>
      </section>
    );
  }

  const Next = isAr ? ArrowLeft : ArrowRight;
  const Back = isAr ? ArrowRight : ArrowLeft;

  return (
    <section className="pw-card" dir={isAr ? "rtl" : "ltr"}>
      <div className="pw-progress" aria-hidden>
        <div className="pw-progress-bar" style={{ width: `${((step + 1) / total) * 100}%` }} />
      </div>
      <p className="pw-step-meta">{t.step} {step + 1} {t.of} {total}</p>
      <h3 className="pw-step-title">{cur.title}</h3>
      <p className="pw-step-hint">{cur.hint}</p>

      <div className="pw-body">
        {cur.key === "type" && (
          <div className="pw-grid">
            {cur.options!.map((o) => {
              const Icon = typeIcons[o.v];
              return (
                <button key={o.v} type="button" className={a.projectType === o.v ? "pw-card-opt pw-on" : "pw-card-opt"} onClick={() => set({ projectType: o.v })}>
                  <Icon size={22} />
                  <span>{isAr ? o.ar : o.en}</span>
                </button>
              );
            })}
          </div>
        )}

        {cur.key === "idea" && (
          <div className="pw-fields">
            <div className="pw-chips">
              {cur.goalTags!.map((g) => (
                <button key={g} type="button" className={a.goalTags.includes(g) ? "pw-chip pw-on" : "pw-chip"} onClick={() => toggle("goalTags", g)}>{g}</button>
              ))}
            </div>
            <label className="pw-field">
              <span>{t.labels.goal}</span>
              <textarea rows={3} value={a.goal} onChange={(e) => set({ goal: e.target.value })} placeholder={t.labels.goalPh} />
            </label>
            <label className="pw-field">
              <span>{t.labels.audience} <i>{t.optional}</i></span>
              <input value={a.audience} onChange={(e) => set({ audience: e.target.value })} placeholder={t.labels.audiencePh} />
            </label>
          </div>
        )}

        {cur.key === "features" && (
          <div className="pw-fields">
            <div className="pw-chips">
              {features.map((f) => (
                <button key={f} type="button" className={a.features.includes(f) ? "pw-chip pw-on" : "pw-chip"} onClick={() => toggle("features", f)}>
                  {a.features.includes(f) && <Check size={13} />} {f}
                </button>
              ))}
            </div>
            <label className="pw-field">
              <span>{t.labels.featuresOther} <i>{t.optional}</i></span>
              <input value={a.featuresOther} onChange={(e) => set({ featuresOther: e.target.value })} />
            </label>
          </div>
        )}

        {cur.key === "look" && (
          <div className="pw-fields">
            <span className="pw-mini">{t.labels.style}</span>
            <div className="pw-chips">
              {t.labels.styleOpts.map((s2) => (
                <button key={s2} type="button" className={a.style.includes(s2) ? "pw-chip pw-on" : "pw-chip"} onClick={() => toggle("style", s2)}>{s2}</button>
              ))}
            </div>
            <label className="pw-field">
              <span>{t.labels.colors} <i>{t.optional}</i></span>
              <input value={a.colors} onChange={(e) => set({ colors: e.target.value })} placeholder={t.labels.colorsPh} />
            </label>
            <label className="pw-field">
              <span>{t.labels.reference} <i>{t.optional}</i></span>
              <input value={a.reference} onChange={(e) => set({ reference: e.target.value })} placeholder={t.labels.referencePh} />
            </label>
            <span className="pw-mini">{t.labels.hasReady}</span>
            <div className="pw-chips">
              {t.labels.hasReadyOpts.map((h) => (
                <button key={h} type="button" className={a.hasReady.includes(h) ? "pw-chip pw-on" : "pw-chip"} onClick={() => toggle("hasReady", h)}>{h}</button>
              ))}
            </div>
            <label className="pw-field">
              <span>{t.labels.oldSite} <i>{t.optional}</i></span>
              <input value={a.oldSite} onChange={(e) => set({ oldSite: e.target.value })} placeholder={t.labels.oldSitePh} />
            </label>
          </div>
        )}

        {cur.key === "you" && (
          <div className="pw-fields">
            <label className="pw-field">
              <span>{t.labels.name}</span>
              <input value={a.name} onChange={(e) => set({ name: e.target.value })} placeholder={t.labels.namePh} />
            </label>
            <label className="pw-field">
              <span>{t.labels.contact}</span>
              <input value={a.contact} onChange={(e) => set({ contact: e.target.value })} placeholder={t.labels.contactPh} />
            </label>
            <span className="pw-mini">{t.labels.budget} <i>{t.optional}</i></span>
            <div className="pw-chips">
              {t.labels.budgetOpts.map((b) => (
                <button key={b} type="button" className={a.budget === b ? "pw-chip pw-on" : "pw-chip"} onClick={() => set({ budget: a.budget === b ? "" : b })}>{b}</button>
              ))}
            </div>
            <span className="pw-mini">{t.labels.timeline} <i>{t.optional}</i></span>
            <div className="pw-chips">
              {t.labels.timelineOpts.map((b) => (
                <button key={b} type="button" className={a.timeline === b ? "pw-chip pw-on" : "pw-chip"} onClick={() => set({ timeline: a.timeline === b ? "" : b })}>{b}</button>
              ))}
            </div>
            <label className="pw-field">
              <span>{t.labels.notes} <i>{t.optional}</i></span>
              <textarea rows={2} value={a.notes} onChange={(e) => set({ notes: e.target.value })} />
            </label>
          </div>
        )}

        {cur.key === "review" && (
          <ul className="pw-review">
            {([
              [t.steps[0].title, selectedTypeLabel],
              [t.labels.goal, a.goal || a.goalTags.join("، ") || "—"],
              [t.labels.audience, a.audience || "—"],
              [t.steps[2].title, [...a.features, a.featuresOther].filter(Boolean).join("، ") || "—"],
              [t.labels.style, [a.style.join("، "), a.colors].filter(Boolean).join(" · ") || "—"],
              [t.labels.name, a.name || "—"],
              [t.labels.contact, a.contact || "—"],
            ] as Array<[string, string]>).map(([k, v], i) => (
              <li key={i}><strong>{k}</strong><span>{v}</span></li>
            ))}
          </ul>
        )}
      </div>

      {error ? <p className="pw-error">{error}</p> : null}

      <div className="pw-nav">
        {step > 0 ? (
          <button type="button" className="pw-btn pw-btn-ghost" onClick={() => setStep((s2) => s2 - 1)} disabled={loading}>
            <Back size={16} /> {t.back}
          </button>
        ) : <span />}
        {step < total - 1 ? (
          <button type="button" className="pw-btn pw-btn-primary" onClick={() => setStep((s2) => s2 + 1)} disabled={!canNext()}>
            {t.next} <Next size={16} />
          </button>
        ) : (
          <button type="button" className="pw-btn pw-btn-primary" onClick={submit} disabled={loading}>
            {loading ? <><Loader2 className="pw-spin" size={16} /> {t.sending}</> : <><Send size={16} /> {t.send}</>}
          </button>
        )}
      </div>
    </section>
  );
}
