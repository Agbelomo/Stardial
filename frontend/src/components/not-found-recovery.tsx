"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  captureCurrentRoute,
  homeHrefForPath,
  isSafeInternalPath,
  type RouteContext
} from "@/lib/route-context";

export function NotFoundRecovery() {
  const router = useRouter();
  const [context, setContext] = useState<RouteContext | null>(null);

  useEffect(() => {
    setContext(captureCurrentRoute());
  }, []);

  const previousPath = context?.previousPath;
  const secondaryClass =
    "inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 font-semibold text-[var(--brand-text)]";

  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
      {isSafeInternalPath(previousPath) ? (
        <Link href={previousPath} className={secondaryClass}>
          Go back
        </Link>
      ) : (
        <button type="button" onClick={() => router.back()} className={secondaryClass}>
          Go back
        </button>
      )}
      <Link
        href={homeHrefForPath(context?.path ?? null)}
        className="premium-button inline-flex items-center gap-2 rounded-full bg-[var(--brand-primary)] px-6 py-3 font-semibold text-white"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        Back to home
      </Link>
      {context ? (
        <p className="w-full text-sm text-[var(--brand-muted)]" data-testid="not-found-route">
          You were on: <code className="font-mono">{context.path}</code>
        </p>
      ) : null}
    </div>
  );
}
