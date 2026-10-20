import { z } from "zod";
export const dateKinds = [
  "day",
  "month",
  "year",
  "decade",
  "range",
  "before",
  "after",
  "relative",
  "unknown",
] as const;
const isoDay = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((s) => {
    const d = new Date(s + "T00:00:00Z");
    return !Number.isNaN(+d) && d.toISOString().slice(0, 10) === s;
  }, "Use a real calendar date");
export const exactDate = isoDay;
export const historicalDateSchema = z
  .object({
    precision: z.enum(dateKinds),
    label: z.string().max(1000),
    earliest: z.string().nullable().default(null),
    latest: z.string().nullable().default(null),
    relation: z.string().nullable().default(null),
  })
  .superRefine((v, c) => {
    const formats: Record<string, RegExp> = {
      day: /^\d{4}-\d{2}-\d{2}$/,
      month: /^\d{4}-\d{2}$/,
      year: /^\d{4}$/,
      decade: /^\d{3}0s$/,
    };
    if (formats[v.precision] && !formats[v.precision].test(v.label))
      c.addIssue({
        code: "custom",
        message: `Invalid ${v.precision} value`,
        path: ["label"],
      });
    if (v.precision === "day" && !isoDay.safeParse(v.label).success)
      c.addIssue({
        code: "custom",
        message: "Invalid calendar day",
        path: ["label"],
      });
    if (
      v.precision === "month" &&
      (Number(v.label.slice(5)) < 1 || Number(v.label.slice(5)) > 12)
    )
      c.addIssue({ code: "custom", message: "Invalid month", path: ["label"] });
    for (const k of ["earliest", "latest"] as const)
      if (v[k] && !/^\d{4}(-\d{2}(-\d{2})?)?$/.test(v[k]!))
        c.addIssue({
          code: "custom",
          message: "Bounds need year, month or day",
          path: [k],
        });
    if (v.earliest && v.latest && v.earliest > v.latest)
      c.addIssue({
        code: "custom",
        message: "Date bounds are reversed",
        path: ["latest"],
      });
    if (
      ["range", "before", "after", "relative"].includes(v.precision) &&
      !v.label.trim()
    )
      c.addIssue({
        code: "custom",
        message: "Describe the uncertain date",
        path: ["label"],
      });
  });
export type HistoricalDate = z.infer<typeof historicalDateSchema>;
export function dateValue(
  precision: HistoricalDate["precision"] = "unknown",
  label = "Unknown",
  earliest: string | null = null,
  latest: string | null = null,
  relation: string | null = null,
): HistoricalDate {
  return historicalDateSchema.parse({
    precision,
    label,
    earliest,
    latest,
    relation,
  });
}
export function bounds(d: HistoricalDate): [string | null, string | null] {
  if (d.precision === "day") return [d.label, d.label];
  if (d.precision === "month") {
    const [y, m] = d.label.split("-").map(Number);
    return [
      `${d.label}-01`,
      `${d.label}-${new Date(Date.UTC(y, m, 0)).getUTCDate()}`,
    ];
  }
  if (d.precision === "year") return [d.label + "-01-01", d.label + "-12-31"];
  if (d.precision === "decade")
    return [
      d.label.slice(0, 4) + "-01-01",
      String(Number(d.label.slice(0, 4)) + 9) + "-12-31",
    ];
  return [
    d.earliest ? expand(d.earliest, false) : null,
    d.latest ? expand(d.latest, true) : null,
  ];
}
function expand(s: string, end: boolean): string {
  if (s.length === 4) return s + (end ? "-12-31" : "-01-01");
  if (s.length === 7) return bounds(dateValue("month", s))[end ? 1 : 0]!;
  return s;
}
export function intersects(a: RowDate, b: RowDate): boolean {
  if (!a.valid_from || !b.valid_from) return false;
  return (
    a.valid_from <= (b.valid_to ?? "9999-12-31") &&
    b.valid_from <= (a.valid_to ?? "9999-12-31")
  );
}
type RowDate = { valid_from: string | null; valid_to: string | null };
