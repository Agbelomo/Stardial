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

export interface ErrorRecoveryActionsProps {
  retry?: () => void;
  retryLabel?: string;
  backLabel?: string;
  homeLabel?: string;
  contextLabel?: string;
}

export function ErrorRecoveryActions({
  retry,
  retryLabel = "Try again",
  backLabel = "Go back",
  homeLabel = "Back to home",
  contextLabel = "You were on:"
}: ErrorRecoveryActionsProps) {
  const router = useRouter();
  const [context, setContext] = useState<RouteContext | null>(null);

  useEffect(() => {
    setContext(captureCurrentRoute());
  }, []);

  const previousPath = context?.previousPath;
  const homeHref = homeHrefForPath(context?.path ?? null);

  return (
    <div className="mt-5 flex flex-wrap items-center gap-3" data-testid="error-recovery">
      {retry ? (
        <button
          type="button"
          onClick={retry}
          className="rounded-full bg-red-900 px-5 py-2 text-sm font-semibold text-white"
        >
          {retryLabel}
        </button>
      ) : null}
      {isSafeInternalPath(previousPath) ? (
        <Link
          href={previousPath}
          className="rounded-full border border-red-400/60 px-5 py-2 text-sm font-semibold"
        >
          {backLabel}
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-full border border-red-400/60 px-5 py-2 text-sm font-semibold"
        >
          {backLabel}
        </button>
      )}
      <Link
        href={homeHref}
        className="rounded-full border border-red-400/60 px-5 py-2 text-sm font-semibold"
      >
        {homeLabel}
      </Link>
      {context ? (
        <p className="w-full text-xs text-red-900/60" data-testid="error-recovery-route">
          {contextLabel} <code className="font-mono">{context.path}</code>
        </p>
      ) : null}
    </div>
  );
}
