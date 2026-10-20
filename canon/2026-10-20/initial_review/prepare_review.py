"""Build review records and reports without connecting to or changing the application."""
import calendar, csv, hashlib, json, re, sqlite3, zipfile
from datetime import datetime, timedelta
from pathlib import Path

ROOT=Path(__file__).resolve().parent
LATEST='src_bcb9f282108154c9'
def j(v): return json.dumps(v,ensure_ascii=False,sort_keys=True)
def hid(s): return hashlib.sha256(s.encode()).hexdigest()[:20]

def main():
    c=sqlite3.connect(ROOT/'reunion_evidence.sqlite'); c.row_factory=sqlite3.Row; c.execute('PRAGMA foreign_keys=ON')
    c.executescript('''
    CREATE TABLE IF NOT EXISTS source_statements(id TEXT PRIMARY KEY,passage_id TEXT NOT NULL UNIQUE REFERENCES passages,statement_kind TEXT NOT NULL,review_state TEXT NOT NULL,notes TEXT);
    CREATE TABLE IF NOT EXISTS source_equivalence(source_a TEXT REFERENCES sources,source_b TEXT REFERENCES sources,basis TEXT,PRIMARY KEY(source_a,source_b));
    CREATE TABLE IF NOT EXISTS snapshots(id TEXT PRIMARY KEY,source_id TEXT REFERENCES sources,label TEXT,reported_date TEXT,effective_date TEXT,date_status TEXT);
    CREATE TABLE IF NOT EXISTS entity_registry(id TEXT PRIMARY KEY,kind TEXT,label TEXT,notes TEXT);
    CREATE TABLE IF NOT EXISTS check_results(id TEXT PRIMARY KEY,topic TEXT,source_id TEXT REFERENCES sources,locator TEXT,observed_json TEXT,calculated_json TEXT,status TEXT,explanation TEXT);
    CREATE TABLE IF NOT EXISTS historical_event_candidates(id TEXT PRIMARY KEY,source_id TEXT REFERENCES sources,passage_id TEXT REFERENCES passages,title TEXT,world_date_text TEXT,date_precision TEXT,date_validity TEXT,operational_status TEXT,canon_status TEXT,recorded_at TEXT);
    CREATE TABLE IF NOT EXISTS source_notes(source_id TEXT PRIMARY KEY REFERENCES sources,review_notes TEXT,media_limitations TEXT);
    CREATE TABLE IF NOT EXISTS decision_log(id INTEGER PRIMARY KEY,issue_id TEXT REFERENCES review_issues,answer TEXT,reason TEXT,recorded_at TEXT);
    CREATE TRIGGER IF NOT EXISTS decision_log_no_update BEFORE UPDATE ON decision_log BEGIN SELECT RAISE(ABORT,'Decision history is append-only'); END;
    CREATE TRIGGER IF NOT EXISTS decision_log_no_delete BEFORE DELETE ON decision_log BEGIN SELECT RAISE(ABORT,'Decision history is append-only'); END;
    CREATE VIEW IF NOT EXISTS latest_tracker_cells AS SELECT sheet,address,cell_type,raw_value,display_value,formula,style_id FROM workbook_cells WHERE source_id='src_bcb9f282108154c9';
    ''')
    # All passages remain available as evidence; the following is a staging classification,
    # never an automatic acceptance of what a source says.
    for p in c.execute('SELECT p.*,s.kind,s.priority FROM passages p JOIN sources s ON s.id=p.source_id').fetchall():
        body=p['body']; typ='source_statement'; state='unreviewed'
        if p['kind'] in ('.xlsx','.xlsm'): typ='workbook_row_or_comment'
        elif p['kind']=='.docx': typ='document_paragraph'
        elif p['kind']=='.html':
            typ='discord_message'
            if not body.strip(): typ='empty_message'
            elif re.fullmatch(r'[\s=_.\-]+',body) or re.fullmatch(r'@\S+(?:\s+@\S+)*',body): typ='separator_or_mention'
            elif 'Details:[1d' in body or body.startswith('?r '): typ='game_mechanics'
            if '(NON-CANON)' in body: state='explicit_noncanon_marker_context_required'
        c.execute('INSERT OR REPLACE INTO source_statements VALUES(?,?,?,?,?)',('stmt_'+hid(p['id']),p['id'],typ,state,'No canon decision is inferred from a message author, file title, or past-tense wording.'))
    # Cell-level equality is verified, rather than inferred from filenames or ZIP dates.
    for other in ['src_539d8ebf1a7af711','src_cc94adb3d61a0460']:
        cols='sheet,address,cell_type,display_value,formula'
        a=[tuple(r) for r in c.execute(f'SELECT {cols} FROM workbook_cells WHERE source_id=? ORDER BY sheet,address',(LATEST,))]
        b=[tuple(r) for r in c.execute(f'SELECT {cols} FROM workbook_cells WHERE source_id=? ORDER BY sheet,address',(other,))]
        assert a==b
        ca=[tuple(r) for r in c.execute('SELECT sheet,address,body FROM workbook_comments WHERE source_id=? ORDER BY sheet,address',(LATEST,))]
        cb=[tuple(r) for r in c.execute('SELECT sheet,address,body FROM workbook_comments WHERE source_id=? ORDER BY sheet,address',(other,))]
        def norm_comments(rows):return [(sh,ad,re.sub(r'\n=+\s*$','',body)) for sh,ad,body in rows]
        assert norm_comments(ca)==norm_comments(cb)
        c.execute('INSERT OR REPLACE INTO source_equivalence VALUES(?,?,?)',(LATEST,other,'All 730 decoded cell values/types/formulas/caches match. Six comments match substantively; XLSM adds trailing separator lines. Original bytes and shared-string indices differ.'))
    c.execute('INSERT OR REPLACE INTO snapshots VALUES(?,?,?,?,?,?)',('latest_tracker',LATEST,'User-designated latest campaign tracker','1992-10-03',None,'Mixed chronology requires user decision; no effective date assigned.'))
    cells={(r['sheet'],r['address']):r for r in c.execute('SELECT * FROM workbook_cells WHERE source_id=?',(LATEST,))}
    def v(sh,ad):
        r=cells.get((sh,ad)); value=r['display_value'] if r else None
        if value is None:return None
        if r['cell_type']=='n':
            try:return float(value) if '.' in value or 'E' in value.upper() else int(value)
            except ValueError:pass
        return value
    def pid(sid,locator):
        r=c.execute('SELECT id FROM passages WHERE source_id=? AND locator=?',(sid,locator)).fetchone()
        assert r,(sid,locator)
        return r[0]
    def claim(entity,predicate,value,locs,unit=None,authority='latest_tracker_user_designated',world=None,precision='unknown',canon='provisional',operation='unknown',notes=''):
        ident='cl_'+hid(entity+'|'+predicate+'|'+j(value)+'|'+str(world))
        val={'value':value,'unit':unit} if unit else value
        c.execute('INSERT OR REPLACE INTO candidate_claims VALUES(?,?,?,?,?,?,?,?,?,?)',(ident,entity,predicate,j(val),world,precision,canon,operation,authority,notes))
        for sid,loc in locs:c.execute('INSERT OR IGNORE INTO claim_evidence VALUES(?,?,?)',(ident,pid(sid,loc),'supports'))
        return ident
    def rowloc(sh,row):return [(LATEST,sh+'!row '+str(row))]
    governing='''Session provenance: quoted rules supplied in the visible Reunion project instructions and current user message. This is an instruction record, not an additional original historical document.
"The campaign tracker is the most up to date data"
"King Zo III is the current reigning monarch."
"His young heir has also been identified as Zo III. Treat that identical designation as an unresolved naming issue, not permission to rename either character."
"Darius Younger is the canonical Vice President."
"Dr. Amalia Rehn died in a car accident shortly after her appointment as Finance Minister. Emilio Curro succeeded her."
"The Croatian settlement places the frontier just north of Šibenik, with the Šibenik area designated as a DMZ."
"Parliament has 400 seats, expanded to give Dalmatia equal representation with the three core islands. The enlargement violates the existing constitutional seat limit but has been institutionally tolerated."
The current request requires a separate database and questions before any app update.
'''
    gb=governing.encode(); gh=hashlib.sha256(gb).hexdigest(); gs='src_session_instructions'
    c.execute('INSERT OR IGNORE INTO source_blobs VALUES(?,?)',(gh,gb))
    c.execute('INSERT OR REPLACE INTO sources VALUES(?,?,?,?,?,?,?,?,?)',(gs,'conversation','Session governing instructions.md','.md',gh,len(gb),'explicit_user_instruction','extracted',governing))
    gp='p_session_instructions'
    c.execute('INSERT OR REPLACE INTO passages(id,source_id,locator,body) VALUES(?,?,?,?)',(gp,gs,'visible project instructions and current user message',governing))
    c.execute('DELETE FROM search WHERE source_id=?',(gs,));c.execute('INSERT INTO search VALUES(?,?,?,?)',(gp,gs,'visible project instructions and current user message',governing))
    c.execute('INSERT OR IGNORE INTO review_coverage(source_id) VALUES(?)',(gs,))
    for ent,pred,value in [('reunion','vice_president','Darius Younger'),('reunion','reigning_monarch','Zo III'),('reunion','heir_designation','Zo III'),('reunion','finance_succession',['Dr. Amalia Rehn','Emilio Curro']),('reunion','croatian_settlement',{'frontier':'just north of Šibenik','Šibenik':'DMZ'}),('parliament','seats_in_practice',400)]:
        claim(ent,pred,value,[(gs,'visible project instructions and current user message')],authority='explicit_user_instruction',canon='confirmed',notes='Retained governing instruction. Current snapshot effective date remains unresolved; no invented appointment/reign date.')
    # Important current-state fields; dated source values remain separate from the
    # pending effective date of the latest tracker snapshot.
    for name,typ,notes in [('reunion','state',''),('king_zo_iii','person','Reigning king. Distinct from heir.'),('heir_zo_iii','person','Separate entity. Do not rename to Jakob without approval.'),('dax_donahue_ii','person','President'),('darius_younger','person','Canonical Vice President. Do not merge with businessman Jack Younger.'),('jack_younger','person','Named industrialist and diplomatic emissary in new Discord evidence; no inferred VP office.'),('amalia_rehn','person','Finance predecessor; reported June 24 death date requires chronology review.'),('emilio_curro','person','Finance successor; corporate president in Horizon channel does not mean President of Reunion.'),('ezra_hartman','person','Military officer; identity distinct pending clarification.'),('ebin_hartmann_ii','person','Do not merge with Ezra or Ebin Hartmann the elder.'),('ebin_hartmann_elder','person','Reported born 1916 in character source.'),('parliament','institution','400 seats in practice; constitutional maximum 300 remains unrepaired.')]:
        c.execute('INSERT OR REPLACE INTO entity_registry VALUES(?,?,?,?)',(name,typ,name.replace('_',' ').title(),notes))
    for sh,ad,entity,pred,unit in [
        ('Dashboard','D4','reunion','tracker_date_serial','Excel 1900 serial'),('Politics','B5','reunion','president',None),('Politics','D5','dax_donahue_ii','national_approval','percent'),('Politics','F5','reunion','reigning_monarch',None),('Politics','H5','king_zo_iii','national_approval','percent'),('Politics','E4','parliament','session_status',None),('Politics','B6','reunion','government_mechanics',None),
        ('Economy','E4','reunion','gdp','USD'),('Economy','G4','reunion','gdp','RMC'),('Economy','B5','reunion','real_growth','fraction'),('Economy','E5','reunion','inflation','fraction'),('Economy','H5','reunion','fx_reserves','USD'),('Economy','B6','reunion','official_fx',None),('Economy','E6','reunion','market_fx_low','RMC/USD'),('Economy','H6','reunion','market_fx_high','RMC/USD'),('Economy','B7','reunion','revenue_headline','USD'),('Economy','E7','reunion','spending_headline','USD'),('Economy','H7','reunion','deficit_headline','USD'),('Economy','B8','reunion','public_debt','USD'),('Economy','B29','reunion','current_oil_revenue_status',None),
        ('Military','B4','armed_forces','broad_active_duty','persons'),('Military','D4','army','reserve','persons'),('Military','F4','ria_national_guard','personnel','persons'),('Military','B5','air_force','source_label_combat_aircraft','aircraft'),('Military','D5','armed_forces','attack_helicopters','aircraft'),('Military','F5','navy','surface_combatants_including_carrier','vessels'),('Military','H5','navy','submarines','vessels'),('Military','B6','army','modern_mbts','vehicles'),('Military','D6','army','light_tanks','vehicles'),('Military','F6','army','older_mbts','vehicles'),('Military','H6','army','operational_tube_artillery','pieces'),('Military','D9','air_force','awacs_status',None),('Military','F9','air_force','tanker_status',None)]:
        claim(entity,pred,v(sh,ad),rowloc(sh,int(re.search(r'\d+',ad)[0])),unit=unit,notes='Tracker effective date unresolved. Cached formula results preserved, not recalculated source values.')
    for row in range(15,21):claim('parliament','bloc_seats',{'bloc':v('Politics','A'+str(row)),'seats':v('Politics','B'+str(row)),'status':v('Politics','C'+str(row)),'line':v('Politics','D'+str(row))},rowloc('Politics',row))
    for row in range(13,26):claim('reunion_budget','allocation',{'category':v('Economy','A'+str(row)),'amount':v('Economy','B'+str(row)),'unit':'USD billions'},rowloc('Economy',row),operation='budget_status_unspecified')
    for row in range(19,24):claim('defense_budget','branch_allocation',{'branch':v('Military','A'+str(row)),'amount':v('Military','B'+str(row)),'unit':'USD billions'},rowloc('Military',row),operation='budget_status_unspecified')
    for row in range(2,9):
        value={k:v('Projects',col+str(row)) for k,col in [('name','A'),('total_cost_usd_b','B'),('paid_out_usd_b','C'),('committed_usd_b','D'),('unfunded_gap_usd_b','E'),('work_left_usd_b','F'),('monthly_execution_usd_b','G'),('funding_coverage','H'),('months_to_finish','I'),('eta_excel_serial','J')]}
        claim(value['name'],'project_financial_snapshot',value,rowloc('Projects',row),operation='funded_not_completed',notes='ETAs are forecasts; commitments are not disbursements. Overlapping project scopes remain unconfirmed.')
    for row in range(2,6):
        value={k:v('Companies',col+str(row)) for k,col in [('name','A'),('control_description','B'),('working_value_usd_b','C'),('activity','D'),('political_tie','E'),('source_qualification','F')]}
        claim(value['name'],'company_working_profile',value,rowloc('Companies',row),canon='provisional',notes='Source explicitly labels valuations and some ownership as estimates. Do not promote those estimates to confirmed canon.')
    for row in range(2,10):claim('trade_partners','partner_profile',{k:v('Trade Partners',col+str(row)) for k,col in [('partner','A'),('tier','B'),('imports','C'),('exports','D'),('relationship','F'),('balance_description','G'),('qualification','H')]},rowloc('Trade Partners',row),notes='Retain estimated goods mixes and grouped partners as estimates.')
    for row in range(4,14):claim('foreign_relations','source_assessment',{k:v('Foreign',col+str(row)) for k,col in [('actor','A'),('posture','B'),('private_assessment','C'),('leverage_over_reunion','D'),('reunion_leverage','E'),('risk_rating','F'),('forecast_next_move','G'),('notes','H')]},rowloc('Foreign',row),operation='assessment_not_outcome')
    # Every procurement item in the latest workbook comments, with exact cell provenance.
    army=[('M109 howitzer',100,150000000),('M270 MLRS',30,120000000),('M102 towed howitzer',200,60000000),('Cobra',10,100000000),('AH-64',25,375000000),('Blackhawk',36,324000000),('Little Bird',30,30000000),('Puma',30,120000000),('Chinook',15,225000000),('M1A1 Abrams',175,1050000000),('Leopard, variant unspecified',35,175000000),('M2 Bradley',400,800000000),('Marder IFV',300,450000000),('FV432',300,150000000),('LAV-25',75,112000000),('Various support vehicles',800,300000000)]
    air=[('F-16 newer version',12,600000000),('F-16 older version',12,180000000),('Falcon 20, source spelling Flacon',5,100000000),('E-3 Sentry',2,400000000),('C-130',10,200000000),('KC-135',3,180000000),('Mirage 2000C',24,1320000000),('Tornado GR.1A',5,375000000),('Jaguar',11,198000000)]
    for branch,rows,addr in [('Army',army,'C19'),('Air Force',air,'C20')]:
        for name,count,total in rows:claim(name,'procurement_batch',{'branch_budget':branch,'quantity':count,'source_total_cost_usd':total},[(LATEST,'Military!'+addr+' comment')],operation='delivery_unconfirmed',notes='Comment is not delivery evidence. Earlier baseline describes corresponding modernization orders as undelivered. Do not add to operational inventory.')
    # Review arithmetic independently; source cells remain untouched.
    def check(ident,topic,sid,loc,obs,calc,status,why):c.execute('INSERT OR REPLACE INTO check_results VALUES(?,?,?,?,?,?,?,?)',(ident,topic,sid,loc,j(obs),j(calc),status,why))
    check('seats','parliament',LATEST,'Politics!B15:B21',400,sum(v('Politics','B'+str(r)) for r in range(15,21)),'pass','Six blocs sum to the stated 400 seats. This does not establish filled/voting seats or constitutional legality.')
    total=sum(v('Economy','B'+str(r)) for r in range(13,26))
    check('budget_sum','budget',LATEST,'Economy!B13:B26 versus E7',v('Economy','E7')/1e9,total,'needs_decision','Category allocations sum to 255B; headline spending is 250B. At unchanged revenue, category-based deficit would be 95B, not 90B.')
    check('army_cost_sum','procurement',LATEST,'Military!C19 comment',{'claimed_spent_b':23,'personnel_b':10,'left_b':2},{'itemized_equipment_b':sum(x[2] for x in army)/1e9,'with_personnel_b':10+sum(x[2] for x in army)/1e9,'unexplained_to_claimed_spent_b':23-10-sum(x[2] for x in army)/1e9},'needs_decision','Listed item costs do not explain the comment total; do not invent the missing costs.')
    check('air_cost_sum','procurement',LATEST,'Military!C20 comment',{'budget_b':25,'personnel_b':7,'project_transfer_b':2.9,'remaining_b':1.1},{'itemized_equipment_b':sum(x[2] for x in air)/1e9,'explained_plus_personnel_transfer_remaining_b':sum(x[2] for x in air)/1e9+7+2.9+1.1,'unexplained_b':25-(sum(x[2] for x in air)/1e9+7+2.9+1.1)},'needs_decision','Unlisted procurement, sustainment or another figure may explain this; none is invented.')
    check('project_costs','projects',LATEST,'Projects!F16:G16',{'gross_b':v('Projects','F16'),'after_fudge_b':v('Projects','G16')},{'gross_b':sum(v('Projects','B'+str(r)) for r in range(2,9)),'deductions_b':2.9+4.1+13},'needs_decision','Funding source transfers do not ordinarily reduce a project total cost. Scope and accounting intent need confirmation.')
    check('rail_eta','formula',LATEST,'Projects!J6',v('Projects','J6'),{'formula':'references row 5 instead of row 6','row6_months':v('Projects','I6'),'row5_months':v('Projects','I5')},'confirmed_formula_reference_error','J6 uses G5/E5/K5/I5, copying the energy-project forecast into the rail row. Original workbook was not edited.')
    check('coverage_excludes_oil','formula',LATEST,'Dashboard!B15','AVERAGE(Projects!H2:H7)',{'omitted_row':8,'current_all_seven_coverage':1},'scope_note','Oil row is omitted. Currently all seven projects are 100% funded, so the displayed average happens to remain 100%.')
    check('aircraft_definition','classification',LATEST,'Military!B5',27,{'fighters':20,'cas':5,'ew':2,'sum_all_listed':27},'definition_note','Earlier detailed OOB includes two ECM aircraft inside the 27 labelled combat aircraft. Preserve the raw label and show the composition; do not silently treat 27 as fighter/CAS aircraft.')
    check('altis_strength','casualties','src_d3ffad383db533f6','word/document.xml:paragraphs 21-25',{'headline_effective':61,'headline_casualty_percent_approx':44},{'subunit_effective_sum':4+20+12+35,'kia':2+16+17+6,'wia':4+14+1+14,'mia':15,'casualties':41+33+15,'original_strength':160,'effective_if_categories_exhaustive':71,'casualty_percent_from_categories':55.625},'needs_decision','Subunit rows sum to 71 effective and 89 casualties, contradicting 61 effective and approximately 44% casualties.')
    # Dated evidence is not resolved canon. Record incomplete/invalid dates literally.
    date_pattern=re.compile(r'\b(?:\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)|(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?)[,\s]+(?:19|20)\d{2}\b',re.I)
    for p in c.execute("SELECT p.* FROM passages p JOIN sources s ON p.source_id=s.id WHERE s.kind IN('.html','.docx','.txt')").fetchall():
        for m in date_pattern.finditer(p['body']):
            literal=m.group(); cleaned=re.sub(r'(\d)(st|nd|rd|th)',r'\1',literal,flags=re.I).replace(',',''); cleaned=' '.join(cleaned.split())
            validity='invalid_calendar_date'; iso=None
            for fmt in ['%d %B %Y','%B %d %Y']:
                try:iso=datetime.strptime(cleaned,fmt).date().isoformat();validity='valid_textual_mention';break
                except ValueError:pass
            eid='ev_'+hid(p['id']+'|'+literal)
            c.execute('INSERT OR REPLACE INTO historical_event_candidates VALUES(?,?,?,?,?,?,?,?,?,?)',(eid,p['source_id'],p['id'],p['body'][:180],literal,'day_as_written',validity,'source_context_unresolved','unreviewed',p['recorded_at']))
    # Selected reported events and distinct casualty categories with direct provenance.
    for mid,ent,pred,value,dt,op in [
        ('1447490234265636948','dax_donahue_ii','runoff_result',{'Donahue_Younger_approx_percent':59,'Hartmann_approx_percent':41},'1992-07-05','reported_result'),
        ('1447834232293429330','amalia_rehn','reported_death_and_succession',{'cause':'car crash','successor':'Emilio Curro'},'1992-06-24','reported_completed'),
        ('1492263875633090731','parliament','dissolution',{'duration_months':3,'time':'06:00'},'1992-10-03','reported_completed'),
        ('1449495998761144430','dalmatia_1992_09_10','casualty_report',{'KIA':560,'WIA':1330,'MIA':260,'POW':370,'total':2520,'report_cutoff':'12:00'},'1992-09-10','reported_losses'),
        ('1495837261265375477','altis','ceasefire_and_un_observers',{'turkish_position':'airport','buffer_zone':True,'supplies_delivered':True},None,'reported_completed'),
        ('1447990919612727379','rnio_act_1992','presidential_signature',{'source_spelling':'rhino act of 1992'},None,'reported_signed'),
        ('1464093460578570325','younger_industries_legacy','legacy_scope_notice',{'text':'Everything before this is no longer relavent and classified. Don\'t even bother it\'s all gone'},None,'scope_unresolved')]:
        rr=c.execute('SELECT source_id FROM discord_messages WHERE message_id=?',(mid,)).fetchone()
        claim(ent,pred,value,[(rr[0],'message '+mid)],authority='discord_reported_event',world=dt,precision='day' if dt else 'unknown',operation=op,notes='New evidence staged for review; reported dates are not silently used to settle conflicting chronology.')
    # Questions are authored only after reviewing all supplied text and workbook comments.
    issues=[]
    def issue(n,priority,topic,question,refs,default):
        ev=[]
        for sid,loc in refs:
            pp=c.execute('SELECT id,body FROM passages WHERE source_id=? AND locator=?',(sid,loc)).fetchone()
            assert pp,(sid,loc)
            sp=c.execute('SELECT path FROM sources WHERE id=?',(sid,)).fetchone()[0]
            ev.append({'source_id':sid,'source_path':sp,'locator':loc,'passage_id':pp['id'],'excerpt':pp['body'][:1400]})
        ident='Q'+str(n).zfill(2)
        c.execute('INSERT INTO review_issues(id,priority,topic,question,evidence,default_handling) VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET priority=excluded.priority,topic=excluded.topic,question=excluded.question,evidence=excluded.evidence,default_handling=excluded.default_handling',(ident,priority,topic,question,j(ev),default))
        issues.append({'id':ident,'priority':priority,'topic':topic,'question':question,'evidence':ev,'default_handling':default,'answer':''})
    def msg(mid):
        r=c.execute('SELECT source_id FROM discord_messages WHERE message_id=?',(mid,)).fetchone(); assert r,mid;return (r[0],'message '+mid)
    def para(s,n):return (s,'word/document.xml:paragraph '+str(n))
    issue(1,'before_app_update','Current date','What is the actual current in-world date? The tracker is dated October 3, 1992, but includes the ceasefire following Altis reports dated October 1993. Should Altis stay in 1993, move to 1992, or sit in a separate later snapshot?',rowloc('Dashboard',4)+[msg('1493871717066735728')],'Keep tracker date, latest-state label, and Altis dates separately. No unified current snapshot yet.')
    issue(2,'before_app_update','Parliament chronology','The suspension on October 3, 1992 is already established. How should the oil law on October 6, Horizon law on October 9, and parliamentary activity on October 16 fit around it? If the current date is later, were extensions, reconvening, or elections actually played?', [msg('1492263875633090731'),para('src_27f0c8dd736bf3fc',5),para('src_518d5c52fdba70e4',37)],'Retain the suspension and all reported legislative dates; do not invent later sessions or extensions.')
    issue(3,'before_app_update','Election and finance succession','What date did Donahue take office? Discord gives a July 5, 1992 runoff, but Rehn dies and Curro replaces her on June 24, and Donahue signs laws on June 26. Which dates should change, if any? Can June 24 now be used as Rehn’s death/Curro’s succession date, and is Rehn’s appointment date known?', [msg('1447490234265636948'),msg('1447834232293429330'),msg('1447856851029852170')],'Preserve the confirmed Rehn-to-Curro sequence. New exact dates remain competing evidence.')
    issue(4,'before_app_update','Population','For the current national scale, should I use the baseline population of roughly 19–21 million? The Discord country-information sheet says 1.35 million, and its city figures sum to 1.355 million. Is the smaller figure old canon, an earlier historical population, or a scale that should still apply? What territory does the current total cover?', [('src_7bfbcacf0ec064ec','full text'),msg('1117628707658535064')],'Do not attach the undated 1.35M city figures to the 19–21M population or invent a regional distribution.')
    issue(5,'before_app_update','Historical economic scale','The latest GDP is $400B USD / 2.32T RMC. Earlier reports use GDP of only 18–20B RMC. Were those earlier figures retconned, or are they valid for a different period? If retconned, do old loan, rail, infrastructure and treaty amounts stay at their written amounts or need explicit replacements?',rowloc('Economy',4)+[para('src_1717c14edc04b275',77),para('src_e72b96945587c6d9',125)],'Use latest tracker values for its pending-date snapshot; flag earlier scale-sensitive ratios without multiplying any old amount automatically.')
    issue(6,'before_app_update','National budget total','Should the national spending total be $250B or $255B? The tracker’s category lines add to $255B. With revenue of $160B, that gives a $95B deficit rather than the displayed $90B. If $250B is intended, which category should change?',rowloc('Economy',7)+rowloc('Economy',26),'Keep the headline and category sum as competing reported values; no silent balancing adjustment.')
    issue(7,'before_app_update','Transfers and defense budget','Are the project transfers of $17.1B from Navy and $2.9B from Air Force approved and completed reallocations? What are the final defense branch appropriations after them? The visible branch figures sum to $82.9B, while the national defense line still says $100B.',[(LATEST,'Projects!N2 comment'),(LATEST,'Projects!N3 comment'),(LATEST,'Projects!N8 comment'),(LATEST,'Military!C21 comment')]+rowloc('Economy',13),'Record transfer notes independently; do not count them as both new funding and an unchanged spending appropriation.')
    issue(8,'before_app_update','Procurement costs','Are the Army and Air Force comment lists complete and their prices total batch costs? Army items add to $4.541B, or $14.541B with the stated $10B personnel cost, versus “$23B spent.” Air items add to $3.553B; personnel, project transfer and stated remainder still leave $10.447B unexplained. What costs or corrected totals are missing?',[(LATEST,'Military!C19 comment'),(LATEST,'Military!C20 comment')],'Preserve listed quantities and batch prices. Leave unexplained balances explicit.')
    issue(9,'before_app_update','Delivery status','Has any of the modernization equipment in the tracker comments actually been delivered, accepted or made operational since the October 3 baseline? If yes, which items, quantities and dates? This includes the five Falcon 20s and all new armor, artillery, helicopters, F-16s, Mirages, E-3s, tankers and transports.',[(LATEST,'Military!C19 comment'),(LATEST,'Military!C20 comment'),('src_4b015437d0e0b398','full text')],'Retain the prior undelivered classification for matching orders; new comment-only items have unconfirmed delivery status.')
    issue(10,'before_app_update','Project accounting','Are all seven projects separate additive budgets, or do rail, energy and defense infrastructure overlap the National Infrastructure Spine? What does the tracker’s $41.6B “after fudge” total mean compared with $61.6B gross? It subtracts $20B of funding transfers. Should paid-out and committed columns be treated as actual payments and binding commitments?',rowloc('Projects',16)+rowloc('Projects',2)+rowloc('Projects',8),'Preserve seven project rows. Do not add overlapping scopes to national spending or convert funding coverage into completion.')
    issue(11,'before_app_update','US loan','Does the signed US facility remain $90 million at 12%, with a 3% fee, after the economic scale changes? Which tranches actually arrived, and when? Is this facility already included in the $120B public-debt stock?', [para('src_e72b96945587c6d9',22),para('src_e72b96945587c6d9',55),para('src_66e60f91d28ddf41',50)]+rowloc('Economy',8),'Keep the written loan amount and conditional tranches; do not infer disbursement or add the full facility to debt again.')
    issue(12,'before_app_update','Oil geology','Is the deposit heavy oil or light oil? The economic baseline calls it heavy-dominant, while the October 16 report calls it confirmed light oil. Is the 1.5–2.2 billion barrel recoverable estimate still valid, and is 1.2M barrels/day only a future scenario?', [('src_f7a3e5eb9823236c','full text'),para('src_9d7138a069387106',28),para('src_27f0c8dd736bf3fc',92)],'Keep the two oil descriptions disputed. No meaningful current oil revenue; production scenarios stay forecasts.')
    issue(13,'before_app_update','Oil awards','Which petroleum awards actually became binding? The oil document offers Exxon 6%, Shell 6%, a French or Italian group 4%, and a Younger-led domestic group 4%, with conditional alternatives. Were those awards approved, and on what dates? I will keep Royla’s approximately 2% oil entitlement separate from the 15% equity sale in Royla itself.', [para('src_27f0c8dd736bf3fc',57),para('src_27f0c8dd736bf3fc',62),para('src_9d7138a069387106',40)],'Stage conditional allocations as proposals; keep company equity and national oil entitlement in different fields.')
    issue(14,'before_app_update','Horizon ownership and capital','What is Horizon’s approved ownership and funding structure? One document proposes Curro 70% / King 30% voting shares and Strevo investing 70% of his net worth through preferred capital. The tracker calls it state-backed and labels ownership/value as estimated. Which stakes, investment amounts and transfers actually happened?', [para('src_518d5c52fdba70e4',23),para('src_518d5c52fdba70e4',25),msg('1494122944622755920')]+rowloc('Companies',5),'Confirmed existence/role can be distinguished from proposed share classes, estimated value and unconfirmed capital movements.')
    issue(15,'before_app_update','Intelligence institutions','What is the approved structure after the signed RNIO Act? The Act creates a unified civilian RNIA with no independent detention/kinetic role, merges GRI and leaves RIA as a National Guard-type force. The baseline instead lists an internal RNIA with detention powers plus a separate external RNIO. Are those later changes, old errors, or distinct agencies? Who heads each now?', [msg('1447990919612727379'),para('src_ce2733bfe991c696',26),('src_7bfbcacf0ec064ec','full text')],'Preserve statutory powers and reported practical structures independently; do not merge agencies or transfer powers by inference.')
    issue(16,'before_app_update','Hartmann identities','Are Ezra Hartman, Ebin Hartmann II, and the NSF leader named Hartmann separate people? Who currently commands the Army, who leads NSF, and which person ran for president in 1992? The older character Ebin Hartmann born in 1916 will remain a separate identity.', [msg('1261400767101665340'),msg('1381058918876450897'),msg('1447490234265636948'),msg('1117635220036931664')],'Keep distinct provisional identities and ambiguous references; no automatic merge from a surname.')
    issue(17,'before_app_update','Drafts versus accepted events','Which of these saved texts were accepted into canon: the Industrial Air Capability Act ($6B), the detailed Horizon consolidation law/reactions, the oil law/tender outcomes, the August–September events log, and the October 2 presidential memorandum’s new events? Can reported completed events in those files be accepted except where they are explicitly options/forecasts, or should each remain pending?', [para('src_8997b231610323b7',18),para('src_1f14ebe994a98cfa',55),para('src_66e60f91d28ddf41',18)],'Explicit primary actions remain evidence. Assistant-style reactions, model probabilities, “typical outcomes” and hypothetical casualties do not become canon automatically.')
    issue(18,'later_detail','Unit 17','Was Hartmann’s roughly 40-person Unit 17 actually approved/formed in canon, or is the internal NSF/RIA write-up an unused scenario? If formed, which Hartmann authorized it and when?', [para('src_81f67458789233bf',2),para('src_81f67458789233bf',4)],'Keep as an unapproved classified scenario/account until confirmed; allegations remain separate from established events.')
    issue(19,'before_app_update','Croatian treaty articles','Which articles of the Croatian draft became the signed final agreement? The frontier just north of Šibenik and Šibenik DMZ are already established. Are the draft’s 30km force restriction, 50km withdrawal notification rule, broad breach clauses and twelve-year term binding? Are there final maps or annexes defining the DMZ and corridors?', [para('src_8bc07f9050eb8b1c',34),para('src_8bc07f9050eb8b1c',43),para('src_8bc07f9050eb8b1c',68)],'Preserve the existing frontier/DMZ override. Draft clauses remain draft obligations until ratification scope is confirmed; no guessed coordinates.')
    issue(20,'later_detail','Ploče chronology','What date did the UN corridor resolution at Ploče actually finish? Does the later reference to a “second Bosnian peacekeeping force” describe a new canon incursion, a proposal, or just an attachment caption? The earlier completed resolution will remain intact.', [msg('1463619695809658910'),msg('1468368064277119103'),('src_7bfbcacf0ec064ec','full text')],'Keep Operation King’s Hand, negotiations, the resolved corridor and any later incident as separate events; no inferred second battle.')
    issue(21,'before_app_update','Altis ceasefire date','What is the date the Altis ceasefire and UN buffer took effect? The last news reports say the ceasefire happened but do not give an in-world dateline. Is the airport still Turkish-held at the current date?', [msg('1495837261265375477'),msg('1495837262355763200')],'Store the ceasefire as reported completed with an unknown exact date. No undocumented subsequent outcome.')
    issue(22,'later_detail','Altis casualty totals','For the October 11 Altis report, which figures should be corrected? The four Turkish subunits total 71 effective personnel from 160, with 41 KIA, 33 WIA and 15 MIA. The headline instead says 61 effective and about 44% casualties. Should the detailed rows or a replacement report govern?', [para('src_d3ffad383db533f6',21),para('src_d3ffad383db533f6',22),para('src_d3ffad383db533f6',23),para('src_d3ffad383db533f6',24),para('src_d3ffad383db533f6',25)],'Retain all competing figures. Do not silently recalculate official losses or combine categories with another phase.')
    issue(23,'later_detail','Founding chronology','How should the 1946 constitution and the civil war ending in 1947 fit together? Was there a 1946 interim government/constitution before the final settlement? Who was the first president and when: Chester McPeak, as the settlement account says, or Hartmann in 1946, as the presidential list says?', [msg('1116235130676187167'),msg('1116236931899084841'),msg('1135921678749274251'),para('src_0b79c125ec3c7196',3)],'Keep the civil-war end, constitutional adoption, interim rule and presidential terms separate; no fabricated bridge dates.')
    issue(24,'later_detail','Royal succession','The current king remains Zo III. A newly supplied Discord country record calls the heir Prince Jakob Steiner, while your later decision identifies the young heir as Zo III. Is Jakob an old superseded name, his personal name with Zo III as another designation, or a different person? Do you have a lineage separating the king crowned in 1924 from the present king?', [msg('1135919921751134258'),msg('996701480037920818'),msg('1116235130676187167')],'Preserve your later Zo III heir designation and separate king/heir entities until you decide. Zo IV mentions do not rename the reigning king.')
    issue(25,'later_detail','Legacy canon scope','When the Younger channel says everything before its reset is “no longer relevant and classified,” is that a retcon or only a secrecy/current-focus change? Should clones, supernatural experiments, joke commanders and the 2023 football stories remain historical/future canon, or be archived outside the main continuity?', [msg('1464093460578570325'),msg('1021643326849556530'),msg('1117238238076207154')],'Preserve every original. Do not treat humorous posts, non-canon markers or a classification notice as blanket authority to erase history.')
    issue(26,'source_gap','Missing attachment content','Can you later supply the Discord media folder or re-export with downloaded attachments? The ZIP contains HTML references to 117 attachments but no attachment files. Two Drive documents are blank, and BosniaPloce.mp4 is five seconds of white frames with no audio. The Ezra character document is also only linked, not included in this Drive ZIP.', [msg('1447837907749568644')],'Text review is complete for supplied bytes. Image-only maps, screenshots and absent linked documents remain unverified; no replacement facts invented.')
    issue(27,'later_detail','Invalid historical dates','What dates should replace November 31, 1945 in the rebel election and Funkyville sabotage posts, and February 29, 1994 in the military-request post? I will retain the original text and leave normalized dates unknown until corrected.', [msg('1034670531066208316'),msg('1034679809491607594'),msg('1381054220261654559')],'Do not turn invalid dates into November 30, December 1, or a different year automatically. The September 31 filename is separately explained by its valid September 30 body.')
    # Source-by-source coverage notes describe what was actually accessible.
    for s in c.execute('SELECT * FROM sources').fetchall():
        limitation=''
        if s['kind']=='.html':
            cc=c.execute('SELECT expected_count,parsed_count FROM discord_channels WHERE source_id=?',(s['id'],)).fetchone()
            note=f'Channel text and available embed text reviewed. Expected {cc[0]} messages; parsed {cc[1]}. Attachment references preserved.'
            limitation='Remote images/attachments not included in supplied ZIP; visual contents not verified.' if c.execute("SELECT 1 FROM attachment_references WHERE source_id=? AND kind='discord_attachment'",(s['id'],)).fetchone() else ''
        elif s['kind'] in ('.xlsx','.xlsm'):note='All 10 worksheets, cell values/formulas/caches and six cell comments reviewed. No macros executed; no source workbook changed.'
        elif s['extraction_status']=='empty_document':note='Inspected document XML: no textual paragraphs. No evidence content to infer.'
        elif s['kind']=='.docx':note='All document paragraphs/tables extracted and text reviewed. Original OOXML retained. No embedded media present.'
        elif s['kind']=='.mp4':note='ffprobe and all decoded frames checked: 151 identical white frames, 5.033333 seconds, no audio stream.';limitation='No visible or audible roleplay content in supplied video.'
        elif s['kind']=='.zip':note='Archive CRC verified; every file member ingested and preserved.'
        else:note='Complete text reviewed; earlier baseline conflicts preserved.'
        c.execute('INSERT OR REPLACE INTO source_notes VALUES(?,?,?)',(s['id'],note,limitation))
        c.execute('UPDATE review_coverage SET extraction_verified=1,content_reviewed=1,notes=? WHERE source_id=?',(note,s['id']))
    c.execute("INSERT OR REPLACE INTO metadata VALUES('app_update_status','No app code, app database, hosting data, or published site was modified. All new material is isolated pending answers.')")
    c.commit()
    # Readable deliverables and machine-readable migration inputs.
    lines=['# Reunion canon questions','', 'The supplied text and tracker review is complete. The app has not been updated. Answer by ID, for example `Q01: ...`. “Unknown” or “defer” is valid. Questions marked “before app update” affect the unified current snapshot; later-detail questions can remain unresolved in the eventual app.', '', 'Already retained without reopening: Darius Younger is Vice President; Rehn died in a car crash and Curro succeeded; the current king and young heir remain separate; Parliament has 400 seats despite the constitutional maximum of 300; the frontier is just north of Šibenik with a Šibenik DMZ. The latest tracker has priority over older snapshot values, while its explicit estimates remain estimates.','']
    for q in issues:
        lines.extend(['## '+q['id']+' '+q['topic'],'','**'+q['priority'].replace('_',' ')+'**','',q['question'],'','Evidence:'])
        for ev in q['evidence']:
            lines.append('- `'+ev['source_id']+'` · '+ev['source_path']+' · '+ev['locator'])
        lines.extend(['','Until answered: '+q['default_handling'],'','**Answer:**',''])
    (ROOT/'Reunion_Canon_Questions.md').write_text('\n'.join(lines))
    (ROOT/'review_questions.json').write_text(j(issues))
    with (ROOT/'review_questions.csv').open('w',newline='') as f:
        w=csv.DictWriter(f,fieldnames=['id','priority','topic','question','answer']);w.writeheader();w.writerows({k:q[k] for k in w.fieldnames} for q in issues)
    checks=[dict(r) for r in c.execute('SELECT * FROM check_results ORDER BY id')]
    (ROOT/'checks.json').write_text(json.dumps(checks,indent=2,ensure_ascii=False))
    claims=[]
    for rr in c.execute('SELECT * FROM candidate_claims ORDER BY entity,predicate,id'):
        rr=dict(rr);rr['value']=json.loads(rr.pop('value_json'));rr['evidence']=[dict(x) for x in c.execute('SELECT p.id,p.source_id,s.path,p.locator FROM claim_evidence e JOIN passages p ON e.passage_id=p.id JOIN sources s ON p.source_id=s.id WHERE e.claim_id=?',(rr['id'],))];claims.append(rr)
    (ROOT/'normalized_candidates.json').write_text(json.dumps(claims,indent=2,ensure_ascii=False))
    refs=[dict(r) for r in c.execute('SELECT a.*,s.path FROM attachment_references a JOIN sources s ON s.id=a.source_id ORDER BY s.path,a.message_id,a.id')]
    with (ROOT/'attachment_references.csv').open('w',newline='') as f:
        w=csv.DictWriter(f,fieldnames=refs[0].keys());w.writeheader();w.writerows(refs)
    inv=[dict(r) for r in c.execute('SELECT s.id,s.container,s.path,s.kind,s.sha256,s.byte_count,s.priority,s.extraction_status,length(s.text) AS text_chars,n.review_notes,n.media_limitations FROM sources s LEFT JOIN source_notes n ON n.source_id=s.id ORDER BY s.container,s.path')]
    (ROOT/'source_inventory.json').write_text(json.dumps(inv,indent=2,ensure_ascii=False))
    with (ROOT/'source_inventory.csv').open('w',newline='') as f:
        w=csv.DictWriter(f,fieldnames=inv[0].keys());w.writeheader();w.writerows(inv)
    stats={t:c.execute('SELECT count(*) FROM '+t).fetchone()[0] for t in ['sources','discord_channels','discord_messages','workbook_cells','workbook_comments','passages','source_statements','candidate_claims','historical_event_candidates','review_issues']}
    (ROOT/'review_stats.json').write_text(json.dumps(stats,indent=2))
    report=f'''# Reunion evidence review

The new material has been reviewed and placed in a separate searchable SQLite database. No change was made to the Reunion app. The campaign tracker is the user-designated latest snapshot, with its historical date held pending clarification.

## Coverage

- 46 Discord channel exports, containing 1,140 messages. Every channel count matches the export footer.
- Drive ZIP: 28 Word documents, two workbook versions and one video. Twenty-six Word documents contain text; two are blank.
- Latest standalone tracker: 10 sheets, 730 nonempty/formula cells and six cell comments. Both Drive workbook versions match all decoded cell values, types, formulas and caches. The XLSM adds separator lines to comments; their substantive contents match. Their file bytes differ, so the original files remain separate.
- Six earlier Reunion text sources reviewed alongside the new evidence.
- {stats['passages']} searchable evidence passages and {stats['candidate_claims']} normalized candidate records. These are evidence and review records, not a claim that every passage is an approved historical fact.
- {stats['historical_event_candidates']} explicit date mentions indexed as candidate chronology entries. A date mention is not automatically an event date or an approved timeline entry.

## Findings

The latest workbook updates project funding and provides detailed Army and Air Force procurement lists in comments at Military!C19 and C20. Those comments are preserved with exact cell references. Funding, commitments, cash paid, forecasts and delivery status remain separate.

The strongest chronological conflict is between the October 3, 1992 tracker date and its post-Altis ceasefire notes, supported by an October 11, 1993 battle report. A second conflict places Rehn’s death/Curro’s succession on June 24 while the winning presidential runoff is reported on July 5. Parliamentary bills described after the established October 3 suspension also need an explicit chronological decision.

The national spending categories total $255B while the headline says $250B. At unchanged $160B revenue, the implied category-based deficit is $95B. That is a diagnostic calculation, not a canon correction. Army equipment prices sum to $4.541B; Air Force items sum to $3.553B. Their comment summaries include unexplained balances that remain unallocated.

The seven project rows total $61.6B. The $41.6B figure subtracts $20B matching transfer notes. Whether that represents net new financing or another scope must be confirmed. All seven rows show full funding coverage, which does not mean completion. Rail ETA cell Projects!J6 refers to row 5 instead of row 6. Dashboard!B15 also omits oil row 8 from its coverage range; all current coverages are 100%, so the omission presently leaves its displayed average unchanged. These source formulas were preserved.

The detailed September 10, 1992 casualty report supplies 560 KIA, 1,330 WIA, 260 MIA and 370 POW, totalling 2,520. This resolves the categories of that particular report without reclassifying later losses. The October 11 Altis report is internally inconsistent: Turkish subunit rows give 71 effective and 89 casualties from 160, while its headline gives 61 effective and about 44% casualties. It remains disputed.

Sources confirm a signed RNIO reform act, but its civilian RNIA structure conflicts with the later baseline’s RNIA/RNIO definitions. Royal, Hartmann and Younger identities are kept separate. The word “president” applied to Emilio Curro in the Horizon channel is treated in its company context, not as a national presidential succession.

The October 3 detailed OOB lists 20 fighters, five CAS aircraft and two EW aircraft within a headline of 27 “combat aircraft.” The database retains the label and the component counts. Likewise the 42 surface-vessel figure reconciles with the detailed fleet when the helicopter carrier is included. These are definition notes, not unexplained new losses or acquisitions.

## Material that is still missing

The Discord HTML files contain 117 attachment references but no accompanying image/attachment files. Referenced operational maps, charts, screenshots, flags and image-only lore therefore cannot be verified visually from this upload. URLs, message IDs and channel IDs are preserved for later recovery. Linked Google documents are references, not imported document content merely because a preview exists.

The video BosniaPloce.mp4 contains 151 identical white frames, lasts 5.033333 seconds, and has no audio stream. Untitled document.docx and New Bills (June 25 – July 1, 1992).docx contain no text. No conclusions were invented for these empty sources.

## Decisions and next step

Reunion_Canon_Questions.md contains 27 questions with exact source locators and handling rules. Questions affecting the current state are separated from historical detail and missing-media questions. Answering “unknown” preserves a usable unresolved record. No question requires inventing a date or selecting an unsupported outcome.

After answers, record the decisions and explanations before preparing any app import. Do not rewrite originals, infer completion from a forecast, or turn company valuation and trade estimates into confirmed facts. No user answers or new canon approvals have been recorded during this review.
'''
    (ROOT/'Reunion_Review_Report.md').write_text(report)
    schema='\n\n'.join(r[0]+';' for r in c.execute("SELECT sql FROM sqlite_master WHERE sql IS NOT NULL AND name NOT LIKE 'search_%' ORDER BY type,name"))
    (ROOT/'schema.sql').write_text(schema)
    c.close()
    print(json.dumps(stats,indent=2))

if __name__=='__main__':main()
