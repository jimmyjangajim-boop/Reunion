-- Global full-text search, preserving exact passage locators.
SELECT s.path,p.locator,p.body,p.recorded_at
FROM search f JOIN passages p ON p.id=f.passage_id
JOIN sources s ON s.id=p.source_id
WHERE search MATCH 'Rehn' ORDER BY s.path,p.locator;

-- Current unresolved questions, without assuming an answer from elapsed time.
SELECT id,priority,topic,question,default_handling,answer,status
FROM review_issues ORDER BY id;

-- All current tracker cell values and formula caches.
SELECT * FROM latest_tracker_cells ORDER BY sheet,address;

-- Exact procurement cell comments in the designated latest workbook.
SELECT sheet,address,body FROM workbook_comments
WHERE source_id='src_bcb9f282108154c9' AND sheet='Military';

-- Normalized candidates and their provenance.
SELECT cl.entity,cl.predicate,cl.value_json,cl.world_date_text,
cl.canon_status,cl.operational_status,cl.authority,s.path,p.locator
FROM candidate_claims cl JOIN claim_evidence e ON e.claim_id=cl.id
JOIN passages p ON p.id=e.passage_id JOIN sources s ON s.id=p.source_id
ORDER BY cl.entity,cl.predicate;

-- Original source bytes for exact recovery (write through a SQLite client).
SELECT s.id,s.container,s.path,s.sha256,b.bytes
FROM sources s JOIN source_blobs b ON b.sha256=s.sha256;

-- Media references, which do not establish possession of the media bytes.
SELECT s.path,a.message_id,a.url,a.kind,a.availability
FROM attachment_references a JOIN sources s ON s.id=a.source_id;
