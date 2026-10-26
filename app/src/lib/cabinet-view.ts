import type { Row } from "./db.ts";
import { archiveOnly } from "./administration-view.ts";
import { bounds, historicalDateSchema } from "./dates.ts";
import { billAtDate } from "./parliament-view.ts";
import type { Bill, BillEvent } from "./parliament-view.ts";
const roleTitles = (name: string) => {
  const office = [
    "President",
    "Vice President",
    "Reigning monarch",
    "Heir",
  ].find((r) => r.toLowerCase() === name.trim().toLowerCase());
  return office
    ? {
        ministry: ["President", "Vice President"].includes(office)
          ? "Presidency"
          : "The Crown",
        office,
        kind: ["President", "Vice President"].includes(office)
          ? "leadership"
          : "royal",
      }
    : null;
};
const isEstablishedTerm = (a: Row, date: string) =>
  !archiveOnly(a) &&
  a.canon === "confirmed" &&
  a.start_date &&
  a.start_date <= date &&
  (!a.end_date || a.end_date >= date);
const observedBy = (r: Row, date: string) => {
  if (r.scope === "interval" && r.valid_from && r.valid_from <= date)
    return true;
  try {
    const [lo, hi] = bounds(
      historicalDateSchema.parse(JSON.parse(r.date_json)),
    );
    return !!lo && !!hi && hi <= date;
  } catch {
    return false;
  }
};
const isUndated = (r: Row) => {
  try {
    const [lo, hi] = bounds(
      historicalDateSchema.parse(JSON.parse(r.date_json)),
    );
    return !lo && !hi;
  } catch {
    return true;
  }
};
const good = (r: Row) =>
  !archiveOnly(r) && !["superseded", "rejected"].includes(r.canon);
const dateText = (r: Row) => {
  try {
    return JSON.parse(r.date_json).label;
  } catch {
    return r.date ?? "Date unknown";
  }
};
const same = (a: string, b: string) =>
  a.trim().toLocaleLowerCase() === b.trim().toLocaleLowerCase();
export function officeTitles(name: string) {
  const role = roleTitles(name);
  if (role) return role;
  const clean = name.replaceAll("&", "and").trim();
  if (/Intelligence \(RIA Director\)/i.test(clean))
    return {
      ministry: "Reunion Intelligence Agency",
      office: "Director of the RIA",
      kind: "institution",
    };
  if (/^Ministry of /i.test(clean))
    return {
      ministry: clean,
      office: clean.replace(/^Ministry of /i, "Minister of "),
      kind: "minister",
    };
  if (/^(Finance Minister|Minister of Finance)$/i.test(clean))
    return {
      ministry: "Ministry of Finance",
      office: "Minister of Finance",
      kind: "minister",
    };
  if (/^(Deputy|Assistant) /i.test(clean))
    return { ministry: clean, office: clean, kind: "deputy" };
  if (/ Minister$/i.test(clean))
    return {
      ministry: "Ministry of " + clean.replace(/ Minister$/i, ""),
      office: "Minister of " + clean.replace(/ Minister$/i, ""),
      kind: "minister",
    };
  return {
    ministry: "Ministry of " + clean,
    office: "Minister of " + clean,
    kind: "minister",
  };
}
/** A read-only roster projection. Ministry observations are not appointment dates. */
export function cabinetView(input: {
  date: string;
  records: Row[];
  snapshot: Row[];
  government: Row[];
  entities: Row[];
  offices: Row[];
  appointments: Row[];
  timeline: Row[];
  bills: Row[];
  billEvents?: Row[];
}) {
  const {
    date,
    records,
    snapshot,
    government,
    entities,
    offices,
    appointments,
    timeline,
    bills,
    billEvents = [],
  } = input;
  const claims = records.filter(
    (r) => good(r) && ["Baseline minister", "Minister"].includes(r.predicate),
  );
  const groups = new Map<string, Row[]>();
  for (const claim of claims) {
    const title = officeTitles(claim.entity_name);
    const key = title.ministry.toLocaleLowerCase();
    groups.set(key, [...(groups.get(key) ?? []), claim]);
  }
  const knownOfficeNames = new Set<string>();
  const rowFor = (
    id: string,
    titles: Row,
    holder: Row | undefined,
    observations: Row[],
    office: Row | undefined,
    terms: Row[],
  ): Row => {
    const name =
      holder?.value &&
      !/^(unknown|not established|unrecorded|—)$/i.test(holder.value)
        ? holder.value
        : null;
    const people = name
      ? entities.filter(
          (e) =>
            e.kind === "person" &&
            (holder?.person_id
              ? e.id === holder.person_id
              : same(e.name, name)),
        )
      : [];
    const person = people.length === 1 ? people[0] : undefined;
    const personal = person
      ? records.filter((r) => r.entity_id === person.id && good(r))
      : [];
    const affiliation =
      snapshot.find(
        (r) =>
          r.entity_id === person?.id &&
          r.canon === "confirmed" &&
          /^(Political affiliation|Party|Affiliation)$/i.test(r.predicate),
      )?.value ?? null;
    const evidence = [
      ...new Map(
        [
          ...observations.flatMap((r) => r.evidence ?? []),
          ...personal.flatMap((r) => r.evidence ?? []),
          ...terms
            .filter((t) => t.source_id)
            .map((t) => ({
              id: "term-" + t.id,
              source_id: t.source_id,
              filename: "Appointment record",
            })),
        ].map((e: Row) => [e.id ?? `${e.source_id}:${e.line_start}`, e]),
      ).values(),
    ];
    const vacant =
      !!name &&
      /^(vacant|unfilled|no (?:minister|officeholder)(?: appointed)?)$/i.test(
        name,
      );
    const currentTerm = terms.find(
      (a) => isEstablishedTerm(a, date) && a.person === name,
    );
    const linked = personal.map((r) => ({
      id: r.id,
      title: r.predicate.replaceAll("_", " "),
      canon: r.canon,
      operation: r.operation,
      value: r.value,
      date: dateText(r),
      evidence: r.evidence ?? [],
    }));
    const relevant = (text: string) =>
      !!name && text.toLocaleLowerCase().includes(name.toLocaleLowerCase());
    return {
      id,
      ...titles,
      name: vacant ? null : name,
      person_id: person?.id ?? null,
      status: vacant
        ? "vacant"
        : holder?.canon === "disputed"
          ? "disputed"
          : name
            ? "recorded"
            : "unknown",
      selected_date: date,
      office_id: office?.id ?? null,
      context: currentTerm
        ? "Dated appointment"
        : holder?.register_context === "undated_canon"
          ? "Undated canon reference"
          : holder && !isUndated(holder)
            ? "Dated observation"
            : "No dated officeholder established",
      observed_date:
        currentTerm?.start_date ??
        (holder && !isUndated(holder) ? dateText(holder) : null),
      appointment_date: currentTerm?.start_date ?? null,
      affiliation,
      responsibilities:
        office?.authority && office.authority !== "Unknown"
          ? office.authority
          : null,
      evidence,
      history: terms.filter((t) => !archiveOnly(t)),
      observations: observations.map((r) => ({
        id: r.id,
        name: r.value,
        date: dateText(r),
        canon: r.canon,
        evidence: r.evidence ?? [],
      })),
      facts: linked.filter((_, i) => observedBy(personal[i], date)),
      undated_facts: linked.filter((_, i) => isUndated(personal[i])),
      events: timeline
        .filter(
          (t) =>
            good(t) &&
            observedBy(t, date) &&
            (relevant(t.title) ||
              (person &&
                t.related_entities?.some(
                  (e: Row) => (e.id ?? e.entity_id) === person.id,
                ))),
        )
        .map((t) => ({
          id: t.id,
          title: t.title,
          date: dateText(t),
          source_id: t.source_id,
          canon: t.canon,
          operation: t.operation,
        })),
      legislation: bills
        .filter(
          (b) =>
            ((person && b.sponsor_id === person.id) ||
              relevant(b.summary ?? "") ||
              relevant(b.sponsor ?? "")) &&
            billAtDate(b as Bill, billEvents as BillEvent[], date).visible,
        )
        .map((b) => ({
          id: b.id,
          title: b.title,
          identifier: b.identifier,
          stage: billAtDate(b as Bill, billEvents as BillEvent[], date).stage,
          source_id: b.source_id,
        })),
    };
  };
  const roster: Row[] = [];
  for (const [key, observations] of groups) {
    const titles = officeTitles(observations[0].entity_name);
    const office = offices.find(
      (o) => officeTitles(o.name).ministry.toLocaleLowerCase() === key,
    );
    if (office) knownOfficeNames.add(office.id);
    const terms = office
      ? appointments.filter((a) => a.office_id === office.id)
      : [];
    const dated = snapshot.filter((r) =>
      observations.some((o) => o.id === r.id),
    );
    const ranked = dated.length
      ? dated.filter((r) => r.tier === Math.min(...dated.map((r) => r.tier)))
      : [];
    const values = [
      ...new Set(
        ranked.flatMap((r) =>
          r.alternatives?.length
            ? r.alternatives.map((a: Row) => a.value)
            : [r.value],
        ),
      ),
    ];
    let holder: Row | undefined = ranked.length
      ? {
          ...ranked[0],
          value: values.join(" / "),
          canon: values.length > 1 ? "disputed" : ranked[0].canon,
        }
      : undefined;
    const established = terms.filter((a) => isEstablishedTerm(a, date));
    // Explicit dated appointments take priority over an observation on that date.
    if (established.length === 1)
      holder = { ...established[0], value: established[0].person };
    else if (established.length > 1)
      holder = {
        ...established[0],
        value: [...new Set(established.map((a) => a.person))].join(" / "),
        canon: "disputed",
      };
    roster.push(
      rowFor(
        "cabinet-" + observations[0].entity_id,
        titles,
        holder,
        observations,
        office,
        terms,
      ),
    );
  }
  for (const office of offices.filter(
    (o) => !knownOfficeNames.has(o.id) && !roleTitles(o.name),
  )) {
    const terms = appointments.filter((a) => a.office_id === office.id);
    const dated = terms.filter((a) => isEstablishedTerm(a, date));
    const holder = dated.length
      ? {
          ...dated[0],
          value: dated.map((a) => a.person).join(" / "),
          canon: dated.length > 1 ? "disputed" : "confirmed",
        }
      : undefined;
    const titles = /Minister/i.test(office.name)
      ? officeTitles(office.name)
      : {
          ministry: office.name,
          office: office.name,
          kind: /deputy/i.test(office.name) ? "deputy" : "institution",
        };
    roster.push(
      rowFor("office-" + office.id, titles, holder, [], office, terms),
    );
  }
  const roleRow = (r: Row) => {
    const titles = roleTitles(r.predicate)!;
    const office = offices.find(
      (o) => roleTitles(o.name)?.office === r.predicate,
    );
    const terms = office
      ? appointments.filter((a) => a.office_id === office.id)
      : [];
    const dated = terms.filter((a) => isEstablishedTerm(a, date));
    const holder = dated.length
      ? {
          ...dated[0],
          value: [...new Set(dated.map((a) => a.person))].join(" / "),
          canon: dated.length > 1 ? "disputed" : "confirmed",
        }
      : r.canon === "unknown"
        ? undefined
        : r;
    return rowFor(
      (titles.kind === "royal" ? "royal-" : "leadership-") + r.predicate,
      titles,
      holder,
      [r],
      office,
      terms,
    );
  };
  const leadership = government
    .filter((r) => ["President", "Vice President"].includes(r.predicate))
    .map(roleRow);
  const royal = government
    .filter((r) => ["Reigning monarch", "Heir"].includes(r.predicate))
    .map(roleRow);
  return {
    date,
    leadership,
    royal,
    ministries: roster
      .filter((r) => r.kind === "minister")
      .sort((a, b) => a.ministry.localeCompare(b.ministry)),
    deputies: roster.filter((r) => r.kind === "deputy"),
    institutions: roster.filter((r) => r.kind === "institution"),
  };
}
