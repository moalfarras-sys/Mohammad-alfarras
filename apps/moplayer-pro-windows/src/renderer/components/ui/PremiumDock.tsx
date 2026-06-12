import type React from "react";
import type { KeyboardEvent } from "react";

import type { ScreenId } from "../../../shared/types";

export type DockItem = {
  id: ScreenId;
  icon: React.ElementType;
  label: string;
};

type PremiumDockProps = {
  items: DockItem[];
  activeId: ScreenId;
  onNavigate: (id: ScreenId) => void;
};

function resolveActive(screen: ScreenId): ScreenId {
  if (screen === "episodes") return "series";
  if (screen === "license" || screen === "support") return "settings";
  return screen;
}

function focusDockItem(event: KeyboardEvent<HTMLElement>, direction: 1 | -1) {
  const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("[data-dock-item='true']"));
  const active = document.activeElement;
  const index = buttons.findIndex((button) => button === active);
  const nextIndex = index >= 0 ? (index + direction + buttons.length) % buttons.length : 0;
  buttons[nextIndex]?.focus();
}

export function PremiumDock({ items, activeId, onNavigate }: PremiumDockProps) {
  const active = resolveActive(activeId);
  return (
    <nav
      className="premium-dock"
      aria-label="Main navigation"
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") {
          event.preventDefault();
          focusDockItem(event, 1);
        }
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          focusDockItem(event, -1);
        }
      }}
    >
      <span className="dock-floor-glow" aria-hidden="true" />
      <div className="dock-pill">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              type="button"
              data-dock-item="true"
              className={`dock-item ${isActive ? "is-active" : ""}`}
              onClick={() => onNavigate(item.id)}
              aria-current={isActive ? "page" : undefined}
              aria-label={item.label}
              title={item.label}
            >
              <span className="dock-icon"><Icon size={19} strokeWidth={2.35} /></span>
              <span className="dock-label">{item.label}</span>
              <span className="dock-dot" aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
