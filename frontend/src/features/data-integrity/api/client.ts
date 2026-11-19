"use client";

import { ApiError } from "../../../lib/api-client";
import { getEnv } from "../../../lib/env";

export interface DataIntegrityReport {
  status: "ok" | "drift_detected" | "error";
  checkedAt: string;
  details?: Record<string, unknown>;
}

export class DataIntegrityApiClient {
  private baseUrl: string;
  private defaultTimeout: number;

  constructor(baseUrl?: string, timeout?: number) {
    this.baseUrl = baseUrl ?? getEnv().NEXT_PUBLIC_API_BASE_URL;
    this.defaultTimeout = timeout ?? 30_000;
  }

  private async requestJson<T>(path: string, timeoutMs?: number): Promise<T> {
    const timeout = timeoutMs ?? this.defaultTimeout;
    const controller = new AbortController();
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    try {
      const timeoutError = new Error(`Request timed out after ${timeout}ms: ${path}`);
      const response = await Promise.race([
        fetch(`${this.baseUrl}${path}`, {
          signal: controller.signal,
          headers: { "Content-Type": "application/json" },
        }),
        new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => {
            controller.abort();
            reject(timeoutError);
          }, timeout);
        }),
      ]);

      const body = (await response.json().catch(() => null)) as unknown;
      if (!response.ok) {
        const status = response.status;
        let message = `Failed request (status ${status})`;
        let code: string | undefined;
        if (body && typeof body === "object") {
          const p = body as Record<string, unknown>;
          if (typeof p.message === "string" && p.message.trim()) message = p.message;
          if (typeof p.error === "string" && p.error.trim()) code = p.error;
          else if (typeof p.code === "string" && p.code.trim()) code = p.code;
        }
        throw new ApiError(status, message, code);
      }
      return body as T;
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        throw new Error(`Request timed out after ${timeout}ms: ${path}`, { cause: err });
      }
      throw err;
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  async getReport(timeout?: number): Promise<DataIntegrityReport> {
    return this.requestJson<DataIntegrityReport>("/ops/data-integrity", timeout);
  }
}
