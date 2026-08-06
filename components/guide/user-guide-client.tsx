"use client";

import {
  IconArrowRight,
  IconBook2,
  IconCheck,
  IconChevronDown,
  IconCircleCheck,
  IconHelpCircle,
  IconPrinter,
  IconSearch,
  IconShieldCheck,
  IconSnowflake,
} from "@tabler/icons-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { useBranchContext } from "@/components/branch/branch-context";
import { roleGuides } from "@/components/dashboard/dashboard-guide";
import { Button } from "@/components/ui/button";
import { isAdminRole, platformRoles, type PlatformRole } from "@/lib/domain/roles";
import {
  roleDocumentation,
  salesFlow,
  statusGlossary,
  type GuideProcedure,
} from "@/lib/guide/user-guide";

function procedureMatches(procedure: GuideProcedure, query: string) {
  if (!query) return true;

  return [
    procedure.title,
    procedure.summary,
    ...procedure.prerequisites,
    ...procedure.steps,
    ...procedure.completeWhen,
    procedure.escalation ?? "",
  ]
    .join(" ")
    .toLocaleLowerCase()
    .includes(query);
}

export function UserGuideClient() {
  const { selectedBranch, user } = useBranchContext();
  const canViewAllRoles = isAdminRole(user.platformRole);
  const [selectedRole, setSelectedRole] = useState<PlatformRole>(user.platformRole);
  const [search, setSearch] = useState("");
  const guide = roleGuides[selectedRole];
  const documentation = roleDocumentation[selectedRole];
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const procedures = useMemo(
    () =>
      documentation.procedures.filter((procedure) =>
        procedureMatches(procedure, normalizedSearch),
      ),
    [documentation.procedures, normalizedSearch],
  );

  function changeRole(role: PlatformRole) {
    setSelectedRole(role);
    setSearch("");
  }

  return (
    <div className="user-guide-page space-y-6">
      <header className="flex flex-col gap-5 border-b pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <IconBook2 aria-hidden="true" className="size-5" />
            YITA operations manual
          </div>
          <h1 className="mt-2 text-3xl font-semibold">User guide</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
            Detailed responsibilities, controls, and step-by-step procedures for
            your YITA Iceberg role.
          </p>
        </div>
        <Button className="print-hidden self-start" onClick={() => window.print()} variant="outline">
          <IconPrinter aria-hidden="true" />
          Print guide
        </Button>
      </header>

      <section className="app-surface glass-edge rounded-xl border p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.55fr)] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">Guide for</p>
            {canViewAllRoles ? (
              <label className="mt-2 block max-w-md">
                <span className="sr-only">Select role guide</span>
                <select
                  className="h-11 w-full rounded-lg border bg-background px-3 text-sm font-medium"
                  onChange={(event) => changeRole(event.target.value as PlatformRole)}
                  value={selectedRole}
                >
                  {platformRoles.map((role) => (
                    <option key={role} value={role}>
                      {roleGuides[role].label}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <p className="mt-1 text-xl font-semibold">{guide.label}</p>
            )}
            {canViewAllRoles ? (
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Your {roleGuides[user.platformRole].label.toLocaleLowerCase()} access lets
                you review every role manual for training and support.
              </p>
            ) : null}
          </div>
          <label className="print-hidden block">
            <span className="text-xs font-semibold uppercase text-muted-foreground">
              Search this role guide
            </span>
            <span className="relative mt-2 block">
              <IconSearch
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <input
                className="h-11 w-full rounded-lg border bg-background pl-10 pr-3 text-sm"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search payments, stock, reversals..."
                type="search"
                value={search}
              />
            </span>
          </label>
        </div>
      </section>

      <section className="grid gap-6 border-y py-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(18rem,0.95fr)]">
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            {guide.label}
          </p>
          <h2 className="mt-1 text-2xl font-semibold">{guide.headline}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            {guide.summary}
          </p>
          <div className="print-hidden mt-5 flex flex-wrap gap-2">
            <Button asChild>
              <Link href={guide.primaryHref}>
                {guide.primaryAction}
                <IconArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <a href="#procedures">View procedures</a>
            </Button>
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold">What you can do</h3>
            <ul className="mt-3 space-y-2">
              {guide.capabilities.map((capability) => (
                <li className="flex gap-2 text-sm leading-5" key={capability}>
                  <IconCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>{capability}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Important controls</h3>
            <ul className="mt-3 space-y-2">
              {guide.boundaries.map((boundary) => (
                <li className="flex gap-2 text-sm leading-5 text-muted-foreground" key={boundary}>
                  <IconShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                  <span>{boundary}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section aria-labelledby="daily-start-title">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary text-secondary-foreground">
            <IconCircleCheck aria-hidden="true" className="size-5" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">Start here</p>
            <h2 className="text-xl font-semibold" id="daily-start-title">Daily opening check</h2>
          </div>
        </div>
        <ol className="mt-4 grid gap-3 md:grid-cols-3">
          {documentation.dailyStart.map((item, index) => (
            <li className="app-surface flex gap-3 rounded-lg border p-4 text-sm leading-6" key={item}>
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {index + 1}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-sm text-muted-foreground">
          Current branch: <strong className="text-foreground">{selectedBranch?.name ?? "Select the branch required for the task"}</strong>
        </p>
      </section>

      <section aria-labelledby="sales-flow-title" className="border-y py-6">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Shared workflow</p>
          <h2 className="mt-1 text-xl font-semibold" id="sales-flow-title">How every sale moves through YITA</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            The stages are linked but independently verified. Managers, admins, and super admins can support multiple stages without removing the transaction history.
          </p>
        </div>
        <ol className="mt-5 grid gap-4 lg:grid-cols-3">
          {salesFlow.map((item) => (
            <li className="app-surface relative rounded-xl border p-5" key={item.stage}>
              <div className="flex items-center justify-between gap-3">
                <span className="grid size-9 place-items-center rounded-lg bg-primary font-semibold text-primary-foreground">
                  {item.stage}
                </span>
                <span className="text-xs font-semibold uppercase text-muted-foreground">{item.role}</span>
              </div>
              <h3 className="mt-4 font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="procedures-title" id="procedures">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">Operating instructions</p>
            <h2 className="mt-1 text-xl font-semibold" id="procedures-title">Step-by-step procedures</h2>
          </div>
          <p aria-live="polite" className="text-sm text-muted-foreground">
            {procedures.length} of {documentation.procedures.length} procedures
          </p>
        </div>

        {procedures.length > 0 ? (
          <div className="mt-4 divide-y overflow-hidden rounded-xl border bg-card/55">
            {procedures.map((procedure, index) => (
              <ProcedureDetails
                defaultOpen={!normalizedSearch && index === 0}
                key={procedure.id}
                procedure={procedure}
              />
            ))}
          </div>
        ) : (
          <div className="app-surface mt-4 rounded-xl border p-6 text-center">
            <IconSearch aria-hidden="true" className="mx-auto size-6 text-muted-foreground" />
            <h3 className="mt-3 font-semibold">No matching procedure</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Try a broader word or clear the search to see the complete guide.
            </p>
            <Button className="mt-4" onClick={() => setSearch("")} variant="outline">
              Clear search
            </Button>
          </div>
        )}
      </section>

      <section aria-labelledby="status-title" className="border-y py-6">
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">Reference</p>
          <h2 className="mt-1 text-xl font-semibold" id="status-title">Statuses and stock terms</h2>
        </div>
        <dl className="mt-4 grid gap-x-8 gap-y-0 md:grid-cols-2">
          {statusGlossary.map((item) => (
            <div className="border-t py-4 first:border-t-0 md:nth-[2]:border-t-0" key={item.term}>
              <dt className="font-semibold">{item.term}</dt>
              <dd className="mt-1 text-sm leading-6 text-muted-foreground">{item.meaning}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="help-title" className="app-surface glass-edge rounded-xl border p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
            <IconHelpCircle aria-hidden="true" className="size-6" />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold" id="help-title">When to ask for help</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{documentation.escalation}</p>
            <p className="mt-3 text-sm leading-6">
              Include the branch, order or product number, exact action, time, and full error message. Never share your password, service account key, or private setup link.
            </p>
          </div>
        </div>
      </section>

      <footer className="flex items-center gap-3 pb-2 text-xs leading-5 text-muted-foreground">
        <IconSnowflake aria-hidden="true" className="size-4 shrink-0" />
        YITA Iceberg operating guide. Follow current company policy when it is more restrictive than this guide.
      </footer>
    </div>
  );
}

function ProcedureDetails({
  defaultOpen,
  procedure,
}: {
  defaultOpen: boolean;
  procedure: GuideProcedure;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <details
      className="group scroll-mt-28"
      id={procedure.id}
      onToggle={(event) => setOpen(event.currentTarget.open)}
      open={open}
    >
      <summary className="fluid-hover flex cursor-pointer list-none items-start gap-3 px-4 py-4 hover:bg-secondary/60 sm:px-5 [&::-webkit-details-marker]:hidden">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary text-secondary-foreground group-open:bg-primary group-open:text-primary-foreground">
          <IconBook2 aria-hidden="true" className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{procedure.title}</span>
          <span className="mt-1 block text-sm leading-5 text-muted-foreground">{procedure.summary}</span>
        </span>
        <IconChevronDown
          aria-hidden="true"
          className="mt-2 size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="border-t px-4 py-5 sm:px-5">
        <div className="grid gap-6 lg:grid-cols-[minmax(13rem,0.7fr)_minmax(0,1.3fr)]">
          <div className="space-y-5">
            <GuideList heading="Before you start" items={procedure.prerequisites} icon="shield" />
            <GuideList heading="Complete when" items={procedure.completeWhen} icon="check" />
          </div>
          <div>
            <h4 className="text-sm font-semibold">Steps</h4>
            <ol className="mt-3 space-y-3">
              {procedure.steps.map((step, index) => (
                <li className="flex gap-3 text-sm leading-6" key={step}>
                  <span className="grid size-7 shrink-0 place-items-center rounded-full border bg-background text-xs font-semibold">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
        {procedure.escalation ? (
          <div className="mt-5 border-l-2 border-accent bg-accent/15 px-4 py-3 text-sm leading-6">
            <strong>Stop and escalate:</strong> {procedure.escalation}
          </div>
        ) : null}
        <div className="print-hidden mt-5">
          <Button asChild variant="outline">
            <Link href={procedure.href}>
              {procedure.action}
              <IconArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </details>
  );
}

function GuideList({
  heading,
  icon,
  items,
}: {
  heading: string;
  icon: "check" | "shield";
  items: string[];
}) {
  const Icon = icon === "check" ? IconCircleCheck : IconShieldCheck;

  return (
    <div>
      <h4 className="text-sm font-semibold">{heading}</h4>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li className="flex gap-2 text-sm leading-5 text-muted-foreground" key={item}>
            <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
