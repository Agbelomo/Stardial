"use client";

/**
 * CheckoutSection — Issue #59
 *
 * Keeps the primary purchase/action CTA visible without scrolling on small
 * screens by rendering a sticky bottom bar on mobile and an inline card on
 * larger viewports. The sticky bar uses `position: sticky` on a wrapper that
 * stays in document flow so it never obscures content.
 */

interface CheckoutSectionProps {
  /** Label displayed on the primary CTA button. */
  ctaLabel?: string;
  /** Callback fired when the CTA is activated. */
  onCheckout?: () => void;
  /** Optional plan/product name shown above the button. */
  planName?: string;
  /** Optional price string shown above the button. */
  price?: string;
  /** Whether the action is currently processing. */
  isLoading?: boolean;
}

export function CheckoutSection({
  ctaLabel = "Get Started",
  onCheckout,
  planName = "Stardial Pro",
  price,
  isLoading = false,
}: CheckoutSectionProps) {
  const ctaContent = (
    <div className="flex flex-col gap-3">
      {(planName || price) && (
        <div className="flex items-baseline justify-between">
          {planName && (
            <span className="text-sm font-semibold text-[var(--brand-text)]">
              {planName}
            </span>
          )}
          {price && (
            <span className="font-display text-lg font-bold text-[var(--brand-accent)]">
              {price}
            </span>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={onCheckout}
        disabled={isLoading}
        aria-busy={isLoading}
        className="premium-button w-full rounded-full bg-[var(--brand-primary)] px-8 py-4 text-sm font-bold text-white shadow-lg disabled:opacity-60"
      >
        {isLoading ? "Processing…" : ctaLabel}
      </button>
    </div>
  );

  return (
    <>
      {/* ── Inline card — visible on md+ screens ─────────────────────── */}
      <div className="glass-card hidden rounded-[2rem] p-6 md:block md:p-8">
        {ctaContent}
      </div>

      {/* ── Sticky bottom bar — visible only on small screens ─────────── *
       *  Uses `sticky bottom-0` so it scrolls with the page until it     *
       *  reaches the viewport bottom, then pins there. This avoids the   *
       *  "below the fold" problem without covering content with a fixed   *
       *  overlay.                                                         */}
      <div className="sticky bottom-0 z-30 md:hidden">
        {/* Gradient fade above the bar so text beneath isn't hard-clipped */}
        <div
          aria-hidden="true"
          className="pointer-events-none h-6 bg-gradient-to-t from-[var(--brand-surface)] to-transparent"
        />
        <div className="border-t border-white/5 bg-[var(--brand-surface)] px-4 pb-safe-or-4 pt-4 shadow-[0_-8px_24px_rgba(0,0,0,0.5)]">
          {ctaContent}
        </div>
      </div>
    </>
  );
}
