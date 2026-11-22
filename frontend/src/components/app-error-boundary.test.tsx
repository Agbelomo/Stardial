/* @vitest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { captureCurrentRoute, readRouteContext } from "@/lib/route-context";
import { AppErrorBoundary } from "./app-error-boundary";

const { backMock } = vi.hoisted(() => ({ backMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: backMock })
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  )
}));

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn()
}));

function Boom(): never {
  throw new Error("boom");
}

describe("AppErrorBoundary", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.history.replaceState({}, "", "/en/manage");
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("preserves the failed route and offers recovery actions", () => {
    render(
      <AppErrorBoundary>
        <Boom />
      </AppErrorBoundary>
    );

    expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute("href", "/en");
    expect(readRouteContext()?.path).toBe("/en/manage");
  });

  it("recovers its children when retry succeeds", () => {
    let shouldThrow = true;
    function MaybeBoom() {
      if (shouldThrow) return <Boom />;
      return <div>recovered</div>;
    }

    render(
      <AppErrorBoundary>
        <MaybeBoom />
      </AppErrorBoundary>
    );

    shouldThrow = false;
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(screen.getByText("recovered")).toBeInTheDocument();
  });

  it("retains an earlier route as the recovery destination", () => {
    window.history.replaceState({}, "", "/en/dashboard");
    captureCurrentRoute();
    window.history.replaceState({}, "", "/en/manage");

    render(
      <AppErrorBoundary>
        <Boom />
      </AppErrorBoundary>
    );

    expect(screen.getByRole("link", { name: "Go back" })).toHaveAttribute("href", "/en/dashboard");
  });
});
