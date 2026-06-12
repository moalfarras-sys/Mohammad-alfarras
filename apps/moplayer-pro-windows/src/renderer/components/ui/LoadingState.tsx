import { Loader2 } from "lucide-react";

type LoadingStateProps = {
  label?: string;
  compact?: boolean;
};

export function LoadingState({ label, compact = false }: LoadingStateProps) {
  return (
    <div className={`loading-state ${compact ? "is-compact" : ""}`}>
      <Loader2 className="spin" size={compact ? 20 : 32} />
      {label ? <span>{label}</span> : null}
    </div>
  );
}
