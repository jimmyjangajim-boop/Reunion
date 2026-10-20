"""Check the revised review without changing its evidence or app databases."""
import hashlib
import json
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def main():
    c = sqlite3.connect(f"file:{ROOT / 'reunion_evidence.sqlite'}?mode=ro", uri=True)
    checks = []

    def ck(label, condition):
        assert condition, label
        checks.append({"check": label, "result": "pass"})

    def scalar(sql, args=()):
        return c.execute(sql, args).fetchone()[0]

    def fact(entity, predicate):
        rows = c.execute('SELECT value_json FROM active_canon WHERE entity=? AND predicate=?', (entity, predicate)).fetchall()
        assert len(rows) == 1, (entity, predicate)
        return json.loads(rows[0][0])

    ck('SQLite integrity', scalar('PRAGMA integrity_check') == 'ok')
    ck('Foreign key integrity', not c.execute('PRAGMA foreign_key_check').fetchall())
    ck('All 88 source blobs retain their hashes', scalar('SELECT count(*) FROM sources') == 88 and all(hashlib.sha256(b).hexdigest() == h for h, b in c.execute('SELECT sha256,bytes FROM source_blobs')))
    ck('Every source references its complete original blob', scalar('SELECT count(*) FROM sources s LEFT JOIN source_blobs b ON b.sha256=s.sha256 WHERE b.sha256 IS NULL OR s.byte_count<>length(b.bytes)') == 0)
    ck('All 46 Discord channels and 1,140 unique messages retained', scalar('SELECT count(*) FROM discord_channels') == 46 and c.execute('SELECT count(*),count(DISTINCT message_id) FROM discord_messages').fetchone() == (1140, 1140))
    ck('Every export message count matches', scalar('SELECT count(*) FROM discord_channels WHERE expected_count IS NULL OR expected_count<>parsed_count') == 0)
    ck('All three workbooks retain 730 cells and 6 comments', all(c.execute('SELECT count(*) FROM workbook_cells WHERE source_id=?', (s,)).fetchone()[0] == 730 and c.execute('SELECT count(*) FROM workbook_comments WHERE source_id=?', (s,)).fetchone()[0] == 6 for s in ['src_bcb9f282108154c9', 'src_cc94adb3d61a0460', 'src_539d8ebf1a7af711']))
    ck('3,930 passages are searchable exactly once', scalar('SELECT count(*) FROM passages') == 3930 and scalar('SELECT count(*) FROM search') == 3930 and scalar('SELECT count(DISTINCT passage_id) FROM search') == 3930)
    ck('All 27 answers have one decision each', c.execute('SELECT count(*),count(DISTINCT issue_id) FROM decision_log').fetchone() == (27, 27) and scalar('SELECT count(*) FROM review_issues WHERE answer IS NULL') == 0)
    ck('Answer file matches immutable user source', (ROOT / 'user_answers.txt').read_bytes() == c.execute("SELECT b.bytes FROM sources s JOIN source_blobs b ON s.sha256=b.sha256 WHERE s.container='conversation' AND s.priority='explicit_user_decision'").fetchone()[0])
    ck('All 40 new facts link to answer evidence', scalar('SELECT count(*) FROM canon_facts') == 40 and scalar('SELECT count(*) FROM canon_facts f WHERE NOT EXISTS(SELECT 1 FROM fact_provenance p WHERE p.fact_id=f.id)') == 0)
    ck('No heir and no canonical Jakob', fact('royal_family', 'heir_status')['heir'] is None and fact('reunion', 'heir_designation') is None and fact('jakob_steiner', 'existence_in_canon') is False)
    henry = fact('henry_steiner', 'roles')
    ck('Henry is cousin and Inferno commander, with no heir designation', henry['relationship_to_king'] == 'cousin' and henry['commander_of'] == 'Inferno Division' and henry['designated_heir'] is False)
    ck('Ezra ancestry remains bounded rather than invented', fact('ezra_hartman', 'ancestry')['allowed_generational_distance'] == [1, 2] and fact('ezra_hartman', 'ancestry')['exact_relationship'] is None)
    ck('RIA and RNG remain distinct', fact('ria', 'institution')['name'] == 'Reunion Intelligence Agency' and fact('rng', 'institution')['name'] == 'Reunion National Guard')
    ck('Unit 17 operational status is separate from formal approval', fact('unit_17', 'state')['status'] == 'operational' and fact('unit_17', 'state')['formal_approval'] is False)
    ck('Rehn and Curro use confirmed June 25', c.execute("SELECT date_text FROM active_canon WHERE (entity='amalia_rehn' AND predicate='death') OR (entity='emilio_curro' AND predicate='finance_minister_succession')").fetchall() == [('1992-06-25',), ('1992-06-25',)])
    losses = fact('altis_turkish_lead_package', 'casualty_snapshot')
    ck('Altis replacement casualty categories reconcile', sum(losses[k] for k in ['KIA', 'WIA', 'MIA']) == 89 and losses['effective'] + 89 == losses['initial_strength'] == 160 and losses['POW'] == 'not reported')
    ck('255B national allocation and 82B defense reconcile', scalar('SELECT sum(reconciled_usd) FROM national_allocations') == fact('reunion', 'spending_headline') == 255_000_000_000 and scalar('SELECT sum(amount_usd) FROM defense_allocations') == fact('reunion', 'defense_budget') == 82_000_000_000)
    ck('Every branch allocation reconciles', dict(c.execute('SELECT branch,sum(amount_usd) FROM defense_allocations GROUP BY branch')) == {'Army': 25_000_000_000, 'Air Force': 24_100_000_000, 'Navy': 7_900_000_000, 'Marines': 10_000_000_000, 'Missile/radar': 15_000_000_000})
    ck('95B deficit remains a projection', fact('reunion', 'spending_headline') - fact('reunion', 'revenue_headline') == fact('reunion', 'deficit_headline')['USD'] == 95_000_000_000 and scalar("SELECT operational_status FROM canon_facts WHERE predicate='deficit_headline'") == 'annual_budget_projection')
    ck('Defense transfers total 18B and contingency 2B', scalar("SELECT sum(amount_usd) FROM funding_transfers WHERE from_envelope IN('Navy','Air Force')") == 18_000_000_000 and scalar("SELECT sum(amount_usd) FROM funding_transfers WHERE from_envelope='Contingency reserve'") == 2_000_000_000)
    ck('Seven projects reconcile funding without claiming physical completion', scalar('SELECT count(*) FROM project_accounts') == 7 and scalar('SELECT count(*) FROM project_accounts WHERE total_authorized_usd<>source_paid_out_usd+source_committed_usd OR unfunded_usd<>0 OR physical_status<>\'ongoing_or_planned_not_completed\'') == 0)
    ck('Project total is 61.6B with 24.72B source-paid and 36.88B committed', c.execute('SELECT sum(total_authorized_usd),sum(source_paid_out_usd),sum(source_committed_usd) FROM project_accounts').fetchone() == (61_600_000_000, 24_720_000_000, 36_880_000_000))
    ck('25 procurement batches retain source quantities and total costs', scalar('SELECT count(*) FROM procurement_batches') == 25 and dict(c.execute('SELECT branch,sum(batch_cost_usd) FROM procurement_batches GROUP BY branch')) == {'Army': 4_541_000_000, 'Air Force': 3_553_000_000})
    ck('No ordered batch is counted as delivered or operational', scalar("SELECT count(*) FROM procurement_batches WHERE operational_status<>'ordered' OR delivered_confirmed<>0 OR accepted_confirmed<>0 OR operational_confirmed<>0") == 0)
    ck('Each delivery plan conserves ordered quantity', scalar('SELECT count(*) FROM procurement_batches b WHERE b.quantity_ordered<>(SELECT sum(d.quantity) FROM delivery_plans d WHERE d.batch_id=b.id)') == 0)
    ck('Delivery waves stay within declared windows and remain planning only', scalar("SELECT count(*) FROM delivery_plans d JOIN procurement_batches b ON b.id=d.batch_id WHERE d.quantity<=0 OR d.months_after_order<b.earliest_month_after_order OR d.months_after_order>b.latest_month_after_order OR d.status<>'planning_only_not_delivered'") == 0)
    ck('Oil survey and future production remain separate', fact('reunion_oil', 'status')['current_large_scale_production'] is False and fact('reunion_oil', 'status')['future_scenario_bpd'] == 1_200_000)
    ownership = fact('horizon_dynamics', 'ownership')
    ck('Horizon ownership and Strevo investment use distinct denominators', ownership['Curro_voting_fraction'] + ownership['King_voting_fraction'] == 1 and ownership['strevo_capital_fraction_of_personal_net_worth'] == 0.7 and ownership['strevo_investment_usd'] is None)
    ck('All five calendar proposals remain unconfirmed', scalar('SELECT count(*) FROM chronology_proposals') == 5 and scalar("SELECT count(*) FROM chronology_proposals WHERE status<>'needs_user_date_confirmation'") == 0 and scalar("SELECT effective_date FROM snapshots WHERE id='latest_tracker'") is None)
    ck('Only one answer application, with app unchanged', c.execute('SELECT count(*),sum(app_modified) FROM revision_runs').fetchone() == (1, 0))

    restored = sqlite3.connect(':memory:')
    c.backup(restored)
    tables = [r[0] for r in c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'search_%'")]
    ck('SQLite backup reproduces all relational contents', all(c.execute(f'SELECT * FROM "{t}" ORDER BY rowid').fetchall() == restored.execute(f'SELECT * FROM "{t}" ORDER BY rowid').fetchall() for t in tables))
    for operation in ['UPDATE decision_log SET reason=reason WHERE id=1', 'DELETE FROM decision_log WHERE id=1']:
        try:
            restored.execute(operation)
        except sqlite3.IntegrityError as e:
            ck('Decision history rejects ' + operation.split()[0], 'append-only' in str(e))
        else:
            raise AssertionError('Decision log permitted a destructive edit')
    restored.close()
    c.close()
    result = {'checks_passed': len(checks), 'result': 'pass', 'checks': checks}
    (ROOT / 'validation_results.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps({'checks_passed': len(checks), 'result': 'pass'}))


if __name__ == '__main__':
    main()
