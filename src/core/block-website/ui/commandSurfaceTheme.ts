import type { CSSProperties } from "react";

export const commandSurfaceVars = {
  "--command-surface-bg":
    "linear-gradient(180deg, color-mix(in srgb, var(--color-obsidian-950) 97%, black 3%), color-mix(in srgb, var(--color-obsidian-900) 94%, black 6%) 100%)",
  "--command-surface-tab-bg":
    "linear-gradient(180deg, color-mix(in srgb, var(--color-obsidian-900) 94%, transparent), color-mix(in srgb, var(--color-obsidian-950) 92%, transparent))",
  "--command-surface-border":
    "color-mix(in srgb, var(--chat-accent-light) 18%, var(--border-color))",
  "--command-surface-fg": "color-mix(in srgb, var(--chat-accent-light) 78%, white 22%)",
  "--command-surface-muted": "color-mix(in srgb, var(--chat-accent-light) 56%, white 18%)",
  "--command-surface-code": "color-mix(in srgb, var(--chat-accent-light) 72%, white 28%)",
  "--command-surface-active-text": "color-mix(in srgb, var(--primary-light) 82%, white 18%)",
  "--command-surface-active-bg": "color-mix(in srgb, var(--primary-color) 15%, transparent)",
  "--command-surface-hover-bg": "color-mix(in srgb, var(--chat-accent-light) 9%, transparent)",
  "--command-surface-button-bg": "color-mix(in srgb, var(--chat-accent-light) 11%, transparent)",
  "--command-surface-button-bg-hover":
    "color-mix(in srgb, var(--chat-accent-light) 18%, transparent)",
  "--command-surface-button-border":
    "color-mix(in srgb, var(--chat-accent-light) 22%, transparent)",
} as CSSProperties;
