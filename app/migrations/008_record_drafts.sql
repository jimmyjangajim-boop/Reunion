-- Guided drafts are not a second national record store. Only an explicit save
-- executes the existing domain command; the saved draft is its immutable receipt.
CREATE TABLE record_drafts(
  id TEXT PRIMARY KEY, kind TEXT NOT NULL, payload_json TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','saved')),
  target_id TEXT, approval_reason TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER saved_record_draft_no_update BEFORE UPDATE ON record_drafts WHEN OLD.status='saved'
BEGIN SELECT RAISE(ABORT,'Saved record receipts are immutable'); END;
CREATE TRIGGER record_draft_no_delete BEFORE DELETE ON record_drafts
BEGIN SELECT RAISE(ABORT,'Record drafts and receipts are preserved'); END;
CREATE TABLE record_draft_citations(
  draft_id TEXT NOT NULL REFERENCES record_drafts(id),
  source_id TEXT NOT NULL REFERENCES sources(id),
  line_start INTEGER NOT NULL CHECK(line_start>0),
  line_end INTEGER NOT NULL CHECK(line_end>=line_start),
  PRIMARY KEY(draft_id,source_id,line_start,line_end)
);
CREATE TABLE bill_sponsors(bill_id TEXT PRIMARY KEY REFERENCES bills(id),person_id TEXT NOT NULL REFERENCES entities(id));
CREATE TABLE treaty_participants(treaty_id TEXT NOT NULL REFERENCES treaties(id),entity_id TEXT NOT NULL REFERENCES entities(id),PRIMARY KEY(treaty_id,entity_id));
CREATE TABLE timeline_entities(timeline_id TEXT NOT NULL REFERENCES timeline(id),entity_id TEXT NOT NULL REFERENCES entities(id),PRIMARY KEY(timeline_id,entity_id));
CREATE TRIGGER draft_citation_no_update BEFORE UPDATE ON record_draft_citations BEGIN SELECT RAISE(ABORT,'Record citations are append-only'); END;
CREATE TRIGGER draft_citation_no_delete BEFORE DELETE ON record_draft_citations BEGIN SELECT RAISE(ABORT,'Record citations are append-only'); END;
