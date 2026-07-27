"use client";

import Link from "next/link";
import { type ComponentType, type SVGProps, useEffect, useMemo, useRef, useState } from "react";
import {
  IconCash,
  IconCalendarStats,
  IconClipboardList,
  IconDownload,
  IconRefresh,
  IconChartBar,
  IconAlertTriangle,
  IconBuildingStore,
  IconDiamond,
  IconLockAccess,
  IconPackage,
  IconReceiptRefund,
  IconReportAnalytics,
  IconShieldCheck,
  IconUsers,
} from "@tabler/icons-react";

import { useBranchContext } from "@/components/branch/branch-context";
import {
  DashboardGuide,
  RoleWorkflowOverview,
  roleGuides,
} from "@/components/dashboard/dashboard-guide";
import { Field } from "@/components/shared/field";
import { OperationState } from "@/components/shared/operation-state";
import { Button } from "@/components/ui/button";
import { isAdminRole, type PlatformRole } from "@/lib/domain/roles";
import { callFunction } from "@/lib/firebase/callables";
import { formatNairaFromKobo } from "@/lib/format/number";
import type {
  BranchScope,
  ReportResult,
  ReportType,
} from "@/lib/types/operational";

type ReportConfig = {
  type: Exclude<ReportType, "dashboard">;
  title: string;
  description: string;
  functionName: string;
  columns: Array<{ key: string; label: string; money?: boolean; hideWhenNotSensitive?: boolean }>;
  metrics: Array<{ key: string; label: string; money?: boolean }>;
};

type WorkflowCard = {
  href: string;
  title: string;
  description: string;
  roles: PlatformRole[];
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

const today = new Date().toISOString().slice(0, 10);
const monthStart = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-01`;
const maximumDashboardRangeDays = 93;

type DashboardDatePreset = "today" | "last_7_days" | "last_30_days" | "month_to_date" | "custom";

type DailySalesPoint = {
  date: string;
  salesKobo: number;
  completedOrders: number;
};

function daysAgoIso(daysAgo: number) {
  const date = new Date(`${today}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

function dashboardDateRangeError(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "Choose a valid start and end date.";
  if (start > end) return "Start date must be before or equal to end date.";
  const days = Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
  if (days > maximumDashboardRangeDays) return `Choose a range of ${maximumDashboardRangeDays} days or less.`;
  return null;
}

function dashboardRangeLabel(startDate: string, endDate: string) {
  const format = (value: string) =>
    new Date(`${value}T00:00:00.000Z`).toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: startDate.slice(0, 4) !== endDate.slice(0, 4) ? "numeric" : undefined,
      timeZone: "UTC",
    });
  return startDate === endDate ? format(startDate) : `${format(startDate)} - ${format(endDate)}`;
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export const reportConfigs: Record<Exclude<ReportType, "dashboard">, ReportConfig> = {
  sales: {
    type: "sales",
    title: "Sales report",
    description: "Orders, sales status, reversals, and completed-sale totals.",
    functionName: "getSalesReport",
    metrics: [
      { key: "grossSalesKobo", label: "Gross sales", money: true },
      { key: "discountTotalKobo", label: "Discounts", money: true },
      { key: "netCompletedSalesKobo", label: "Net completed sales", money: true },
      { key: "completedOrderCount", label: "Completed orders" },
    ],
    columns: [
      { key: "orderNumber", label: "Order" },
      { key: "date", label: "Date" },
      { key: "branch", label: "Branch" },
      { key: "customer", label: "Customer" },
      { key: "status", label: "Status" },
      { key: "paymentStatus", label: "Payment" },
      { key: "totalKobo", label: "Total", money: true },
      { key: "reversalStatus", label: "Reversal" },
    ],
  },
  payments: {
    type: "payments",
    title: "Payment report",
    description: "Confirmed payment lines, split payments, proof status, and cashier totals.",
    functionName: "getPaymentReport",
    metrics: [
      { key: "cashTotalKobo", label: "Cash", money: true },
      { key: "transferTotalKobo", label: "Transfer", money: true },
      { key: "posTotalKobo", label: "POS", money: true },
      { key: "creditTotalKobo", label: "Credit", money: true },
    ],
    columns: [
      { key: "paymentDate", label: "Date" },
      { key: "orderNumber", label: "Order" },
      { key: "branch", label: "Branch" },
      { key: "paymentMethod", label: "Method" },
      { key: "amountKobo", label: "Amount", money: true },
      { key: "reference", label: "Reference" },
      { key: "cashier", label: "Cashier" },
      { key: "proofStatus", label: "Proof" },
    ],
  },
  inventory: {
    type: "inventory",
    title: "Inventory report",
    description: "Branch stock position with valuation fields shown only to admins.",
    functionName: "getInventoryReport",
    metrics: [
      { key: "productCount", label: "Products" },
      { key: "lowStockCount", label: "Low stock" },
      { key: "stockValueKobo", label: "Stock value", money: true },
    ],
    columns: [
      { key: "product", label: "Product" },
      { key: "sku", label: "SKU" },
      { key: "branch", label: "Branch" },
      { key: "onHandQty", label: "On hand" },
      { key: "reservedQty", label: "Reserved" },
      { key: "availableQty", label: "Available" },
      { key: "reorderLevel", label: "Reorder" },
      { key: "stockValueKobo", label: "Value", money: true, hideWhenNotSensitive: true },
    ],
  },
  stock_movements: {
    type: "stock_movements",
    title: "Stock movement ledger",
    description: "Inventory movement history, including sale returns and no-stock reversals.",
    functionName: "getStockMovementReport",
    metrics: [
      { key: "movementCount", label: "Movements" },
      { key: "totalQuantity", label: "Total quantity" },
    ],
    columns: [
      { key: "date", label: "Date" },
      { key: "branch", label: "Branch" },
      { key: "product", label: "Product" },
      { key: "movementType", label: "Type" },
      { key: "quantity", label: "Qty" },
      { key: "onHandBefore", label: "Before" },
      { key: "onHandAfter", label: "After" },
      { key: "performedBy", label: "By" },
    ],
  },
  reversals: {
    type: "reversals",
    title: "Reversal and refund report",
    description: "Correction records, internal refund records, and credit reductions.",
    functionName: "getReversalReport",
    metrics: [
      { key: "reversalCount", label: "Reversals" },
      { key: "completedReversalCount", label: "Completed" },
      { key: "refundAmountKobo", label: "Internal refunds", money: true },
      { key: "creditReductionKobo", label: "Credit reductions", money: true },
    ],
    columns: [
      { key: "reversalNumber", label: "Reversal" },
      { key: "orderNumber", label: "Order" },
      { key: "branch", label: "Branch" },
      { key: "customer", label: "Customer" },
      { key: "type", label: "Type" },
      { key: "status", label: "Status" },
      { key: "refundAmountKobo", label: "Refund", money: true },
      { key: "creditReductionKobo", label: "Credit", money: true },
      { key: "requestedDate", label: "Requested" },
    ],
  },
  credit: {
    type: "credit",
    title: "Credit and receivables report",
    description: "Credit sales, correction records, and receivable movements.",
    functionName: "getCreditReport",
    metrics: [
      { key: "totalCreditSalesKobo", label: "Credit sales", money: true },
      { key: "totalOutstandingBalanceKobo", label: "Outstanding", money: true },
      { key: "creditReductionsKobo", label: "Reductions", money: true },
    ],
    columns: [
      { key: "createdDate", label: "Date" },
      { key: "branch", label: "Branch" },
      { key: "orderNumber", label: "Order" },
      { key: "customer", label: "Customer" },
      { key: "creditAmountKobo", label: "Credit", money: true },
      { key: "creditReductionKobo", label: "Reduction", money: true },
      { key: "outstandingBalanceKobo", label: "Outstanding", money: true },
      { key: "status", label: "Status" },
    ],
  },
  staff_activity: {
    type: "staff_activity",
    title: "Staff activity report",
    description: "Safe activity summaries without exposing raw audit before/after payloads.",
    functionName: "getStaffActivityReport",
    metrics: [
      { key: "activityCount", label: "Activities" },
      { key: "ownActivityOnly", label: "Own activity only" },
    ],
    columns: [
      { key: "date", label: "Date" },
      { key: "branch", label: "Branch" },
      { key: "user", label: "User" },
      { key: "role", label: "Role" },
      { key: "action", label: "Action" },
      { key: "entityType", label: "Entity" },
      { key: "entityId", label: "Entity ID" },
    ],
  },
  low_stock: {
    type: "low_stock",
    title: "Low-stock report",
    description: "Products where available quantity is at or below reorder level.",
    functionName: "getLowStockReport",
    metrics: [
      { key: "productCount", label: "Low-stock rows" },
      { key: "lowStockCount", label: "Low-stock count" },
    ],
    columns: [
      { key: "branch", label: "Branch" },
      { key: "product", label: "Product" },
      { key: "sku", label: "SKU" },
      { key: "onHandQty", label: "On hand" },
      { key: "reservedQty", label: "Reserved" },
      { key: "availableQty", label: "Available" },
      { key: "reorderLevel", label: "Reorder" },
    ],
  },
};

const reportRoles: Record<Exclude<ReportType, "dashboard">, PlatformRole[]> = {
  sales: ["branch_manager", "admin", "super_admin"],
  payments: ["cashier", "branch_manager", "admin", "super_admin"],
  inventory: ["branch_manager", "admin", "super_admin"],
  stock_movements: ["branch_manager", "admin", "super_admin"],
  reversals: ["branch_manager", "admin", "super_admin"],
  credit: ["branch_manager", "admin", "super_admin"],
  staff_activity: ["cashier", "branch_manager", "admin", "super_admin"],
  low_stock: ["branch_manager", "admin", "super_admin"],
};

const workflowCards: WorkflowCard[] = [
  {
    href: "/orders",
    title: "Order registration",
    description: "Create, edit, cancel, and reissue order slips before payment.",
    roles: ["order_registrar", "branch_manager", "admin", "super_admin"],
    icon: IconClipboardList,
  },
  {
    href: "/customers",
    title: "Customers",
    description: "Register customer details used across orders, payments, and credit records.",
    roles: ["order_registrar", "cashier", "branch_manager", "admin", "super_admin"],
    icon: IconUsers,
  },
  {
    href: "/cashier",
    title: "Payments",
    description: "Verify orders, collect payments, record methods, and issue receipts.",
    roles: ["cashier", "branch_manager", "admin", "super_admin"],
    icon: IconCash,
  },
  {
    href: "/release",
    title: "Release verification",
    description: "Confirm payment validity and complete the final stock-out release step.",
    roles: ["release_verifier", "branch_manager", "admin", "super_admin"],
    icon: IconShieldCheck,
  },
  {
    href: "/inventory",
    title: "Inventory control",
    description: "Receive stock, request adjustments, run counts, and approve variances.",
    roles: ["branch_manager", "admin", "super_admin"],
    icon: IconPackage,
  },
  {
    href: "/reversals",
    title: "Reversals and refunds",
    description: "Reverse completed sales, record corrections, and approve refund records.",
    roles: ["branch_manager", "admin", "super_admin"],
    icon: IconReceiptRefund,
  },
  {
    href: "/reports",
    title: "Reports and analytics",
    description: "Review sales, payments, inventory, stock movement, credit, and staff activity.",
    roles: ["branch_manager", "admin", "super_admin"],
    icon: IconReportAnalytics,
  },
  {
    href: "/branches",
    title: "Branches",
    description: "Create branch locations and configure workflow rules for each outlet.",
    roles: ["admin", "super_admin"],
    icon: IconBuildingStore,
  },
  {
    href: "/catalog/products",
    title: "Product catalog",
    description: "Manage master products and branch product pricing controls.",
    roles: ["admin", "super_admin"],
    icon: IconDiamond,
  },
  {
    href: "/access",
    title: "Access management",
    description: "Invite users, assign workflow roles, and control branch access.",
    roles: ["admin", "super_admin"],
    icon: IconLockAccess,
  },
];

function moneyOrValue(value: unknown, money?: boolean) {
  if (money) return formatNairaFromKobo(typeof value === "number" ? value : 0);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string" && value.includes("T")) return new Date(value).toLocaleString();
  return value === undefined || value === null || value === "" ? "—" : String(value).replaceAll("_", " ");
}

function reportInput(branchId: string | null, branchScope: BranchScope, startDate: string, endDate: string, pageCursor?: string | null) {
  return {
    ...(branchScope === "selected_branch" && branchId ? { branchId } : {}),
    branchScope,
    startDate,
    endDate,
    pageSize: 50,
    ...(pageCursor ? { pageCursor } : {}),
    filters: {},
  };
}

export function SummaryMetricCard({ label, value, money }: { label: string; value: unknown; money?: boolean }) {
  return (
    <div className="app-surface fluid-hover rounded-xl border p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-semibold tracking-normal text-foreground">{moneyOrValue(value, money)}</p>
    </div>
  );
}

export function ReportDateRangePicker({
  endDate,
  setEndDate,
  setStartDate,
  startDate,
}: {
  endDate: string;
  setEndDate: (value: string) => void;
  setStartDate: (value: string) => void;
  startDate: string;
}) {
  return (
    <>
      <Field label="Start date">
        <input className="h-9 rounded-md border bg-background px-3" onChange={(event) => setStartDate(event.target.value)} type="date" value={startDate} />
      </Field>
      <Field label="End date">
        <input className="h-9 rounded-md border bg-background px-3" onChange={(event) => setEndDate(event.target.value)} type="date" value={endDate} />
      </Field>
    </>
  );
}

export function BranchScopeSelector({
  branchScope,
  setBranchScope,
}: {
  branchScope: BranchScope;
  setBranchScope: (scope: BranchScope) => void;
}) {
  const { branches, selectedBranchId, selectBranch, user } = useBranchContext();
  const admin = isAdminRole(user.platformRole);
  return (
    <>
      <Field label="Scope">
        <select className="h-9 rounded-md border bg-background px-3" onChange={(event) => setBranchScope(event.target.value as BranchScope)} value={branchScope}>
          <option value="selected_branch">Selected branch</option>
          {admin ? <option value="all_branches">All branches</option> : null}
        </select>
      </Field>
      {branchScope === "selected_branch" ? (
        <Field label="Branch">
          <select className="h-9 rounded-md border bg-background px-3" onChange={(event) => selectBranch(event.target.value)} value={selectedBranchId ?? ""}>
            <option value="">Choose branch</option>
            {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
          </select>
        </Field>
      ) : null}
    </>
  );
}

function ReportEmptyState() {
  return <OperationState detail="Try a different date range or branch scope." title="No report rows found" />;
}

function ReportPermissionDenied({ detail }: { detail: string }) {
  return <OperationState detail={detail} title="Report access denied" />;
}

export function ReportExportButton({
  branchScope,
  disabled,
  endDate,
  reportType,
  startDate,
}: {
  branchScope: BranchScope;
  disabled: boolean;
  endDate: string;
  reportType: Exclude<ReportType, "dashboard">;
  startDate: string;
}) {
  const { selectedBranchId } = useBranchContext();
  const [busy, setBusy] = useState(false);

  async function exportCsv() {
    setBusy(true);
    try {
      const result = await callFunction<Record<string, unknown>, { fileName: string; content: string; contentType: string }>("exportReport", {
        reportType,
        format: "csv",
        ...reportInput(selectedBranchId, branchScope, startDate, endDate),
      });
      const blob = new Blob([result.content], { type: result.contentType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.fileName;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button disabled={disabled || busy} onClick={() => void exportCsv()} type="button" variant="outline">
      <IconDownload />{busy ? "Exporting" : "CSV"}
    </Button>
  );
}

export function DashboardClient() {
  const { loading: branchLoading, selectedBranchId, user } = useBranchContext();
  const admin = isAdminRole(user.platformRole);
  const management = ["branch_manager", "admin", "super_admin"].includes(user.platformRole);
  const [branchScope, setBranchScope] = useState<BranchScope>(admin ? "all_branches" : "selected_branch");
  const [startDate, setStartDate] = useState(monthStart);
  const [endDate, setEndDate] = useState(today);
  const [draftStartDate, setDraftStartDate] = useState(monthStart);
  const [draftEndDate, setDraftEndDate] = useState(today);
  const [datePreset, setDatePreset] = useState<DashboardDatePreset>("month_to_date");
  const [data, setData] = useState<ReportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const requestId = useRef(0);
  const blocked = management && branchScope === "selected_branch" && !selectedBranchId;

  async function load() {
    if (!management || blocked) return;
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const result = await callFunction<Record<string, unknown>, ReportResult>("getDashboardSummary", {
        ...reportInput(selectedBranchId, branchScope, startDate, endDate),
      });
      if (currentRequest === requestId.current) setData(result);
    } catch (err) {
      if (currentRequest === requestId.current) {
        setError(err instanceof Error ? err.message : "Unable to load dashboard.");
      }
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [branchScope, endDate, management, selectedBranchId, startDate]);

  const periodMetrics = [
    ["salesTodayKobo", "Net sales", true],
    ["completedOrdersToday", "Completed orders", false],
    ["cashReceivedKobo", "Cash", true],
    ["transferReceivedKobo", "Transfer", true],
    ["posReceivedKobo", "POS", true],
    ["creditSalesKobo", "Credit sales", true],
    ["reversalRefundValueKobo", "Internal refunds", true],
  ] as const;
  const operationsMetrics = [
    ["pendingUnpaidOrders", "Pending unpaid", false],
    ["paidButUnreleasedOrders", "Paid unreleased", false],
    ["lowStockCount", "Low stock", false],
    ["inventoryValueKobo", "Inventory value", true],
  ] as const;
  const dailySales = Array.isArray(data?.summary.dailySales)
    ? data.summary.dailySales.map((point) => point as DailySalesPoint)
    : [];
  const appliedRangeLabel = dashboardRangeLabel(startDate, endDate);
  const roleGuide = roleGuides[user.platformRole];

  function applyDateRange(nextStartDate: string, nextEndDate: string, preset: DashboardDatePreset) {
    const validationError = dashboardDateRangeError(nextStartDate, nextEndDate);
    setDateError(validationError);
    if (validationError) return;
    setDraftStartDate(nextStartDate);
    setDraftEndDate(nextEndDate);
    setDatePreset(preset);
    setStartDate(nextStartDate);
    setEndDate(nextEndDate);
  }

  function applyPreset(preset: Exclude<DashboardDatePreset, "custom">) {
    const ranges: Record<Exclude<DashboardDatePreset, "custom">, [string, string]> = {
      today: [today, today],
      last_7_days: [daysAgoIso(6), today],
      last_30_days: [daysAgoIso(29), today],
      month_to_date: [monthStart, today],
    };
    applyDateRange(...ranges[preset], preset);
  }

  function applyCustomRange() {
    applyDateRange(draftStartDate, draftEndDate, "custom");
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {management ? `Sales performance for ${appliedRangeLabel}.` : roleGuide.summary}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <DashboardGuide role={user.platformRole} uid={user.uid} />
          {management ? <Button disabled={loading} onClick={() => void load()} type="button" variant="outline"><IconRefresh />{loading ? "Refreshing" : "Refresh"}</Button> : null}
          {management ? <Button asChild><Link href="/reports"><IconChartBar />Reports</Link></Button> : null}
        </div>
      </div>
      <RoleWorkflowOverview role={user.platformRole} />
      {management ? (
        <>
          <div className="app-surface space-y-4 rounded-xl border p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="rounded-lg border bg-secondary p-2 text-muted-foreground">
                  <IconCalendarStats aria-hidden="true" className="size-5" />
                </span>
                <div>
                  <p className="font-semibold">Reporting period</p>
                  <p className="text-sm text-muted-foreground">{appliedRangeLabel}</p>
                </div>
              </div>
              <div aria-label="Date range presets" className="flex flex-wrap gap-1 rounded-lg border bg-muted/60 p-1" role="group">
                {([
                  ["today", "Today"],
                  ["last_7_days", "7 days"],
                  ["last_30_days", "30 days"],
                  ["month_to_date", "This month"],
                ] as const).map(([preset, label]) => (
                  <Button
                    aria-pressed={datePreset === preset}
                    key={preset}
                    onClick={() => applyPreset(preset)}
                    size="sm"
                    type="button"
                    variant={datePreset === preset ? "default" : "ghost"}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="grid items-end gap-3 md:grid-cols-2 xl:grid-cols-5">
              <ReportDateRangePicker
                endDate={draftEndDate}
                setEndDate={(value) => {
                  setDraftEndDate(value);
                  setDatePreset("custom");
                }}
                setStartDate={(value) => {
                  setDraftStartDate(value);
                  setDatePreset("custom");
                }}
                startDate={draftStartDate}
              />
              <BranchScopeSelector branchScope={branchScope} setBranchScope={setBranchScope} />
              <Button disabled={loading} onClick={applyCustomRange} type="button">
                <IconChartBar />Apply
              </Button>
            </div>
            {dateError ? <p className="text-sm font-medium text-destructive">{dateError}</p> : null}
          </div>
          {blocked ? <OperationState detail="Choose a branch or switch to all branches." title="Branch required" /> : null}
          {error ? <ReportPermissionDenied detail={error} /> : null}
          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold tracking-normal">Sales performance</h2>
              <p className="text-sm text-muted-foreground">{appliedRangeLabel} across the selected scope.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-4">
              {periodMetrics.map(([key, label, money]) => (
                <SummaryMetricCard key={key} label={label} money={money} value={data?.summary[key]} />
              ))}
            </div>
          </section>
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.8fr)]">
            <DailySalesChart points={dailySales} rangeLabel={appliedRangeLabel} />
            <PaymentMixChart summary={data?.summary ?? {}} />
          </div>
          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold tracking-normal">Operations and inventory</h2>
              <p className="text-sm text-muted-foreground">Open workflow items for the period and current stock position.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {operationsMetrics.map(([key, label, money]) => (
                <SummaryMetricCard key={key} label={label} money={money} value={data?.summary[key]} />
              ))}
            </div>
          </section>
          {Array.isArray(data?.summary.branchComparison) && data.summary.branchComparison.length > 0 ? (
            <BranchComparisonTable rows={data.summary.branchComparison as Record<string, unknown>[]} />
          ) : null}
        </>
      ) : !branchLoading && !selectedBranchId ? (
        <OperationState detail="Ask an administrator to assign your account to a branch before starting work." title="Branch assignment required" />
      ) : null}
      <WorkflowLinks role={user.platformRole} />
    </div>
  );
}

function DailySalesChart({ points, rangeLabel }: { points: DailySalesPoint[]; rangeLabel: string }) {
  const maximumSales = Math.max(...points.map((point) => numberValue(point.salesKobo)), 0);
  const hasSales = maximumSales > 0;

  return (
    <section className="app-surface min-w-0 rounded-xl border p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">Net sales trend</h2>
          <p className="text-sm text-muted-foreground">{rangeLabel}</p>
        </div>
        <IconChartBar aria-hidden="true" className="size-5 text-muted-foreground" />
      </div>
      {!hasSales ? (
        <div className="flex h-56 items-center justify-center text-center text-sm text-muted-foreground">
          No completed sales in this period.
        </div>
      ) : (
        <div
          aria-label={`Daily net sales chart for ${rangeLabel}`}
          className="mt-5 overflow-x-auto pb-1"
          role="img"
        >
          <div
            className="grid h-56 items-end gap-2"
            style={{
              gridTemplateColumns: `repeat(${points.length}, minmax(36px, 1fr))`,
              minWidth: `${Math.max(100, points.length * 44)}px`,
            }}
          >
            {points.map((point) => {
              const sales = numberValue(point.salesKobo);
              const height = sales > 0 ? Math.max(4, Math.round((sales / maximumSales) * 100)) : 0;
              const date = new Date(`${point.date}T00:00:00.000Z`);
              return (
                <div className="grid h-full grid-rows-[1fr_auto] gap-2" key={point.date}>
                  <div className="flex min-h-0 items-end justify-center border-b border-border/70">
                    <div
                      aria-label={`${date.toLocaleDateString("en-NG", { dateStyle: "medium", timeZone: "UTC" })}: ${formatNairaFromKobo(point.salesKobo)}`}
                      className="w-full max-w-10 rounded-t-md bg-primary transition-[height] duration-300"
                      style={{ height: `${height}%` }}
                      title={`${date.toLocaleDateString("en-NG", { dateStyle: "medium", timeZone: "UTC" })}: ${formatNairaFromKobo(point.salesKobo)} from ${point.completedOrders} completed order${point.completedOrders === 1 ? "" : "s"}`}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold">{date.toLocaleDateString("en-NG", { day: "numeric", timeZone: "UTC" })}</p>
                    <p className="text-[0.68rem] text-muted-foreground">{date.toLocaleDateString("en-NG", { month: "short", timeZone: "UTC" })}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

function PaymentMixChart({ summary }: { summary: Record<string, unknown> }) {
  const methods = [
    { key: "cashReceivedKobo", label: "Cash", color: "bg-[#0b2b50]" },
    { key: "transferReceivedKobo", label: "Transfer", color: "bg-[#2f7d78]" },
    { key: "posReceivedKobo", label: "POS", color: "bg-[#b38b45]" },
    { key: "creditSalesKobo", label: "Credit", color: "bg-[#8e5d78]" },
  ].map((method) => ({ ...method, value: numberValue(summary[method.key]) }));
  const total = methods.reduce((sum, method) => sum + method.value, 0);

  return (
    <section className="app-surface rounded-xl border p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">Payment mix</h2>
          <p className="text-sm text-muted-foreground">Confirmed payments and credit sales.</p>
        </div>
        <IconCash aria-hidden="true" className="size-5 text-muted-foreground" />
      </div>
      <p className="mt-5 text-2xl font-semibold tracking-normal">{formatNairaFromKobo(total)}</p>
      <div aria-label="Payment method distribution" className="mt-4 flex h-3 overflow-hidden rounded-full bg-muted" role="img">
        {methods.map((method) => (
          method.value > 0 ? (
            <span
              className={method.color}
              key={method.key}
              style={{ width: `${(method.value / total) * 100}%` }}
              title={`${method.label}: ${formatNairaFromKobo(method.value)}`}
            />
          ) : null
        ))}
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        {methods.map((method) => (
          <div className="flex items-center justify-between gap-3 text-sm" key={method.key}>
            <span className="flex items-center gap-2 text-muted-foreground">
              <span className={`size-2.5 rounded-sm ${method.color}`} />
              {method.label}
            </span>
            <span className="font-semibold">{formatNairaFromKobo(method.value)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function BranchComparisonTable({ rows }: { rows: Record<string, unknown>[] }) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold tracking-normal">Branch comparison</h2>
        <p className="text-sm text-muted-foreground">Sales and confirmed receipts across active locations.</p>
      </div>
      <div className="app-surface responsive-table-deck overflow-x-auto rounded-xl border">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-muted text-xs uppercase text-muted-foreground">
            <tr><th className="px-3 py-2">Branch</th><th className="px-3 py-2">Sales</th><th className="px-3 py-2">Received</th></tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => (
              <tr key={String(row.branchId)}>
                <td className="px-3 py-2 font-medium" data-deck-primary data-label="Branch">{moneyOrValue(row.branch)}</td>
                <td className="px-3 py-2" data-label="Sales">{moneyOrValue(row.salesKobo, true)}</td>
                <td className="px-3 py-2" data-label="Received">{moneyOrValue(row.receivedKobo, true)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function WorkflowLinks({ role }: { role: PlatformRole }) {
  const visibleWorkflows = workflowCards.filter(
    (workflow) => isAdminRole(role) || workflow.roles.includes(role),
  );

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold tracking-normal">Workflow access</h2>
        <p className="text-sm text-muted-foreground">Available work queues and control areas for your role.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {visibleWorkflows.map((workflow) => {
          const Icon = workflow.icon;

          return (
            <Link
              className="app-surface fluid-hover group rounded-xl border p-4 hover:border-ring/40"
              href={workflow.href}
              key={workflow.href}
            >
              <div className="flex items-start gap-3">
                <span className="rounded-lg border bg-secondary p-2 text-muted-foreground transition group-hover:text-foreground">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block font-medium">{workflow.title}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {workflow.description}
                  </span>
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function ReportsIndexClient() {
  const { user } = useBranchContext();
  const reports = Object.values(reportConfigs).filter((report) =>
    isAdminRole(user.platformRole) || reportRoles[report.type].includes(user.platformRole),
  );
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Reports</h1>
        <p className="text-sm text-muted-foreground">Exportable operational reports from server-authorized data.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {reports.map((report) => (
          <Link className="rounded-lg border bg-card p-4 transition hover:bg-muted" href={`/reports/${report.type.replace("_", "-")}`} key={report.type}>
            <p className="font-medium">{report.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{report.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function ReportPageClient({ reportType }: { reportType: Exclude<ReportType, "dashboard"> }) {
  const config = reportConfigs[reportType];
  const { selectedBranchId, user } = useBranchContext();
  const allowed =
    isAdminRole(user.platformRole) || reportRoles[reportType].includes(user.platformRole);
  const admin = isAdminRole(user.platformRole);
  const [branchScope, setBranchScope] = useState<BranchScope>(admin ? "all_branches" : "selected_branch");
  const [startDate, setStartDate] = useState(monthStart);
  const [endDate, setEndDate] = useState(today);
  const [data, setData] = useState<ReportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const blocked = branchScope === "selected_branch" && !selectedBranchId;

  async function load(pageCursor?: string | null) {
    if (!allowed || blocked) return;
    setLoading(true);
    setError(null);
    try {
      const result = await callFunction<Record<string, unknown>, ReportResult>(
        config.functionName,
        reportInput(selectedBranchId, branchScope, startDate, endDate, pageCursor),
      );
      setData((previous) => pageCursor && previous ? { ...result, rows: [...previous.rows, ...result.rows] } : result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load report.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [allowed, branchScope, selectedBranchId, startDate, endDate, reportType]);

  const columns = useMemo(
    () => config.columns.filter((column) => !column.hideWhenNotSensitive || data?.sensitiveFieldsIncluded),
    [config.columns, data?.sensitiveFieldsIncluded],
  );

  if (!allowed) {
    return (
      <OperationState
        detail="This report is outside your assigned role. Use the dashboard to open your available work areas."
        title="Report unavailable"
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">{config.title}</h1>
          <p className="text-sm text-muted-foreground">{config.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ReportExportButton branchScope={branchScope} disabled={blocked || loading} endDate={endDate} reportType={reportType} startDate={startDate} />
          <Button disabled={blocked || loading} onClick={() => void load()} type="button" variant="outline"><IconRefresh />Refresh</Button>
        </div>
      </div>
      <div className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-4">
        <ReportDateRangePicker endDate={endDate} setEndDate={setEndDate} setStartDate={setStartDate} startDate={startDate} />
        <BranchScopeSelector branchScope={branchScope} setBranchScope={setBranchScope} />
      </div>
      {blocked ? <OperationState detail="Choose a branch or switch to all branches." title="Branch required" /> : null}
      {error ? <ReportPermissionDenied detail={error} /> : null}
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-4">
        {config.metrics.map((metric) => (
          <SummaryMetricCard key={metric.key} label={metric.label} money={metric.money} value={data?.summary[metric.key]} />
        ))}
      </div>
      {reportType === "low_stock" && data?.rows.length ? (
        <div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <IconAlertTriangle className="size-4" /> Low stock uses available quantity: on hand minus reserved.
        </div>
      ) : null}
      {data && data.rows.length === 0 ? <ReportEmptyState /> : null}
      {data && data.rows.length > 0 ? <ReportTable columns={columns} rows={data.rows} /> : null}
      {data?.nextPageCursor ? (
        <div className="flex justify-center">
          <Button disabled={loading} onClick={() => void load(data.nextPageCursor)} type="button" variant="outline">Load more</Button>
        </div>
      ) : null}
    </div>
  );
}

function ReportTable({
  columns,
  rows,
}: {
  columns: ReportConfig["columns"];
  rows: Record<string, unknown>[];
}) {
  return (
    <div className="responsive-table-deck overflow-x-auto rounded-lg border">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-muted text-xs uppercase text-muted-foreground">
          <tr>{columns.map((column) => <th className="px-3 py-2" key={column.key}>{column.label}</th>)}</tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row, index) => (
            <tr key={`${row.id ?? row.orderId ?? row.transactionId ?? index}`}>
              {columns.map((column) => (
                <td
                  className="max-w-[220px] truncate px-3 py-2"
                  data-deck-primary={column.key === columns[0]?.key || undefined}
                  data-label={column.label}
                  key={column.key}
                >
                  {moneyOrValue(row[column.key], column.money)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
