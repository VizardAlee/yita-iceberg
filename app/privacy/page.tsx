import type { Metadata } from "next";
import Link from "next/link";

import { YitaLogo } from "@/components/brand/yita-logo";

export const metadata: Metadata = {
  title: "Privacy Notice | YITA Iceberg",
  description:
    "Privacy information for the private YITA Iceberg staff operations portal.",
  alternates: {
    canonical: "/privacy",
  },
};

const sections = [
  {
    title: "Purpose of this portal",
    body: "YITA Iceberg uses this system to manage authorized staff access, branches, products, inventory, customers, orders, payments, release verification, reversals, and operational reporting.",
  },
  {
    title: "Information handled",
    body: "The portal may contain staff account details, customer contact information, transaction records, product and stock records, payment references or evidence, and security or activity logs required for business operations.",
  },
  {
    title: "Access and use",
    body: "Access is restricted by assigned role and branch. Information in the portal must be used only for authorized YITA Iceberg work and must not be shared outside approved business processes.",
  },
  {
    title: "Account responsibility",
    body: "Staff must keep their credentials private, sign out from shared devices, and report suspected unauthorized access or incorrect records to a company administrator promptly.",
  },
  {
    title: "Questions and corrections",
    body: "For account support, privacy questions, or correction of operational records, contact your YITA Iceberg administrator through the company’s approved internal channel.",
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#f4f7fa] text-[#071426]">
      <header className="border-b border-[#071426]/10 bg-white px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <Link aria-label="YITA Iceberg home" href="/">
            <YitaLogo compact showImage={false} />
          </Link>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#071426]/15 px-4 text-sm font-semibold hover:bg-[#eef4f9]"
            href="/"
          >
            Back to home
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8f7437]">
          Staff portal
        </p>
        <h1 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">
          Privacy notice
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[#1d2430]/70">
          This notice explains how operational information is handled within
          the private YITA Iceberg system.
        </p>
        <div className="mt-10 divide-y divide-[#071426]/10 border-y border-[#071426]/10">
          {sections.map((section) => (
            <section className="grid gap-3 py-6 md:grid-cols-[15rem_1fr]" key={section.title}>
              <h2 className="text-lg font-semibold">{section.title}</h2>
              <p className="text-sm leading-7 text-[#1d2430]/72">{section.body}</p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
