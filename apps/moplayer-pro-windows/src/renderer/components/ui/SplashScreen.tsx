import { Loader2, Play } from "lucide-react";
import { APP_NAME } from "../../../shared/types";
import tvBanner from "../../assets/moplayer-tv-banner.png";

type SplashScreenProps = {
  label: string;
  version?: string;
  progress?: number;
};

export function SplashScreen({ label, version, progress = 0 }: SplashScreenProps) {
  const pct = Math.min(100, Math.max(0, progress));
  return (
    <main className="splash-screen is-premium">
      <div className="splash-glow-ring" aria-hidden="true" />
      <div className="splash-logo-wrap">
        <span className="splash-brand-badge">
          <Play size={28} strokeWidth={2.6} />
        </span>
        <img className="splash-art" src={tvBanner} alt="" />
      </div>
      <h1>{APP_NAME}</h1>
      {version ? <span className="splash-version">v{version}</span> : null}
      <p><Loader2 className="spin" size={16} /> {label}</p>
      <div className="splash-progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <span className="splash-progress-track">
          <i className="splash-progress-fill" style={{ width: `${pct}%` }} />
        </span>
      </div>
    </main>
  );
}
