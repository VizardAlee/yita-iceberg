import Image from "next/image";

export function TabletPreview() {
  return (
    <section className="bg-[#eef4f9] px-4 py-16 text-[#071426] sm:px-6 md:py-20 lg:px-8">
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#8f7437]">
            Tablet control surface
          </p>
          <h2 className="mt-4 font-display text-4xl leading-tight text-balance sm:text-5xl">
            A dedicated-feeling tablet experience for branch teams.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-[#1d2430]/72">
            Large touch targets, app-like panels, and clear status controls keep the counter workflow moving without hiding approval checks.
          </p>
        </div>
        <div className="overflow-hidden rounded-2xl border-[10px] border-[#071426] bg-[#071426] shadow-[0_32px_90px_rgba(7,20,38,0.22)]">
          <Image
            alt="Actual YITA Iceberg dashboard with reporting period, sales cards, and charts"
            className="h-auto w-full"
            height={900}
            loading="eager"
            sizes="(min-width: 1024px) 55vw, 100vw"
            src="/brand/yita-dashboard-preview.webp"
            width={1440}
          />
        </div>
      </div>
    </section>
  );
}
