import type React from "react";
import { Loader2 } from "lucide-react";

type OrangeButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  loading?: boolean;
  wide?: boolean;
  variant?: "primary" | "ghost";
  className?: string;
};

export function OrangeButton({
  children,
  onClick,
  type = "button",
  disabled = false,
  loading = false,
  wide = false,
  variant = "primary",
  className = "",
}: OrangeButtonProps) {
  const base = variant === "primary" ? "primary-button" : "ghost-button";
  return (
    <button
      type={type}
      className={`${base} ${wide ? "is-wide" : ""} ${className}`.trim()}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? <Loader2 className="spin" size={16} /> : null}
      {children}
    </button>
  );
}
