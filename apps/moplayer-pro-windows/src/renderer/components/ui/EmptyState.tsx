import type React from "react";

type EmptyStateProps = {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state is-premium">
      <span className="empty-state-icon">{icon}</span>
      <strong>{title}</strong>
      {description ? <p>{description}</p> : null}
      {action ? <div className="button-row">{action}</div> : null}
    </div>
  );
}
