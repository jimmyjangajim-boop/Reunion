-- Preserve every existing action and ID while extending the allowed action kinds.
ALTER TABLE report_actions RENAME TO report_actions_v3;
CREATE TABLE report_actions(id TEXT PRIMARY KEY,report_id TEXT NOT NULL REFERENCES national_reports(id),ordinal INTEGER NOT NULL,kind TEXT NOT NULL CHECK(kind IN ('movement_order','movement_arrival','record_event','legislation')),payload_json TEXT NOT NULL,line_start INTEGER NOT NULL,line_end INTEGER NOT NULL,status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','applied','rejected')),target_id TEXT,UNIQUE(report_id,ordinal));
INSERT INTO report_actions SELECT * FROM report_actions_v3;
DROP TABLE report_actions_v3;
CREATE TABLE bill_events(id TEXT PRIMARY KEY,bill_id TEXT NOT NULL REFERENCES bills(id),stage TEXT NOT NULL CHECK(stage IN ('considering','introduced','passed','enacted')),date TEXT,effective_date TEXT,recorded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX bill_event_lookup ON bill_events(bill_id,date,stage);
CREATE TABLE bill_event_evidence(event_id TEXT NOT NULL REFERENCES bill_events(id),source_id TEXT NOT NULL REFERENCES sources(id),line_start INTEGER NOT NULL,line_end INTEGER NOT NULL,report_action_id TEXT NOT NULL UNIQUE REFERENCES report_actions(id),PRIMARY KEY(event_id,report_action_id));
CREATE TRIGGER bill_events_no_update BEFORE UPDATE ON bill_events BEGIN SELECT RAISE(ABORT,'Legislative history is append-only'); END;
CREATE TRIGGER bill_events_no_delete BEFORE DELETE ON bill_events BEGIN SELECT RAISE(ABORT,'Legislative history is append-only'); END;
CREATE TRIGGER bill_evidence_no_update BEFORE UPDATE ON bill_event_evidence BEGIN SELECT RAISE(ABORT,'Legislative evidence is append-only'); END;
CREATE TRIGGER bill_evidence_no_delete BEFORE DELETE ON bill_event_evidence BEGIN SELECT RAISE(ABORT,'Legislative evidence is append-only'); END;
