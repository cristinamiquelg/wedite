"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { trackPageView } from "@/lib/analytics";

// Records one page_view per client-side navigation. Renders nothing.
export default function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    // The private dashboard isn't part of the product; never count it.
    if (pathname.startsWith("/ops/")) return;
    trackPageView(pathname);
  }, [pathname]);

  return null;
}
