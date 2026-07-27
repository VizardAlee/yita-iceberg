import type { Metadata } from "next";

import { FeaturePillars } from "@/components/landing/feature-pillars";
import { FinalCta } from "@/components/landing/final-cta";
import { HeroSection } from "@/components/landing/hero-section";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";
import { MobilePreview } from "@/components/landing/mobile-preview";
import { SecuritySection } from "@/components/landing/security-section";
import { TabletPreview } from "@/components/landing/tablet-preview";
import { TrustStrip } from "@/components/landing/trust-strip";
import { WorkflowSection } from "@/components/landing/workflow-section";
import { getCurrentUser } from "@/lib/server/auth/session";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

export default async function Home() {
  const user = await getCurrentUser();
  const portalHref = user ? "/dashboard" : "/sign-in";
  const portalLabel = user ? "Open Dashboard" : "Staff Sign In";

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#071426]">
      <LandingHeader portalHref={portalHref} portalLabel={portalLabel} />
      <HeroSection portalHref={portalHref} portalLabel={portalLabel} />
      <TrustStrip />
      <WorkflowSection />
      <FeaturePillars />
      <TabletPreview />
      <MobilePreview />
      <SecuritySection />
      <FinalCta portalHref={portalHref} portalLabel={portalLabel} />
      <LandingFooter />
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#071426]/92 p-3 backdrop-blur md:hidden">
        <a
          className="flex min-h-12 items-center justify-center rounded-lg bg-[#c8a45d] text-sm font-semibold text-[#071426]"
          href={portalHref}
        >
          {portalLabel}
        </a>
      </div>
    </main>
  );
}
