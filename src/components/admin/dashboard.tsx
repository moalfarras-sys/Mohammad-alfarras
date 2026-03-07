import {
  deleteCertificationAction,
  deleteContactChannelAction,
  deleteExperienceAction,
  deleteMediaAction,
  deletePageBlockAction,
  deleteServiceOfferingAction,
  deleteWorkProjectAction,
  duplicatePageBlockAction,
  logoutAdminAction,
  publishPageAction,
  syncYoutubeAction,
  updateNavigationItemAction,
  updateNavigationTranslationAction,
  updatePageCoreAction,
  updatePageTranslationAction,
  updateThemeTokenAction,
  uploadMediaAction,
  upsertCertificationAction,
  upsertContactChannelAction,
  upsertExperienceAction,
  upsertPageBlockAction,
  upsertPageBlockTranslationAction,
  upsertServiceOfferingAction,
  upsertVideoAction,
  upsertWorkProjectAction,
} from "@/lib/admin-actions";
import type { CmsSnapshot, Locale } from "@/types/cms";

function ui(locale: Locale) {
  if (locale === "ar") {
    return {
      title: "Galaxy Pro Admin",
      subtitle: "لوحة تحكم كاملة وواضحة لإدارة كل محتوى الموقع.",
      overview: "نظرة عامة",
      structure: "هيكل الصفحات",
      content: "Content Studio",
      theme: "الثيم",
      seo: "SEO",
      nav: "الملاحة",
      videos: "فيديوهات يوتيوب",
      syncYoutube: "مزامنة من القناة",
      work: "الأعمال",
      experiences: "الخبرات",
      certifications: "الشهادات",
      services: "الخدمات",
      channels: "قنوات التواصل",
      media: "مكتبة الوسائط",
      add: "إضافة جديد",
      save: "حفظ",
      delete: "حذف",
      duplicate: "نسخ",
      logout: "تسجيل خروج",
      publish: "نشر",
      draft: "مسودة",
      totalPages: "الصفحات",
      totalBlocks: "البلوكات",
      totalWork: "الأعمال",
      totalChannels: "قنوات التواصل",
      advancedJson: "وضع متقدم (JSON)",
    };
  }

  return {
    title: "Galaxy Pro Admin",
    subtitle: "Clear full-control dashboard for all website content.",
    overview: "Overview",
    structure: "Site Structure",
    content: "Content Studio",
    theme: "Theme",
    seo: "SEO",
    nav: "Navigation",
    videos: "YouTube Videos",
    syncYoutube: "Sync from channel",
    work: "Projects",
    experiences: "Experiences",
    certifications: "Certifications",
    services: "Services",
      channels: "Contact Channels",
      media: "Media Library",
    add: "Add New",
    save: "Save",
    delete: "Delete",
    duplicate: "Duplicate",
    logout: "Logout",
    publish: "Publish",
    draft: "Draft",
    totalPages: "Pages",
    totalBlocks: "Blocks",
    totalWork: "Projects",
    totalChannels: "Contact Channels",
    advancedJson: "Advanced JSON",
  };
}

function textAreaList(items: string[] | undefined) {
  return (items ?? []).join("\n");
}

export function AdminDashboard({ locale, snapshot }: { locale: Locale; snapshot: CmsSnapshot }) {
  const t = ui(locale);
  const pageMap = new Map(snapshot.pages.map((page) => [page.id, page]));
  const blocks = snapshot.page_blocks.slice().sort((a, b) => a.page_slug.localeCompare(b.page_slug) || a.sort_order - b.sort_order);

  return (
    <div className="admin-galaxy">
      <aside className="admin-orbit-nav card">
        <a href="#overview">{t.overview}</a>
        <a href="#structure">{t.structure}</a>
        <a href="#content">{t.content}</a>
        <a href="#media">{t.media}</a>
        <a href="#theme">{t.theme}</a>
        <a href="#seo">{t.seo}</a>
        <a href="#nav">{t.nav}</a>
        <a href="#videos">{t.videos}</a>
        <form action={logoutAdminAction} className="admin-logout-form">
          <button className="btn secondary" type="submit">{t.logout}</button>
        </form>
      </aside>

      <div className="admin-galaxy-content">
        <section id="overview" className="card admin-card admin-hero-panel">
          <h2>{t.title}</h2>
          <p>{t.subtitle}</p>
          <div className="admin-stats-grid">
            <article className="card stat-card"><h3>{snapshot.pages.length}</h3><p>{t.totalPages}</p></article>
            <article className="card stat-card"><h3>{snapshot.page_blocks.length}</h3><p>{t.totalBlocks}</p></article>
            <article className="card stat-card"><h3>{snapshot.work_projects.filter((item) => item.is_active).length}</h3><p>{t.totalWork}</p></article>
            <article className="card stat-card"><h3>{snapshot.contact_channels.filter((item) => item.is_active).length}</h3><p>{t.totalChannels}</p></article>
          </div>
        </section>

        <section id="structure" className="card admin-card">
          <div className="admin-head">
            <h2>{t.structure}</h2>
            <span className="muted">{t.advancedJson}</span>
          </div>

          <article className="card admin-subcard">
            <h3>{t.add} Block</h3>
            <form action={upsertPageBlockAction} className="token-form galaxy-form">
              <input type="hidden" name="id" value="" />
              <input type="hidden" name="config_json" value="{}" />
              <label><span>page_slug</span><input name="page_slug" defaultValue="home" /></label>
              <label>
                <span>block_type</span>
                <select name="block_type" defaultValue="hero">
                  <option value="hero">hero</option>
                  <option value="feature-grid">feature-grid</option>
                  <option value="media-gallery">media-gallery</option>
                  <option value="work-showcase">work-showcase</option>
                  <option value="experience-timeline">experience-timeline</option>
                  <option value="certifications-grid">certifications-grid</option>
                  <option value="services-grid">services-grid</option>
                  <option value="contact-channels">contact-channels</option>
                  <option value="faq">faq</option>
                  <option value="cta">cta</option>
                  <option value="rich-text">rich-text</option>
                  <option value="cards">cards</option>
                  <option value="videos">videos</option>
                </select>
              </label>
              <label><span>sort_order</span><input type="number" name="sort_order" defaultValue={1} /></label>
              <label className="check-row"><input type="checkbox" name="is_enabled" defaultChecked />enabled</label>
              <button className="btn primary" type="submit">{t.add}</button>
            </form>
          </article>

          <div className="admin-columns-2">
            {blocks.map((block) => {
              const ar = snapshot.page_block_translations.find((entry) => entry.block_id === block.id && entry.locale === "ar");
              const en = snapshot.page_block_translations.find((entry) => entry.block_id === block.id && entry.locale === "en");
              return (
                <article key={block.id} className="card admin-subcard">
                  <h3>{block.page_slug} / {block.block_type}</h3>
                  <form action={upsertPageBlockAction} className="token-form galaxy-form">
                    <input type="hidden" name="id" value={block.id} />
                    <input type="hidden" name="page_slug" value={block.page_slug} />
                    <input type="hidden" name="block_type" value={block.block_type} />
                    <label><span>sort_order</span><input type="number" name="sort_order" defaultValue={block.sort_order} /></label>
                    <label><span>config_json</span><textarea rows={3} name="config_json" defaultValue={JSON.stringify(block.config_json ?? {}, null, 2)} /></label>
                    <label className="check-row"><input type="checkbox" name="is_enabled" defaultChecked={block.is_enabled} />enabled</label>
                    <button className="btn secondary" type="submit">{t.save}</button>
                  </form>

                  {[ar, en].filter(Boolean).map((tr) => (
                    <form key={`${block.id}-${tr!.locale}`} action={upsertPageBlockTranslationAction} className="token-form galaxy-form">
                      <input type="hidden" name="block_id" value={block.id} />
                      <input type="hidden" name="locale" value={tr!.locale} />
                      <h4>{tr!.locale.toUpperCase()} content_json</h4>
                      <textarea rows={8} name="content_json" defaultValue={JSON.stringify(tr!.content_json, null, 2)} />
                      <button className="btn secondary" type="submit">{t.save}</button>
                    </form>
                  ))}

                  <div className="actions-row">
                    <form action={duplicatePageBlockAction}>
                      <input type="hidden" name="id" value={block.id} />
                      <button className="btn secondary" type="submit">{t.duplicate}</button>
                    </form>
                    <form action={deletePageBlockAction}>
                      <input type="hidden" name="id" value={block.id} />
                      <button className="btn danger" type="submit">{t.delete}</button>
                    </form>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section id="content" className="card admin-card">
          <h2>{t.content}</h2>

          <h3>{t.work}</h3>
          <article className="card admin-subcard">
            <h4>{t.add} {t.work}</h4>
            <form action={upsertWorkProjectAction} className="token-form galaxy-form">
              <label><span>slug</span><input name="slug" placeholder="new-project" required /></label>
              <label><span>sort_order</span><input type="number" name="sort_order" defaultValue={snapshot.work_projects.length + 1} /></label>
              <label><span>project_url</span><input name="project_url" placeholder="https://example.com" /></label>
              <label><span>repo_url</span><input name="repo_url" placeholder="https://github.com/user/repo" /></label>
              <label><span>cover_media_id</span><input name="cover_media_id" placeholder="media-..." /></label>
              <label className="check-row"><input type="checkbox" name="is_active" defaultChecked />is_active</label>
              <label><span>title_ar</span><input name="title_ar" required /></label>
              <label><span>summary_ar</span><input name="summary_ar" required /></label>
              <label><span>description_ar</span><textarea name="description_ar" rows={3} required /></label>
              <label><span>cta_label_ar</span><input name="cta_label_ar" defaultValue="عرض المشروع" required /></label>
              <label><span>title_en</span><input name="title_en" required /></label>
              <label><span>summary_en</span><input name="summary_en" required /></label>
              <label><span>description_en</span><textarea name="description_en" rows={3} required /></label>
              <label><span>cta_label_en</span><input name="cta_label_en" defaultValue="Open project" required /></label>
              <button className="btn primary" type="submit">{t.add}</button>
            </form>
          </article>
          <div className="admin-columns-2">
            {snapshot.work_projects.map((project) => {
              const ar = snapshot.work_project_translations.find((entry) => entry.project_id === project.id && entry.locale === "ar");
              const en = snapshot.work_project_translations.find((entry) => entry.project_id === project.id && entry.locale === "en");
              return (
                <article key={project.id} className="card admin-subcard">
                  <form action={upsertWorkProjectAction} className="token-form galaxy-form">
                    <input type="hidden" name="id" value={project.id} />
                    <input type="hidden" name="created_at" value={project.created_at} />
                    <label><span>slug</span><input name="slug" defaultValue={project.slug} /></label>
                    <label><span>sort_order</span><input type="number" name="sort_order" defaultValue={project.sort_order} /></label>
                    <label><span>project_url</span><input name="project_url" defaultValue={project.project_url} /></label>
                    <label><span>repo_url</span><input name="repo_url" defaultValue={project.repo_url} /></label>
                    <label><span>cover_media_id</span><input name="cover_media_id" defaultValue={project.cover_media_id ?? ""} /></label>
                    <label className="check-row"><input type="checkbox" name="is_active" defaultChecked={project.is_active} />is_active</label>
                    <label><span>title_ar</span><input name="title_ar" defaultValue={ar?.title ?? ""} /></label>
                    <label><span>summary_ar</span><input name="summary_ar" defaultValue={ar?.summary ?? ""} /></label>
                    <label><span>description_ar</span><textarea name="description_ar" rows={3} defaultValue={ar?.description ?? ""} /></label>
                    <label><span>cta_label_ar</span><input name="cta_label_ar" defaultValue={ar?.cta_label ?? ""} /></label>
                    <label><span>title_en</span><input name="title_en" defaultValue={en?.title ?? ""} /></label>
                    <label><span>summary_en</span><input name="summary_en" defaultValue={en?.summary ?? ""} /></label>
                    <label><span>description_en</span><textarea name="description_en" rows={3} defaultValue={en?.description ?? ""} /></label>
                    <label><span>cta_label_en</span><input name="cta_label_en" defaultValue={en?.cta_label ?? ""} /></label>
                    <button className="btn primary" type="submit">{t.save}</button>
                  </form>
                  <form action={deleteWorkProjectAction}>
                    <input type="hidden" name="id" value={project.id} />
                    <button className="btn danger" type="submit">{t.delete}</button>
                  </form>
                </article>
              );
            })}
          </div>

          <h3>{t.experiences}</h3>
          <article className="card admin-subcard">
            <h4>{t.add} {t.experiences}</h4>
            <form action={upsertExperienceAction} className="token-form galaxy-form">
              <label><span>company</span><input name="company" required /></label>
              <label><span>location</span><input name="location" required /></label>
              <label><span>start_date</span><input name="start_date" placeholder="2024-01" required /></label>
              <label><span>end_date</span><input name="end_date" placeholder="2025-01" /></label>
              <label><span>sort_order</span><input type="number" name="sort_order" defaultValue={snapshot.experiences.length + 1} /></label>
              <label><span>logo_media_id</span><input name="logo_media_id" placeholder="media-..." /></label>
              <label className="check-row"><input type="checkbox" name="current_role" />current_role</label>
              <label className="check-row"><input type="checkbox" name="is_active" defaultChecked />is_active</label>
              <label><span>role_title_ar</span><input name="role_title_ar" required /></label>
              <label><span>description_ar</span><textarea name="description_ar" rows={3} required /></label>
              <label><span>highlights_ar (line per item)</span><textarea name="highlights_ar" rows={3} /></label>
              <label><span>role_title_en</span><input name="role_title_en" required /></label>
              <label><span>description_en</span><textarea name="description_en" rows={3} required /></label>
              <label><span>highlights_en (line per item)</span><textarea name="highlights_en" rows={3} /></label>
              <button className="btn primary" type="submit">{t.add}</button>
            </form>
          </article>
          <div className="admin-columns-2">
            {snapshot.experiences.map((experience) => {
              const ar = snapshot.experience_translations.find((entry) => entry.experience_id === experience.id && entry.locale === "ar");
              const en = snapshot.experience_translations.find((entry) => entry.experience_id === experience.id && entry.locale === "en");
              return (
                <article key={experience.id} className="card admin-subcard">
                  <form action={upsertExperienceAction} className="token-form galaxy-form">
                    <input type="hidden" name="id" value={experience.id} />
                    <label><span>company</span><input name="company" defaultValue={experience.company} /></label>
                    <label><span>location</span><input name="location" defaultValue={experience.location} /></label>
                    <label><span>start_date</span><input name="start_date" defaultValue={experience.start_date} /></label>
                    <label><span>end_date</span><input name="end_date" defaultValue={experience.end_date ?? ""} /></label>
                    <label><span>sort_order</span><input type="number" name="sort_order" defaultValue={experience.sort_order} /></label>
                    <label><span>logo_media_id</span><input name="logo_media_id" defaultValue={experience.logo_media_id ?? ""} /></label>
                    <label className="check-row"><input type="checkbox" name="current_role" defaultChecked={experience.current_role} />current_role</label>
                    <label className="check-row"><input type="checkbox" name="is_active" defaultChecked={experience.is_active} />is_active</label>
                    <label><span>role_title_ar</span><input name="role_title_ar" defaultValue={ar?.role_title ?? ""} /></label>
                    <label><span>description_ar</span><textarea name="description_ar" rows={3} defaultValue={ar?.description ?? ""} /></label>
                    <label><span>highlights_ar (line per item)</span><textarea name="highlights_ar" rows={3} defaultValue={textAreaList(ar?.highlights_json)} /></label>
                    <label><span>role_title_en</span><input name="role_title_en" defaultValue={en?.role_title ?? ""} /></label>
                    <label><span>description_en</span><textarea name="description_en" rows={3} defaultValue={en?.description ?? ""} /></label>
                    <label><span>highlights_en (line per item)</span><textarea name="highlights_en" rows={3} defaultValue={textAreaList(en?.highlights_json)} /></label>
                    <button className="btn primary" type="submit">{t.save}</button>
                  </form>
                  <form action={deleteExperienceAction}>
                    <input type="hidden" name="id" value={experience.id} />
                    <button className="btn danger" type="submit">{t.delete}</button>
                  </form>
                </article>
              );
            })}
          </div>

          <h3>{t.certifications}</h3>
          <article className="card admin-subcard">
            <h4>{t.add} {t.certifications}</h4>
            <form action={upsertCertificationAction} className="token-form galaxy-form">
              <label><span>issuer</span><input name="issuer" required /></label>
              <label><span>issue_date</span><input name="issue_date" placeholder="2025-01" required /></label>
              <label><span>expiry_date</span><input name="expiry_date" placeholder="2028-01" /></label>
              <label><span>credential_url</span><input name="credential_url" placeholder="https://..." /></label>
              <label><span>certificate_media_id</span><input name="certificate_media_id" placeholder="media-..." /></label>
              <label><span>sort_order</span><input type="number" name="sort_order" defaultValue={snapshot.certifications.length + 1} /></label>
              <label className="check-row"><input type="checkbox" name="is_active" defaultChecked />is_active</label>
              <label><span>name_ar</span><input name="name_ar" required /></label>
              <label><span>description_ar</span><textarea name="description_ar" rows={3} required /></label>
              <label><span>name_en</span><input name="name_en" required /></label>
              <label><span>description_en</span><textarea name="description_en" rows={3} required /></label>
              <button className="btn primary" type="submit">{t.add}</button>
            </form>
          </article>
          <div className="admin-columns-2">
            {snapshot.certifications.map((certificate) => {
              const ar = snapshot.certification_translations.find((entry) => entry.certification_id === certificate.id && entry.locale === "ar");
              const en = snapshot.certification_translations.find((entry) => entry.certification_id === certificate.id && entry.locale === "en");
              return (
                <article key={certificate.id} className="card admin-subcard">
                  <form action={upsertCertificationAction} className="token-form galaxy-form">
                    <input type="hidden" name="id" value={certificate.id} />
                    <label><span>issuer</span><input name="issuer" defaultValue={certificate.issuer} /></label>
                    <label><span>issue_date</span><input name="issue_date" defaultValue={certificate.issue_date} /></label>
                    <label><span>expiry_date</span><input name="expiry_date" defaultValue={certificate.expiry_date ?? ""} /></label>
                    <label><span>credential_url</span><input name="credential_url" defaultValue={certificate.credential_url} /></label>
                    <label><span>certificate_media_id</span><input name="certificate_media_id" defaultValue={certificate.certificate_media_id ?? ""} /></label>
                    <label><span>sort_order</span><input type="number" name="sort_order" defaultValue={certificate.sort_order} /></label>
                    <label className="check-row"><input type="checkbox" name="is_active" defaultChecked={certificate.is_active} />is_active</label>
                    <label><span>name_ar</span><input name="name_ar" defaultValue={ar?.name ?? ""} /></label>
                    <label><span>description_ar</span><textarea name="description_ar" rows={3} defaultValue={ar?.description ?? ""} /></label>
                    <label><span>name_en</span><input name="name_en" defaultValue={en?.name ?? ""} /></label>
                    <label><span>description_en</span><textarea name="description_en" rows={3} defaultValue={en?.description ?? ""} /></label>
                    <button className="btn primary" type="submit">{t.save}</button>
                  </form>
                  <form action={deleteCertificationAction}>
                    <input type="hidden" name="id" value={certificate.id} />
                    <button className="btn danger" type="submit">{t.delete}</button>
                  </form>
                </article>
              );
            })}
          </div>

          <h3>{t.services}</h3>
          <article className="card admin-subcard">
            <h4>{t.add} {t.services}</h4>
            <form action={upsertServiceOfferingAction} className="token-form galaxy-form">
              <label><span>icon</span><input name="icon" defaultValue="sparkles" required /></label>
              <label><span>color_token</span><input name="color_token" defaultValue="--accent" required /></label>
              <label><span>sort_order</span><input type="number" name="sort_order" defaultValue={snapshot.service_offerings.length + 1} /></label>
              <label className="check-row"><input type="checkbox" name="is_active" defaultChecked />is_active</label>
              <label><span>title_ar</span><input name="title_ar" required /></label>
              <label><span>description_ar</span><textarea name="description_ar" rows={3} required /></label>
              <label><span>bullets_ar (line per item)</span><textarea name="bullets_ar" rows={3} /></label>
              <label><span>title_en</span><input name="title_en" required /></label>
              <label><span>description_en</span><textarea name="description_en" rows={3} required /></label>
              <label><span>bullets_en (line per item)</span><textarea name="bullets_en" rows={3} /></label>
              <button className="btn primary" type="submit">{t.add}</button>
            </form>
          </article>
          <div className="admin-columns-2">
            {snapshot.service_offerings.map((service) => {
              const ar = snapshot.service_offering_translations.find((entry) => entry.service_id === service.id && entry.locale === "ar");
              const en = snapshot.service_offering_translations.find((entry) => entry.service_id === service.id && entry.locale === "en");
              return (
                <article key={service.id} className="card admin-subcard">
                  <form action={upsertServiceOfferingAction} className="token-form galaxy-form">
                    <input type="hidden" name="id" value={service.id} />
                    <label><span>icon</span><input name="icon" defaultValue={service.icon} /></label>
                    <label><span>color_token</span><input name="color_token" defaultValue={service.color_token} /></label>
                    <label><span>sort_order</span><input type="number" name="sort_order" defaultValue={service.sort_order} /></label>
                    <label className="check-row"><input type="checkbox" name="is_active" defaultChecked={service.is_active} />is_active</label>
                    <label><span>title_ar</span><input name="title_ar" defaultValue={ar?.title ?? ""} /></label>
                    <label><span>description_ar</span><textarea name="description_ar" rows={3} defaultValue={ar?.description ?? ""} /></label>
                    <label><span>bullets_ar (line per item)</span><textarea name="bullets_ar" rows={3} defaultValue={textAreaList(ar?.bullets_json)} /></label>
                    <label><span>title_en</span><input name="title_en" defaultValue={en?.title ?? ""} /></label>
                    <label><span>description_en</span><textarea name="description_en" rows={3} defaultValue={en?.description ?? ""} /></label>
                    <label><span>bullets_en (line per item)</span><textarea name="bullets_en" rows={3} defaultValue={textAreaList(en?.bullets_json)} /></label>
                    <button className="btn primary" type="submit">{t.save}</button>
                  </form>
                  <form action={deleteServiceOfferingAction}>
                    <input type="hidden" name="id" value={service.id} />
                    <button className="btn danger" type="submit">{t.delete}</button>
                  </form>
                </article>
              );
            })}
          </div>

          <h3>{t.channels}</h3>
          <article className="card admin-subcard">
            <h4>{t.add} {t.channels}</h4>
            <form action={upsertContactChannelAction} className="token-form galaxy-form">
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
              <label><span>value</span><input name="value" placeholder="https://wa.me/..." required /></label>
              <label><span>icon</span><input name="icon" defaultValue="link" required /></label>
              <label><span>label_default</span><input name="label_default" required /></label>
              <label><span>sort_order</span><input type="number" name="sort_order" defaultValue={snapshot.contact_channels.length + 1} /></label>
              <label className="check-row"><input type="checkbox" name="is_primary" />is_primary</label>
              <label className="check-row"><input type="checkbox" name="is_active" defaultChecked />is_active</label>
              <label><span>label_ar</span><input name="label_ar" required /></label>
              <label><span>description_ar</span><textarea name="description_ar" rows={2} required /></label>
              <label><span>label_en</span><input name="label_en" required /></label>
              <label><span>description_en</span><textarea name="description_en" rows={2} required /></label>
              <button className="btn primary" type="submit">{t.add}</button>
            </form>
          </article>
          <div className="admin-columns-2">
            {snapshot.contact_channels.map((channel) => {
              const ar = snapshot.contact_channel_translations.find((entry) => entry.channel_id === channel.id && entry.locale === "ar");
              const en = snapshot.contact_channel_translations.find((entry) => entry.channel_id === channel.id && entry.locale === "en");
              return (
                <article key={channel.id} className="card admin-subcard">
                  <form action={upsertContactChannelAction} className="token-form galaxy-form">
                    <input type="hidden" name="id" value={channel.id} />
                    <label>
                      <span>channel_type</span>
                      <select name="channel_type" defaultValue={channel.channel_type}>
                        <option value="whatsapp">whatsapp</option>
                        <option value="email">email</option>
                        <option value="linkedin">linkedin</option>
                        <option value="telegram">telegram</option>
                        <option value="instagram">instagram</option>
                        <option value="youtube">youtube</option>
                        <option value="custom">custom</option>
                      </select>
                    </label>
                    <label><span>value</span><input name="value" defaultValue={channel.value} /></label>
                    <label><span>icon</span><input name="icon" defaultValue={channel.icon} /></label>
                    <label><span>label_default</span><input name="label_default" defaultValue={channel.label_default} /></label>
                    <label><span>sort_order</span><input type="number" name="sort_order" defaultValue={channel.sort_order} /></label>
                    <label className="check-row"><input type="checkbox" name="is_primary" defaultChecked={channel.is_primary} />is_primary</label>
                    <label className="check-row"><input type="checkbox" name="is_active" defaultChecked={channel.is_active} />is_active</label>
                    <label><span>label_ar</span><input name="label_ar" defaultValue={ar?.label ?? ""} /></label>
                    <label><span>description_ar</span><textarea name="description_ar" rows={2} defaultValue={ar?.description ?? ""} /></label>
                    <label><span>label_en</span><input name="label_en" defaultValue={en?.label ?? ""} /></label>
                    <label><span>description_en</span><textarea name="description_en" rows={2} defaultValue={en?.description ?? ""} /></label>
                    <button className="btn primary" type="submit">{t.save}</button>
                  </form>
                  <form action={deleteContactChannelAction}>
                    <input type="hidden" name="id" value={channel.id} />
                    <button className="btn danger" type="submit">{t.delete}</button>
                  </form>
                </article>
              );
            })}
          </div>
        </section>

        <section id="media" className="card admin-card">
          <h2>{t.media}</h2>
          <article className="card admin-subcard">
            <h3>{t.add} {t.media}</h3>
            <form action={uploadMediaAction} className="token-form galaxy-form" encType="multipart/form-data">
              <label><span>file</span><input name="file" type="file" accept="image/*,video/*" /></label>
              <label><span>path (optional if file selected)</span><input name="path" placeholder="https://..." /></label>
              <label><span>alt_ar</span><input name="alt_ar" required /></label>
              <label><span>alt_en</span><input name="alt_en" required /></label>
              <label><span>width</span><input name="width" type="number" defaultValue={0} /></label>
              <label><span>height</span><input name="height" type="number" defaultValue={0} /></label>
              <label><span>type</span><input name="type" defaultValue="image" /></label>
              <button className="btn primary" type="submit">{t.add}</button>
            </form>
          </article>

          <div className="admin-columns-2">
            {snapshot.media_assets.map((asset) => (
              <article key={asset.id} className="card admin-subcard media-card">
                <h3>{asset.id}</h3>
                <p className="muted">{asset.type} - {asset.width}x{asset.height}</p>
                <a href={asset.path} target="_blank" rel="noreferrer noopener">{asset.path}</a>
                <p>{asset.alt_ar}</p>
                <p>{asset.alt_en}</p>
                <form action={deleteMediaAction}>
                  <input type="hidden" name="id" value={asset.id} />
                  <button className="btn danger" type="submit">{t.delete}</button>
                </form>
              </article>
            ))}
          </div>
        </section>

        <section id="theme" className="card admin-card">
          <h2>{t.theme}</h2>
          <div className="token-grid">
            {snapshot.theme_tokens
              .slice()
              .sort((a, b) => a.mode.localeCompare(b.mode) || a.token_key.localeCompare(b.token_key))
              .map((token) => (
                <form key={token.id} action={updateThemeTokenAction} className="token-form galaxy-form">
                  <input type="hidden" name="mode" value={token.mode} />
                  <input type="hidden" name="tokenKey" value={token.token_key} />
                  <label>
                    <span>{token.mode}.{token.token_key}</span>
                    <input name="tokenValue" defaultValue={token.token_value} />
                  </label>
                  <button className="btn primary" type="submit">{t.save}</button>
                </form>
              ))}
          </div>
        </section>

        <section id="seo" className="card admin-card">
          <h2>{t.seo}</h2>
          <div className="admin-columns-2">
            {snapshot.pages.map((page) => {
              const ar = snapshot.page_translations.find((tr) => tr.page_id === page.id && tr.locale === "ar");
              const en = snapshot.page_translations.find((tr) => tr.page_id === page.id && tr.locale === "en");

              return (
                <article key={page.id} className="card admin-subcard">
                  <h3>{page.slug}</h3>
                  <form action={updatePageCoreAction} className="token-form galaxy-form">
                    <input type="hidden" name="id" value={page.id} />
                    <label>
                      <span>status</span>
                      <select name="status" defaultValue={page.status}>
                        <option value="published">published</option>
                        <option value="draft">draft</option>
                      </select>
                    </label>
                    <label><span>template</span><input name="template" defaultValue={page.template} /></label>
                    <button className="btn primary" type="submit">{t.save}</button>
                  </form>
                  <form action={publishPageAction} className="token-form galaxy-form">
                    <input type="hidden" name="slug" value={page.slug} />
                    <input type="hidden" name="status" value={page.status === "published" ? "draft" : "published"} />
                    <button className="btn secondary" type="submit">{page.status === "published" ? t.draft : t.publish}</button>
                  </form>

                  {[ar, en].filter(Boolean).map((tr) => (
                    <form key={`${page.id}-${tr!.locale}`} action={updatePageTranslationAction} className="token-form galaxy-form">
                      <input type="hidden" name="page_id" value={page.id} />
                      <input type="hidden" name="locale" value={tr!.locale} />
                      <h4>{tr!.locale.toUpperCase()}</h4>
                      <label><span>title</span><input name="title" defaultValue={tr!.title} /></label>
                      <label><span>meta_title</span><input name="meta_title" defaultValue={tr!.meta_title} /></label>
                      <label><span>meta_description</span><textarea rows={2} name="meta_description" defaultValue={tr!.meta_description} /></label>
                      <label><span>og_title</span><input name="og_title" defaultValue={tr!.og_title} /></label>
                      <label><span>og_description</span><textarea rows={2} name="og_description" defaultValue={tr!.og_description} /></label>
                      <button className="btn secondary" type="submit">{t.save}</button>
                    </form>
                  ))}
                </article>
              );
            })}
          </div>
        </section>

        <section id="nav" className="card admin-card">
          <h2>{t.nav}</h2>
          <div className="admin-columns-2">
            {snapshot.navigation_items
              .slice()
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((item) => {
                const ar = snapshot.navigation_translations.find((tr) => tr.nav_item_id === item.id && tr.locale === "ar");
                const en = snapshot.navigation_translations.find((tr) => tr.nav_item_id === item.id && tr.locale === "en");

                return (
                  <article key={item.id} className="card admin-subcard">
                    <h3>{item.id} <span className="muted">({pageMap.get(`p-${item.href_slug || "home"}`)?.slug ?? "route"})</span></h3>
                    <form action={updateNavigationItemAction} className="token-form galaxy-form">
                      <input type="hidden" name="id" value={item.id} />
                      <label><span>href_slug</span><input name="href_slug" defaultValue={item.href_slug} /></label>
                      <label><span>icon</span><input name="icon" defaultValue={item.icon} /></label>
                      <label><span>sort_order</span><input type="number" name="sort_order" defaultValue={item.sort_order} /></label>
                      <label className="check-row"><input name="is_enabled" type="checkbox" defaultChecked={item.is_enabled} />enabled</label>
                      <button className="btn primary" type="submit">{t.save}</button>
                    </form>

                    {[ar, en].filter(Boolean).map((tr) => (
                      <form key={`${item.id}-${tr!.locale}`} action={updateNavigationTranslationAction} className="token-form galaxy-form">
                        <input type="hidden" name="nav_item_id" value={item.id} />
                        <input type="hidden" name="locale" value={tr!.locale} />
                        <label><span>{tr!.locale.toUpperCase()} label</span><input name="label" defaultValue={tr!.label} /></label>
                        <button className="btn secondary" type="submit">{t.save}</button>
                      </form>
                    ))}
                  </article>
                );
              })}
          </div>
        </section>

        <section id="videos" className="card admin-card">
          <div className="admin-head">
            <h2>{t.videos}</h2>
            <form action={syncYoutubeAction}>
              <input type="hidden" name="max_results" value="12" />
              <button className="btn secondary" type="submit">{t.syncYoutube}</button>
            </form>
          </div>
          <div className="token-grid">
            {snapshot.youtube_videos.map((video) => (
              <form key={video.id} action={upsertVideoAction} className="token-form galaxy-form">
                <input type="hidden" name="id" defaultValue={video.id} />
                <label><span>youtube_id</span><input name="youtube_id" defaultValue={video.youtube_id} /></label>
                <label><span>title_ar</span><input name="title_ar" defaultValue={video.title_ar} /></label>
                <label><span>title_en</span><input name="title_en" defaultValue={video.title_en} /></label>
                <label><span>description_ar</span><textarea name="description_ar" defaultValue={video.description_ar} rows={2} /></label>
                <label><span>description_en</span><textarea name="description_en" defaultValue={video.description_en} rows={2} /></label>
                <label><span>thumbnail</span><input name="thumbnail" defaultValue={video.thumbnail} /></label>
                <label><span>duration</span><input name="duration" defaultValue={video.duration} /></label>
                <label><span>views</span><input name="views" type="number" defaultValue={video.views} /></label>
                <label><span>published_at</span><input name="published_at" defaultValue={video.published_at} /></label>
                <label><span>sort_order</span><input name="sort_order" type="number" defaultValue={video.sort_order} /></label>
                <label className="check-row"><input name="is_featured" type="checkbox" defaultChecked={video.is_featured} />featured</label>
                <label className="check-row"><input name="is_active" type="checkbox" defaultChecked={video.is_active} />active</label>
                <button className="btn primary" type="submit">{t.save}</button>
              </form>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
