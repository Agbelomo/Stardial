/* @vitest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { writeRouteContext } from "@/lib/route-context";
import { ErrorRecoveryActions } from "./error-recovery-actions";

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

describe("ErrorRecoveryActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
    window.history.replaceState({}, "", "/fr/dashboard");
  });

  it("offers retry, previous-page and locale-aware home recovery", () => {
    writeRouteContext({
      path: "/fr/dashboard",
      pathname: "/fr/dashboard",
      previousPath: "/fr/create",
      capturedAt: 1
    });
    const retry = vi.fn();

    render(<ErrorRecoveryActions retry={retry} retryLabel="Retry" backLabel="Back" homeLabel="Home" />);

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(retry).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("link", { name: "Back" })).toHaveAttribute("href", "/fr/create");
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/fr");
    expect(screen.getByTestId("error-recovery-route")).toHaveTextContent("/fr/dashboard");
  });

  it("falls back to browser history when no previous route was stored", () => {
    render(<ErrorRecoveryActions />);

    fireEvent.click(screen.getByRole("button", { name: "Go back" }));
    expect(backMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute("href", "/fr");
  });

  it("omits the retry action when no retry handler is provided", () => {
    render(<ErrorRecoveryActions />);

    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
  });
});
