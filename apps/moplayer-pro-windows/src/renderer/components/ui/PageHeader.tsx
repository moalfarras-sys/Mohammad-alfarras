import type React from "react";

type PageHeaderProps = {
  eyebrow?: React.ReactNode;
  title: string;
  description?: string;
};

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <header className="page-header">
      {eyebrow ? <div className="page-header-eyebrow">{eyebrow}</div> : null}
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
    </header>
  );
}
