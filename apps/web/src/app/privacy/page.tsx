import type { Metadata } from "next";
import Link from "next/link";

import { readAppEcosystem } from "@/lib/app-ecosystem";

export const metadata: Metadata = {
  title: "MoPlayer Privacy",
  description: "Privacy policy for MoPlayer under moalfarras.space.",
  alternates: {
    canonical: "https://moalfarras.space/privacy",
  },
};

export default async function PrivacyPage() {
  const { product } = await readAppEcosystem("moplayer");

  const sections = [
    {
      title: "What MoPlayer is",
      body: "MoPlayer is a playback interface and application shell. It does not provide channels, playlists, or media subscriptions by itself.",
    },
    {
      title: "What data is handled",
      body: "For the app page and support flow, the website only stores the information you submit intentionally through the support form: your name, email address, and message.",
    },
    {
      title: "In-app credentials",
      body: "Within the Android app itself, credentials are handled locally on-device using encrypted storage patterns. They are not intended to be exposed through the website frontend.",
    },
    {
      title: "Support requests",
      body: "Support form submissions are stored in the shared Supabase backend strictly for follow-up and issue resolution.",
    },
    {
      title: "Third-party content sources",
      body: "Users remain responsible for the legality and ownership of the media sources they connect to the app.",
    },
  ];

  return (
    <main className="mx-auto max-w-5xl px-5 py-12 text-white md:px-8 md:py-16">
      <div className="rounded-[2.4rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03)),#08111f] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.4)] backdrop-blur-2xl md:p-10">
        <p className="text-[11px] font-black uppercase tracking-[0.28em] text-primary">MoPlayer privacy</p>
        <h1 className="mt-4 text-4xl font-black md:text-5xl">Privacy policy</h1>
        <p className="mt-4 max-w-3xl text-sm leading-8 text-white/70">
          This policy covers the product surface published at <code>/app</code>, the release download flow, and the support requests stored in the shared Moalfarras backend.
        </p>

        <div className="mt-8 grid gap-4">
          {sections.map((section) => (
            <section key={section.title} className="rounded-[1.8rem] border border-white/8 bg-black/15 p-5">
              <h2 className="text-xl font-black">{section.title}</h2>
              <p className="mt-3 text-sm leading-8 text-white/68">{section.body}</p>
            </section>
          ))}
        </div>

        <div className="mt-8 rounded-[1.8rem] border border-white/8 bg-black/15 p-5">
          <h2 className="text-xl font-black">Contact</h2>
          <p className="mt-3 text-sm leading-8 text-white/68">
            For privacy or support questions, email <a href={`mailto:${product.support_email}`} className="text-primary">{product.support_email}</a> or use the{" "}
            <Link href="/support" className="text-primary">support page</Link>.
          </p>
        </div>
      </div>
    </main>
  );
}
