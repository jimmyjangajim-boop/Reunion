export type RecordOption = { id: string; name: string; kind?: string };

// These are browsing groups, not new domain types or canon classifications.
export function recordChoiceGroup(kind?: string): string {
  if (!kind) return "Records";
  if (kind === "person") return "People";
  if (["institution", "organization", "party", "law"].includes(kind))
    return "Government & organizations";
  if (["unit", "battle"].includes(kind)) return "Military";
  if (["place", "location", "territory", "nation"].includes(kind))
    return "Places & nations";
  if (kind === "project") return "Economy & projects";
  return "Other records";
}

export function filterRecordChoices(
  options: RecordOption[],
  group: string,
  query: string,
) {
  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return options.filter(
    (o) =>
      (!group || recordChoiceGroup(o.kind) === group) &&
      words.every((word) =>
        `${o.name} ${o.kind ?? ""}`.toLocaleLowerCase().includes(word),
      ),
  );
}
