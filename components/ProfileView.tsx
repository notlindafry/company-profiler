import type { ExecutiveProfile } from "@/lib/schema";

function SourceLink({ url }: { url?: string }) {
  if (!url || url === "Not found") return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="ml-1 text-xs font-medium text-blue-600 hover:underline"
    >
      [source]
    </a>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-slate-200 py-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Empty() {
  return <p className="text-sm italic text-slate-400">Not found</p>;
}

export default function ProfileView({ profile }: { profile: ExecutiveProfile }) {
  return (
    <article className="print-container mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      {/* Header */}
      <header className="pb-2">
        <h1 className="text-2xl font-bold text-slate-900">{profile.name}</h1>
        <p className="mt-1 text-lg text-slate-700">
          {profile.currentTitle}
          {profile.currentCompany ? ` · ${profile.currentCompany}` : ""}
        </p>
        {(profile.tenure?.startDate || profile.tenure?.durationText) && (
          <p className="mt-1 text-sm text-slate-500">
            At company since {profile.tenure.startDate || "Not found"}
            {profile.tenure.durationText && profile.tenure.durationText !== "Not found"
              ? ` (${profile.tenure.durationText})`
              : ""}
          </p>
        )}
      </header>

      {/* Career history */}
      <Section title="Career history (where they came from)">
        {profile.careerHistory?.length ? (
          <ul className="space-y-3">
            {profile.careerHistory.map((role, i) => (
              <li key={i} className="text-sm">
                <span className="font-semibold text-slate-900">{role.title}</span>
                {role.company ? `, ${role.company}` : ""}
                <span className="text-slate-500">
                  {" "}
                  ({role.startDate || "?"} – {role.endDate || "?"})
                </span>
                <SourceLink url={role.source} />
                {role.note && role.note !== "Not found" && (
                  <p className="mt-0.5 text-slate-600">{role.note}</p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <Empty />
        )}
      </Section>

      {/* Education */}
      <Section title="Education">
        {profile.education?.length ? (
          <ul className="space-y-2">
            {profile.education.map((ed, i) => (
              <li key={i} className="text-sm">
                <span className="font-medium text-slate-900">{ed.institution}</span>
                {ed.degree && ed.degree !== "Not found" ? ` — ${ed.degree}` : ""}
                {ed.field && ed.field !== "Not found" ? `, ${ed.field}` : ""}
                {ed.year && ed.year !== "Not found" ? ` (${ed.year})` : ""}
                <SourceLink url={ed.source} />
              </li>
            ))}
          </ul>
        ) : (
          <Empty />
        )}
      </Section>

      {/* Career notes */}
      <Section title="Career notes">
        {profile.careerNotes?.length ? (
          <ul className="list-disc space-y-1 pl-5">
            {profile.careerNotes.map((n, i) => (
              <li key={i} className="text-sm text-slate-700">
                {n.note}
                <SourceLink url={n.source} />
              </li>
            ))}
          </ul>
        ) : (
          <Empty />
        )}
      </Section>

      {/* Media & publications */}
      <Section title="Media & publications (recent first)">
        {profile.mediaAndPublications?.length ? (
          <ul className="space-y-2">
            {profile.mediaAndPublications.map((m, i) => (
              <li key={i} className="text-sm">
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium uppercase text-slate-500">
                  {m.type}
                </span>{" "}
                <span className="text-slate-800">{m.title}</span>
                {m.date && m.date !== "Not found" ? (
                  <span className="text-slate-500"> · {m.date}</span>
                ) : null}
                <SourceLink url={m.url} />
              </li>
            ))}
          </ul>
        ) : (
          <Empty />
        )}
      </Section>

      {/* Announcements since joining */}
      <Section title="Announcements since joining">
        {profile.announcementsSinceJoining?.length ? (
          <ul className="space-y-2">
            {profile.announcementsSinceJoining.map((a, i) => (
              <li key={i} className="text-sm text-slate-700">
                {a.summary}
                {a.date && a.date !== "Not found" ? (
                  <span className="text-slate-500"> · {a.date}</span>
                ) : null}
                <SourceLink url={a.url} />
              </li>
            ))}
          </ul>
        ) : (
          <Empty />
        )}
      </Section>

      {/* LinkedIn (public only) */}
      <Section title="LinkedIn (public info only)">
        {profile.linkedin ? (
          <div className="text-sm text-slate-700">
            {profile.linkedin.profileUrl && profile.linkedin.profileUrl !== "Not found" ? (
              <p>
                Profile:
                <a
                  href={profile.linkedin.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 break-all text-blue-600 hover:underline"
                >
                  {profile.linkedin.profileUrl}
                </a>
              </p>
            ) : (
              <p className="italic text-slate-400">Profile URL not found</p>
            )}
            {profile.linkedin.publicActivitySummary &&
              profile.linkedin.publicActivitySummary !== "Not found" && (
                <p className="mt-1">{profile.linkedin.publicActivitySummary}</p>
              )}
            {profile.linkedin.themes?.length ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {profile.linkedin.themes.map((t, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                  >
                    {t}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <Empty />
        )}
      </Section>

      {/* Fit & Angle */}
      <Section title="Fit & Angle (tailored to you)">
        <div className="space-y-4 text-sm">
          <FitList label="Their likely priorities" items={profile.fitAndAngle?.execLikelyPriorities} />
          <FitList label="Why you connect" items={profile.fitAndAngle?.whyYouConnect} />
          <FitList label="Talking points" items={profile.fitAndAngle?.talkingPoints} />
          <FitList label="Smart questions to ask" items={profile.fitAndAngle?.questionsToAsk} />
        </div>
      </Section>

      {/* Unknowns */}
      <Section title="Unknowns / low-confidence">
        {profile.unknowns?.length ? (
          <ul className="list-disc space-y-1 pl-5 text-sm text-amber-700">
            {profile.unknowns.map((u, i) => (
              <li key={i}>{u}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm italic text-slate-400">None flagged.</p>
        )}
      </Section>
    </article>
  );
}

function FitList({ label, items }: { label: string; items?: string[] }) {
  return (
    <div>
      <h3 className="font-semibold text-slate-800">{label}</h3>
      {items?.length ? (
        <ul className="mt-1 list-disc space-y-1 pl-5 text-slate-700">
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 italic text-slate-400">Not found</p>
      )}
    </div>
  );
}
