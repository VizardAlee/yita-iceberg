import Image from "next/image";
import Link from "next/link";

export function HeroSection({
  portalHref,
  portalLabel,
}: {
  portalHref: string;
  portalLabel: string;
}) {
  return (
    <section className="relative isolate flex min-h-[34rem] items-center overflow-hidden bg-[#071426] px-4 py-14 text-white sm:px-6 md:min-h-[min(68svh,44rem)] lg:px-8">
      <Image
        alt="YITA Iceberg operations dashboard showing reporting and branch controls"
        className="-z-20 object-cover object-top"
        fill
        priority
        sizes="100vw"
        src="/brand/yita-dashboard-preview.webp"
      />
      <div className="absolute inset-0 -z-10 bg-[#071426]/78" />
      <div className="mx-auto w-full max-w-7xl">
        <div className="max-w-3xl space-y-7">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#e6d3a3]">
            Authorized staff access only
          </p>
          <h1 className="font-display text-5xl leading-[0.98] tracking-normal text-balance sm:text-6xl lg:text-7xl">
            YITA Iceberg Staff Operations Portal
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-[#dceaf7] sm:text-xl">
            Secure multi-branch inventory, order registration, payment
            confirmation, release verification, and company reporting for the
            YITA Iceberg team.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[#c8a45d] px-6 text-sm font-semibold text-[#071426] shadow-[0_16px_44px_rgba(200,164,93,0.28)] transition hover:bg-[#e6d3a3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e6d3a3]"
              href={portalHref}
            >
              {portalLabel}
            </Link>
            <a
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/25 bg-[#071426]/65 px-6 text-sm font-semibold text-white transition hover:border-[#c8a45d]/60 hover:bg-[#071426]/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#dceaf7]"
              href="#workflow"
            >
              View Operational Flow
            </a>
          </div>
          <p className="max-w-xl text-sm leading-6 text-[#dceaf7]/75">
            Accounts are issued by an administrator. There is no public
            registration.
          </p>
        </div>
      </div>
    </section>
  );
}
