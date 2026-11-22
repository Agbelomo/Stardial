"use client";

import { ErrorRecoveryActions } from "@/components/error-recovery-actions";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-16">
      <div className="rounded-2xl border border-red-400/40 bg-red-50 p-6 text-red-900">
        <h1 className="font-display text-2xl">Unexpected application error</h1>
        <p className="mt-2 text-sm text-red-900/80">{error.message}</p>
        <ErrorRecoveryActions retry={reset} />
      </div>
    </main>
  );
}
