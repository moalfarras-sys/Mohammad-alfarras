import { ArrowUpRight, Compass, Home, Languages } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const nodes = [
  ["Home", "/en"],
  ["Work", "/en/work"],
  ["MoPlayer", "/en/apps/moplayer"],
  ["YouTube", "/en/youtube"],
  ["CV", "/en/cv"],
  ["Contact", "/en/contact"],
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
          Lost signal / إشارة مفقودة
        </p>
        <h1>404</h1>

        <div className="not-found-copy">
          <h2>The page stepped outside the Digital OS.</h2>
          <p>The link may be old, moved, or mistyped. Choose a stable route below to continue.</p>
          <h2 dir="rtl">هذه الصفحة خرجت من النظام الرقمي.</h2>
          <p dir="rtl">ربما تغيّر الرابط أو كُتب بشكل غير صحيح. اختر مساراً واضحاً للعودة إلى الموقع.</p>
        </div>

        <div className="not-found-actions">
          <Link href="/en" className="fresh-button fresh-button-primary magnetic-surface">
            <Home size={17} />
            English home
          </Link>
          <Link href="/ar" className="fresh-button magnetic-surface">
            <Languages size={17} />
            الرئيسية العربية
          </Link>
        </div>

        <div className="not-found-routes">
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
