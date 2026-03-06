"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
    Home,
    FileText,
    Youtube,
    Briefcase,
    Image as ImageIcon,
    Mail,
    Settings,
    LogOut,
    Plus,
    Save,
    Trash2,
    ExternalLink,
    ChevronRight,
    Database
} from "lucide-react";

import {
    logoutAdminAction,
    upsertWorkProjectAction,
    deleteWorkProjectAction,
    upsertExperienceAction,
    deleteExperienceAction,
    updateThemeTokenAction,
    uploadMediaAction,
    deleteMediaAction
} from "@/lib/admin-actions";
import type { CmsSnapshot, Locale, MediaAsset, WorkProject, Experience } from "@/types/cms";

type Tab = "overview" | "home" | "cv" | "blog" | "youtube" | "media" | "inbox" | "settings";

export function PremiumAdminDashboard({ locale, snapshot }: { locale: Locale; snapshot: CmsSnapshot }) {
    const [activeTab, setActiveTab] = useState<Tab>("overview");

    const navItems = [
        { id: "overview", label: locale === "ar" ? "نظرة عامة" : "Overview", icon: Database },
        { id: "home", label: locale === "ar" ? "الرئيسية" : "Home Page", icon: Home },
        { id: "cv", label: locale === "ar" ? "السيرة الذاتية" : "CV / Resume", icon: FileText },
        { id: "blog", label: locale === "ar" ? "المشاريع" : "Blog & Projects", icon: Briefcase },
        { id: "youtube", label: locale === "ar" ? "يوتيوب" : "YouTube", icon: Youtube },
        { id: "media", label: locale === "ar" ? "الوسائط" : "Media", icon: ImageIcon },
        { id: "inbox", label: locale === "ar" ? "الرسائل" : "Inbox", icon: Mail },
        { id: "settings", label: locale === "ar" ? "الإعدادات" : "Settings", icon: Settings },
    ];

    return (
        <div className="admin-container">
            {/* Sidebar */}
            <aside className="admin-sidebar" dir={locale === "ar" ? "rtl" : "ltr"}>
                <div className="brand">
                    <div className="logo-icon" style={{ width: 40, height: 40, borderRadius: 12, background: "var(--primary)", display: "grid", placeItems: "center", color: "white", fontWeight: 900 }}>M</div>
                    <span>MOA ADMIN</span>
                </div>

                <nav className="admin-nav">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id as Tab)}
                            className={`admin-nav-item ${activeTab === item.id ? "active" : ""}`}
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div style={{ marginTop: "auto" }}>
                    <form action={logoutAdminAction}>
                        <button className="admin-nav-item danger-hover" type="submit" style={{ color: "rgba(var(--text-rgb), 0.6)" }}>
                            <LogOut size={20} />
                            <span>{locale === "ar" ? "خروج" : "Logout"}</span>
                        </button>
                    </form>
                </div>
            </aside>

            {/* Main Content */}
            <main className="admin-content" dir={locale === "ar" ? "rtl" : "ltr"}>
                <header style={{ marginBottom: "3rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <h1 style={{ fontSize: "2rem", fontWeight: 800 }}>
                            {navItems.find(n => n.id === activeTab)?.label}
                        </h1>
                        <p style={{ opacity: 0.6 }}>{locale === "ar" ? "أهلاً بك محمد، تحكم في موقعك من هنا." : "Welcome back Mohammad, manage your world here."}</p>
                    </div>
                    <Link href={`/${locale}`} target="_blank" className="btn secondary" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <ExternalLink size={16} /> {locale === "ar" ? "معاينة الموقع" : "View Site"}
                    </Link>
                </header>

                <div className="tab-content">
                    {activeTab === "overview" && <OverviewTab locale={locale} snapshot={snapshot} />}
                    {activeTab === "home" && <HomeTab locale={locale} snapshot={snapshot} />}
                    {activeTab === "cv" && <CVTab locale={locale} snapshot={snapshot} />}
                    {activeTab === "blog" && <ProjectsTab locale={locale} snapshot={snapshot} />}
                    {activeTab === "youtube" && <YouTubeTab locale={locale} snapshot={snapshot} />}
                    {activeTab === "media" && <MediaTab locale={locale} snapshot={snapshot} />}
                    {activeTab === "settings" && <SettingsTab locale={locale} snapshot={snapshot} />}

                    {activeTab === "inbox" && (
                        <div className="admin-card">
                            <h3><Mail size={20} /> {locale === "ar" ? "صندوق الوارد" : "Inbox"}</h3>
                            <p style={{ opacity: 0.6 }}>{locale === "ar" ? "لا توجد رسائل جديدة." : "No new messages recorded."}</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

function OverviewTab({ locale, snapshot }: { locale: Locale; snapshot: CmsSnapshot }) {
    const stats = [
        { label: locale === "ar" ? "إجمالي المشاريع" : "Total Projects", value: snapshot.work_projects.length, icon: Briefcase, color: "#a855f7" },
        { label: locale === "ar" ? "فيديوهات يوتيوب" : "YouTube Videos", value: (snapshot as any).youtube_videos?.length || 0, icon: Youtube, color: "#ef4444" },
        { label: locale === "ar" ? "سنوات الخبرة" : "Years Experience", value: "+5", icon: FileText, color: "#3b82f6" },
        { label: locale === "ar" ? "قنوات التواصل" : "Contact Channels", value: snapshot.contact_channels.length, icon: Mail, color: "#10b981" },
    ];

    return (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem" }}>
            {stats.map((stat, i) => (
                <div key={i} className="admin-card" style={{ marginBottom: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                        <div>
                            <p style={{ fontSize: "0.85rem", fontWeight: 600, opacity: 0.6, marginBottom: "0.5rem" }}>{stat.label}</p>
                            <h4 style={{ fontSize: "2rem", fontWeight: 800 }}>{stat.value}</h4>
                        </div>
                        <div style={{ padding: "0.75rem", borderRadius: "12px", background: `${stat.color}15`, color: stat.color }}>
                            <stat.icon size={24} />
                        </div>
                    </div>
                </div>
            ))}

            <div className="admin-card" style={{ gridColumn: "1 / -1" }}>
                <h3><Database size={20} /> System Status</h3>
                <p>Your premium portfolio is live and synced. All modifications are reflected in real-time across the bilingual site.</p>
                <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                    <div className="badge success">CMS v2.0 Ready</div>
                    <div className="badge info">Glass UI Active</div>
                    <div className="badge warning">Sync: Realtime</div>
                </div>
            </div>
        </div>
    );
}

function HomeTab({ locale, snapshot }: { locale: Locale; snapshot: CmsSnapshot }) {
    const heroBlock = snapshot.page_blocks.find(b => b.id === "b-home-hero");
    const heroEn = snapshot.page_block_translations.find(t => t.block_id === "b-home-hero" && t.locale === "en")?.content_json as any;
    const heroAr = snapshot.page_block_translations.find(t => t.block_id === "b-home-hero" && t.locale === "ar")?.content_json as any;

    return (
        <div className="section-stack">
            <div className="admin-card">
                <h3><Home size={20} /> Hero Section (English)</h3>
                <div className="admin-form-grid">
                    <div className="admin-field">
                        <label>Title</label>
                        <input defaultValue={heroEn?.title || "Mohammad Alfarras"} />
                    </div>
                    <div className="admin-field">
                        <label>Body Text</label>
                        <textarea defaultValue={heroEn?.body || ""} rows={3} />
                    </div>
                </div>
            </div>
            <div className="admin-card">
                <h3><Home size={20} /> Hero Section (Arabic)</h3>
                <div className="admin-form-grid">
                    <div className="admin-field">
                        <label>العنوان</label>
                        <input defaultValue={heroAr?.title || "محمد الفراس"} dir="rtl" />
                    </div>
                    <div className="admin-field">
                        <label>المحتوى</label>
                        <textarea defaultValue={heroAr?.body || ""} rows={3} dir="rtl" />
                    </div>
                </div>
                <button className="btn primary" style={{ marginTop: "1.5rem" }}><Save size={18} /> Save Home Changes</button>
            </div>
        </div>
    );
}

function ProjectsTab({ locale, snapshot }: { locale: Locale; snapshot: CmsSnapshot }) {
    const [editingProject, setEditingProject] = useState<string | null>(null);

    return (
        <div className="section-stack">
            <div className="admin-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                    <h3 style={{ margin: 0 }}><Briefcase size={20} /> Projects</h3>
                    <button className="btn secondary sm" onClick={() => setEditingProject("new")}><Plus size={16} /> New Project</button>
                </div>

                <div className="admin-list">
                    {snapshot.work_projects.map((proj) => {
                        const tr = snapshot.work_project_translations.find(t => t.project_id === proj.id && t.locale === locale);
                        return (
                            <div key={proj.id} className="admin-list-item">
                                <div className="admin-list-item-info">
                                    <div style={{ width: 40, height: 40, borderRadius: 8, background: "rgba(var(--secondary-rgb), 0.1)", display: "grid", placeItems: "center" }}>
                                        <Briefcase size={20} color="var(--secondary)" />
                                    </div>
                                    <div>
                                        <strong>{tr?.title || proj.slug}</strong>
                                        <p style={{ fontSize: "0.75rem", opacity: 0.6 }}>{proj.project_url || "No Link"}</p>
                                    </div>
                                </div>
                                <div className="admin-list-item-actions">
                                    <form action={deleteWorkProjectAction}>
                                        <input type="hidden" name="id" value={proj.id} />
                                        <button className="btn icon-only danger" type="submit"><Trash2 size={16} /></button>
                                    </form>
                                    <button className="btn icon-only" onClick={() => setEditingProject(proj.id)}><Settings size={16} /></button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {editingProject && (
                <div className="admin-card">
                    <h3>{editingProject === "new" ? "New Project" : "Edit Project"}</h3>
                    <form action={upsertWorkProjectAction} className="admin-form-grid">
                        <input type="hidden" name="id" value={editingProject === "new" ? "" : editingProject} />
                        <div className="admin-field">
                            <label>Internal Slug</label>
                            <input name="slug" placeholder="e.g. website-a" required />
                        </div>
                        <div className="admin-field">
                            <label>Project URL</label>
                            <input name="project_url" placeholder="https://..." />
                        </div>
                        <div className="admin-field">
                            <label>Title (EN)</label>
                            <input name="title_en" required />
                        </div>
                        <div className="admin-field">
                            <label>Title (AR)</label>
                            <input name="title_ar" required dir="rtl" />
                        </div>
                        <div className="admin-field" style={{ gridColumn: "1 / -1" }}>
                            <label>Summary (EN)</label>
                            <textarea name="summary_en" rows={2} />
                        </div>
                        <div className="admin-field" style={{ gridColumn: "1 / -1" }}>
                            <label>Summary (AR)</label>
                            <textarea name="summary_ar" rows={2} dir="rtl" />
                        </div>
                        <div style={{ gridColumn: "1 / -1", display: "flex", gap: "1rem" }}>
                            <button className="btn primary" type="submit"><Save size={18} /> Save Project</button>
                            <button className="btn secondary" type="button" onClick={() => setEditingProject(null)}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

function CVTab({ locale, snapshot }: { locale: Locale; snapshot: CmsSnapshot }) {
    return (
        <div className="section-stack">
            <div className="admin-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                    <h3 style={{ margin: 0 }}><FileText size={20} /> Experience</h3>
                    <button className="btn secondary sm"><Plus size={16} /> Add New</button>
                </div>

                <div className="admin-list">
                    {snapshot.experiences.map((exp) => (
                        <div key={exp.id} className="admin-list-item">
                            <div className="admin-list-item-info">
                                <div style={{ width: 40, height: 40, borderRadius: 8, background: "rgba(var(--primary-rgb), 0.1)", display: "grid", placeItems: "center" }}>
                                    <Briefcase size={20} color="var(--primary)" />
                                </div>
                                <div>
                                    <strong>{exp.company}</strong>
                                    <p style={{ fontSize: "0.75rem", opacity: 0.6 }}>{exp.start_date} - {exp.end_date || "Present"}</p>
                                </div>
                            </div>
                            <div className="admin-list-item-actions">
                                <button className="btn icon-only" title="Edit"><Settings size={16} /></button>
                                <form action={deleteExperienceAction}>
                                    <input type="hidden" name="id" value={exp.id} />
                                    <button className="btn icon-only danger" type="submit" title="Delete"><Trash2 size={16} /></button>
                                </form>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function YouTubeTab({ locale, snapshot }: { locale: Locale; snapshot: CmsSnapshot }) {
    const videos = (snapshot as any).youtube_videos || snapshot.youtube_videos || [];

    return (
        <div className="section-stack">
            <div className="admin-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                    <h3 style={{ margin: 0 }}><Youtube size={20} /> Channel Stats</h3>
                    <button className="btn primary sm"><Database size={16} /> Sync API Now</button>
                </div>

                <div className="admin-form-grid">
                    <div className="admin-field">
                        <label>Subscribers</label>
                        <input defaultValue="6,060" />
                    </div>
                    <div className="admin-field">
                        <label>Total Views</label>
                        <input defaultValue="+100K" />
                    </div>
                    <div className="admin-field">
                        <label>Video Count</label>
                        <input defaultValue={videos.length || "162"} />
                    </div>
                </div>
            </div>

            <div className="admin-card">
                <h3>Manual Video Management</h3>
                <div className="admin-list">
                    {videos.slice(0, 5).map((vid: any) => (
                        <div key={vid.id} className="admin-list-item">
                            <div className="admin-list-item-info">
                                <img src={vid.thumbnail} alt="" style={{ width: 60, height: 35, borderRadius: 4, objectFit: "cover" }} />
                                <div>
                                    <strong style={{ fontSize: "0.85rem" }}>{locale === "ar" ? vid.title_ar : vid.title_en}</strong>
                                </div>
                            </div>
                            <div className="admin-list-item-actions">
                                <button className="btn icon-only"><Settings size={16} /></button>
                            </div>
                        </div>
                    ))}
                </div>
                <button className="btn secondary" style={{ width: "100%", marginTop: "1rem" }}>View All {videos.length} Videos</button>
            </div>
        </div>
    );
}

function MediaTab({ locale, snapshot }: { locale: Locale; snapshot: CmsSnapshot }) {
    return (
        <div className="section-stack">
            <div className="admin-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                    <h3 style={{ margin: 0 }}><ImageIcon size={20} /> Media Assets</h3>
                    <form action={uploadMediaAction} encType="multipart/form-data">
                        <label className="btn secondary sm" style={{ cursor: "pointer" }}>
                            <Plus size={16} /> Upload New
                            <input type="file" name="file" hidden onChange={(e) => e.target.form?.requestSubmit()} />
                        </label>
                    </form>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "1rem" }}>
                    {snapshot.media_assets.map((asset) => (
                        <div key={asset.id} className="media-preview-card" style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(var(--border-rgb), 0.1)", background: "rgba(0,0,0,0.05)" }}>
                            <img src={asset.path} alt="" style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover" }} />
                            <div className="media-overlay" style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0.5rem", background: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "space-between", color: "white", fontSize: "0.7rem" }}>
                                <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{asset.path.split("/").pop()}</span>
                                <form action={deleteMediaAction}>
                                    <input type="hidden" name="id" value={asset.id} />
                                    <button type="submit" style={{ background: "none", border: "none", color: "#ff4444", cursor: "pointer" }} title="Delete"><Trash2 size={14} /></button>
                                </form>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function SettingsTab({ locale, snapshot }: { locale: Locale; snapshot: CmsSnapshot }) {
    return (
        <div className="section-stack">
            <div className="admin-card">
                <h3><Settings size={20} /> Visual Identity</h3>
                <div className="admin-form-grid">
                    <div className="admin-field">
                        <label>Primary Color (Light)</label>
                        <form action={updateThemeTokenAction}>
                            <input type="hidden" name="mode" value="light" />
                            <input type="hidden" name="tokenKey" value="primary" />
                            <input name="tokenValue" type="color" defaultValue={snapshot.theme_tokens.find(t => t.mode === "light" && t.token_key === "primary")?.token_value} onChange={(e) => e.target.form?.requestSubmit()} />
                        </form>
                    </div>
                    <div className="admin-field">
                        <label>Primary Color (Dark)</label>
                        <form action={updateThemeTokenAction}>
                            <input type="hidden" name="mode" value="dark" />
                            <input type="hidden" name="tokenKey" value="primary" />
                            <input name="tokenValue" type="color" defaultValue={snapshot.theme_tokens.find(t => t.mode === "dark" && t.token_key === "primary")?.token_value} onChange={(e) => e.target.form?.requestSubmit()} />
                        </form>
                    </div>
                </div>
            </div>

            <div className="admin-card">
                <h3>Global Metadata</h3>
                <div className="admin-form-grid">
                    <div className="admin-field">
                        <label>Site Name (AR)</label>
                        <input defaultValue="محمد الفراس" dir="rtl" />
                    </div>
                    <div className="admin-field">
                        <label>Site Name (EN)</label>
                        <input defaultValue="Mohammad Alfarras" />
                    </div>
                </div>
                <button className="btn primary" style={{ marginTop: "1.5rem" }}><Save size={18} /> Update Settings</button>
            </div>
        </div>
    );
}
