"use client";

import Script from "next/script";
import { useId, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          theme?: "light" | "dark" | "auto";
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
        },
      ) => string;
    };
  }
}

export function TurnstileWidget({ onToken }: { onToken: (token: string) => void }) {
  const id = useId().replace(/:/g, "");
  const [ready, setReady] = useState(false);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  if (!siteKey) {
    // No key configured (e.g. local dev) — skip the widget rather than
    // block the form; the server falls back to rejecting in production.
    return null;
  }

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
        onReady={() => {
          if (ready) return;
          setReady(true);
          window.turnstile?.render(`#${id}`, {
            sitekey: siteKey,
            theme: "dark",
            callback: onToken,
            "expired-callback": () => onToken(""),
          });
        }}
      />
      <div id={id} className="min-h-[65px]" />
    </>
  );
}
