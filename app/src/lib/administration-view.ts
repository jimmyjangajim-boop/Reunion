import type { Row } from "./db.ts";

/** The user keeps the 1725 campaign as records, outside active administration. */
export function archiveOnly(record: Row): boolean {
  let date: Row = {};
  try {
    date =
      typeof record.date_json === "string"
        ? JSON.parse(record.date_json)
        : (record.date ?? {});
  } catch {
    /* Unreadable dates remain unknown, not invented. */
  }
  return [
    date.label,
    date.earliest,
    date.latest,
    record.valid_from,
    record.valid_to,
  ].some((v) => typeof v === "string" && /\b1725\b/.test(v));
}
const inactive = new Set(["superseded", "rejected"]);
const notCurrent = new Set([
  "proposal",
  "planned",
  "ordered",
  "contracted",
  "in production",
  "simulated",
  "canceled",
]);
const offices = [
  ["reunion", "Reunion", "President"],
  ["reunion", "Reunion", "Vice President"],
  ["crown", "Crown", "Reigning monarch"],
  ["crown", "Crown", "Heir"],
] as const;
export function administrationView(
  records: Row[],
  dated: Row[],
  entities: Row[],
  issues: Row[],
) {
  const annotated: Row[] = records.map((r) => ({
    ...r,
    archive_only: archiveOnly(r),
  }));
  const active = annotated.filter(
    (r) => !r.archive_only && !inactive.has(r.canon),
  );
  const snapshot = dated.filter((r) => !archiveOnly(r));
  const government: Row[] = offices.map(
    ([entity_id, entity_name, predicate]) => {
      const current = snapshot.find(
        (r) => r.entity_id === entity_id && r.predicate === predicate,
      );
      if (current)
        return {
          ...current,
          value:
            current.canon === "disputed" && current.alternatives?.length
              ? [
                  ...new Set(current.alternatives.map((r: Row) => r.value)),
                ].join(" / ")
              : current.value,
          register_context: "dated",
        };
      // Undated decisions may be shown as register knowledge, never as a dated term.
      const undated = active.filter(
        (r) =>
          r.entity_id === entity_id &&
          r.predicate === predicate &&
          r.canon === "confirmed" &&
          !r.valid_from &&
          !notCurrent.has(r.operation),
      );
      if (undated.length) {
        const tier = Math.min(...undated.map((r) => r.tier));
        const best = undated.filter((r) => r.tier === tier),
          values = [...new Set(best.map((r) => r.value))];
        const evidence = [
          ...new Map(
            best
              .flatMap((r) => r.evidence ?? [])
              .map((e: Row) => [e.id, e] as const),
          ).values(),
        ];
        return {
          ...best[0],
          value: values.join(" / "),
          canon: values.length > 1 ? "disputed" : "confirmed",
          evidence,
          register_context: "undated_canon",
        };
      }
      return {
        id: "government-" + entity_id + "-" + predicate,
        entity_id,
        entity_name,
        predicate,
        value: "Unknown for selected date",
        canon: "unknown",
        operation: "unknown",
        date_json: JSON.stringify({ precision: "unknown", label: "Unknown" }),
        tier: null,
        evidence: [],
        register_context: "unknown",
      };
    },
  );
  const inactiveEntities = new Set(
    entities
      .filter((e) => {
        const claims = annotated.filter((r) => r.entity_id === e.id);
        return (
          claims.length > 0 &&
          claims.every((r) => r.archive_only || inactive.has(r.canon))
        );
      })
      .map((e) => e.id),
  );
  const archiveIds = new Set(
    annotated.filter((r) => r.archive_only).map((r) => r.id),
  );
  const classifiedIssues: Row[] = issues.map((i) => ({
    ...i,
    archive_only:
      archiveIds.has(i.a_id) ||
      archiveIds.has(i.b_id) ||
      /\b1725\b/.test([i.title, i.known_state, i.question].join(" ")),
  }));
  return {
    records: annotated,
    administrationRecords: active,
    snapshot,
    government,
    currentEntities: entities.filter((e) => !inactiveEntities.has(e.id)),
    issues: classifiedIssues.filter((i) => !i.archive_only),
    archiveIssues: classifiedIssues.filter((i) => i.archive_only),
  };
}
