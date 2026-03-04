"use client";
import dynamic from "next/dynamic";

export const CommandPalette = dynamic(
  () =>
    import("@/components/docs/CommandPalette").then((m) => ({ default: m.CommandPalette })),
  { ssr: false },
);
export const CookieConsent = dynamic(
  () => import("@/components/CookieConsent").then((m) => ({ default: m.CookieConsent })),
  { ssr: false },
);
export const ConsoleCapture = dynamic(
  () => import("@/components/errors/ConsoleCapture").then((m) => ({ default: m.ConsoleCapture })),
  { ssr: false },
);
export const IframeErrorBridge = dynamic(
  () =>
    import("@/components/errors/IframeErrorBridge").then((m) => ({
      default: m.IframeErrorBridge,
    })),
  { ssr: false },
);
export const PersonalizedWelcome = dynamic(
  () =>
    import("@/components/landing/PersonalizedWelcome").then((m) => ({
      default: m.PersonalizedWelcome,
    })),
  { ssr: false },
);
