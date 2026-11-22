import { beforeEach, describe, expect, it } from "vitest";
import {
  ROUTE_CONTEXT_STORAGE_KEY,
  captureCurrentRoute,
  clearRouteContext,
  homeHrefForPath,
  isSafeInternalPath,
  readRouteContext,
  writeRouteContext
} from "./route-context";

describe("route context", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.history.replaceState({}, "", "/en/dashboard?tab=manage#history");
  });

  it("captures the full current route including query string and hash", () => {
    const context = captureCurrentRoute();

    expect(context).toMatchObject({
      path: "/en/dashboard?tab=manage#history",
      pathname: "/en/dashboard",
      previousPath: null
    });
    expect(window.sessionStorage.getItem(ROUTE_CONTEXT_STORAGE_KEY)).toContain("dashboard");
  });

  it("keeps the previous route when navigating to a new one", () => {
    captureCurrentRoute();
    window.history.replaceState({}, "", "/fr/receipts/abc");
    const context = captureCurrentRoute();

    expect(context?.path).toBe("/fr/receipts/abc");
    expect(context?.previousPath).toBe("/en/dashboard?tab=manage#history");
  });

  it("does not overwrite the previous route when recapturing the same route", () => {
    captureCurrentRoute();
    window.history.replaceState({}, "", "/fr/receipts/abc");
    captureCurrentRoute();

    const again = captureCurrentRoute();
    expect(again?.previousPath).toBe("/en/dashboard?tab=manage#history");
  });

  it("round-trips a stored context and clears it", () => {
    writeRouteContext({
      path: "/en/create",
      pathname: "/en/create",
      previousPath: "/en/dashboard",
      capturedAt: 123
    });

    expect(readRouteContext()).toEqual({
      path: "/en/create",
      pathname: "/en/create",
      previousPath: "/en/dashboard",
      capturedAt: 123
    });

    clearRouteContext();
    expect(readRouteContext()).toBeNull();
  });

  it("ignores malformed or unsafe stored context", () => {
    window.sessionStorage.setItem(ROUTE_CONTEXT_STORAGE_KEY, "not-json");
    expect(readRouteContext()).toBeNull();

    window.sessionStorage.setItem(
      ROUTE_CONTEXT_STORAGE_KEY,
      JSON.stringify({ path: "//evil.example.com", pathname: "/en" })
    );
    expect(readRouteContext()).toBeNull();
  });

  it("only accepts internal paths", () => {
    expect(isSafeInternalPath("/en/dashboard")).toBe(true);
    expect(isSafeInternalPath("//evil.example.com")).toBe(false);
    expect(isSafeInternalPath("/\\evil.example.com")).toBe(false);
    expect(isSafeInternalPath("javascript:alert(1)")).toBe(false);
    expect(isSafeInternalPath("/en/\nsetup")).toBe(false);
    expect(isSafeInternalPath(null)).toBe(false);
  });

  it("derives a locale-aware home link from the stored path", () => {
    expect(homeHrefForPath("/fr/receipts/abc")).toBe("/fr");
    expect(homeHrefForPath("/en")).toBe("/en");
    expect(homeHrefForPath("/")).toBe("/");
    expect(homeHrefForPath("//evil.example.com")).toBe("/");
    expect(homeHrefForPath(null)).toBe("/");
  });
});
