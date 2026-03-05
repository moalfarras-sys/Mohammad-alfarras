import Link from "next/link";

export default function LocaleNotFound() {
  return (
    <section className="page-section">
      <div className="container section-stack">
        <h2>Page not found</h2>
        <p>The requested page does not exist.</p>
        <Link className="btn primary" href="/ar">
          Back to home
        </Link>
      </div>
    </section>
  );
}
