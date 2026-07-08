import { ArrowUpRight, Compass, Home, Languages } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// Arabic-first, matching the site's default locale.
const nodes = [
  ["الرئيسية", "/ar"],
  ["الأعمال", "/ar/work"],
  ["MoPlayer", "/ar/apps/moplayer"],
  ["يوتيوب", "/ar/youtube"],
  ["السيرة", "/ar/cv"],
  ["تواصل", "/ar/contact"],
] as const;

export default function GlobalNotFound() {
  return (
    <main className="not-found-os">
      <section className="not-found-card">
        <div className="not-found-logo">
          <span aria-hidden="true" />
          <Image src="/images/logo.png" alt="Mohammad Alfarras logo" width={74} height={74} />
        </div>

        <p className="fresh-eyebrow">
          <Compass size={15} />
          إشارة مفقودة / Lost signal
        </p>
        <h1>404</h1>

        <div className="not-found-copy">
          <h2 dir="rtl">هذه الصفحة غير موجودة.</h2>
          <p dir="rtl">ربما تغيّر الرابط أو كُتب بشكل غير صحيح. اختر مساراً واضحاً للعودة إلى الموقع.</p>
          <h2>This page could not be found.</h2>
          <p>The link may be old, moved, or mistyped. Choose a stable route below to continue.</p>
        </div>

        <div className="not-found-actions">
          <Link href="/ar" className="fresh-button fresh-button-primary magnetic-surface">
            <Home size={17} />
            الرئيسية العربية
          </Link>
          <Link href="/en" className="fresh-button magnetic-surface">
            <Languages size={17} />
            English home
          </Link>
        </div>

        <div className="not-found-routes" dir="rtl">
          {nodes.map(([node, href], index) => (
            <Link key={node} href={href} className="magnetic-surface">
              <span>{String(index + 1).padStart(2, "0")}</span>
              {node}
              <ArrowUpRight size={14} />
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
