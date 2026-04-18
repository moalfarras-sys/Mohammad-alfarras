import type { Metadata } from "next";
import Link from "next/link";

import { readAppEcosystem } from "@/lib/app-ecosystem";

export const metadata: Metadata = {
  title: "MoPlayer Support",
  description: "Support contact page for MoPlayer downloads, installation, compatibility, and release help.",
  alternates: {
    canonical: "https://moalfarras.space/support",
  },
};

export default async function SupportPage({
  searchParams,
}: {
  searchParams?: Promise<{ support?: string }>;
}) {
  const ecosystem = await readAppEcosystem("moplayer");
  const { product } = ecosystem;
  const query = (await searchParams) ?? {};
  const isSent = query.support === "sent";

  return (
    <main className="mx-auto max-w-6xl px-5 py-12 text-white md:px-8 md:py-16">
      <div className="rounded-[2.6rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03)),#07101d] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.4)] backdrop-blur-2xl md:p-10">
        <p className="text-[11px] font-black uppercase tracking-[0.28em] text-primary">MoPlayer support</p>
        <h1 className="mt-4 text-4xl font-black md:text-5xl">Support and installation help</h1>
        <p className="mt-4 max-w-3xl text-sm leading-8 text-white/70">
          Use this page for download issues, installation help, Android TV compatibility questions, or release-specific support.
        </p>

        {isSent ? (
          <div className="mt-6 rounded-[1.4rem] border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-medium text-emerald-100">
            Your request was sent successfully. The message is now available in the shared support inbox.
          </div>
        ) : null}

        <div className="mt-8 grid gap-8 lg:grid-cols-[0.48fr_0.52fr]">
          <section className="space-y-4 rounded-[1.8rem] border border-white/8 bg-black/15 p-5">
            <h2 className="text-2xl font-black">Direct contact</h2>
            <p className="text-sm leading-8 text-white/68">
              Email: <a className="text-primary" href={`mailto:${product.support_email}`}>{product.support_email}</a>
            </p>
            <p className="text-sm leading-8 text-white/68">
              WhatsApp: <a className="text-primary" href={product.support_whatsapp} target="_blank" rel="noreferrer">{product.support_whatsapp}</a>
            </p>
            <p className="text-sm leading-8 text-white/68">
              Privacy policy: <Link className="text-primary" href="/privacy">/privacy</Link>
            </p>
            <p className="text-sm leading-8 text-white/68">
              Product page: <Link className="text-primary" href="/app">/app</Link>
            </p>
          </section>

          <form action="/api/app/support" method="post" className="grid gap-3 rounded-[1.8rem] border border-white/8 bg-black/15 p-5">
            <input type="hidden" name="product_slug" value={product.slug} />
            <input name="name" required placeholder="Your name" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" />
            <input name="email" type="email" required placeholder="Your email" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" />
            <textarea name="message" required placeholder="Describe the problem or question" className="min-h-40 rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" />
            <button type="submit" className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-black text-black">
              Send support request
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
