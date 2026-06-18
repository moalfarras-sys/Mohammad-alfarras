"use client";

import Link from "next/link";
import { Bot, ImageIcon, Megaphone, MonitorPlay, Search, Send, Sparkles, X } from "lucide-react";
import { useMemo, useState } from "react";

import { useLocale } from "@/components/admin/locale-provider";

type HelperAnswer = {
  title: string;
  body: string;
  links: ReadonlyArray<{ href: string; label: string }>;
};

const topics = [
  {
    keys: ["صورة", "صور", "image", "logo", "hero", "banner", "معرض", "gallery"],
    icon: ImageIcon,
    ar: {
      title: "تغيير الصور",
      body: "لتغيير صور الموقع افتح إدارة الموقع ثم مكتبة الصور أو الهوية. لتغيير صور MoPlayer أو Pro افتح صفحة التطبيق، ستجد خريطة الصور، ثم ارفع بديل واحفظ. لا تحتاج تكتب مسار إلا إذا فتحت Advanced.",
      links: [
        { href: "/website#media", label: "مكتبة صور الموقع" },
        { href: "/website#brand", label: "صور الهوية" },
        { href: "/moplayer/classic#product-content", label: "صور MoPlayer" },
        { href: "/moplayer/pro#product-content", label: "صور Pro" },
        { href: "/moplayer/ios#ios-images", label: "صور iOS" },
      ],
    },
    en: {
      title: "Change images",
      body: "For website images, open Website then Media or Brand. For MoPlayer/Pro images, open the app page, use the image map, upload a replacement, then save. You do not need paths unless you open Advanced.",
      links: [
        { href: "/website#media", label: "Website media" },
        { href: "/website#brand", label: "Brand images" },
        { href: "/moplayer/classic#product-content", label: "MoPlayer images" },
        { href: "/moplayer/pro#product-content", label: "Pro images" },
        { href: "/moplayer/ios#ios-images", label: "iOS image" },
      ],
    },
  },
  {
    keys: ["عرض", "عروض", "offer", "promo", "banner", "حملة"],
    icon: Megaphone,
    ar: {
      title: "إدارة العروض",
      body: "العروض موجودة داخل إدارة الموقع. أضف عرضاً، اختر أين يظهر، اختر الشكل، ارفع صورة، واحفظ. إذا أردت إخفاء العرض أطفئ Show offer بدل الحذف.",
      links: [
        { href: "/website#offers", label: "عروض الموقع" },
        { href: "/website#media", label: "رفع صورة للعرض" },
      ],
    },
    en: {
      title: "Manage offers",
      body: "Offers live in Website control. Add an offer, choose where it appears, choose the style, upload an image, and save. Turn Show offer off to hide it without deleting.",
      links: [
        { href: "/website#offers", label: "Website offers" },
        { href: "/website#media", label: "Upload offer image" },
      ],
    },
  },
  {
    keys: ["تطبيق", "موبلير", "moplayer", "pro", "apk", "اصدار", "إصدار", "تحميل"],
    icon: MonitorPlay,
    ar: {
      title: "إدارة التطبيقات",
      body: "كل تطبيق له صفحة منفصلة. MoPlayer Classic لا يخلط مع Pro. ابدأ من بطاقات مركز التحكم: التشغيل، الإصدارات، الأجهزة، الصور والصفحة.",
      links: [
        { href: "/moplayer/classic#runtime", label: "تشغيل Classic" },
        { href: "/moplayer/classic#releases", label: "إصدارات Classic" },
        { href: "/moplayer/pro#runtime", label: "تشغيل Pro" },
        { href: "/moplayer/pro#releases", label: "إصدارات Pro" },
        { href: "/moplayer/ios#ios-runtime", label: "صفحة iOS" },
      ],
    },
    en: {
      title: "Manage apps",
      body: "Each app has its own page. Classic does not mix with Pro. Start from the control cards: runtime, releases, devices, images and page.",
      links: [
        { href: "/moplayer/classic#runtime", label: "Classic runtime" },
        { href: "/moplayer/classic#releases", label: "Classic releases" },
        { href: "/moplayer/pro#runtime", label: "Pro runtime" },
        { href: "/moplayer/pro#releases", label: "Pro releases" },
        { href: "/moplayer/ios#ios-runtime", label: "iOS page" },
      ],
    },
  },
  {
    keys: ["ai", "مساعد", "شرح", "help", "مساعدة"],
    icon: Bot,
    ar: {
      title: "المساعد",
      body: "استخدم المساعد ليفهمك أين تغيّر الصور، العروض، تشغيل التطبيقات، أو الإصدارات. لا تحتاج تحفظ أي شيء من هنا.",
      links: [
        { href: "/ai", label: "AI" },
        { href: "/website#offers", label: "العروض" },
        { href: "/moplayer/pro#product-content", label: "صور Pro" },
        { href: "/moplayer/ios#ios-images", label: "صور iOS" },
      ],
    },
    en: {
      title: "Assistant",
      body: "Use the helper to understand where to change images, offers, app runtime, or releases. You do not need to save anything here.",
      links: [
        { href: "/ai", label: "AI" },
        { href: "/website#offers", label: "Offers" },
        { href: "/moplayer/pro#product-content", label: "Pro images" },
        { href: "/moplayer/ios#ios-images", label: "iOS image" },
      ],
    },
  },
] as const;

function answerQuestion(input: string, locale: "ar" | "en"): HelperAnswer {
  const normalized = input.trim().toLowerCase();
  const topic = topics.find((item) => item.keys.some((key) => normalized.includes(key.toLowerCase())));
  if (topic) return topic[locale];
  return locale === "ar"
    ? {
        title: "أفضل طريقة للإدارة",
        body: "ابدأ من الصفحة الرئيسية للأدمن. إذا كان الشيء يظهر على الموقع افتح Website. إذا يخص تطبيقاً افتح MoPlayer أو Pro. إذا أردت شرحاً سريعاً افتح AI.",
        links: [
          { href: "/", label: "لوحة التحكم" },
          { href: "/website", label: "إدارة الموقع" },
          { href: "/moplayer", label: "مركز MoPlayer" },
          { href: "/moplayer/pro", label: "إدارة Pro" },
          { href: "/ai", label: "AI" },
        ],
      }
    : {
        title: "Best admin path",
        body: "Start from Overview. If it appears on the website, open Website. If it belongs to an app, open MoPlayer or Pro. For quick guidance, open AI.",
        links: [
          { href: "/", label: "Overview" },
          { href: "/website", label: "Website control" },
          { href: "/moplayer", label: "MoPlayer suite" },
          { href: "/moplayer/pro", label: "Pro control" },
          { href: "/ai", label: "AI inbox" },
        ],
      };
}

export function AdminHelperWidget() {
  const { locale, t } = useLocale();
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<HelperAnswer>(() => answerQuestion("", locale));
  const quickQuestions = useMemo(
    () =>
      locale === "ar"
        ? ["كيف أغير صور Pro؟", "كيف أضيف عرض؟", "أين رسائل AI؟", "كيف أنشر APK؟"]
        : ["How do I change Pro images?", "How do I add an offer?", "Where are AI messages?", "How do I publish an APK?"],
    [locale],
  );

  function ask(value: string) {
    setQuestion(value);
    setAnswer(answerQuestion(value, locale));
    setOpen(true);
  }

  return (
    <aside className={open ? "admin-helper admin-helper-open" : "admin-helper"} aria-label={t({ en: "Admin helper", ar: "مساعد الأدمن" })}>
      {open ? (
        <section className="admin-helper-panel">
          <header>
            <span>
              <Bot className="h-4 w-4" />
            </span>
            <strong>{t({ en: "Ask the admin helper", ar: "اسأل مساعد الأدمن" })}</strong>
            <button type="button" onClick={() => setOpen(false)} aria-label={t({ en: "Close helper", ar: "إغلاق المساعد" })}>
              <X className="h-4 w-4" />
            </button>
          </header>
          <div className="admin-helper-body">
            <div className="admin-helper-search">
              <Search className="h-4 w-4" />
              <input
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder={t({ en: "Ask: where do I change images?", ar: "اسأل: وين أغير الصور؟" })}
              />
              <button type="button" onClick={() => setAnswer(answerQuestion(question, locale))}>
                <Send className="h-4 w-4" />
              </button>
            </div>
            <div className="admin-helper-answer">
              <p className="admin-helper-kicker">
                <Sparkles className="h-3.5 w-3.5" />
                {t({ en: "Suggested path", ar: "المسار المقترح" })}
              </p>
              <h3>{answer.title}</h3>
              <p>{answer.body}</p>
              <div>
                {answer.links.map((link) => (
                  <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="admin-helper-chips">
              {quickQuestions.map((item) => (
                <button key={item} type="button" onClick={() => ask(item)}>
                  {item}
                </button>
              ))}
            </div>
          </div>
        </section>
      ) : null}
      <button type="button" className="admin-helper-fab" onClick={() => setOpen((value) => !value)}>
        <Bot className="h-4 w-4" />
        {t({ en: "Help", ar: "مساعدة" })}
      </button>
    </aside>
  );
}
