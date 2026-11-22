"use client";

/**
 * CookieBanner — Issue #61
 *
 * Design requirements:
 * - Does NOT cover or block the main content (bottom-anchored, not a modal overlay).
 * - Fully dismissible via "Accept" or "Decline" with preference persisted in
 *   localStorage so the banner never re-appears after a choice.
 * - Provides clear, plain-language choices so users can make an informed decision.
 * - Respects reduced-motion preferences.
 */

import { useEffect, useState } from "react";

const STORAGE_KEY = "stardial.cookie-consent";

type ConsentValue = "accepted" | "declined";

function readConsent(): ConsentValue | null {
  if (typeof window === "undefined") return null;
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === "accepted" || value === "declined") return value;
  } catch {
    // localStorage unavailable (private browsing, security policy)
  }
  return null;
}

function writeConsent(value: ConsentValue): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // ignore
  }
}

export function CookieBanner() {
  // null = not yet read (SSR), undefined = no stored preference, or the stored value
  const [consent, setConsent] = useState<ConsentValue | null | undefined>(null);

  useEffect(() => {
    setConsent(readConsent() ?? undefined);
  }, []);

  // Hidden until hydrated (avoids flash on initial SSR) and hidden once a
  // choice has been made.
  if (consent !== undefined) return null;

  function handleChoice(value: ConsentValue) {
    writeConsent(value);
    setConsent(value);
  }

  return (
    /*
     * `position: sticky` with `bottom-0` on a wrapper keeps the banner at
     * the natural end of the page flow. It only "sticks" to the viewport
     * bottom while the bottom of the page is in view, so it never floats
     * above main content the way a `fixed` overlay would.
     *
     * We wrap in an outer <div> that takes up space in the document so
     * content above is never obscured.
     */
    <div
      role="region"
      aria-label="Cookie consent"
      aria-live="polite"
      className="sticky bottom-0 z-40 w-full"
    >
      {/* Gradient fade above banner so it doesn't hard-cut the page */}
      <div
        aria-hidden="true"
        className="pointer-events-none h-8 bg-gradient-to-t from-[var(--brand-surface)] to-transparent"
      />

      <div className="border-t border-white/5 bg-[var(--brand-surface)] px-4 py-4 shadow-[0_-8px_32px_rgba(0,0,0,0.6)] sm:px-6 md:px-8">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Message */}
          <p className="text-sm leading-relaxed text-[var(--brand-muted)]">
            We use cookies to improve your experience and to understand how the
            app is used. No personal data is sold.{" "}
            <a
              href="/privacy"
              className="underline underline-offset-2 hover:text-[var(--brand-text)]"
            >
              Learn more
            </a>
            .
          </p>

          {/* Actions */}
          <div className="flex shrink-0 flex-wrap gap-3">
            <button
              type="button"
              onClick={() => handleChoice("declined")}
              className="rounded-full border border-white/20 px-5 py-2.5 text-xs font-semibold text-[var(--brand-muted)] transition-colors hover:border-white/40 hover:text-[var(--brand-text)]"
            >
              Decline
            </button>
            <button
              type="button"
              onClick={() => handleChoice("accepted")}
              className="premium-button rounded-full bg-[var(--brand-primary)] px-5 py-2.5 text-xs font-bold text-white"
            >
              Accept cookies
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
