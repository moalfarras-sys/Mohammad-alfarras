import Link from "next/link";

import {
  deleteContactChannelAction,
  deleteWorkProjectAction,
  logoutAdminAction,
  syncYoutubeAction,
  updateThemeTokenAction,
  upsertContactChannelAction,
  upsertWorkProjectAction,
} from "@/lib/admin-actions";
import type { CmsSnapshot, Locale } from "@/types/cms";

function ui(locale: Locale) {
  if (locale === "ar") {
    return {
      title: "لوحة إدارة مبسطة",
      subtitle: "واجهة سريعة وواضحة للموبايل. أضف أعمالك وعدّل التواصل والثيم بسهولة.",
      quick: "الوضع المتقدم",
      logout: "تسجيل خروج",
      work: "الأعمال",
      channels: "قنوات التواصل",
      theme: "ألوان الموقع",
      add: "إضافة",
      save: "حفظ",
      delete: "حذف",
      active: "مفعّل",
      primary: "أساسي",
    };
  }

  return {
    title: "Simple Admin Panel",
    subtitle: "Mobile-friendly quick control for projects, contact channels, and theme.",
    quick: "Advanced mode",
    logout: "Logout",
    work: "Projects",
    channels: "Contact Channels",
    theme: "Theme Colors",
    add: "Add",
    save: "Save",
    delete: "Delete",
    active: "Active",
    primary: "Primary",
  };
}

export function AdminLiteDashboard({ locale, snapshot }: { locale: Locale; snapshot: CmsSnapshot }) {
  const t = ui(locale);
  const themeMode: "light" | "dark" = "light";
  const editableTokens = ["primary", "secondary", "accent", "bg", "text", "surface", "border"];

  return (
    <div className="admin-lite">
      <section className="card admin-lite-hero">
        <h2>{t.title}</h2>
        <p>{t.subtitle}</p>
        <div className="actions-row">
          <Link href={`/${locale}/admin?mode=advanced`} className="btn secondary">{t.quick}</Link>
          <form action={syncYoutubeAction}>
            <input type="hidden" name="max_results" value="12" />
            <button className="btn secondary" type="submit">
              {locale === "ar" ? "مزامنة يوتيوب" : "Sync YouTube"}
            </button>
          </form>
          <form action={logoutAdminAction}>
            <button className="btn danger" type="submit">{t.logout}</button>
          </form>
        </div>
      </section>

      <section className="card admin-lite-section">
        <h3>{t.work}</h3>
        <form action={upsertWorkProjectAction} className="token-form">
          <label><span>slug</span><input name="slug" required placeholder="project-slug" /></label>
          <label><span>sort_order</span><input name="sort_order" type="number" defaultValue={snapshot.work_projects.length + 1} /></label>
          <label><span>project_url</span><input name="project_url" placeholder="https://example.com" /></label>
          <label><span>title_ar</span><input name="title_ar" required /></label>
          <label><span>title_en</span><input name="title_en" required /></label>
          <label><span>summary_ar</span><input name="summary_ar" required /></label>
          <label><span>summary_en</span><input name="summary_en" required /></label>
          <label><span>description_ar</span><textarea rows={2} name="description_ar" required /></label>
          <label><span>description_en</span><textarea rows={2} name="description_en" required /></label>
          <label><span>cta_label_ar</span><input name="cta_label_ar" defaultValue="عرض المشروع" required /></label>
          <label><span>cta_label_en</span><input name="cta_label_en" defaultValue="Open project" required /></label>
          <label className="check-row"><input type="checkbox" name="is_active" defaultChecked />{t.active}</label>
          <button className="btn primary" type="submit">{t.add}</button>
        </form>

        <div className="admin-lite-list">
          {snapshot.work_projects
            .slice()
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((project) => {
              const trAr = snapshot.work_project_translations.find((tr) => tr.project_id === project.id && tr.locale === "ar");
              const trEn = snapshot.work_project_translations.find((tr) => tr.project_id === project.id && tr.locale === "en");
              return (
                <details key={project.id} className="admin-lite-item">
                  <summary>{project.slug} - {trAr?.title || trEn?.title || project.slug}</summary>
                  <form action={upsertWorkProjectAction} className="token-form">
                    <input type="hidden" name="id" value={project.id} />
                    <input type="hidden" name="created_at" value={project.created_at} />
                    <label><span>slug</span><input name="slug" defaultValue={project.slug} required /></label>
                    <label><span>sort_order</span><input name="sort_order" type="number" defaultValue={project.sort_order} /></label>
                    <label><span>project_url</span><input name="project_url" defaultValue={project.project_url} /></label>
                    <label><span>repo_url</span><input name="repo_url" defaultValue={project.repo_url} /></label>
                    <label><span>title_ar</span><input name="title_ar" defaultValue={trAr?.title || ""} required /></label>
                    <label><span>title_en</span><input name="title_en" defaultValue={trEn?.title || ""} required /></label>
                    <label><span>summary_ar</span><input name="summary_ar" defaultValue={trAr?.summary || ""} required /></label>
                    <label><span>summary_en</span><input name="summary_en" defaultValue={trEn?.summary || ""} required /></label>
                    <label className="check-row"><input type="checkbox" name="is_active" defaultChecked={project.is_active} />{t.active}</label>
                    <button className="btn primary" type="submit">{t.save}</button>
                  </form>
                  <form action={deleteWorkProjectAction}>
                    <input type="hidden" name="id" value={project.id} />
                    <button className="btn danger" type="submit">{t.delete}</button>
                  </form>
                </details>
              );
            })}
        </div>
      </section>

      <section className="card admin-lite-section">
        <h3>{t.channels}</h3>
        <form action={upsertContactChannelAction} className="token-form">
          <label>
            <span>channel_type</span>
            <select name="channel_type" defaultValue="whatsapp">
              <option value="whatsapp">whatsapp</option>
              <option value="email">email</option>
              <option value="linkedin">linkedin</option>
              <option value="telegram">telegram</option>
              <option value="instagram">instagram</option>
              <option value="youtube">youtube</option>
              <option value="custom">custom</option>
            </select>
          </label>
          <label><span>value</span><input name="value" required placeholder="https://wa.me/..." /></label>
          <label><span>label_ar</span><input name="label_ar" required /></label>
          <label><span>label_en</span><input name="label_en" required /></label>
          <label><span>description_ar</span><textarea rows={2} name="description_ar" required /></label>
          <label><span>description_en</span><textarea rows={2} name="description_en" required /></label>
          <label className="check-row"><input type="checkbox" name="is_primary" />{t.primary}</label>
          <label className="check-row"><input type="checkbox" name="is_active" defaultChecked />{t.active}</label>
          <button className="btn primary" type="submit">{t.add}</button>
        </form>

        <div className="admin-lite-list">
          {snapshot.contact_channels
            .slice()
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((channel) => {
              const trAr = snapshot.contact_channel_translations.find((tr) => tr.channel_id === channel.id && tr.locale === "ar");
              const trEn = snapshot.contact_channel_translations.find((tr) => tr.channel_id === channel.id && tr.locale === "en");
              return (
                <details key={channel.id} className="admin-lite-item">
                  <summary>{channel.channel_type} - {trAr?.label || trEn?.label || channel.label_default}</summary>
                  <form action={upsertContactChannelAction} className="token-form">
                    <input type="hidden" name="id" value={channel.id} />
                    <label><span>value</span><input name="value" defaultValue={channel.value} required /></label>
                    <label><span>sort_order</span><input name="sort_order" type="number" defaultValue={channel.sort_order} /></label>
                    <label><span>label_ar</span><input name="label_ar" defaultValue={trAr?.label || ""} required /></label>
                    <label><span>label_en</span><input name="label_en" defaultValue={trEn?.label || ""} required /></label>
                    <label><span>description_ar</span><textarea rows={2} name="description_ar" defaultValue={trAr?.description || ""} required /></label>
                    <label><span>description_en</span><textarea rows={2} name="description_en" defaultValue={trEn?.description || ""} required /></label>
                    <input type="hidden" name="channel_type" value={channel.channel_type} />
                    <input type="hidden" name="icon" value={channel.icon} />
                    <input type="hidden" name="label_default" value={channel.label_default} />
                    <label className="check-row"><input type="checkbox" name="is_primary" defaultChecked={channel.is_primary} />{t.primary}</label>
                    <label className="check-row"><input type="checkbox" name="is_active" defaultChecked={channel.is_active} />{t.active}</label>
                    <button className="btn primary" type="submit">{t.save}</button>
                  </form>
                  <form action={deleteContactChannelAction}>
                    <input type="hidden" name="id" value={channel.id} />
                    <button className="btn danger" type="submit">{t.delete}</button>
                  </form>
                </details>
              );
            })}
        </div>
      </section>

      <section className="card admin-lite-section">
        <h3>{t.theme}</h3>
        <div className="token-grid">
          {editableTokens.map((tokenKey) => {
            const token = snapshot.theme_tokens.find((item) => item.mode === themeMode && item.token_key === tokenKey);
            return (
              <form key={tokenKey} action={updateThemeTokenAction} className="token-form">
                <input type="hidden" name="mode" value={themeMode} />
                <input type="hidden" name="tokenKey" value={tokenKey} />
                <label><span>{themeMode}.{tokenKey}</span><input name="tokenValue" defaultValue={token?.token_value || ""} /></label>
                <button className="btn primary" type="submit">{t.save}</button>
              </form>
            );
          })}
        </div>
      </section>
    </div>
  );
}
