import type {
  CompanyProfile,
  CompanyFitAndAngle,
  FitTemperature,
  ControversyType,
  RiskAndSecurityFunction,
  Ciso,
  GrcRiskLeadership,
} from "@/lib/schema";
import { INTENTS } from "@/lib/schema";

function SourceLink({ url }: { url?: string }) {
  if (!url || url === "Not found") return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="ml-1 text-xs font-medium text-[var(--link)] hover:underline"
    >
      [source]
    </a>
  );
}

function Section({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-[var(--border)] py-5">
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          {title}
        </h2>
        {badge}
      </div>
      {children}
    </section>
  );
}

// Traffic-light verdict on how strong a given lens's fit is. Color and label are
// fixed; the model's one-line rationale (note) is shown inline when present.
const TEMPERATURE_META: Record<
  FitTemperature,
  { label: string; className: string }
> = {
  green: { label: "Good fit", className: "bg-green-100 text-green-700" },
  orange: { label: "Mixed / unclear", className: "bg-amber-100 text-amber-700" },
  red: { label: "Poor fit", className: "bg-red-100 text-red-700" },
};

function TemperatureBadge({
  temperature,
  note,
}: {
  temperature?: FitTemperature;
  note?: string;
}) {
  if (!temperature) return null;
  const meta = TEMPERATURE_META[temperature];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span
        className={`inline-block min-w-[8rem] rounded-full px-2 py-0.5 text-center font-semibold uppercase tracking-wide ${meta.className}`}
      >
        {meta.label}
      </span>
      {has(note) ? (
        <span className="font-normal normal-case text-[var(--text-muted)]">{note}</span>
      ) : null}
    </span>
  );
}

function Empty() {
  return <p className="text-sm italic text-[var(--text-muted)]">Not found</p>;
}

function has(value?: string): boolean {
  return !!value && value !== "Not found";
}

const CONTROVERSY_LABEL: Record<ControversyType, string> = {
  breach: "Breach",
  lawsuit: "Lawsuit",
  regulatory: "Regulatory",
  other: "Other",
};

function SnapshotRow({ label, value }: { label: string; value?: string }) {
  if (!has(value)) return null;
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-[var(--text-muted)]">{label}</dt>
      <dd className="text-sm text-[var(--text-strong)]">{value}</dd>
    </div>
  );
}

export default function CompanyView({
  profile,
  usedExampleBackground = false,
}: {
  profile: CompanyProfile;
  // True when the server tailored the Fit & Angle sections against the committed
  // example background (the ABOUT_ME env var was unset). Surfaced as a notice so
  // a misconfigured deploy can't silently pass off decoy-based verdicts as real.
  usedExampleBackground?: boolean;
}) {
  const s = profile.snapshot;
  return (
    <article className="print-container mx-auto max-w-3xl rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm">
      {/* Header */}
      <header className="pb-2">
        <h1 className="text-2xl font-bold text-[var(--text-strong)]">{profile.name}</h1>
        {has(s?.status) && (
          <p className="mt-1 text-lg text-[var(--text)]">{s.status}</p>
        )}
        {has(profile.overview) && (
          <p className="mt-2 text-[var(--text-muted)]">{profile.overview}</p>
        )}
      </header>

      {/* Snapshot */}
      {s && (
        <Section title="Snapshot">
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <SnapshotRow label="Legal name" value={s.legalName} />
            <SnapshotRow label="Headquarters" value={s.headquarters} />
            <SnapshotRow label="Founded" value={s.founded} />
            <SnapshotRow label="Sector" value={s.sector} />
            <SnapshotRow label="Employees" value={s.employees} />
            <SnapshotRow label="Status" value={s.status} />
          </dl>
          {has(s.website) && (
            <p className="mt-3 text-sm">
              <a
                href={s.website}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-[var(--link)] hover:underline"
              >
                {s.website}
              </a>
            </p>
          )}
        </Section>
      )}

      {/* Products */}
      <Section title="Products & services">
        {profile.products?.length ? (
          <ul className="space-y-2">
            {profile.products.map((p, i) => (
              <li key={i} className="text-sm">
                <span className="font-semibold text-[var(--text-strong)]">{p.name}</span>
                {has(p.description) ? (
                  <span className="text-[var(--text)]"> — {p.description}</span>
                ) : null}
                <SourceLink url={p.source} />
              </li>
            ))}
          </ul>
        ) : (
          <Empty />
        )}
      </Section>

      {/* Milestones */}
      <Section title="Milestones (recent first)">
        {profile.milestones?.length ? (
          <ul className="space-y-2">
            {profile.milestones.map((m, i) => (
              <li key={i} className="text-sm text-[var(--text)]">
                {has(m.date) && (
                  <span className="font-medium text-[var(--text-strong)]">{m.date}: </span>
                )}
                {m.summary}
                <SourceLink url={m.source} />
              </li>
            ))}
          </ul>
        ) : (
          <Empty />
        )}
      </Section>

      {/* Leadership changes */}
      <Section title="Leadership changes">
        {profile.execChanges?.length ? (
          <ul className="space-y-2">
            {profile.execChanges.map((c, i) => (
              <li key={i} className="text-sm text-[var(--text)]">
                {has(c.date) && (
                  <span className="font-medium text-[var(--text-strong)]">{c.date}: </span>
                )}
                {c.summary}
                <SourceLink url={c.source} />
              </li>
            ))}
          </ul>
        ) : (
          <Empty />
        )}
      </Section>

      {/* Risk & Security function — the standing state of security leadership and
          the second line (counterpart to the Leadership-changes event log above). */}
      <RiskSecuritySection data={profile.riskAndSecurityFunction} />

      {/* Layoffs / RIFs */}
      <Section title="Layoffs / reductions in force">
        {profile.layoffs?.length ? (
          <ul className="space-y-2">
            {profile.layoffs.map((l, i) => (
              <li key={i} className="text-sm text-[var(--text)]">
                {has(l.date) && (
                  <span className="font-medium text-[var(--text-strong)]">{l.date}: </span>
                )}
                {l.summary}
                <SourceLink url={l.source} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm italic text-[var(--text-muted)]">None found.</p>
        )}
      </Section>

      {/* Controversies */}
      <Section title="Controversies (breaches, lawsuits, actions)">
        {profile.controversies?.length ? (
          <ul className="space-y-2">
            {profile.controversies.map((c, i) => (
              <li key={i} className="text-sm">
                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium uppercase text-amber-700">
                  {CONTROVERSY_LABEL[c.type] ?? "Other"}
                </span>{" "}
                <span className="text-[var(--text)]">{c.summary}</span>
                {has(c.date) ? (
                  <span className="text-[var(--text-muted)]"> · {c.date}</span>
                ) : null}
                <SourceLink url={c.source} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm italic text-[var(--text-muted)]">None found.</p>
        )}
      </Section>

      {/* SEC filings */}
      <Section title="SEC filing highlights (10-K / 10-Q / 8-K)">
        {profile.secFilingsHighlights?.length ? (
          <ul className="space-y-2">
            {profile.secFilingsHighlights.map((f, i) => (
              <li key={i} className="text-sm">
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium uppercase text-slate-600">
                  {f.filingType}
                </span>{" "}
                <span className="text-[var(--text)]">{f.highlight}</span>
                {has(f.date) ? (
                  <span className="text-[var(--text-muted)]"> · {f.date}</span>
                ) : null}
                <SourceLink url={f.url} />
              </li>
            ))}
          </ul>
        ) : (
          <Empty />
        )}
      </Section>

      {/* Risk factors (from filings) */}
      <Section title="Risk factors (from SEC filings)">
        {profile.riskFactors?.length ? (
          <ul className="space-y-2">
            {profile.riskFactors.map((r, i) => (
              <li key={i} className="text-sm">
                {has(r.category) && (
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium uppercase text-slate-600">
                    {r.category}
                  </span>
                )}{" "}
                <span className="text-[var(--text)]">{r.summary}</span>
                <SourceLink url={r.source} />
              </li>
            ))}
          </ul>
        ) : (
          <Empty />
        )}
      </Section>

      {/* Regulatory filings */}
      <Section title="Regulatory filings & actions">
        {profile.regulatoryFilings?.length ? (
          <ul className="space-y-2">
            {profile.regulatoryFilings.map((r, i) => (
              <li key={i} className="text-sm">
                <span className="font-medium text-[var(--text-strong)]">{r.agency}</span>
                {": "}
                <span className="text-[var(--text)]">{r.summary}</span>
                {has(r.date) ? (
                  <span className="text-[var(--text-muted)]"> · {r.date}</span>
                ) : null}
                <SourceLink url={r.url} />
              </li>
            ))}
          </ul>
        ) : (
          <Empty />
        )}
      </Section>

      {/* Major customers */}
      <Section title="Major customers & partners">
        {profile.majorCustomers?.length ? (
          <ul className="space-y-2">
            {profile.majorCustomers.map((c, i) => (
              <li key={i} className="text-sm">
                <span className="font-medium text-[var(--text-strong)]">{c.name}</span>
                {has(c.note) ? (
                  <span className="text-[var(--text)]"> — {c.note}</span>
                ) : null}
                <SourceLink url={c.source} />
              </li>
            ))}
          </ul>
        ) : (
          <Empty />
        )}
      </Section>

      {/* Company culture */}
      <Section title="Company culture">
        {profile.culture &&
        (has(profile.culture.rtoPolicy) ||
          has(profile.culture.benefits) ||
          has(profile.culture.sentiment) ||
          has(profile.culture.workLifeBalance) ||
          has(profile.culture.generalNotes)) ? (
          <div className="space-y-3 text-sm">
            <CultureRow label="Return to office" value={profile.culture.rtoPolicy} />
            <CultureRow label="Benefits & perks" value={profile.culture.benefits} />
            <CultureRow label="Employee sentiment" value={profile.culture.sentiment} />
            <CultureRow label="Work-life balance" value={profile.culture.workLifeBalance} />
            <CultureRow label="General culture" value={profile.culture.generalNotes} />
            <SourceLink url={profile.culture.source} />
          </div>
        ) : (
          <Empty />
        )}
      </Section>

      {/* Example-background notice — the Fit & Angle verdicts below were tailored
          against the committed decoy profile because ABOUT_ME was unset. */}
      {usedExampleBackground && (
        <div className="mt-5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-[var(--warn)]">
          Generated against the example background — set the{" "}
          <code className="rounded bg-amber-500/20 px-1 py-0.5 font-mono text-xs">
            ABOUT_ME
          </code>{" "}
          environment variable for personalized assessments.
        </div>
      )}

      {/* Fit & Angle — one section per lens (W2 role, advisory client) */}
      {INTENTS.map((meta) => {
        const fit = profile.fitAndAngle?.[meta.value];
        return (
          <Section
            key={meta.value}
            title={meta.sectionTitle}
            badge={
              <TemperatureBadge
                temperature={fit?.temperature}
                note={fit?.temperatureNote}
              />
            }
          >
            <div className="space-y-4 text-sm">
              <FitList
                label={meta.fieldLabels.whyItCouldFitYou}
                items={fit?.whyItCouldFitYou}
              />
              <FitList
                label={meta.fieldLabels.watchOuts}
                items={fit?.watchOuts}
              />
              <FitList
                label={meta.fieldLabels.talkingPoints}
                items={fit?.talkingPoints}
              />
              <FitList
                label={meta.fieldLabels.questionsToAsk}
                items={fit?.questionsToAsk}
              />
              {meta.value === "w2" ? <W2Hiring fit={fit} /> : null}
            </div>
          </Section>
        );
      })}

      {/* Unknowns */}
      <Section title="Unknowns / low-confidence">
        {profile.unknowns?.length ? (
          <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--warn)]">
            {profile.unknowns.map((u, i) => (
              <li key={i}>{u}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm italic text-[var(--text-muted)]">None flagged.</p>
        )}
      </Section>
    </article>
  );
}

function CultureRow({ label, value }: { label: string; value?: string }) {
  if (!has(value)) return null;
  return (
    <div>
      <dt className="font-semibold text-[var(--text-strong)]">{label}</dt>
      <dd className="text-[var(--text)]">{value}</dd>
    </div>
  );
}

// Risk & Security function — the standing state of the security leadership and
// second line. Leads with the CISO as the headline stat (tenure is a primary
// decision driver) and gives the veto-relevant hiring signal its own callout.
// Gated like the culture card: renders <Empty /> when every field is empty.
function RiskSecuritySection({ data }: { data?: RiskAndSecurityFunction }) {
  const ciso = data?.ciso;
  const grc = data?.grcRiskLeadership;
  const anyField =
    !!data &&
    (has(ciso?.name) ||
      has(ciso?.title) ||
      has(ciso?.tenure) ||
      has(ciso?.startDate) ||
      has(ciso?.background) ||
      has(data.securityLeadershipStability) ||
      has(grc?.present) ||
      has(grc?.detail) ||
      has(data.secondLineMaturity) ||
      has(data.hiringShape));

  return (
    <Section title="Risk & Security function">
      {anyField ? (
        <div className="space-y-3 text-sm">
          <CisoHeadline ciso={ciso} />
          <CultureRow
            label="Leadership stability"
            value={data.securityLeadershipStability}
          />
          <GrcOwnerRow grc={grc} />
          <CultureRow label="Second-line maturity" value={data.secondLineMaturity} />
          <HiringSignal value={data.hiringShape} />
        </div>
      ) : (
        <Empty />
      )}
    </Section>
  );
}

// Headline stat for the section: "Name — Title" with the tenure called out
// prominently (bold, since it drives the stability read), the start date and
// background as supporting detail, and a [source] link.
function CisoHeadline({ ciso }: { ciso?: Ciso }) {
  if (!ciso) return null;
  const showName = has(ciso.name);
  const showTitle = has(ciso.title);
  const showTenure = has(ciso.tenure);
  const showStart = has(ciso.startDate);
  const showBackground = has(ciso.background);
  if (!showName && !showTitle && !showTenure && !showStart && !showBackground)
    return null;
  return (
    <div>
      <dt className="font-semibold text-[var(--text-strong)]">Security leader</dt>
      <dd className="text-[var(--text)]">
        {showName || showTitle ? (
          <p className="text-base text-[var(--text-strong)]">
            {showName ? <span className="font-semibold">{ciso.name}</span> : null}
            {showName && showTitle ? " — " : null}
            {showTitle ? <span>{ciso.title}</span> : null}
          </p>
        ) : null}
        {showTenure ? (
          <p className="mt-0.5">
            <span className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
              Tenure:{" "}
            </span>
            <span className="text-base font-bold text-[var(--text-strong)]">
              {ciso.tenure}
            </span>
            {showStart ? (
              <span className="text-[var(--text-muted)]"> · since {ciso.startDate}</span>
            ) : null}
          </p>
        ) : null}
        {showBackground ? (
          <p className="mt-0.5 text-[var(--text-muted)]">{ciso.background}</p>
        ) : null}
        <SourceLink url={ciso.source} />
      </dd>
    </div>
  );
}

// GRC / Enterprise-Risk ownership: the "Yes/No" presence flag plus the detail
// on who owns it, with its own [source] link.
function GrcOwnerRow({ grc }: { grc?: GrcRiskLeadership }) {
  if (!grc || (!has(grc.present) && !has(grc.detail))) return null;
  return (
    <div>
      <dt className="font-semibold text-[var(--text-strong)]">GRC / risk owner</dt>
      <dd className="text-[var(--text)]">
        {has(grc.present) ? (
          <span className="font-medium text-[var(--text-strong)]">{grc.present}</span>
        ) : null}
        {has(grc.present) && has(grc.detail) ? " — " : null}
        {has(grc.detail) ? <span>{grc.detail}</span> : null}
        <SourceLink url={grc.source} />
      </dd>
    </div>
  );
}

// The veto-relevant field (solo IC seat vs. real team mandate). Given an accent
// callout so it reads first, not as the last grey row.
function HiringSignal({ value }: { value?: string }) {
  if (!has(value)) return null;
  return (
    <div className="rounded-lg border border-[var(--border-strong)] border-l-4 border-l-[var(--accent)] bg-[var(--accent-dim)] px-4 py-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        Hiring signal
      </dt>
      <dd className="mt-0.5 text-[var(--text-strong)]">{value}</dd>
    </div>
  );
}

function CareersLink({ url, label }: { url?: string; label: string }) {
  if (!has(url)) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-[var(--link)] hover:underline"
    >
      {label}
    </a>
  );
}

// W2-only hiring block: roles posted in the last 30 days, with a careers-page
// fallback when none match.
function W2Hiring({ fit }: { fit?: CompanyFitAndAngle }) {
  const postings = fit?.jobPostings ?? [];
  const careersUrl = fit?.careersUrl;
  return (
    <div>
      <h3 className="font-semibold text-[var(--text-strong)]">
        Open roles posted in the last 30 days
      </h3>
      {postings.length ? (
        <>
          <ul className="mt-1 space-y-2 text-[var(--text)]">
            {postings.map((job, i) => (
              <li key={i}>
                <span className="font-medium text-[var(--text-strong)]">{job.title}</span>
                {has(job.location) ? (
                  <span className="text-[var(--text-muted)]"> · {job.location}</span>
                ) : null}
                {has(job.postedDate) ? (
                  <span className="text-[var(--text-muted)]"> · {job.postedDate}</span>
                ) : null}
                <SourceLink url={job.url} />
                {has(job.note) ? (
                  <span className="block text-[var(--text-muted)]">{job.note}</span>
                ) : null}
              </li>
            ))}
          </ul>
          {has(careersUrl) ? (
            <p className="mt-2">
              <CareersLink url={careersUrl} label="See all open roles →" />
            </p>
          ) : null}
        </>
      ) : (
        <p className="mt-1 text-[var(--text-muted)]">
          No relevant roles posted in the last 30 days.{" "}
          {has(careersUrl) ? (
            <CareersLink url={careersUrl} label="Browse all open roles →" />
          ) : null}
        </p>
      )}
    </div>
  );
}

function FitList({ label, items }: { label: string; items?: string[] }) {
  return (
    <div>
      <h3 className="font-semibold text-[var(--text-strong)]">{label}</h3>
      {items?.length ? (
        <ul className="mt-1 list-disc space-y-1 pl-5 text-[var(--text)]">
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 italic text-[var(--text-muted)]">Not found</p>
      )}
    </div>
  );
}
