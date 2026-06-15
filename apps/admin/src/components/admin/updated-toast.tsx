"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";

import { useLocale } from "@/components/admin/locale-provider";

const MESSAGES: Record<string, { en: string; ar: string; error?: boolean }> = {
  product: { en: "Product content saved.", ar: "تم حفظ محتوى المنتج." },
  faq: { en: "FAQ saved.", ar: "تم حفظ السؤال." },
  faq_deleted: { en: "FAQ deleted.", ar: "تم حذف السؤال." },
  screenshot: { en: "Visual asset saved.", ar: "تم حفظ الصورة." },
  screenshot_deleted: { en: "Visual asset deleted.", ar: "تم حذف الصورة." },
  release: { en: "Release published.", ar: "تم نشر الإصدار." },
  release_deleted: { en: "Release deleted.", ar: "تم حذف الإصدار." },
  support: { en: "Support request updated.", ar: "تم تحديث طلب الدعم." },
  runtime_config: { en: "Runtime configuration synced.", ar: "تمت مزامنة إعدادات التشغيل." },
  website_hero: { en: "Homepage copy saved.", ar: "تم حفظ نص الصفحة الرئيسية." },
  website_services: { en: "Services copy saved.", ar: "تم حفظ نص الخدمات." },
  website_page: { en: "Page settings saved.", ar: "تم حفظ إعدادات الصفحة." },
  website_project: { en: "Project saved.", ar: "تم حفظ المشروع." },
  website_project_deleted: { en: "Project deleted.", ar: "تم حذف المشروع." },
  website_service: { en: "Service saved.", ar: "تم حفظ الخدمة." },
  website_service_deleted: { en: "Service deleted.", ar: "تم حذف الخدمة." },
  website_media: { en: "Media uploaded.", ar: "تم رفع الصورة." },
  website_upload_missing: { en: "Choose an image before uploading.", ar: "اختر صورة قبل الرفع.", error: true },
  website_upload_type: { en: "Only image files are allowed.", ar: "يسمح برفع ملفات الصور فقط.", error: true },
  website_upload_too_large: { en: "Image is too large. Use an image under 10 MB.", ar: "الصورة كبيرة جداً. استخدم صورة أقل من 10 MB.", error: true },
  website_upload_failed: { en: "Image upload failed. Try another image or a smaller file.", ar: "فشل رفع الصورة. جرّب صورة أخرى أو ملفاً أصغر.", error: true },
  website_media_deleted: { en: "Media deleted.", ar: "تم حذف الصورة." },
  website_media_in_use: {
    en: "This image is still used on the site. Replace it where it is used before deleting it.",
    ar: "هذه الصورة ما زالت مستخدمة في الموقع. استبدلها في مكان استخدامها قبل الحذف.",
    error: true,
  },
  site_status: { en: "Site status updated.", ar: "تم تحديث حالة الموقع." },
  legal_pages: { en: "Legal pages saved.", ar: "تم حفظ الصفحات القانونية." },
  legal_missing: {
    en: "Legal pages saved as hidden. Add responsible name, address, and email before publishing.",
    ar: "تم حفظ الصفحات القانونية كمخفية. أضف اسم المسؤول والعنوان والبريد قبل النشر.",
    error: true,
  },
  message_status: { en: "Message status updated.", ar: "تم تحديث حالة الرسالة." },
  message_deleted: { en: "Message deleted.", ar: "تم حذف الرسالة." },
  message_invalid: { en: "Invalid message status update.", ar: "تحديث حالة الرسالة غير صالح.", error: true },
  reply_sent: { en: "Email sent to the user.", ar: "تم إرسال البريد للمستخدم." },
  reply_failed: { en: "Email failed. Check SMTP settings.", ar: "فشل الإرسال. تحقق من إعدادات SMTP.", error: true },
  reply_invalid: { en: "Recipient and message are required.", ar: "البريد والرسالة مطلوبان.", error: true },
};

export function UpdatedToast({ code }: { code?: string }) {
  const { t } = useLocale();
  const [open, setOpen] = useState(true);
  if (!code || !open) return null;
  const entry = MESSAGES[code];
  if (!entry) return null;
  const error = entry.error;

  return (
    <div
      className="fade-up flex items-center gap-3 rounded-2xl border p-4 text-sm font-bold"
      style={{
        borderColor: error ? "rgba(251,113,133,0.3)" : "rgba(52,211,153,0.3)",
        background: error ? "rgba(251,113,133,0.1)" : "rgba(52,211,153,0.1)",
        color: error ? "var(--danger)" : "var(--success)",
      }}
    >
      {error ? <AlertTriangle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
      <span className="flex-1">{t(entry)}</span>
      <button type="button" onClick={() => setOpen(false)} aria-label="Dismiss">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
