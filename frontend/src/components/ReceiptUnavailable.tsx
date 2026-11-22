"use client";

import { useRouter } from "next/navigation";

import { ErrorRecoveryActions } from "./error-recovery-actions";

export function ReceiptUnavailable() {
  const router = useRouter();

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <div className="rounded-2xl border border-red-400/40 bg-red-50 p-6 text-red-900">
        <h1 className="font-display text-2xl">Receipt unavailable</h1>
        <p className="mt-2 text-sm text-red-900/80">
          The transaction service could not be reached. Try again later.
        </p>
        <ErrorRecoveryActions retry={() => router.refresh()} retryLabel="Try again" />
      </div>
    </main>
  );
}
