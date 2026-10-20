"""Apply explicit user decisions to a COPY of the evidence database, never the app."""
import calendar,csv,hashlib,json,re,sqlite3
from datetime import datetime,timezone
from decimal import Decimal as D
from pathlib import Path

ROOT=Path(__file__).resolve().parent
def js(x):return json.dumps(x,ensure_ascii=False,sort_keys=True)
def sha(x):return hashlib.sha256(x).hexdigest()

def main():
    c=sqlite3.connect(ROOT/'reunion_evidence.sqlite');c.row_factory=sqlite3.Row;c.execute('PRAGMA foreign_keys=ON')
    c.executescript('''
    CREATE TABLE IF NOT EXISTS revision_runs(id TEXT PRIMARY KEY,answer_sha256 TEXT,recorded_at TEXT,app_modified INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS canon_facts(id TEXT PRIMARY KEY,entity TEXT,predicate TEXT,value_json TEXT,date_text TEXT,date_precision TEXT,canon_status TEXT,operational_status TEXT,authority TEXT,question_id TEXT REFERENCES review_issues,notes TEXT);
    CREATE TABLE IF NOT EXISTS fact_provenance(fact_id TEXT REFERENCES canon_facts,passage_id TEXT REFERENCES passages,relation TEXT,PRIMARY KEY(fact_id,passage_id));
    CREATE TABLE IF NOT EXISTS supersessions(old_claim_id TEXT REFERENCES candidate_claims,new_fact_id TEXT REFERENCES canon_facts,reason TEXT,PRIMARY KEY(old_claim_id,new_fact_id));
    CREATE TABLE IF NOT EXISTS source_annotations(passage_id TEXT REFERENCES passages,disposition TEXT,question_id TEXT REFERENCES review_issues,explanation TEXT,PRIMARY KEY(passage_id,disposition));
    CREATE TABLE IF NOT EXISTS date_revisions(passage_id TEXT REFERENCES passages,old_date_text TEXT,new_date_text TEXT,authority TEXT,question_id TEXT REFERENCES review_issues,PRIMARY KEY(passage_id,old_date_text));
    CREATE TABLE IF NOT EXISTS national_allocations(category TEXT PRIMARY KEY,previous_usd INTEGER,reconciled_usd INTEGER,status TEXT,authority TEXT,notes TEXT);
    CREATE TABLE IF NOT EXISTS defense_allocations(branch TEXT,category TEXT,amount_usd INTEGER,status TEXT,authority TEXT,PRIMARY KEY(branch,category));
    CREATE TABLE IF NOT EXISTS funding_transfers(id TEXT PRIMARY KEY,from_envelope TEXT,to_envelope TEXT,amount_usd INTEGER,operational_status TEXT,in_world_authorization TEXT,presidential_awareness TEXT,authority TEXT);
    CREATE TABLE IF NOT EXISTS procurement_batches(id TEXT PRIMARY KEY,source_claim_id TEXT REFERENCES candidate_claims,model TEXT,branch TEXT,quantity_ordered INTEGER,batch_cost_usd INTEGER,canon_status TEXT,operational_status TEXT,delivered_confirmed INTEGER,accepted_confirmed INTEGER,operational_confirmed INTEGER,earliest_month_after_order INTEGER,latest_month_after_order INTEGER,planning_origin TEXT,notes TEXT);
    CREATE TABLE IF NOT EXISTS delivery_plans(batch_id TEXT REFERENCES procurement_batches,wave INTEGER,quantity INTEGER,months_after_order INTEGER,status TEXT,PRIMARY KEY(batch_id,wave));
    CREATE TABLE IF NOT EXISTS project_accounts(name TEXT PRIMARY KEY,total_authorized_usd INTEGER,source_paid_out_usd INTEGER,source_committed_usd INTEGER,unfunded_usd INTEGER,physical_status TEXT,scope_policy TEXT,authority TEXT);
    CREATE TABLE IF NOT EXISTS money_restatements(id TEXT PRIMARY KEY,source_id TEXT REFERENCES sources,locator TEXT,old_value_text TEXT,new_value_json TEXT,method TEXT,status TEXT,authority TEXT);
    CREATE TABLE IF NOT EXISTS chronology_proposals(id TEXT PRIMARY KEY,event TEXT,proposed_date TEXT,status TEXT,reason TEXT,depends_on TEXT);
    CREATE VIEW IF NOT EXISTS active_canon AS SELECT * FROM canon_facts WHERE canon_status IN('confirmed','confirmed_estimate','delegated_reconciliation');
    CREATE VIEW IF NOT EXISTS unresolved_review AS SELECT id,topic,status,answer FROM review_issues WHERE status IN('needs_date_confirmation','source_gap','exact_date_unknown');
    ''')
    raw=(ROOT/'user_answers.txt').read_bytes();digest=sha(raw);runid='answers_'+digest[:20]
    if c.execute('SELECT 1 FROM revision_runs WHERE id=?',(runid,)).fetchone():
        export(c);print('Already applied; regenerated exports without duplicating decisions.');return
    sid='src_user_answers_'+digest[:16];body=raw.decode()
    c.execute('INSERT INTO source_blobs VALUES(?,?)',(digest,raw))
    c.execute('INSERT INTO sources VALUES(?,?,?,?,?,?,?,?,?)',(sid,'conversation','Canon review answers 2026-10-20.txt','.txt',digest,len(raw),'explicit_user_decision','extracted',body))
    answers={};pids={}
    for m in re.finditer(r'(?m)^(\d+)\. (.*)(?:\n|$)',body):
        n=int(m.group(1));qid=f'Q{n:02}';answers[qid]=m.group(2);pid=f'p_answer_{digest[:10]}_{n:02}';pids[qid]=pid
        c.execute('INSERT INTO passages(id,source_id,locator,body,recorded_at,canon_status) VALUES(?,?,?,?,?,?)',(pid,sid,qid,m.group(2),'2026-10-20T00:49:36-05:00','user_decision'))
        c.execute('INSERT INTO search VALUES(?,?,?,?)',(pid,sid,qid,m.group(2)))
        c.execute('INSERT INTO source_statements VALUES(?,?,?,?,?)',('stmt_answer_'+digest[:10]+f'_{n:02}',pid,'user_canon_decision','recorded','Direct user answer.'))
    assert len(answers)==27
    statuses={1:'needs_date_confirmation',2:'needs_date_confirmation',3:'needs_date_confirmation',4:'resolved_by_user',5:'delegated_reconciliation',6:'resolved_by_user',7:'resolved_by_user',8:'delegated_reconciliation',9:'delivery_plan_prepared',10:'delegated_reconciliation',11:'resolved_nonblocking',12:'resolved_by_user',13:'resolved_by_user',14:'resolved_by_user',15:'resolved_by_user',16:'resolved_with_bounded_unknown',17:'resolved_by_user',18:'resolved_by_user',19:'resolved_with_map_pending',20:'delegated_date_assigned',21:'relative_date_confirmed',22:'resolved_by_user',23:'resolved_by_user',24:'resolved_by_user',25:'resolved_by_user',26:'source_gap',27:'exact_date_unknown'}
    for qid,answer in answers.items():
        status=statuses[int(qid[1:])]
        c.execute('UPDATE review_issues SET answer=?,status=? WHERE id=?',(answer,status,qid))
        c.execute('INSERT INTO decision_log(issue_id,answer,reason,recorded_at) VALUES(?,?,?,?)',(qid,answer,'Direct user answer; delegated assumptions and incomplete dates are stored separately.','2026-10-20T00:49:36-05:00'))
    def fact(entity,pred,value,qid,*,date=None,precision='unknown',status='confirmed',op='unknown',authority='explicit_user_decision',notes='',replace_pred=None):
        fid='cf_'+sha((entity+'|'+pred+'|'+js(value)+'|'+qid).encode())[:20]
        c.execute('INSERT INTO canon_facts VALUES(?,?,?,?,?,?,?,?,?,?,?)',(fid,entity,pred,js(value),date,precision,status,op,authority,qid,notes))
        c.execute('INSERT INTO fact_provenance VALUES(?,?,?)',(fid,pids[qid],'direct_decision' if authority=='explicit_user_decision' else 'delegates_reconciliation'))
        for old in c.execute('SELECT id FROM candidate_claims WHERE entity=? AND predicate=?',(entity,replace_pred or pred)).fetchall():
            c.execute('INSERT INTO supersessions VALUES(?,?,?)',(old[0],fid,'New user decision or delegated reconciliation. Original payload and evidence retained.'))
        return fid
    def ann(query,args,qid,disp,why):
        for rr in c.execute(query,args).fetchall():c.execute('INSERT OR IGNORE INTO source_annotations VALUES(?,?,?,?)',(rr[0],disp,qid,why))
    fact('altis','operation_year',1992,'Q01',date='1992',precision='year',notes='The 1993 datelines are typographical errors. Only Altis-context 1993 dates change.')
    altis_sources=['src_d3ffad383db533f6']
    for p in c.execute("SELECT id,source_id,body,locator FROM passages WHERE source_id='src_d3ffad383db533f6' OR locator IN('message 1493871717066735728','message 1493871781394776165')").fetchall():
        for m in re.finditer(r'\b1993\b',p['body']):
            c.execute('INSERT OR IGNORE INTO date_revisions VALUES(?,?,?,?,?)',(p['id'],'1993 (Altis context)','1992','explicit_user_decision','Q01'))
    fact('amalia_rehn','death',{'cause':'car accident'},'Q03',date='1992-06-25',precision='day',op='completed',replace_pred='reported_death_and_succession')
    fact('emilio_curro','finance_minister_succession',{'predecessor':'Dr. Amalia Rehn','office':'Minister of Finance'},'Q03',date='1992-06-25',precision='day',op='appointed')
    fact('reunion','pre_civil_war_population',{'value':1350000,'as_of':'before the civil war','territorial_scope':'as reported in country record'},'Q04',precision='before_event',status='confirmed_estimate')
    fact('reunion','current_population_range',{'minimum':19000000,'maximum':21000000,'exact_value':None},'Q04',status='confirmed_estimate',notes='Retains the later baseline. The smaller 1.35M figure is now historical; no invented current city distribution.')
    fact('reunion','gdp',{'USD':400000000000,'RMC':2320000000000,'official_fx_rmc_per_usd':5.8},'Q05',status='confirmed_estimate',notes='Latest macro baseline retained; no simultaneous use of the old 18–20B RMC GDP.')
    fact('reunion','legacy_gdp_scale',{'old_range_rmc':[18000000000,20000000000],'status':'retconned'},'Q05',op='superseded')
    fact('reunion','spending_headline',255000000000,'Q06',op='annual_budget_framework',replace_pred='spending_headline')
    fact('reunion','defense_budget',82000000000,'Q07',op='annual_budget_framework')
    fact('reunion','revenue_headline',160000000000,'Q06',status='confirmed_estimate',op='annual_revenue_estimate',notes='Unchanged latest tracker revenue.')
    fact('reunion','deficit_headline',{'USD':95000000000,'fraction_gdp':0.2375},'Q06',authority='deterministic_arithmetic',status='delegated_reconciliation',op='annual_budget_projection',notes='255B expenditure less 160B revenue. This is not a booked debt increase.')
    fact('reunion','public_debt',120000000000,'Q11',status='confirmed_estimate',op='reported_debt_stock',notes='Latest stock retained. No automatic addition of full undrawn facilities or the projected deficit.')
    fact('us_stabilization_loan','facility',{'principal_usd':90000000,'fixed_interest_rate':0.12,'fee_fraction':0.03,'tranche_a_usd':30000000,'later_tranches_count':6,'later_tranche_usd':10000000,'actual_disbursement':None,'debt_stock_inclusion':'unknown'},'Q11',op='signed_facility',notes='Kept at the written 90M because user explicitly treats it as small/nonblocking. Expired deadlines do not prove receipt.')
    fact('royal_family','heir_status',{'heir':None,'status':'no_heir_designated'},'Q24')
    fact('reunion','heir_designation',None,'Q24',notes='Supersedes the earlier heir named Zo III. No successor is invented.')
    fact('jakob_steiner','existence_in_canon',False,'Q24',op='retconned',notes='Nonexistent in revised canon; original mentions remain evidence.')
    fact('king_zo_iii','royal_designation','Zo III','Q24',op='reigning')
    fact('henry_steiner','roles',{'relationship_to_king':'cousin','commander_of':'Inferno Division','designated_heir':False},'Q24',op='in_office',notes='Replaces earlier brother relationship and obsolete heir assumptions.')
    fact('ezra_hartman','roles',{'military':'General of the Armed Forces','political':'NSF leader','unit_17':'personal controller'},'Q16',op='in_office')
    fact('ezra_hartman','ancestry',{'ancestor':'Ebin Hartman','allowed_generational_distance':[1,2],'exact_relationship':None},'Q16',precision='bounded_unknown',notes='Son or grandson is intentionally unresolved; no choice made silently.')
    fact('ebin_hartman','founding_roles',{'civil_war_role':'general of the democratic rebels','presidential_order':1,'election_year':1947},'Q16',date='1947',precision='year',op='historical')
    fact('reunion','constitutional_transition',{'interim_year':1946,'constitution':'drafting and finalization','mcpeak_attempts':'unstable and unsuccessful during repeatedly broken ceasefires','peace_treaty_year':1947,'treaty_signatory':'King','first_elected_president':'Ebin Hartman'},'Q23',date='1946–1947',precision='year_range',op='historical')
    fact('ria','institution',{'name':'Reunion Intelligence Agency','missions':['domestic intelligence','foreign intelligence'],'distinct_from':'Reunion National Guard'},'Q15',op='operational')
    fact('rng','institution',{'name':'Reunion National Guard','legacy_source_designation':'GRI','former_arrangement':'under the same agency as RIA','separation_instrument':'RNIO Act 1992','separation_date':None},'Q15',op='operational')
    fact('reunion','intelligence_name_corrections',{'RNIA':'superseded/confused designation; no additional independent agency inferred','RNIO':'title of reform act; no independent external-intelligence office inferred','RIA':'domestic and foreign intelligence','GRI':'superseded designation for RNG'},'Q15',notes='The user correction takes precedence over inconsistent institutional wording in the signed original. Original law text is not rewritten.')
    fact('rng','personnel',{'value':17000,'precision':'approximate'},'Q15',status='confirmed_estimate',notes='Latest 17,000 RIA/National Guard personnel are reclassified to RNG, not counted as 17,000 intelligence agents. Remains separate from 70,000 broad active-duty source total.')
    fact('unit_17','state',{'status':'operational','formal_approval':False,'controller':'Ezra Hartman','role':'personal black operations','strength_approx':40,'official_oob_membership':'not established'},'Q18',op='operational',notes='Actual clandestine existence and legal authorization are separate.')
    fact('horizon_dynamics','ownership',{'Curro_voting_fraction':0.7,'King_voting_fraction':0.3,'state_voting_fraction':0,'strevo_capital_fraction_of_personal_net_worth':0.7,'strevo_investment_usd':None,'strevo_voting_fraction':'not established by net-worth investment'},'Q14',op='capitalized',notes='State contracts and state backing do not create a state equity stake. Absolute net worth remains unknown.')
    fact('horizon_dynamics','state_contracts',{'purpose':'construct a domestic arms manufacturing industry','contract_aggregate_usd':None},'Q14',op='contracted')
    fact('horizon_dynamics','programs',{'NACP_authorization_usd':6000000000,'authorization_fiscal_years':[1993,1994,1995],'current_spending_or_receipts_usd':None},'Q17',op='authorized',notes='Future multi-year authorization is separate from the company’s estimated valuation, contracts and actual cash receipts.')
    fact('reunion_oil','status',{'type':'heavy oil','activity':['Reunion surveys','Soviet surveys'],'maritime_area':'split between Communist Greek waters and Reunion waters','current_meaningful_state_revenue_usd':0,'current_large_scale_production':False,'future_scenario_bpd':1200000},'Q12',op='surveying',notes='No full drilling/production milestone is inferred from a project name or funding coverage.')
    fact('reunion_oil','binding_entitlements',{'state_fraction':0.8,'private_fraction':0.2,'Exxon_led':0.06,'Shell_led':0.06,'French_led_Total_Elf':0.04,'Younger_led_domestic':0.04,'Royla_total_national_entitlement_approx':0.02},'Q13',op='binding_awards',notes='French-led main allocation adopted; optional ENI alternative is not a second 4% award. Consortium ownership detail remains unknown. Binding awards do not grant title to Greek waters.')
    fact('royla','equity_sale',{'buyer':'Shao Luxian','company_equity_fraction':0.15},'Q13',op='completed',notes='Separate from Royla’s approximately 2% share of national production entitlement.')
    fact('croatian_peace_treaty','legal_status',{'signed_final_text':'the supplied Croatian draft','term_years':12,'signature_date':'1992-09-14','nominal_expiry':'2004-09-14','force_restriction_km':30,'withdrawal_air_naval_notification_km':50,'frontier':'just north of Šibenik','Šibenik':'DMZ','map_or_annex_coordinates':None,'broad_material_breach_clauses':'binding'},'Q19',date='1992-09-14',precision='day',op='in_force',notes='Retains user frontier override over contradictory old north-of-Split language. Enforcement geometry remains unknown until a map is supplied.')
    fact('ploce','corridor_completion',{'date':'1992-10-02','date_assignment':'delegated','relation_to_last_major_fighting':'approximately two days later','last_fighting_exact_date':None},'Q20',date='1992-10-02',precision='assigned_day',authority='delegated_date_assignment',status='delegated_reconciliation',op='completed',notes='Assigned to fit the October 2 morning memorandum and the resolved October 3 baseline. A precise prior combat date is not asserted.')
    fact('ploce','second_bosnian_peacekeeping_force',{'status':'noncanon_meme','actual_second_incursion':False},'Q20',op='noncanon')
    fact('altis','current_disposition',{'Turkish_control':'airport complex','Greek_control':'rest of island, reinforced','naval_posture':'Turkish and Greek navies stand off on opposite sides','UN_observers_and_buffer':True,'ceasefire_date_rule':'one day before current canon date'},'Q21',op='ceasefire_in_effect',notes='Exact ceasefire calendar date awaits the current-date choice.')
    fact('altis_turkish_lead_package','casualty_snapshot',{'initial_strength':160,'effective':71,'KIA':41,'WIA':33,'MIA':15,'POW':'not reported','total_reported_casualties':89,'casualty_percent':55.625,'effective_percent':44.375},'Q22',date='1992-10-11 04:30 local',precision='day_and_local_time',op='reported_losses',notes='POW is unknown/not reported, not an invented zero. Snapshot categories are not added to incompatible prior-phase reports.')
    fact('lucas_younger','revised_history',{'experiments':['nuclear','other highly experimental research'],'consequence':'drove him mad','fate':'disappeared','death_confirmed':False,'successors':'sons, individual names unspecified','inherited_successful_weapons':'not established'},'Q25',op='historical',notes='Does not restore clones, supernatural events or every experimental outcome. No suicide/death date asserted.')
    ann('SELECT p.id FROM passages p JOIN discord_messages m ON p.locator=\'message \'||m.message_id WHERE m.source_id=? AND CAST(m.message_id AS INTEGER)<?',('src_c4bf91a67273cb81',1464093460578570325),'Q25','retconned_legacy','Pre-reset Younger channel is archived outside active continuity. Revised Lucas biography is the explicit exception; individual old claims are not automatically restored.')
    ann('SELECT id FROM passages WHERE source_id=?',('src_d7f8153923bda1f4',),'Q25','legacy_joke_not_active_canon','Old football/supernatural legacy material is not carried into the revised current continuity.')
    ann("SELECT id FROM passages WHERE locator='message 1468368064277119103'",(),'Q20','explicit_noncanon_meme','Second Bosnian peacekeeping force caption is a meme, not a deployment.')
    for sid2 in ['src_8997b231610323b7','src_518d5c52fdba70e4','src_27f0c8dd736bf3fc','src_1f14ebe994a98cfa','src_66e60f91d28ddf41']:
        ann('SELECT id FROM passages WHERE source_id=?',(sid2,),'Q17','accepted_source_with_status_qualifiers','User accepts the text into canon. Forecasts remain forecasts, options remain options, and newest user corrections override inconsistent figures and identities.')
    # Current national framework: the defense reduction is distributed to civilian
    # envelopes once. No cash expenditure is inferred from an allotment.
    categories=[('Defense & readiness',100,82),('Interior / police / security',10,10),('Veterans + health',10,10),('Infrastructure',20,27),('Energy & industry',15,28),('Education / training',18,18),('Agriculture + food',11,11),('Social supports + housing',10,10),('Debt service',10,10),('Intelligence / RIA',18,18),('Admin + justice',10,10),('Contingency reserve',21,19),('Soviet treaty line',2,2)]
    for name,old,new in categories:c.execute('INSERT INTO national_allocations VALUES(?,?,?,?,?,?)',(name,int(old*1e9),int(new*1e9),'budget_allotment_not_cash','user_total_with_delegated_distribution','The 18B movement is an internal reallocation; legal authorization remains unverified.'))
    # Retain Army/Navy/Marine/missile source envelopes. Air Force is the balancing
    # envelope, reducing its 25B source figure by 0.9B to reach the user-fixed 82B.
    branches={'Army':D('25'),'Air Force':D('24.1'),'Navy':D('7.9'),'Marines':D('10'),'Missile/radar':D('15')}
    costs={'Army':D('4.541'),'Air Force':D('3.553')}
    schedules={
      'Army':{'Personnel and personnel support':'10','Equipment purchase commitments':'4.541','Maintenance and spare parts':'3.1','Ammunition and ordnance reserves':'2.7','Training and exercises':'1.8','Fuel and logistics operations':'2','Uncommitted branch reserve':'0.859'},
      'Air Force':{'Personnel and personnel support':'7','Equipment purchase commitments':'3.553','Maintenance and spare parts':'4.2','Ammunition and ordnance reserves':'2.5','Training and exercises':'2','Fuel and flying operations':'2.5','Airfield and base support':'1.5','Defense infrastructure funding top-up':'0.2','Uncommitted branch reserve':'0.647'},
      'Navy':{'Personnel and personnel support':'2.8','Fleet maintenance and spare parts':'2','Munitions and missile reloads':'1.2','Fuel and operations':'1','Training and base support':'0.6','Uncommitted branch reserve':'0.3'},
      'Marines':{'Personnel and personnel support':'3.8','Maintenance and spare parts':'1.8','Munitions and stores':'1.6','Fuel lift and logistics':'1.3','Training and bases':'1','Uncommitted branch reserve':'0.5'},
      'Missile/radar':{'Personnel and technical support':'1.5','SAM and radar capital allocation':'5','Radar hardening and communications':'2.5','Missile ammunition reserves':'2','Maintenance and spare parts':'2','Training and integration':'1','Uncommitted branch reserve':'1'}}
    for branch,lines in schedules.items():
        assert sum(D(x) for x in lines.values())==branches[branch]
        for name,n in lines.items():c.execute('INSERT INTO defense_allocations VALUES(?,?,?,?,?)',(branch,name,int(D(n)*10**9),'planned_allotment_not_actual_spending','delegated_budget_reconciliation'))
    transfers=[('t_spine_navy','Navy','National Infrastructure Spine','2'),('t_spine_air','Air Force','National Infrastructure Spine','0.9'),('t_dalmatia','Navy','Dalmatian Development Program','4.1'),('t_oil_navy','Navy','National Oil Drilling','11'),('t_oil_existing','Contingency reserve','National Oil Drilling','2'),('t_defense_topup','Existing Air Force envelope','Defense Infrastructure','0.2')]
    for ident,frm,to,n in transfers:c.execute('INSERT INTO funding_transfers VALUES(?,?,?,?,?,?,?,?)',(ident,frm,to,int(D(n)*10**9),'allotted_not_cash','not_established','probably_not_informed' if frm in ['Navy','Air Force'] else 'unknown','delegated_reconciliation_Q07_Q10'))
    for old in c.execute("SELECT * FROM candidate_claims WHERE predicate='project_financial_snapshot'").fetchall():
        val=json.loads(old['value_json']);name=val['name']
        policy='Distinct accounting scope. Core-island civil roads/ports/grid excludes separately ledgered rail, Dalmatian, defense and oil packages.' if name=='National Infrastructure Spine' else 'Energy and industrial modernization excludes the separately ledgered oil program.' if name=='Energy & Industrial Expansion' else 'Dedicated ring-fenced program; shared invoices must be allocated to one program only.'
        c.execute('INSERT INTO project_accounts VALUES(?,?,?,?,?,?,?,?)',(name,int(D(str(val['total_cost_usd_b']))*10**9),int(D(str(val['paid_out_usd_b']))*10**9),int(D(str(val['committed_usd_b']))*10**9),0,'ongoing_or_planned_not_completed',policy,'tracker_plus_delegated_scope_reconciliation'))
    fact('capital_programs','total_authorized',{'gross_usd':61600000000,'source_paid_out_usd':24720000000,'committed_usd':36880000000,'unfunded_usd':0,'old_after_fudge_41_6_billion':'superseded funding/cost mix'},'Q10',authority='delegated_reconciliation',status='delegated_reconciliation',op='fully_funded_not_completed',notes='Seven separate accounting envelopes. New program scope avoids double counting; old narrative overlap is preserved in evidence. Paid-out source entries are retained without inventing individual cash transactions.')
    # Procurement quantities/costs come from the actual workbook, not invented
    # replacements. Supply timings are scenario planning assumptions only.
    windows={'M109 howitzer':(6,30),'M270 MLRS':(12,36),'M102 towed howitzer':(3,18),'Cobra':(6,18),'AH-64':(18,36),'Blackhawk':(12,30),'Little Bird':(6,24),'Puma':(6,24),'Chinook':(12,36),'M1A1 Abrams':(12,36),'Leopard, variant unspecified':(6,24),'M2 Bradley':(12,36),'Marder IFV':(6,30),'FV432':(3,24),'LAV-25':(9,30),'Various support vehicles':(3,24),'F-16 newer version':(18,36),'F-16 older version':(6,18),'Falcon 20, source spelling Flacon':(3,12),'E-3 Sentry':(24,48),'C-130':(6,30),'KC-135':(6,24),'Mirage 2000C':(12,36),'Tornado GR.1A':(12,30),'Jaguar':(6,24)}
    for old in c.execute("SELECT * FROM candidate_claims WHERE predicate='procurement_batch'").fetchall():
        val=json.loads(old['value_json']);model=old['entity'];lo,hi=windows[model];bid='batch_'+sha(old['id'].encode())[:16];q=int(val['quantity']);n=val['source_total_cost_usd']
        c.execute('INSERT INTO procurement_batches VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',(bid,old['id'],model,val['branch_budget'],q,n,'confirmed_order','ordered',0,0,0,lo,hi,'relative_to_order_date_unknown','Delivery windows are delegated planning assumptions; seller schedules and acceptance are unconfirmed. E-3 is the complex-system exception extending to 48 months.'))
        # Exact count-conserving waves. Arrival and operational acceptance are separate.
        sizes=([q//3,q//3,q-2*(q//3)] if q>=3 else [1]*q)
        for wave,size in enumerate(sizes,1):
            month=lo+round((hi-lo)*(wave-1)/max(len(sizes)-1,1))
            c.execute('INSERT INTO delivery_plans VALUES(?,?,?,?,?)',(bid,wave,size,month,'planning_only_not_delivered'))
    # Historical nominal restatements are kept separate from current
    # appropriation/cash records. Current explicit amounts cap/replace old estimates.
    factor=D('2900000000000')/D('19000000000')
    restatements=[
        ('first_term_capital','src_7c640f616dbfcd32','word/document.xml:paragraph 4','1.5–2.0B RMC',{'range_rmc':[float(D('1500000000')*factor),float(D('2000000000')*factor)],'range_usd':[float(D('1500000000')*factor/D('5.8')),float(D('2000000000')*factor/D('5.8'))]},'Same share of pre-crisis GDP, using 19B RMC midpoint and later 2.9T RMC baseline.','restated_historical_planning_range'),
        ('nuclear_refit','src_7c640f616dbfcd32','word/document.xml:paragraph 102','600–800M RMC',{'indicative_range_usd':[float(D('600000000')*factor/D('5.8')),float(D('800000000')*factor/D('5.8'))],'new_appropriation':False},'Proportional historical planning comparison only. Current 15B industrial project envelope remains authoritative; no new nuclear spending or fully funded extra project is fabricated.','context_estimate_not_new_authorization'),
        ('reconstruction_seed','src_5fc5790f41651b59','word/document.xml:paragraph 12','250M RMC',{'restated_rmc':float(D('250000000')*factor),'restated_usd':float(D('250000000')*factor/D('5.8'))},'Preserve relative GDP scale of historical seed fund; treat as a legacy funding envelope within later programs, not additive new money.','delegated_historical_restatement'),
        ('rail_residual','src_1717c14edc04b275','word/document.xml:paragraph 13','150M RMC remaining',{'current_program_total_usd':3700000000,'current_paid_usd':1200000000,'current_committed_usd':2500000000,'unfunded_usd':0},'Latest explicit rail ledger supersedes obsolete small-economy residual. Do not multiply an obsolete residual into a second fund.','superseded_by_latest_ledger'),
        ('bern_deliveries','src_30b16741b0b23781','word/document.xml:paragraph 58','$425M equivalent over six years',{'restated_total_in_kind_value_usd':12000000000,'annual_equivalent_usd':2000000000,'years':6,'start':'1992-07','recorded_actual_deliveries':None},'Recalibrate to the existing 2B/year Soviet treaty budget line. Goods deliveries, fiscal allocation and actual expense remain separate; no delivery is inferred.','delegated_historical_restatement'),
        ('us_loan_exception','src_e72b96945587c6d9','word/document.xml:paragraph 22','$90M USD',{'retained_principal_usd':90000000,'percent_of_current_gdp':0.0225},'Explicit user exception: remains a small facility. Obsolete GDP-burden annex is superseded.','nominal_retained_user_exception')]
    for ident,s,loc,old,new,method,status in restatements:c.execute('INSERT INTO money_restatements VALUES(?,?,?,?,?,?,?,?)',(ident,s,loc,old,js(new),method,status,'delegated_Q05_with_latest_caps_and_Q11_exception'))
    # No date proposal is promoted to canon without resolving the ambiguous
    # instruction to move the date up.
    proposals=[('current','Current national snapshot','1992-10-18','After all October 16 parliamentary reporting and the corrected October 6–11 Altis combat.',None),('dissolution','Three-month parliamentary dissolution','1992-10-17','Moves the old October 3 suspension after the October 6/9 bills and October 16 parliamentary activity.','current'),('altis_ceasefire','Altis ceasefire and buffer zone','1992-10-17','Exactly one day before proposed current date, per Q21.','current'),('final_election','Final presidential election round','1992-06-21','Use the originally named June 21 election as the final round; supersede the incompatible July 5 runoff.','government_calendar_confirmation'),('inauguration','Donahue takes office; Rehn appointed','1992-06-23','Allows Rehn’s death two days after appointment and Curro’s succession on confirmed June 25.','final_election')]
    for ident,event,dt,reason,dep in proposals:c.execute('INSERT INTO chronology_proposals VALUES(?,?,?,?,?,?)',(ident,event,dt,'needs_user_date_confirmation',reason,dep))
    # Preserve the old exact snapshot rather than relabelling all 1992 values as later.
    c.execute("UPDATE snapshots SET date_status='Current date proposed as 1992-10-18; not confirmed. Original tracker date retained. No automatic carry-forward.' WHERE id='latest_tracker'")
    c.execute('INSERT INTO review_coverage VALUES(?,?,?,?)',(sid,1,1,'All 27 user answers captured. Source is immutable; interpretations and proposals are separate.'))
    c.execute('INSERT INTO source_notes VALUES(?,?,?)',(sid,'Highest-priority direct user decisions and delegations.','None'))
    c.execute('INSERT INTO revision_runs VALUES(?,?,?,0)',(runid,digest,'2026-10-20T00:49:36-05:00'))
    c.execute("INSERT OR REPLACE INTO metadata VALUES('revision_policy','User answers applied in isolated review database. New calendar proposals and procurement timing assumptions are not confirmed history. The app and original source bytes are unchanged.')")
    c.commit();export(c)
    print(js({'decisions':len(answers),'canon_records':c.execute('SELECT count(*) FROM canon_facts').fetchone()[0],'procurement_batches':c.execute('SELECT count(*) FROM procurement_batches').fetchone()[0],'app_modified':False}))

def export(c):
    for table in ['canon_facts','national_allocations','defense_allocations','funding_transfers','procurement_batches','delivery_plans','project_accounts','money_restatements','chronology_proposals','date_revisions','supersessions','source_annotations']:
        rows=[dict(r) for r in c.execute('SELECT * FROM '+table)]
        (ROOT/(table+'.json')).write_text(json.dumps(rows,indent=2,ensure_ascii=False))
        if rows:
            with (ROOT/(table+'.csv')).open('w',newline='') as f:w=csv.DictWriter(f,fieldnames=rows[0]);w.writeheader();w.writerows(rows)
    questions=[dict(r) for r in c.execute('SELECT id,topic,question,answer,status FROM review_issues ORDER BY id')]
    (ROOT/'decision_register.json').write_text(json.dumps(questions,indent=2,ensure_ascii=False))
    with (ROOT/'decision_register.csv').open('w',newline='') as f:w=csv.DictWriter(f,fieldnames=questions[0]);w.writeheader();w.writerows(questions)
    schema='\n\n'.join(r[0]+';' for r in c.execute("SELECT sql FROM sqlite_master WHERE sql IS NOT NULL AND name NOT LIKE 'search_%' ORDER BY type,name"))
    (ROOT/'schema.sql').write_text(schema)
    inv=[dict(r) for r in c.execute('SELECT id,container,path,kind,sha256,byte_count,priority,extraction_status FROM sources ORDER BY container,path')]
    (ROOT/'source_inventory.json').write_text(json.dumps(inv,indent=2,ensure_ascii=False))
    with (ROOT/'source_inventory.csv').open('w',newline='') as f:w=csv.DictWriter(f,fieldnames=inv[0]);w.writeheader();w.writerows(inv)

if __name__=='__main__':main()
