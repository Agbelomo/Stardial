/* @vitest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { writeRouteContext } from "@/lib/route-context";
import { NotFoundRecovery } from "./not-found-recovery";

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

describe("NotFoundRecovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
    window.history.replaceState({}, "", "/fr/missing-page");
  });

  it("links back to the previous route and to the locale home page", () => {
    writeRouteContext({
      path: "/fr/missing-page",
      pathname: "/fr/missing-page",
      previousPath: "/fr/create",
      capturedAt: 1
    });

    render(<NotFoundRecovery />);

    expect(screen.getByRole("link", { name: "Go back" })).toHaveAttribute("href", "/fr/create");
    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute("href", "/fr");
    expect(screen.getByTestId("not-found-route")).toHaveTextContent("/fr/missing-page");
  });

  it("falls back to browser history when no previous route exists", () => {
    render(<NotFoundRecovery />);

    fireEvent.click(screen.getByRole("button", { name: "Go back" }));
    expect(backMock).toHaveBeenCalledTimes(1);
  });
});
