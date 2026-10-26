import { all, one } from "./db.ts";
import type { DB } from "./db.ts";
import { recordDraft } from "./record-drafts.ts";
import { guidedDefinition } from "./record-registry.ts";
import { domainRecordDetails } from "./domain-records.ts";
import type { SavedRecordDetails } from "./record-registry.ts";
/** Receipt-specific evidence stays distinct from current domain fields. */
export function savedRecordDetails(
  db: DB,
  receiptId: string,
): SavedRecordDetails {
  const draft = recordDraft(db, receiptId);
  guidedDefinition(draft.kind);
  if (draft.status !== "saved" || !draft.target_id)
    throw Error("This draft has no saved record yet.");
  const current = domainRecordDetails(db, draft.kind, draft.target_id);
  return {
    ...current,
    kind: draft.kind,
    evidence: all(
      db,
      "SELECT c.source_id,s.filename,c.line_start,c.line_end FROM record_draft_citations c JOIN sources s ON s.id=c.source_id WHERE c.draft_id=? ORDER BY c.source_id,c.line_start",
      draft.id,
    ),
    savedAt: draft.updated_at,
    approvalReason:
      one(db, "SELECT approval_reason FROM record_drafts WHERE id=?", draft.id)
        ?.approval_reason ?? "Not recorded",
  };
}
