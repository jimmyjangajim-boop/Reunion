CREATE TABLE attachment_references(id INTEGER PRIMARY KEY,source_id TEXT REFERENCES sources,message_id TEXT,url TEXT,label TEXT,kind TEXT,availability TEXT DEFAULT 'remote_reference_only');

CREATE TABLE candidate_claims(id TEXT PRIMARY KEY,entity TEXT,predicate TEXT,value_json TEXT,world_date_text TEXT,date_precision TEXT,canon_status TEXT,operational_status TEXT,authority TEXT,notes TEXT);

CREATE TABLE check_results(id TEXT PRIMARY KEY,topic TEXT,source_id TEXT REFERENCES sources,locator TEXT,observed_json TEXT,calculated_json TEXT,status TEXT,explanation TEXT);

CREATE TABLE claim_evidence(claim_id TEXT REFERENCES candidate_claims,passage_id TEXT REFERENCES passages,relation TEXT DEFAULT 'supports',PRIMARY KEY(claim_id,passage_id));

CREATE TABLE decision_log(id INTEGER PRIMARY KEY,issue_id TEXT REFERENCES review_issues,answer TEXT,reason TEXT,recorded_at TEXT);

CREATE TABLE discord_channels(source_id TEXT PRIMARY KEY REFERENCES sources,category_channel TEXT,channel_id TEXT,expected_count INTEGER,parsed_count INTEGER,export_timezone TEXT);

CREATE TABLE discord_messages(message_id TEXT PRIMARY KEY,source_id TEXT REFERENCES sources,author_id TEXT,author_display TEXT,author_handle TEXT,posted_text TEXT,posted_utc TEXT,edited_text TEXT,reply_to TEXT,content TEXT,embeds TEXT,raw_html TEXT);

CREATE TABLE document_properties(source_id TEXT REFERENCES sources,name TEXT,value TEXT,PRIMARY KEY(source_id,name));

CREATE TABLE entity_registry(id TEXT PRIMARY KEY,kind TEXT,label TEXT,notes TEXT);

CREATE TABLE historical_event_candidates(id TEXT PRIMARY KEY,source_id TEXT REFERENCES sources,passage_id TEXT REFERENCES passages,title TEXT,world_date_text TEXT,date_precision TEXT,date_validity TEXT,operational_status TEXT,canon_status TEXT,recorded_at TEXT);

CREATE TABLE metadata(key TEXT PRIMARY KEY,value TEXT NOT NULL);

CREATE TABLE passages(id TEXT PRIMARY KEY,source_id TEXT REFERENCES sources,locator TEXT,body TEXT,recorded_at TEXT,world_date_text TEXT,canon_status TEXT DEFAULT 'unreviewed', UNIQUE(source_id,locator));

CREATE TABLE review_coverage(source_id TEXT PRIMARY KEY REFERENCES sources,extraction_verified INTEGER DEFAULT 0,content_reviewed INTEGER DEFAULT 0,notes TEXT);

CREATE TABLE review_issues(id TEXT PRIMARY KEY,priority TEXT,topic TEXT,question TEXT,evidence TEXT,default_handling TEXT,answer TEXT,status TEXT DEFAULT 'awaiting_user');

CREATE VIRTUAL TABLE search USING fts5(passage_id UNINDEXED,source_id UNINDEXED,locator UNINDEXED,body,tokenize='unicode61');

CREATE TABLE snapshots(id TEXT PRIMARY KEY,source_id TEXT REFERENCES sources,label TEXT,reported_date TEXT,effective_date TEXT,date_status TEXT);

CREATE TABLE source_blobs(sha256 TEXT PRIMARY KEY,bytes BLOB NOT NULL);

CREATE TABLE source_equivalence(source_a TEXT REFERENCES sources,source_b TEXT REFERENCES sources,basis TEXT,PRIMARY KEY(source_a,source_b));

CREATE TABLE source_notes(source_id TEXT PRIMARY KEY REFERENCES sources,review_notes TEXT,media_limitations TEXT);

CREATE TABLE source_statements(id TEXT PRIMARY KEY,passage_id TEXT NOT NULL UNIQUE REFERENCES passages,statement_kind TEXT NOT NULL,review_state TEXT NOT NULL,notes TEXT);

CREATE TABLE sources(id TEXT PRIMARY KEY,container TEXT,path TEXT,kind TEXT,sha256 TEXT REFERENCES source_blobs,byte_count INTEGER,priority TEXT,extraction_status TEXT,text TEXT,UNIQUE(container,path));

CREATE TABLE workbook_cells(source_id TEXT REFERENCES sources,sheet TEXT,address TEXT,cell_type TEXT,raw_value TEXT,display_value TEXT,formula TEXT,style_id TEXT,PRIMARY KEY(source_id,sheet,address));

CREATE TABLE workbook_comments(source_id TEXT REFERENCES sources,sheet TEXT,address TEXT,body TEXT,author TEXT,PRIMARY KEY(source_id,sheet,address));

CREATE TABLE workbook_sheets(source_id TEXT REFERENCES sources,name TEXT,state TEXT,dimension TEXT,nonempty_cells INTEGER,PRIMARY KEY(source_id,name));

CREATE TRIGGER decision_log_no_delete BEFORE DELETE ON decision_log BEGIN SELECT RAISE(ABORT,'Decision history is append-only'); END;

CREATE TRIGGER decision_log_no_update BEFORE UPDATE ON decision_log BEGIN SELECT RAISE(ABORT,'Decision history is append-only'); END;

CREATE VIEW latest_tracker_cells AS SELECT sheet,address,cell_type,raw_value,display_value,formula,style_id FROM workbook_cells WHERE source_id='src_bcb9f282108154c9';