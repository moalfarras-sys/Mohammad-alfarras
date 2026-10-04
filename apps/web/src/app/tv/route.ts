import { formatFileSize, readReleaseFacts, type Lang, type ReleaseFacts } from "@/lib/moplayer-release-facts";

/**
 * https://moalfarras.space/tv — the TV-first download page.
 *
 * Built for the simple built-in browser of the Downloader app (and any TV
 * browser driven by a D-pad), so it is deliberately NOT a React page: it is a
 * single server-rendered HTML document with inline CSS, no framework runtime,
 * no web fonts and no images. It works without JavaScript; the only script is
 * a one-line autofocus fallback for old WebViews that ignore `autofocus` on
 * links. Language follows `?lang=` first, then Accept-Language.
 *
 * Not indexed (`noindex`): it duplicates the product pages for search and is
 * meant to be reached by typing the short URL or a Downloader code.
 */
export const dynamic = "force-dynamic";

const copy = {
  en: {
    title: "Install MoPlayer on this TV",
    lead: "Choose an app. The download starts right away and Android offers to install it.",
    classic: "Download MoPlayer",
    classicTag: "Classic",
    classicNote: "Light and fast, also on older Android 7 boxes",
    pro: "Download MoPlayer Pro",
    proTag: "Pro",
    proNote: "The newer TV app with a richer player",
    android: (v: string) => `Android ${v}+`,
    paused: "Downloads are paused for a moment. Please try again later.",
    installTitle: "Installing",
    install:
      "If Android blocks it, allow Downloader to install unknown apps in the TV settings, then press Install again.",
    activate: "Then open the app and add your source with your phone at",
    legal: "MoPlayer is a player only. It includes no channels or playlists — use a source you are allowed to watch.",
    other: "العربية",
    otherLang: "ar",
    pageLink: "All MoPlayer apps",
  },
  ar: {
    title: "ثبّت MoPlayer على هذا التلفزيون",
    lead: "اختر التطبيق. يبدأ التنزيل فوراً ثم يعرض أندرويد تثبيته.",
    classic: "نزّل MoPlayer",
    classicTag: "Classic",
    classicNote: "خفيف وسريع، ويعمل حتى على أجهزة أندرويد 7 القديمة",
    pro: "نزّل MoPlayer Pro",
    proTag: "Pro",
    proNote: "تطبيق التلفزيون الأحدث بمشغّل أغنى",
    android: (v: string) => `أندرويد ${v} أو أحدث`,
    paused: "التنزيل متوقف مؤقتاً. حاول مرة أخرى بعد قليل.",
    installTitle: "التثبيت",
    install:
      "إذا منع أندرويد التثبيت، اسمح لتطبيق Downloader بتثبيت التطبيقات غير المعروفة من إعدادات التلفزيون، ثم اضغط تثبيت مجدداً.",
    activate: "بعدها افتح التطبيق وأضف مصدرك من هاتفك عبر",
    legal: "MoPlayer مشغّل فقط، لا يحتوي قنوات أو قوائم تشغيل. استخدم مصدراً يحق لك مشاهدته.",
    other: "English",
    otherLang: "en",
    pageLink: "كل تطبيقات MoPlayer",
  },
} as const;

function pickLang(request: Request): Lang {
  const url = new URL(request.url);
  const explicit = url.searchParams.get("lang")?.toLowerCase();
  if (explicit === "ar" || explicit === "en") return explicit;
  const header = request.headers.get("accept-language") ?? "";
  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().toLowerCase().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return { tag, q: q ? Number(q.trim().slice(2)) || 0 : 1 };
    })
    .filter((item) => item.tag)
    .sort((a, b) => b.q - a.q);
  const first = ranked.find((item) => item.tag.startsWith("ar") || item.tag.startsWith("en"));
  return first?.tag.startsWith("ar") ? "ar" : "en";
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

function card(facts: ReleaseFacts, lang: Lang, kind: "classic" | "pro", autofocus: boolean) {
  const t = copy[lang];
  const label = kind === "classic" ? t.classic : t.pro;
  const tag = kind === "classic" ? t.classicTag : t.proTag;
  const note = kind === "classic" ? t.classicNote : t.proNote;
  const meta = [`v${facts.version}`, formatFileSize(facts.sizeBytes, lang), t.android(facts.minAndroid)]
    .filter((item): item is string => Boolean(item))
    .map((item) => `<bdi>${escapeHtml(item)}</bdi>`)
    .join(" · ");
  const inner = `
      <span class="tag">${escapeHtml(tag)}</span>
      <span class="label">${escapeHtml(label)}</span>
      <span class="note">${escapeHtml(note)}</span>
      <span class="meta">${meta}</span>
      <span class="short" dir="ltr">${escapeHtml(facts.shortUrl)}</span>`;
  if (!facts.available) {
    return `<div class="card ${kind} off" aria-disabled="true">${inner}
      <span class="paused">${escapeHtml(facts.unavailableMessage || t.paused)}</span></div>`;
  }
  return `<a class="card ${kind}" id="dl-${kind}" href="${facts.downloadHref}"${autofocus ? " autofocus" : ""}>${inner}
      <span class="go" aria-hidden="true"><svg viewBox="0 0 24 24" width="1em" height="1em"><path fill="currentColor" d="M11 4h2v9.17l3.59-3.58L18 11l-6 6-6-6 1.41-1.41L11 13.17z"/><path fill="currentColor" d="M5 19h14v2H5z"/></svg></span></a>`;
}

const styles = `
*{box-sizing:border-box}
html{background:#05070d;color:#f4f6fb;-webkit-text-size-adjust:100%}
body{margin:0;min-height:100vh;font-family:"Segoe UI",Roboto,"Noto Sans","Noto Sans Arabic",Tahoma,Arial,sans-serif;line-height:1.45;
background:radial-gradient(60% 70% at 15% 0%,rgba(37,99,235,.28),transparent 70%),radial-gradient(55% 65% at 100% 100%,rgba(255,122,61,.20),transparent 70%),#05070d}
.wrap{max-width:1200px;margin:0 auto;padding:3.2vw 4.2vw 2.6vw}
header{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:2.4vw}
.brand{display:flex;align-items:center;gap:12px;font-weight:800;font-size:22px;letter-spacing:.01em}
.mark{width:40px;height:40px;border-radius:12px;display:inline-flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#3b82f6,#22d3ee);box-shadow:0 6px 20px rgba(34,211,238,.35)}
.mark svg{width:20px;height:20px}
.lang{color:#cfe3ff;text-decoration:none;font-size:20px;font-weight:700;padding:10px 20px;border-radius:999px;border:2px solid rgba(255,255,255,.18)}
h1{margin:0 0 .5vw;font-size:clamp(28px,4vw,56px);line-height:1.12;font-weight:800;letter-spacing:-.01em}
.lead{margin:0 0 2.4vw;font-size:clamp(17px,1.9vw,26px);color:#b9c3d6}
.cards{display:flex;gap:2.4vw}
.card{position:relative;flex:1 1 0;display:flex;flex-direction:column;gap:6px;min-height:14vw;padding:2vw 2.4vw;border-radius:28px;text-decoration:none;color:#fff;
border:3px solid rgba(255,255,255,.12);background:linear-gradient(160deg,rgba(255,255,255,.08),rgba(255,255,255,.02));outline:none;transition:transform .15s ease,border-color .15s ease,background .15s ease,box-shadow .15s ease}
.card.classic{background:linear-gradient(160deg,rgba(59,130,246,.30),rgba(30,58,138,.18))}
.card.pro{background:linear-gradient(160deg,rgba(255,122,61,.30),rgba(154,52,18,.18))}
.tag{align-self:flex-start;font-size:clamp(13px,1.2vw,17px);font-weight:800;letter-spacing:.12em;text-transform:uppercase;padding:4px 12px;border-radius:999px;background:rgba(0,0,0,.35);color:#e6edf8}
.label{font-size:clamp(24px,3vw,42px);font-weight:800;line-height:1.15;margin-top:.4vw}
.note{font-size:clamp(15px,1.55vw,22px);color:#dbe3f0}
.meta{font-size:clamp(15px,1.55vw,22px);color:#fff;font-weight:700;margin-top:auto;padding-top:.8vw}
.short{font-size:clamp(14px,1.35vw,19px);color:#b6c4dc;font-family:Consolas,"Roboto Mono",monospace}
.go{position:absolute;inset-inline-end:2vw;top:2vw;width:clamp(44px,4.6vw,64px);height:clamp(44px,4.6vw,64px);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:clamp(24px,2.6vw,36px);background:rgba(255,255,255,.14)}
.card:hover,.card:focus,.card:focus-visible{transform:scale(1.035);border-color:#fff;box-shadow:0 0 0 6px rgba(255,255,255,.28),0 22px 60px rgba(0,0,0,.55)}
.card.classic:focus,.card.classic:hover{background:linear-gradient(160deg,#2563eb,#1e3a8a)}
.card.pro:focus,.card.pro:hover{background:linear-gradient(160deg,#f2652f,#9a3412)}
.card:focus .go,.card:hover .go{background:#fff;color:#05070d}
.card.off{opacity:.6}
.paused{font-size:clamp(15px,1.5vw,21px);color:#ffd8a8;font-weight:700}
.lang:focus,.lang:hover,.steps a:focus,.steps a:hover,.foot a:focus,.foot a:hover{outline:4px solid #fff;outline-offset:3px;background:rgba(255,255,255,.12)}
.steps{margin-top:2.4vw;display:flex;gap:2.4vw}
.step{flex:1 1 0;padding:1.4vw 1.8vw;border-radius:20px;background:rgba(255,255,255,.05);border:2px solid rgba(255,255,255,.08);font-size:clamp(15px,1.5vw,21px);color:#d6deeb}
.step b{display:block;color:#fff;font-size:clamp(16px,1.6vw,23px);margin-bottom:4px}
.steps a{color:#7dd3fc;font-weight:800;text-decoration:none;border-radius:8px;padding:0 4px;white-space:nowrap}
.foot{margin-top:2vw;display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;font-size:clamp(13px,1.2vw,17px);color:#8d98ad}
.foot a{color:#cfe3ff;text-decoration:none;font-weight:700;border-radius:8px;padding:2px 6px}
@media (max-width:720px){.wrap{padding:24px 16px}.cards,.steps{flex-direction:column;gap:14px}.card{flex:none;min-height:0;padding:22px;border-radius:22px}.go{top:20px;inset-inline-end:20px}.step{flex:none;padding:16px}h1{margin-bottom:8px}.lead{margin-bottom:18px}.steps{margin-top:18px}.foot{margin-top:18px}header{margin-bottom:18px}}
@media (prefers-reduced-motion:reduce){.card{transition:none}.card:focus,.card:hover{transform:none}}
`;

export async function GET(request: Request) {
  const lang = pickLang(request);
  const t = copy[lang];
  const [classic, pro] = await Promise.all([readReleaseFacts("moplayer"), readReleaseFacts("moplayer2")]);
  const firstFocus = classic.available ? "dl-classic" : pro.available ? "dl-pro" : null;
  const activatePath = `/${lang}/activate`;

  const html = `<!doctype html>
<html lang="${lang}" dir="${lang === "ar" ? "rtl" : "ltr"}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(t.title)} — MoPlayer</title>
<meta name="description" content="${escapeHtml(t.lead)}">
<meta name="robots" content="noindex,follow">
<meta name="color-scheme" content="dark">
<meta name="theme-color" content="#05070d">
<link rel="icon" href="/icon.png">
<link rel="alternate" hreflang="${t.otherLang}" href="/tv?lang=${t.otherLang}">
<style>${styles}</style>
</head>
<body>
<div class="wrap">
<header>
  <span class="brand"><span class="mark" aria-hidden="true"><svg viewBox="0 0 24 24"><path fill="#fff" d="M8 5.5v13a1 1 0 0 0 1.53.85l10.2-6.5a1 1 0 0 0 0-1.7L9.53 4.65A1 1 0 0 0 8 5.5z"/></svg></span>MoPlayer</span>
  <a class="lang" href="/tv?lang=${t.otherLang}" lang="${t.otherLang}" hreflang="${t.otherLang}">${escapeHtml(t.other)}</a>
</header>
<main>
<h1>${escapeHtml(t.title)}</h1>
<p class="lead">${escapeHtml(t.lead)}</p>
<div class="cards">
${card(classic, lang, "classic", firstFocus === "dl-classic")}
${card(pro, lang, "pro", firstFocus === "dl-pro")}
</div>
<div class="steps">
  <p class="step"><b>${escapeHtml(t.installTitle)}</b>${escapeHtml(t.install)}</p>
  <p class="step"><b>QR</b>${escapeHtml(t.activate)} <a href="${activatePath}" dir="ltr">moalfarras.space/activate</a></p>
</div>
</main>
<footer class="foot">
  <span>${escapeHtml(t.legal)}</span>
  <a href="/${lang}/apps/moplayer">${escapeHtml(t.pageLink)}</a>
</footer>
</div>
${firstFocus ? `<script>try{var e=document.getElementById("${firstFocus}");if(e&&document.activeElement!==e)e.focus()}catch(_){}</script>` : ""}
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Content-Language": lang,
      Vary: "Accept-Language",
      "X-Robots-Tag": "noindex, follow",
    },
  });
}

export const HEAD = GET;
