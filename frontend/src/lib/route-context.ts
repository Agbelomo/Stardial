import { routing } from "@/i18n/routing";

export const ROUTE_CONTEXT_STORAGE_KEY = "stardial.route-context";

export interface RouteContext {
  path: string;
  pathname: string;
  previousPath: string | null;
  capturedAt: number;
}

export function isSafeInternalPath(value: string | null | undefined): value is string {
  if (!value || typeof value !== "string") return false;
  if (!value.startsWith("/")) return false;
  if (value.startsWith("//") || value.startsWith("/\\")) return false;
  for (let index = 0; index < value.length; index++) {
    const code = value.charCodeAt(index);
    if (code < 32 || code === 127) return false;
  }
  return true;
}

export function readRouteContext(): RouteContext | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(ROUTE_CONTEXT_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const candidate = parsed as Partial<RouteContext>;
    if (!isSafeInternalPath(candidate.path) || !isSafeInternalPath(candidate.pathname)) {
      return null;
    }
    return {
      path: candidate.path,
      pathname: candidate.pathname,
      previousPath: isSafeInternalPath(candidate.previousPath) ? candidate.previousPath : null,
      capturedAt: typeof candidate.capturedAt === "number" ? candidate.capturedAt : 0,
    };
  } catch {
    return null;
  }
}

export function writeRouteContext(context: RouteContext): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(ROUTE_CONTEXT_STORAGE_KEY, JSON.stringify(context));
  } catch {
    return;
  }
}

export function clearRouteContext(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(ROUTE_CONTEXT_STORAGE_KEY);
  } catch {
    return;
  }
}

export function captureCurrentRoute(): RouteContext | null {
  if (typeof window === "undefined") return null;
  const { pathname, search, hash } = window.location;
  const path = `${pathname}${search}${hash}`;
  const existing = readRouteContext();
  if (existing && existing.path === path) return existing;
  const context: RouteContext = {
    path,
    pathname,
    previousPath: existing?.path ?? null,
    capturedAt: Date.now()
  };
  writeRouteContext(context);
  return context;
}

export function homeHrefForPath(path: string | null | undefined): string {
  if (!isSafeInternalPath(path)) return "/";
  const locale = routing.locales.find((candidate) =>
    path === `/${candidate}` || path.startsWith(`/${candidate}/`)
  );
  return locale ? `/${locale}` : "/";
}
