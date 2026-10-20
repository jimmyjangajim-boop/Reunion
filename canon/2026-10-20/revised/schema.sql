CREATE TABLE attachment_references(id INTEGER PRIMARY KEY,source_id TEXT REFERENCES sources,message_id TEXT,url TEXT,label TEXT,kind TEXT,availability TEXT DEFAULT 'remote_reference_only');

CREATE TABLE candidate_claims(id TEXT PRIMARY KEY,entity TEXT,predicate TEXT,value_json TEXT,world_date_text TEXT,date_precision TEXT,canon_status TEXT,operational_status TEXT,authority TEXT,notes TEXT);

CREATE TABLE canon_facts(id TEXT PRIMARY KEY,entity TEXT,predicate TEXT,value_json TEXT,date_text TEXT,date_precision TEXT,canon_status TEXT,operational_status TEXT,authority TEXT,question_id TEXT REFERENCES review_issues,notes TEXT);

CREATE TABLE check_results(id TEXT PRIMARY KEY,topic TEXT,source_id TEXT REFERENCES sources,locator TEXT,observed_json TEXT,calculated_json TEXT,status TEXT,explanation TEXT);

CREATE TABLE chronology_proposals(id TEXT PRIMARY KEY,event TEXT,proposed_date TEXT,status TEXT,reason TEXT,depends_on TEXT);

CREATE TABLE claim_evidence(claim_id TEXT REFERENCES candidate_claims,passage_id TEXT REFERENCES passages,relation TEXT DEFAULT 'supports',PRIMARY KEY(claim_id,passage_id));

CREATE TABLE date_revisions(passage_id TEXT REFERENCES passages,old_date_text TEXT,new_date_text TEXT,authority TEXT,question_id TEXT REFERENCES review_issues,PRIMARY KEY(passage_id,old_date_text));

CREATE TABLE decision_log(id INTEGER PRIMARY KEY,issue_id TEXT REFERENCES review_issues,answer TEXT,reason TEXT,recorded_at TEXT);

CREATE TABLE defense_allocations(branch TEXT,category TEXT,amount_usd INTEGER,status TEXT,authority TEXT,PRIMARY KEY(branch,category));

CREATE TABLE delivery_plans(batch_id TEXT REFERENCES procurement_batches,wave INTEGER,quantity INTEGER,months_after_order INTEGER,status TEXT,PRIMARY KEY(batch_id,wave));

CREATE TABLE discord_channels(source_id TEXT PRIMARY KEY REFERENCES sources,category_channel TEXT,channel_id TEXT,expected_count INTEGER,parsed_count INTEGER,export_timezone TEXT);

CREATE TABLE discord_messages(message_id TEXT PRIMARY KEY,source_id TEXT REFERENCES sources,author_id TEXT,author_display TEXT,author_handle TEXT,posted_text TEXT,posted_utc TEXT,edited_text TEXT,reply_to TEXT,content TEXT,embeds TEXT,raw_html TEXT);

CREATE TABLE document_properties(source_id TEXT REFERENCES sources,name TEXT,value TEXT,PRIMARY KEY(source_id,name));

CREATE TABLE entity_registry(id TEXT PRIMARY KEY,kind TEXT,label TEXT,notes TEXT);

CREATE TABLE fact_provenance(fact_id TEXT REFERENCES canon_facts,passage_id TEXT REFERENCES passages,relation TEXT,PRIMARY KEY(fact_id,passage_id));

CREATE TABLE funding_transfers(id TEXT PRIMARY KEY,from_envelope TEXT,to_envelope TEXT,amount_usd INTEGER,operational_status TEXT,in_world_authorization TEXT,presidential_awareness TEXT,authority TEXT);

CREATE TABLE historical_event_candidates(id TEXT PRIMARY KEY,source_id TEXT REFERENCES sources,passage_id TEXT REFERENCES passages,title TEXT,world_date_text TEXT,date_precision TEXT,date_validity TEXT,operational_status TEXT,canon_status TEXT,recorded_at TEXT);

CREATE TABLE metadata(key TEXT PRIMARY KEY,value TEXT NOT NULL);

CREATE TABLE money_restatements(id TEXT PRIMARY KEY,source_id TEXT REFERENCES sources,locator TEXT,old_value_text TEXT,new_value_json TEXT,method TEXT,status TEXT,authority TEXT);

CREATE TABLE national_allocations(category TEXT PRIMARY KEY,previous_usd INTEGER,reconciled_usd INTEGER,status TEXT,authority TEXT,notes TEXT);

CREATE TABLE passages(id TEXT PRIMARY KEY,source_id TEXT REFERENCES sources,locator TEXT,body TEXT,recorded_at TEXT,world_date_text TEXT,canon_status TEXT DEFAULT 'unreviewed', UNIQUE(source_id,locator));

CREATE TABLE procurement_batches(id TEXT PRIMARY KEY,source_claim_id TEXT REFERENCES candidate_claims,model TEXT,branch TEXT,quantity_ordered INTEGER,batch_cost_usd INTEGER,canon_status TEXT,operational_status TEXT,delivered_confirmed INTEGER,accepted_confirmed INTEGER,operational_confirmed INTEGER,earliest_month_after_order INTEGER,latest_month_after_order INTEGER,planning_origin TEXT,notes TEXT);

CREATE TABLE project_accounts(name TEXT PRIMARY KEY,total_authorized_usd INTEGER,source_paid_out_usd INTEGER,source_committed_usd INTEGER,unfunded_usd INTEGER,physical_status TEXT,scope_policy TEXT,authority TEXT);

CREATE TABLE reconciliation_worklog(id INTEGER PRIMARY KEY,topic TEXT,old_value TEXT,new_value TEXT,reason TEXT);

CREATE TABLE review_coverage(source_id TEXT PRIMARY KEY REFERENCES sources,extraction_verified INTEGER DEFAULT 0,content_reviewed INTEGER DEFAULT 0,notes TEXT);

CREATE TABLE review_issues(id TEXT PRIMARY KEY,priority TEXT,topic TEXT,question TEXT,evidence TEXT,default_handling TEXT,answer TEXT,status TEXT DEFAULT 'awaiting_user');

CREATE TABLE revision_runs(id TEXT PRIMARY KEY,answer_sha256 TEXT,recorded_at TEXT,app_modified INTEGER NOT NULL DEFAULT 0);

CREATE VIRTUAL TABLE search USING fts5(passage_id UNINDEXED,source_id UNINDEXED,locator UNINDEXED,body,tokenize='unicode61');

CREATE TABLE snapshots(id TEXT PRIMARY KEY,source_id TEXT REFERENCES sources,label TEXT,reported_date TEXT,effective_date TEXT,date_status TEXT);

CREATE TABLE source_annotations(passage_id TEXT REFERENCES passages,disposition TEXT,question_id TEXT REFERENCES review_issues,explanation TEXT,PRIMARY KEY(passage_id,disposition));

CREATE TABLE source_blobs(sha256 TEXT PRIMARY KEY,bytes BLOB NOT NULL);

CREATE TABLE source_equivalence(source_a TEXT REFERENCES sources,source_b TEXT REFERENCES sources,basis TEXT,PRIMARY KEY(source_a,source_b));

CREATE TABLE source_notes(source_id TEXT PRIMARY KEY REFERENCES sources,review_notes TEXT,media_limitations TEXT);

CREATE TABLE source_statements(id TEXT PRIMARY KEY,passage_id TEXT NOT NULL UNIQUE REFERENCES passages,statement_kind TEXT NOT NULL,review_state TEXT NOT NULL,notes TEXT);

CREATE TABLE sources(id TEXT PRIMARY KEY,container TEXT,path TEXT,kind TEXT,sha256 TEXT REFERENCES source_blobs,byte_count INTEGER,priority TEXT,extraction_status TEXT,text TEXT,UNIQUE(container,path));

CREATE TABLE supersessions(old_claim_id TEXT REFERENCES candidate_claims,new_fact_id TEXT REFERENCES canon_facts,reason TEXT,PRIMARY KEY(old_claim_id,new_fact_id));

CREATE TABLE workbook_cells(source_id TEXT REFERENCES sources,sheet TEXT,address TEXT,cell_type TEXT,raw_value TEXT,display_value TEXT,formula TEXT,style_id TEXT,PRIMARY KEY(source_id,sheet,address));

CREATE TABLE workbook_comments(source_id TEXT REFERENCES sources,sheet TEXT,address TEXT,body TEXT,author TEXT,PRIMARY KEY(source_id,sheet,address));

CREATE TABLE workbook_sheets(source_id TEXT REFERENCES sources,name TEXT,state TEXT,dimension TEXT,nonempty_cells INTEGER,PRIMARY KEY(source_id,name));

CREATE TRIGGER decision_log_no_delete BEFORE DELETE ON decision_log BEGIN SELECT RAISE(ABORT,'Decision history is append-only'); END;

CREATE TRIGGER decision_log_no_update BEFORE UPDATE ON decision_log BEGIN SELECT RAISE(ABORT,'Decision history is append-only'); END;

CREATE VIEW active_canon AS SELECT * FROM canon_facts WHERE canon_status IN('confirmed','confirmed_estimate','delegated_reconciliation');

CREATE VIEW latest_tracker_cells AS SELECT sheet,address,cell_type,raw_value,display_value,formula,style_id FROM workbook_cells WHERE source_id='src_bcb9f282108154c9';

CREATE VIEW unresolved_review AS SELECT id,topic,status,answer FROM review_issues WHERE status IN('needs_date_confirmation','source_gap','exact_date_unknown');