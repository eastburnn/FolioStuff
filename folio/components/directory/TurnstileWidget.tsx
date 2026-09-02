"use client";

import { useEffect, useRef } from "react";

// Renders a Cloudflare Turnstile widget when NEXT_PUBLIC_TURNSTILE_SITE_KEY is
// set; renders nothing otherwise. Inside a form, the widget adds a hidden
// "cf-turnstile-response" input that server actions verify.

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      remove: (id: string) => void;
      reset: (id?: string) => void;
    };
    __turnstileOnLoad?: () => void;
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=__turnstileOnLoad";

export default function TurnstileWidget({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!SITE_KEY || !ref.current) return;
    let widgetId: string | undefined;

    const renderWidget = () => {
      if (window.turnstile && ref.current && !widgetId) {
        widgetId = window.turnstile.render(ref.current, {
          sitekey: SITE_KEY,
          theme: "dark",
        });
      }
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      window.__turnstileOnLoad = renderWidget;
      if (!document.querySelector(`script[src^="https://challenges.cloudflare.com/turnstile"]`)) {
        const script = document.createElement("script");
        script.src = SCRIPT_SRC;
        script.async = true;
        document.head.appendChild(script);
      }
    }

    return () => {
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, []);

  if (!SITE_KEY) return null;
  return <div ref={ref} className={className} />;
}
