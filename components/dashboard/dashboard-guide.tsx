"use client";

import Link from "next/link";
import {
  type ComponentType,
  type SVGProps,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  IconArrowRight,
  IconBuildingStore,
  IconCash,
  IconChartBar,
  IconCheck,
  IconChevronLeft,
  IconClipboardList,
  IconDiamond,
  IconHelpCircle,
  IconLockAccess,
  IconPackage,
  IconShieldCheck,
  IconUsers,
  IconX,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import type { PlatformRole } from "@/lib/domain/roles";

type GuideIcon = ComponentType<SVGProps<SVGSVGElement>>;

type GuideStep = {
  title: string;
  description: string;
  href: string;
  action: string;
  icon: GuideIcon;
};

type RoleGuide = {
  label: string;
  headline: string;
  summary: string;
  primaryHref: string;
  primaryAction: string;
  capabilities: string[];
  boundaries: string[];
  steps: GuideStep[];
};

export const roleGuides: Record<PlatformRole, RoleGuide> = {
  order_registrar: {
    label: "Order registrar",
    headline: "Turn a customer request into a verified order",
    summary: "Build the order, confirm the negotiated price, and issue the slip that moves the customer to payment.",
    primaryHref: "/orders/new",
    primaryAction: "Create order",
    capabilities: [
      "Register walk-in or saved customers",
      "View products and available branch stock",
      "Create and edit unpaid orders",
      "Apply negotiated discounts with a reason",
      "Print or reprint QR-coded order slips",
    ],
    boundaries: [
      "Cannot receive payment or release stock",
      "Discounts above branch limits require manager approval",
    ],
    steps: [
      { title: "Confirm the branch", description: "Use the active branch selector before serving the customer.", href: "/dashboard", action: "View dashboard", icon: IconBuildingStore },
      { title: "Identify the customer", description: "Find an existing customer or register their details for the order.", href: "/customers", action: "Open customers", icon: IconUsers },
      { title: "Build the order", description: "Choose products, confirm available quantities, and enter any negotiated discount and reason.", href: "/orders/new", action: "Create order", icon: IconPackage },
      { title: "Confirm approval", description: "If a discount needs approval, wait for the manager decision before sending the customer to payment.", href: "/orders", action: "Review orders", icon: IconShieldCheck },
      { title: "Issue the order slip", description: "Confirm the final total, register the order, and print the QR-coded slip for the cashier.", href: "/orders", action: "Open orders", icon: IconClipboardList },
    ],
  },
  cashier: {
    label: "Cashier",
    headline: "Verify the order and record a trusted payment",
    summary: "Confirm the customer order, capture the payment method and evidence, then issue the payment receipt.",
    primaryHref: "/cashier",
    primaryAction: "Open payment queue",
    capabilities: [
      "View approved unpaid orders for the active branch",
      "Find orders by queue or order number",
      "Record cash, transfer, POS, split, or allowed credit",
      "Attach required transfer evidence",
      "Issue and reprint payment receipts",
    ],
    boundaries: [
      "Cannot change order lines or negotiated prices",
      "Cannot complete the final product release",
    ],
    steps: [
      { title: "Confirm the branch", description: "Make sure the active branch matches the payment desk you are operating.", href: "/dashboard", action: "View dashboard", icon: IconBuildingStore },
      { title: "Find the order", description: "Open the queue, scan the slip, or enter the order number supplied by the customer.", href: "/cashier", action: "Open queue", icon: IconClipboardList },
      { title: "Verify the order", description: "Match the customer, products, quantities, final total, and any required discount approval.", href: "/cashier", action: "Review payment", icon: IconShieldCheck },
      { title: "Record payment", description: "Enter each payment method, reference, and required proof until the exact total is covered.", href: "/cashier", action: "Receive payment", icon: IconCash },
      { title: "Issue the receipt", description: "Confirm payment, print or stamp the receipt, and direct the customer to release verification.", href: "/cashier", action: "Open payment queue", icon: IconClipboardList },
    ],
  },
  release_verifier: {
    label: "Release verifier",
    headline: "Release only fully verified paid orders",
    summary: "Check the payment record and receipt mark, confirm the order identity, and complete the stock release.",
    primaryHref: "/release",
    primaryAction: "Open release queue",
    capabilities: [
      "View paid orders awaiting release",
      "Scan or retrieve an order for verification",
      "Inspect payment status and receipt details",
      "Confirm the physical handover",
      "Complete the sale and final stock deduction",
    ],
    boundaries: [
      "Cannot collect or edit payment",
      "Must not release an unpaid, mismatched, or invalid order",
    ],
    steps: [
      { title: "Confirm the branch", description: "Work only from the branch currently selected in the app header.", href: "/dashboard", action: "View dashboard", icon: IconBuildingStore },
      { title: "Locate the paid order", description: "Scan the QR code, enter its number, or open an order awaiting release from the queue.", href: "/release", action: "Open queue", icon: IconClipboardList },
      { title: "Validate payment", description: "Confirm that payment is complete and the receipt or stamp belongs to the same order.", href: "/release", action: "Review release", icon: IconCash },
      { title: "Match the handover", description: "Check the customer, product images, item names, and quantities before handing anything over.", href: "/release", action: "Verify items", icon: IconPackage },
      { title: "Complete release", description: "Record the final handover once every check is valid; this completes the sale and stock-out.", href: "/release", action: "Open release queue", icon: IconShieldCheck },
    ],
  },
  branch_manager: {
    label: "Branch manager",
    headline: "Keep the branch workflow and stock under control",
    summary: "Monitor each POS stage, resolve exceptions, maintain stock, and review branch performance.",
    primaryHref: "/inventory",
    primaryAction: "Open inventory",
    capabilities: [
      "Operate every POS stage for assigned branches",
      "Approve or reject negotiated discounts",
      "Receive stock and manage branch inventory",
      "Run counts and resolve permitted adjustments",
      "Request, review, and approve operational reversals",
      "View branch reports and staff activity",
    ],
    boundaries: [
      "Access is limited to assigned branches",
      "Protected company-wide configuration remains admin-only",
    ],
    steps: [
      { title: "Select the branch", description: "Choose the branch whose queues and stock you need to manage.", href: "/dashboard", action: "View dashboard", icon: IconBuildingStore },
      { title: "Review order decisions", description: "Open orders and resolve pending negotiated discount approvals before customers reach payment.", href: "/orders", action: "Review orders", icon: IconClipboardList },
      { title: "Monitor POS queues", description: "Check payment and release queues, then step into a workflow when branch staff need support.", href: "/cashier", action: "Review payments", icon: IconCash },
      { title: "Control stock", description: "Receive stock, run counts, review movements, and resolve allowed adjustment requests.", href: "/inventory", action: "Open inventory", icon: IconPackage },
      { title: "Review performance", description: "Use branch reports, low-stock alerts, reversals, and staff activity to close operational gaps.", href: "/reports", action: "Open reports", icon: IconChartBar },
    ],
  },
  admin: {
    label: "Admin",
    headline: "Run every company workflow from one place",
    summary: "Configure branches and staff, control products and stock, and oversee company-wide sales and finances.",
    primaryHref: "/reports",
    primaryAction: "Open reports",
    capabilities: [
      "Access and administer every company workflow",
      "Create branches and configure workflow controls",
      "Create products, attach images, and allocate branch stock",
      "Invite staff and assign non-super-admin roles",
      "Run direct sales and step into any POS stage",
      "View company-wide financial, inventory, and audit reports",
    ],
    boundaries: [
      "Only a super admin can create or assign super-admin access",
      "Sensitive actions remain audited even when performed by an admin",
    ],
    steps: [
      { title: "Configure branches", description: "Create each branch and set order expiry, discount, payment-proof, credit, and split-payment rules.", href: "/branches", action: "Manage branches", icon: IconBuildingStore },
      { title: "Build the catalog", description: "Create every product with its primary image, receive central allocation stock, and distribute quantities to branches.", href: "/catalog/products", action: "Open catalog", icon: IconDiamond },
      { title: "Assign the team", description: "Invite staff, choose operational roles, and assign each person to the correct branches.", href: "/access", action: "Manage access", icon: IconLockAccess },
      { title: "Administer operations", description: "Monitor or perform registration, payment, release, inventory, and direct-sale workflows when needed.", href: "/orders/direct", action: "Open direct sale", icon: IconClipboardList },
      { title: "Oversee performance", description: "Review company-wide sales, payments, inventory value, reversals, credit, and staff activity.", href: "/reports", action: "Open reports", icon: IconChartBar },
    ],
  },
  super_admin: {
    label: "Super admin",
    headline: "Configure and oversee the complete YITA platform",
    summary: "Maintain ultimate access while supporting the owner, branches, users, controls, and operational reporting.",
    primaryHref: "/access",
    primaryAction: "Manage access",
    capabilities: [
      "Exercise ultimate access across every branch and workflow",
      "Create and manage admin or super-admin access",
      "Configure branches, products, images, stock, and operational controls",
      "Perform or supervise any POS and reversal workflow",
      "Review company-wide reports and audit activity",
      "Support platform configuration and controlled recovery",
    ],
    boundaries: [
      "Use super-admin access for platform administration, not routine counter work",
      "All privileged changes are recorded in the audit trail",
    ],
    steps: [
      { title: "Verify company setup", description: "Confirm branch rules, product records, images, stock pools, and branch allocations are correctly configured.", href: "/branches", action: "Review branches", icon: IconBuildingStore },
      { title: "Control privileged access", description: "Invite users, assign roles, renew expired setup links, and maintain admin or super-admin access.", href: "/access", action: "Manage access", icon: IconLockAccess },
      { title: "Validate workflows", description: "Periodically test registration, payment, release, stock, direct sales, and reversal controls end to end.", href: "/orders", action: "Review orders", icon: IconShieldCheck },
      { title: "Resolve platform exceptions", description: "Use ultimate access to support the owner and correct configuration issues without bypassing audit records.", href: "/inventory", action: "Review inventory", icon: IconPackage },
      { title: "Monitor the platform", description: "Review reports and staff activity across all branches, then investigate unusual or failed operations.", href: "/reports", action: "Open reports", icon: IconChartBar },
    ],
  },
};

function guideStorageKey(uid: string, role: PlatformRole) {
  return `yita:dashboard-guide:v2:${uid}:${role}`;
}

export function DashboardGuide({ role, uid }: { role: PlatformRole; uid: string }) {
  const guide = roleGuides[role];
  const storageKey = useMemo(() => guideStorageKey(uid, role), [role, uid]);
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (window.localStorage.getItem(storageKey) !== "complete") {
      setOpen(true);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") finish();
      if (event.key === "ArrowRight") setStepIndex((value) => Math.min(value + 1, guide.steps.length - 1));
      if (event.key === "ArrowLeft") setStepIndex((value) => Math.max(value - 1, 0));
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [guide.steps.length, open]);

  function finish() {
    window.localStorage.setItem(storageKey, "complete");
    setOpen(false);
    setStepIndex(0);
  }

  function showGuide() {
    setStepIndex(0);
    setOpen(true);
  }

  const step = guide.steps[stepIndex];
  const StepIcon = step.icon;
  const lastStep = stepIndex === guide.steps.length - 1;

  return (
    <>
      <Button onClick={showGuide} type="button" variant="outline">
        <IconHelpCircle />Guide
      </Button>
      {open ? (
        <div className="fixed inset-0 z-[80] grid place-items-end bg-slate-950/45 p-0 backdrop-blur-sm sm:place-items-center sm:p-6">
          <section
            aria-describedby="dashboard-guide-description"
            aria-labelledby="dashboard-guide-title"
            aria-modal="true"
            className="bottom-more-sheet liquid-glass max-h-[100dvh] w-full overflow-y-auto border-t p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl sm:max-w-2xl sm:rounded-xl sm:border sm:pb-5"
            role="dialog"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase text-muted-foreground">{guide.label} guide</p>
                <h2 className="mt-1 text-xl font-semibold" id="dashboard-guide-title">{guide.headline}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground" id="dashboard-guide-description">{guide.summary}</p>
              </div>
              <Button aria-label="Close guide" onClick={finish} size="icon" type="button" variant="ghost">
                <IconX />
              </Button>
            </div>

            <div
              aria-label={`Step ${stepIndex + 1} of ${guide.steps.length}`}
              className="mt-5 grid gap-2"
              style={{ gridTemplateColumns: `repeat(${guide.steps.length}, minmax(0, 1fr))` }}
            >
              {guide.steps.map((item, index) => (
                <button
                  aria-current={index === stepIndex ? "step" : undefined}
                  className="group flex min-w-0 items-center gap-2 border-t-2 pt-3 text-left transition-colors aria-[current=step]:border-primary aria-[current=step]:text-foreground"
                  key={item.title}
                  onClick={() => setStepIndex(index)}
                  type="button"
                >
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold group-aria-[current=step]:bg-primary group-aria-[current=step]:text-primary-foreground">
                    {index < stepIndex ? <IconCheck className="size-3.5" /> : index + 1}
                  </span>
                  <span className="hidden truncate text-xs font-medium sm:block">{item.title}</span>
                </button>
              ))}
            </div>

            <div className="my-7 flex items-start gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/15">
                <StepIcon className="size-6" />
              </span>
              <div>
                <p className="text-xs font-semibold text-muted-foreground">STEP {stepIndex + 1}</p>
                <h3 className="mt-1 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t pt-4">
              <Button disabled={stepIndex === 0} onClick={() => setStepIndex((value) => value - 1)} type="button" variant="ghost">
                <IconChevronLeft />Previous
              </Button>
              {lastStep ? (
                <Button asChild>
                  <Link href={step.href} onClick={finish}>{step.action}<IconArrowRight /></Link>
                </Button>
              ) : (
                <Button onClick={() => setStepIndex((value) => value + 1)} type="button">
                  Next<IconArrowRight />
                </Button>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

export function RoleWorkflowOverview({ role }: { role: PlatformRole }) {
  const guide = roleGuides[role];

  return (
    <section className="border-y bg-card/55 px-4 py-5 sm:px-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase text-muted-foreground">{guide.label} workflow</p>
          <h2 className="mt-1 text-lg font-semibold">{guide.headline}</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{guide.summary}</p>
        </div>
        <Button asChild>
          <Link href={guide.primaryHref}>{guide.primaryAction}<IconArrowRight /></Link>
        </Button>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div className="space-y-5">
          <div>
            <h3 className="text-sm font-semibold">What this role can do</h3>
            <ul className="mt-3 space-y-2">
              {guide.capabilities.map((capability) => (
                <li className="flex gap-2 text-sm leading-5" key={capability}>
                  <IconCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>{capability}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold">Important controls</h3>
            <ul className="mt-2 space-y-1.5 text-sm leading-5 text-muted-foreground">
              {guide.boundaries.map((boundary) => (
                <li className="flex gap-2" key={boundary}>
                  <IconShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                  <span>{boundary}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold">Step-by-step workflow</h3>
          <ol className="mt-3 space-y-3">
            {guide.steps.map((step, index) => {
              const StepIcon = step.icon;
              return (
                <li className="flex gap-3 border-t pt-3 first:border-t-0 first:pt-0" key={step.title}>
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary text-secondary-foreground">
                    <StepIcon aria-hidden="true" className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-muted-foreground">STEP {index + 1} OF {guide.steps.length}</p>
                    <p className="mt-0.5 font-medium">{step.title}</p>
                    <p className="mt-1 text-sm leading-5 text-muted-foreground">{step.description}</p>
                    <Link className="mt-1.5 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline" href={step.href}>
                      {step.action}<IconArrowRight aria-hidden="true" className="size-4" />
                    </Link>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
