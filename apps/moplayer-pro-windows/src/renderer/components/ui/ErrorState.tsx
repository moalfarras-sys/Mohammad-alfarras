import { AlertTriangle } from "lucide-react";
import { OrangeButton } from "./OrangeButton";

type ErrorStateProps = {
  title: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
};

export function ErrorState({ title, message, onRetry, retryLabel = "Retry" }: ErrorStateProps) {
  return (
    <div className="error-state">
      <AlertTriangle size={36} />
      <strong>{title}</strong>
      {message ? <p>{message}</p> : null}
      {onRetry ? (
        <OrangeButton onClick={onRetry}>{retryLabel}</OrangeButton>
      ) : null}
    </div>
  );
}
