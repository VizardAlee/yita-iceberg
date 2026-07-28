import Link from "next/link";

import { YitaLogo } from "@/components/brand/yita-logo";

export function LandingFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#071426] px-4 pb-28 pt-8 text-white sm:px-6 md:pb-8 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <YitaLogo compact showImage={false} />
          <p className="max-w-md text-sm leading-6 text-[#dceaf7]/65">
            Private staff operations portal for YITA Iceberg ice production and distribution.
            For account assistance, contact your company administrator.
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm text-[#dceaf7]/65 sm:items-end">
          <Link className="transition hover:text-white" href="/privacy">
            Privacy notice
          </Link>
          <p>© {new Date().getFullYear()} YITA Iceberg. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
