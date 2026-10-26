// Client-safe navigation metadata. These labels do not change stored domain types.
export const operationalKinds = [
  "bill",
  "appointment",
  "office",
  "vote",
  "unit",
  "deployment",
  "procurement",
  "asset",
  "battle",
  "treaty",
  "location",
  "budget",
  "ledger",
  "project",
] as const;
export const domainKinds = [
  ...operationalKinds,
  "person",
  "institution",
  "organization",
  "historical_event",
] as const;
export type OperationalKind = (typeof operationalKinds)[number];
export type DomainKind = (typeof domainKinds)[number];
export const searchCategories = [
  "People",
  "Government & politics",
  "Military",
  "Diplomacy",
  "Economy & treasury",
  "Places",
  "Historical archive",
  "Sources",
] as const;
export type SearchCategory = (typeof searchCategories)[number];
export const recordCatalog: Record<
  DomainKind,
  { title: string; category: SearchCategory; note?: string }
> = {
  person: { title: "Person", category: "People" },
  institution: { title: "Institution", category: "Government & politics" },
  organization: { title: "Organization", category: "Government & politics" },
  historical_event: {
    title: "Historical event",
    category: "Historical archive",
  },
  bill: { title: "Legislative bill", category: "Government & politics" },
  appointment: {
    title: "Government appointment",
    category: "Government & politics",
  },
  office: { title: "Office", category: "Government & politics" },
  vote: { title: "Parliamentary vote", category: "Government & politics" },
  unit: { title: "Unit formation", category: "Military" },
  deployment: { title: "Deployment or order", category: "Military" },
  procurement: {
    title: "Procurement observation",
    category: "Military",
    note: "Ordered, delivered and operational counts are distinct recorded observations. No later delivery or readiness is inferred.",
  },
  asset: {
    title: "Tracked asset",
    category: "Military",
    note: "This is the mutable asset register across all dates, not a historical inventory snapshot.",
  },
  battle: {
    title: "Battle",
    category: "Military",
    note: "Combat phases and casualty categories remain separate in Battles; no combined loss total is inferred here.",
  },
  treaty: { title: "Treaty or agreement", category: "Diplomacy" },
  location: { title: "Named location", category: "Places" },
  budget: {
    title: "Appropriation",
    category: "Economy & treasury",
    note: "A recorded appropriation is distinct from the national spending framework, commitments and actual payments.",
  },
  ledger: {
    title: "Financial transaction",
    category: "Economy & treasury",
    note: "The stored accounting stage is shown explicitly. Proposals and commitments are not actual spending.",
  },
  project: {
    title: "Project or program",
    category: "Economy & treasury",
    note: "Source-reported funding envelopes do not establish actual ledger payments, physical completion or production.",
  },
};
export type RecordLinkKind = DomainKind | "entity";
export type DomainRecordDetails = {
  id: string;
  kind: DomainKind;
  title: string;
  type: string;
  note?: string;
  fields: { label: string; value: string }[];
  links: {
    kind: RecordLinkKind;
    id: string;
    label: string;
    relationship: string;
  }[];
  evidence: {
    source_id: string;
    filename: string;
    line_start: number;
    line_end: number;
  }[];
  currentSource: { id: string; filename: string } | null;
};
export type SearchKind =
  | OperationalKind
  | "entity"
  | "fact"
  | "event"
  | "source";
export const searchKinds = [
  ...operationalKinds,
  "entity",
  "fact",
  "event",
  "source",
] as const;
export type SearchHit = {
  kind: SearchKind;
  id: string;
  title: string;
  type: string;
  category: SearchCategory;
  excerpt: string;
  date?: string;
  canon?: string;
  source_id?: string;
  line_start?: number;
  line_end?: number;
};
export type SearchPage = {
  rows: SearchHit[];
  total: number;
  page: number;
  pages: number;
  size: number;
  categories: Partial<Record<SearchCategory, number>>;
};
