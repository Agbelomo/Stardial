"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { captureCurrentRoute } from "@/lib/route-context";

export function RouteContextTracker() {
  const pathname = usePathname();

  useEffect(() => {
    captureCurrentRoute();
    window.addEventListener("popstate", captureCurrentRoute);
    return () => window.removeEventListener("popstate", captureCurrentRoute);
  }, [pathname]);

  return null;
}
