import type React from "react";

type IconButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  label: string;
  active?: boolean;
  danger?: boolean;
  disabled?: boolean;
  className?: string;
};

export function IconButton({
  children,
  onClick,
  label,
  active = false,
  danger = false,
  disabled = false,
  className = "",
}: IconButtonProps) {
  return (
    <button
      type="button"
      className={`icon-button ${active ? "is-on" : ""} ${danger ? "is-danger" : ""} ${className}`.trim()}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}
