const controls = [
  "Role-aware workspaces",
  "Branch-level visibility",
  "Controlled records",
  "Activity history",
  "Review checkpoints",
  "Protected account access",
];

export function SecuritySection() {
  return (
    <section className="bg-[#f8f5ef] px-4 py-16 text-[#071426] sm:px-6 md:py-20 lg:px-8" id="security">
      <div className="mx-auto max-w-7xl rounded-[2rem] border border-[#071426]/10 bg-white p-6 shadow-[0_30px_90px_rgba(7,20,38,0.08)] md:p-10">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#8f7437]">
              Governance
            </p>
            <h2 className="mt-4 font-display text-4xl leading-tight text-balance sm:text-5xl">
              Clear operations, controlled access.
            </h2>
            <p className="mt-5 text-base leading-7 text-[#1d2430]/72">
              The portal gives each team member the tools required for their
              role while keeping operational records available to authorized
              reviewers.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {controls.map((control) => (
              <div className="rounded-2xl border border-[#071426]/10 bg-[#eef4f9] p-5" key={control}>
                <span className="mb-4 block h-px w-10 bg-[#c8a45d]" />
                <p className="text-sm font-semibold">{control}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
