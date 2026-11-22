import type { NextFunction, Request, Response } from "express";
import { sendErrorResponse } from "../lib/api-error.js";

/**
 * Canonical API versioning constants (Semantic Versioning 2.0.0).
 *
 * - `API_MAJOR_VERSION` is the explicit URL prefix (`/v1/...`) and major
 *   contract identifier advertised in `X-API-Version`.
 * - `API_SEMANTIC_VERSION` is the full semver contract version advertised in
 *   `API-Version`.
 *
 * Breaking changes require a new major version prefix (`/v2/...`) and a
 * documented deprecation/sunset window on the previous major version using
 * `middleware/deprecation.ts`.
 */
export const API_MAJOR_VERSION = "v1" as const;
export const API_SEMANTIC_VERSION = "1.0.0" as const;
export const SUPPORTED_API_MAJOR_VERSIONS = [API_MAJOR_VERSION] as const;

export const API_VERSION_HEADER = "API-Version";
export const X_API_VERSION_HEADER = "X-API-Version";

const V1_ALIASES = new Set(["v1", "1", "1.0", "1.0.0"]);

/**
 * Normalizes a client-supplied version token (e.g. `v1`, `1`, `1.0`, `1.0.0`)
 * to a supported major version identifier, or returns `null` if unsupported.
 */
export function normalizeRequestedVersion(raw: string): (typeof SUPPORTED_API_MAJOR_VERSIONS)[number] | null {
  const normalized = raw.trim().toLowerCase();
  if (V1_ALIASES.has(normalized)) {
    return API_MAJOR_VERSION;
  }
  return null;
}

/**
 * Middleware that:
 * 1. Advertises the active API version on every response via `API-Version`
 *    (full semantic version) and `X-API-Version` (major version).
 * 2. Validates optional header-based version negotiation (`X-API-Version` or
 *    `Accept-Version`) and rejects unsupported versions with a consistent
 *    `400 UNSUPPORTED_API_VERSION` error envelope.
 */
export function apiVersionMiddleware(req: Request, res: Response, next: NextFunction): void {
  res.setHeader(API_VERSION_HEADER, API_SEMANTIC_VERSION);
  res.setHeader(X_API_VERSION_HEADER, API_MAJOR_VERSION);
  res.locals.apiVersion = API_MAJOR_VERSION;
  res.locals.apiSemanticVersion = API_SEMANTIC_VERSION;

  const xApiVersion = req.header("x-api-version");
  const acceptVersion = req.header("accept-version");

  const requestedHeader = xApiVersion ?? acceptVersion;
  if (requestedHeader !== undefined && requestedHeader.trim() !== "") {
    const resolved = normalizeRequestedVersion(requestedHeader);
    if (!resolved) {
      sendErrorResponse(res, 400, {
        error: "unsupported_api_version",
        code: "UNSUPPORTED_API_VERSION",
        message: `Unsupported API version. Supported versions: ${SUPPORTED_API_MAJOR_VERSIONS.join(", ")}.`,
        details: {
          requested: requestedHeader.trim(),
          supported: [...SUPPORTED_API_MAJOR_VERSIONS],
          current: API_SEMANTIC_VERSION,
        },
      });
      return;
    }

    if (
      xApiVersion !== undefined &&
      acceptVersion !== undefined &&
      acceptVersion.trim() !== "" &&
      normalizeRequestedVersion(acceptVersion) !== resolved
    ) {
      sendErrorResponse(res, 400, {
        error: "unsupported_api_version",
        code: "UNSUPPORTED_API_VERSION",
        message: `Unsupported API version. Supported versions: ${SUPPORTED_API_MAJOR_VERSIONS.join(", ")}.`,
        details: {
          requested: acceptVersion.trim(),
          supported: [...SUPPORTED_API_MAJOR_VERSIONS],
          current: API_SEMANTIC_VERSION,
        },
      });
      return;
    }
  }

  next();
}
