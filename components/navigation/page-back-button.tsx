"use client";

import { IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";

const contextualBackPatterns = [
  /^\/cashier\/orders\/[^/]+(?:\/receipt)?$/,
  /^\/catalog\/products\/(?:new|[^/]+)$/,
  /^\/customers\/(?:new|[^/]+)$/,
  /^\/inventory\/(?!receipts(?:\/|$)|adjustments(?:\/|$)|counts(?:\/|$))[^/]+$/,
  /^\/inventory\/(?:receipts|adjustments|counts)\/(?:new|[^/]+)$/,
  /^\/orders\/(?:new|direct)$/,
  /^\/orders\/[^/]+(?:\/(?:edit|reverse|slip))?$/,
  /^\/release\/orders\/[^/]+(?:\/complete)?$/,
  /^\/reversals\/(?:new|[^/]+(?:\/approve)?)$/,
];

function backDestination(pathname: string) {
  if (
    pathname === "/dashboard" ||
    contextualBackPatterns.some((pattern) => pattern.test(pathname))
  ) {
    return null;
  }

  if (pathname.startsWith("/reports/")) {
    return { href: "/reports", label: "Back to reports" };
  }

  if (pathname === "/catalog/branch-products") {
    return { href: "/catalog/products", label: "Back to catalog" };
  }

  if (
    pathname === "/inventory/receipts" ||
    pathname === "/inventory/adjustments" ||
    pathname === "/inventory/counts"
  ) {
    return { href: "/inventory", label: "Back to inventory" };
  }

  return { href: "/dashboard", label: "Back to dashboard" };
}

export function PageBackButton() {
  const pathname = usePathname();
  const destination = backDestination(pathname);

  if (!destination) {
    return null;
  }

  return (
    <div className="mb-4">
      <Button asChild variant="ghost">
        <Link href={destination.href}>
          <IconArrowLeft aria-hidden="true" />
          {destination.label}
        </Link>
      </Button>
    </div>
  );
}
