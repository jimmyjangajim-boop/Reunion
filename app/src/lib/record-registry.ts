export const recordCategories = [
  "Government and Politics",
  "Military",
  "Diplomacy",
  "Economy and Treasury",
  "Historical Archive",
] as const;
export type RecordCategory = (typeof recordCategories)[number];
export type GuidedKind =
  | "person"
  | "institution"
  | "organization"
  | "bill"
  | "appointment"
  | "unit"
  | "deployment"
  | "treaty"
  | "historical_event";
type GuidedDefinition = {
  id: GuidedKind;
  category: RecordCategory;
  title: string;
  description: string;
  mode: "guided";
  form: "identity" | "bill" | "appointment" | "military" | "archive" | "treaty";
};
type ExistingDefinition =
  | {
      id: string;
      category: RecordCategory;
      title: string;
      description: string;
      mode: "existing";
      destination: "Battles" | "Imports & Backups";
      form?: never;
    }
  | {
      id: string;
      category: RecordCategory;
      title: string;
      description: string;
      mode: "existing";
      destination: "ledger" | "budget" | "project" | "vote" | "location";
      form?: never;
    };
export type RecordDefinition = GuidedDefinition | ExistingDefinition;
export const recordRegistry: readonly RecordDefinition[] = [
  {
    id: "bill",
    category: "Government and Politics",
    title: "Legislative bill",
    description:
      "Record a bill and select or name its sponsor. Does not enact legislation.",
    mode: "guided",
    form: "bill",
  },
  {
    id: "appointment",
    category: "Government and Politics",
    title: "Government appointment",
    description:
      "Appoint an existing or newly named person to a recorded office.",
    mode: "guided",
    form: "appointment",
  },
  {
    id: "vote",
    category: "Government and Politics",
    title: "Parliamentary vote",
    description:
      "Use the existing vote form with its seat and authority checks.",
    mode: "existing",
    destination: "vote",
  },
  {
    id: "unit",
    category: "Military",
    title: "Unit formation",
    description:
      "Register a named formation without inventing strength or readiness.",
    mode: "guided",
    form: "military",
  },
  {
    id: "deployment",
    category: "Military",
    title: "Deployment or military order",
    description:
      "Plan or order movement of an existing formation. Arrival is recorded separately.",
    mode: "guided",
    form: "military",
  },
  {
    id: "battle",
    category: "Military",
    title: "Battle, casualties or equipment loss",
    description:
      "Create or select an engagement in the combined reviewed after-action workflow.",
    mode: "existing",
    destination: "Battles",
  },
  {
    id: "treaty",
    category: "Diplomacy",
    title: "Treaty or international agreement",
    description:
      "Record terms and link named participating states, preserving approval and date precision.",
    mode: "guided",
    form: "treaty",
  },
  {
    id: "ledger",
    category: "Economy and Treasury",
    title: "Financial transaction or expenditure",
    description:
      "Use the existing validated ledger with transaction references and funding checks.",
    mode: "existing",
    destination: "ledger",
  },
  {
    id: "budget",
    category: "Economy and Treasury",
    title: "Budget record",
    description:
      "Record explicit appropriation authority in the existing form. Does not revise the national framework.",
    mode: "existing",
    destination: "budget",
  },
  {
    id: "project",
    category: "Economy and Treasury",
    title: "Infrastructure project or program",
    description:
      "Record sourced planned, approved, committed and paid project observations.",
    mode: "existing",
    destination: "project",
  },
  {
    id: "historical_event",
    category: "Historical Archive",
    title: "Historical event",
    description:
      "Record a sourced event with related people, places and organizations.",
    mode: "guided",
    form: "archive",
  },
  ...(["person", "institution", "organization"] as const).map(
    (id): GuidedDefinition => ({
      id,
      category: "Historical Archive",
      title: id[0].toUpperCase() + id.slice(1),
      description:
        "Add a sourced identity with known details and honest uncertainty.",
      mode: "guided",
      form: "identity",
    }),
  ),
  {
    id: "source",
    category: "Historical Archive",
    title: "Source document",
    description:
      "Preserve original files using the existing import and evidence workflow.",
    mode: "existing",
    destination: "Imports & Backups",
  },
  {
    id: "location",
    category: "Historical Archive",
    title: "Geographic location",
    description:
      "Use the existing sourced location form; do not guess coordinates, sovereignty or control.",
    mode: "existing",
    destination: "location",
  },
];
export function guidedDefinition(kind: string): GuidedDefinition {
  const definition = recordRegistry.find(
    (r) => r.id === kind && r.mode === "guided",
  );
  if (!definition || definition.mode !== "guided")
    throw Error("Choose a supported guided record type");
  return definition;
}
export type RecordFormData = Record<string, string | string[]>;
export type RecordChoice = { id: string; name: string; kind?: string };
export type RecordContext = {
  entities: RecordChoice[];
  currentEntities?: RecordChoice[];
  offices: RecordChoice[];
  units: RecordChoice[];
  locations: RecordChoice[];
  sources: { id: string; filename: string }[];
};
export type RecordReview = {
  title: string;
  fields: { label: string; value: string }[];
  links: string[];
  changes: string[];
  unknowns: string[];
  approval: string;
  token: string;
};
export type RecordDraft = {
  id: string;
  kind: GuidedKind;
  payload: RecordFormData;
  revision: number;
  status: "draft" | "saved";
  target_id: string | null;
  updated_at: string;
};
