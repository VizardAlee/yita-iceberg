import Image from "next/image";

export function MobilePreview() {
  return (
    <section className="bg-[#071426] px-4 py-16 text-white sm:px-6 md:py-20 lg:px-8">
      <div className="mx-auto grid max-w-7xl items-center gap-10 md:grid-cols-[0.9fr_1.1fr]">
        <div className="order-2 mx-auto w-full max-w-xs overflow-hidden rounded-[2rem] border-[10px] border-[#020812] bg-[#020812] shadow-[0_28px_80px_rgba(0,0,0,0.34)] md:order-1">
          <Image
            alt="Actual YITA Iceberg mobile dashboard showing sales cards and a net sales chart"
            className="h-auto w-full"
            height={720}
            loading="eager"
            sizes="320px"
            src="/brand/yita-dashboard-mobile-preview.webp"
            width={390}
          />
        </div>
        <div className="order-1 md:order-2">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#e6d3a3]">
            Mobile-first access
          </p>
          <h2 className="mt-4 font-display text-4xl leading-tight text-balance sm:text-5xl">
            Fast enough for the sales floor, controlled enough for governance.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-[#dceaf7]/72">
            Mobile screens prioritize order lookup, payment state, and release verification with native-feeling spacing and thumb-friendly actions.
          </p>
        </div>
      </div>
    </section>
  );
}
