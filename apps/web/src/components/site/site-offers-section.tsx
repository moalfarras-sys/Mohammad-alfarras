import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import type { SiteViewModel } from "./site-view-model";

export function SiteOffersSection({
  model,
  placement,
}: {
  model: SiteViewModel;
  placement: SiteViewModel["offers"][number]["placement"];
}) {
  const offers = model.offers.filter((offer) => offer.placement === placement || offer.placement === "all");
  if (!offers.length) return null;

  return (
    <section className="fresh-section site-offers-section" data-placement={placement}>
      <div className={offers.some((offer) => offer.style === "cards") ? "site-offers-grid" : "site-offers-stack"}>
        {offers.map((offer) => (
          <article key={offer.id} className={`site-offer site-offer-${offer.style}`}>
            <div className="site-offer-copy">
              {offer.badge ? <span className="fresh-eyebrow">{offer.badge}</span> : null}
              <h2>{offer.title}</h2>
              <p>{offer.body}</p>
              {offer.ctaLabel ? (
                <Link href={offer.ctaHref} prefetch={false} className="fresh-button fresh-button-primary">
                  {offer.ctaLabel}
                  <ArrowUpRight size={16} />
                </Link>
              ) : null}
            </div>
            <div className="site-offer-media">
              <Image
                src={offer.image}
                alt={offer.title}
                fill
                sizes="(max-width: 900px) 92vw, 420px"
                className="fresh-image"
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
