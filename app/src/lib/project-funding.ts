import type { TreasuryProject } from "./treasury-view.ts";
export const trackerProjectSource = "REVIEW-src_bcb9f282108154c9";
/** Only the tracker explicitly defines committed as locked funding remaining after paid. */
export function projectFunding(p: TreasuryProject) {
  if (
    p.source_id !== trackerProjectSource ||
    ![p.planned, p.paid, p.committed].every(
      (n) => n !== null && Number.isSafeInteger(n) && n >= 0,
    )
  )
    return { gap: null, coverage: null, remaining: null };
  const total = p.planned!,
    paid = p.paid!,
    committed = p.committed!;
  return {
    gap: Math.max(total - paid - committed, 0),
    coverage: total > 0 ? (paid + committed) / total : null,
    remaining: Math.max(total - paid, 0),
  };
}
export function projectTotals(projects: TreasuryProject[]) {
  const currencies = [...new Set(projects.map((p) => p.currency))];
  return currencies.map((currency) => {
    const rows = projects.filter((p) => p.currency === currency);
    const sum = (key: "planned" | "paid" | "committed") =>
      rows.every(
        (p) => p[key] !== null && Number.isSafeInteger(p[key]) && p[key]! >= 0,
      )
        ? rows.reduce((n, p) => n + p[key]!, 0)
        : null;
    return {
      currency,
      count: rows.length,
      cost: sum("planned"),
      paid: sum("paid"),
      committed: sum("committed"),
      gap: rows.every((p) => projectFunding(p).gap !== null)
        ? rows.reduce((n, p) => n + projectFunding(p).gap!, 0)
        : null,
    };
  });
}
