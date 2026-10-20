"""Validate isolated evidence review, including original bytes and source-linked records."""
import hashlib, io, json, sqlite3, zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parent

def main():
    c=sqlite3.connect('file:'+str(ROOT/'reunion_evidence.sqlite')+'?mode=ro',uri=True)
    checks=[]
    def ck(label,test):
        assert test,label
        checks.append({'check':label,'result':'pass'})
    ck('SQLite integrity',c.execute('PRAGMA integrity_check').fetchone()[0]=='ok')
    ck('Foreign key integrity',not c.execute('PRAGMA foreign_key_check').fetchall())
    ck('All 46 channels parsed',c.execute('SELECT count(*) FROM discord_channels').fetchone()[0]==46)
    ck('All export message totals match',c.execute('SELECT count(*) FROM discord_channels WHERE expected_count IS NULL OR parsed_count<>expected_count').fetchone()[0]==0)
    ck('1,140 unique messages retained',c.execute('SELECT count(*),count(DISTINCT message_id) FROM discord_messages').fetchone()==(1140,1140))
    ck('Every original blob checksum matches',all(hashlib.sha256(b).hexdigest()==h for h,b in c.execute('SELECT sha256,bytes FROM source_blobs')))
    ck('Sources reference blobs with correct byte counts',c.execute('SELECT count(*) FROM sources s JOIN source_blobs b ON s.sha256=b.sha256 WHERE s.byte_count<>length(b.bytes)').fetchone()[0]==0)
    for archive in ['Reunion Archives.zip','REUNION-20261020T035402Z-1-001.zip']:
        ip=ROOT.parent/'upload'/archive
        if not ip.exists():ip=ROOT/'originals'/archive
        disk=ip.read_bytes()
        ck('Original upload unchanged: '+archive,hashlib.sha256(disk).hexdigest()==c.execute('SELECT sha256 FROM sources WHERE container=? AND path=?',('upload',archive)).fetchone()[0])
        with zipfile.ZipFile(io.BytesIO(disk)) as z:
            for n in z.namelist():
                if n.endswith('/'):continue
                r=c.execute('SELECT s.sha256,b.bytes FROM sources s JOIN source_blobs b ON s.sha256=b.sha256 WHERE s.container=? AND s.path=?',(archive,n)).fetchone()
                assert r and z.read(n)==r[1],n
            ck('All archive members byte-preserved: '+archive,True)
    p=ROOT.parent/'upload'/'Reunion campaign tracker(1).xlsx'
    if not p.exists():p=ROOT/'originals'/'Reunion campaign tracker(1).xlsx'
    ck('Latest tracker unchanged',hashlib.sha256(p.read_bytes()).hexdigest()==c.execute("SELECT sha256 FROM sources WHERE id='src_bcb9f282108154c9'").fetchone()[0])
    prior=ROOT.parent/'project_sources'
    if not prior.exists():prior=ROOT/'originals'/'prior_sources'
    ck('All six prior text files unchanged',all((prior/path).read_bytes()==b for path,b in c.execute("SELECT s.path,b.bytes FROM sources s JOIN source_blobs b ON s.sha256=b.sha256 WHERE s.container='prior_sources'")))
    ck('All three tracker versions have 730 cells and 6 comments',all(c.execute('SELECT count(*) FROM workbook_cells WHERE source_id=?',(s,)).fetchone()[0]==730 and c.execute('SELECT count(*) FROM workbook_comments WHERE source_id=?',(s,)).fetchone()[0]==6 for s in ['src_bcb9f282108154c9','src_cc94adb3d61a0460','src_539d8ebf1a7af711']))
    ck('Every normalized candidate has evidence',c.execute('SELECT count(*) FROM candidate_claims cl WHERE NOT EXISTS(SELECT 1 FROM claim_evidence e WHERE e.claim_id=cl.id)').fetchone()[0]==0)
    ck('Latest snapshot is not assigned an invented effective date',c.execute("SELECT effective_date FROM snapshots WHERE id='latest_tracker'").fetchone()[0] is None)
    ck('Only governing user instructions produce confirmed candidates',c.execute("SELECT count(*) FROM candidate_claims WHERE canon_status='confirmed' AND authority<>'explicit_user_instruction'").fetchone()[0]==0)
    ck('No procurement counted as delivered or operational',c.execute("SELECT count(*) FROM candidate_claims WHERE predicate='procurement_batch' AND operational_status IN('operational','delivered','accepted','completed')").fetchone()[0]==0)
    ck('King and heir have different permanent identities',c.execute("SELECT count(*) FROM entity_registry WHERE id IN('king_zo_iii','heir_zo_iii')").fetchone()[0]==2)
    ck('Darius retained as canonical VP',json.loads(c.execute("SELECT value_json FROM candidate_claims WHERE predicate='vice_president' AND canon_status='confirmed'").fetchone()[0])=='Darius Younger')
    casualty=json.loads(c.execute("SELECT value_json FROM candidate_claims WHERE entity='dalmatia_1992_09_10'").fetchone()[0])
    ck('September 10 casualties remain separately classified and reconcile',sum(casualty[k] for k in ['KIA','WIA','MIA','POW'])==casualty['total']==2520)
    ck('27 answerable review questions retained',c.execute('SELECT count(*) FROM review_issues').fetchone()[0]==27)
    ck('No user answers or canon resolutions invented',c.execute('SELECT count(*) FROM review_issues WHERE answer IS NOT NULL OR status<>\'awaiting_user\'').fetchone()[0]==0 and c.execute('SELECT count(*) FROM decision_log').fetchone()[0]==0)
    ck('Known contradictions retained',all(c.execute('SELECT status FROM check_results WHERE id=?',(k,)).fetchone()[0]=='needs_decision' for k in ['budget_sum','army_cost_sum','air_cost_sum','project_costs','altis_strength']))
    ck('Every passage searchable without duplication',c.execute('SELECT count(*) FROM search').fetchone()[0]==c.execute('SELECT count(*) FROM passages').fetchone()[0] and c.execute('SELECT count(*)-count(distinct passage_id) FROM search').fetchone()[0]==0)
    ck('Search returns Rehn, Altis and procurement evidence',all(c.execute('SELECT count(*) FROM search WHERE search MATCH ?',(q,)).fetchone()[0]>0 for q in ['Rehn','Altis','M109']))
    ck('All supplied sources have review coverage',c.execute('SELECT count(*) FROM sources s LEFT JOIN review_coverage r ON r.source_id=s.id WHERE r.source_id IS NULL OR r.content_reviewed<>1').fetchone()[0]==0)
    # Copy/restore is checked against complete relational contents, not just one count.
    restored=sqlite3.connect(':memory:');c.backup(restored)
    tables=[r[0] for r in c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'search_%'")]
    ck('Backup restoration reproduces all relational tables',all(c.execute('SELECT * FROM "'+t+'" ORDER BY rowid').fetchall()==restored.execute('SELECT * FROM "'+t+'" ORDER BY rowid').fetchall() for t in tables))
    restored.close();c.close()
    (ROOT/'validation_results.json').write_text(json.dumps({'checks_passed':len(checks),'checks':checks},indent=2))
    print(json.dumps({'checks_passed':len(checks),'result':'pass'}))

if __name__=='__main__':main()
