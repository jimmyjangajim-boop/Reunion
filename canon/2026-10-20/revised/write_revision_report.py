import csv,json,sqlite3
from pathlib import Path
R=Path(__file__).resolve().parent

def main():
 c=sqlite3.connect(R/'reunion_evidence.sqlite');c.row_factory=sqlite3.Row
 national=list(c.execute('SELECT * FROM national_allocations'))
 defense=list(c.execute('SELECT branch,sum(amount_usd) amount FROM defense_allocations GROUP BY branch ORDER BY branch'))
 questions='''# Reunion recorded decisions and remaining date checks

All 27 answers have been recorded. The original evidence is preserved. The app is unchanged. Most questions are settled; the two proposed calendars below need a clear choice before importing a unified dated snapshot.

## 1 Current calendar

Proposed current date: **18 October 1992**.

- **17 October 1992:** Parliament is dissolved for three months. This moves the old October 3 suspension after the October 6 oil law, October 9 Horizon law and October 16 parliamentary reporting.
- **17 October 1992:** Altis ceasefire and UN buffer take effect, one day before the proposed current date.
- Altis combat on October 6–11 belongs to **1992**. The 1993 year was a typo and has been corrected in normalized records.

**Date check:** Use this October 18 current date, with dissolution and the Altis ceasefire on October 17?

## 2 Election calendar

**25 June 1992 is confirmed** as Rehn’s death and Curro’s succession date.

To preserve the cabinet sequence and June 26 legislation, I propose:

- **21 June 1992:** final presidential election round.
- **23 June 1992:** Donahue takes office and appoints Rehn.
- **25 June 1992:** Rehn dies; Curro succeeds her.
- The incompatible **July 5 runoff** becomes superseded date evidence after this calendar is confirmed.

**Date check:** Use that June 21–25 sequence?

## Q27 explained

That question was only about impossible dates in old posts: **November 31, 1945** and **February 29, 1994**. Neither date exists. The original wording is preserved and their exact normalized days remain unknown. They do not block ordinary app use, and no answer is needed now.

## Settled points

- National annual spending: **$255B**. Defense: **$82B**. At the unchanged $160B revenue estimate, the annual budget deficit is **$95B**. That is a projection, not an automatically booked increase in debt.
- The 1.35M population is pre-civil-war history. The later baseline remains roughly 19–21M; no exact current city populations were invented.
- RIA handles domestic and foreign intelligence. RNG is the distinct National Guard. RNIO remains the reform Act’s title; the mixed RNIA/RNIO agency definitions are superseded.
- Ezra Hartman leads the armed forces and NSF. His descent from Ebin is confirmed, with son versus grandson still an explicit unknown. Ebin is the first elected president after the 1947 settlement.
- King Zo III remains king. Henry Steiner is his cousin and commands Inferno. Jakob is retconned out. **There is no designated heir.**
- Unit 17 is operational, personally controlled by Ezra, and has no formal state approval.
- Horizon’s voting ownership is Curro 70% / King 30%. Strevo invested 70% of his own net worth. State contracts do not make the state an equity owner.
- Oil is heavy oil under survey by Reunion and the Soviets. The 1.2M bpd figure is a future production scenario. The awards are binding; no production or revenue is invented.
- The Croatian draft is the signed treaty. The Šibenik frontier/DMZ correction still governs. Missing boundary maps remain missing.
- Ploče’s corridor completion is assigned **October 2, 1992**, fitting the urgent October 2 memorandum and resolved October 3 baseline. Its exact preceding combat date remains unverified. The second Bosnian peacekeeping force was a meme.
- Corrected Turkish Altis report: **160 initial; 71 effective; 41 KIA; 33 WIA; 15 MIA**. That is **55.625% casualties** and **44.375% effective**. POW is unreported.
- Pre-reset Younger jokes remain outside active canon. Lucas’s revised history retains experimental/nuclear research, madness, disappearance and succession by his sons. No invented death or successful supernatural technology is inherited.

See `Reunion_Reconciliation_Report.md` for the budget distribution, rescaled legacy amounts and delivery assumptions. `decision_register.csv` preserves every answer and its handling status.
'''
 (R/'Reunion_Canon_Questions.md').write_text(questions)
 report=['# Reunion reconciliation report','','The user’s 27 answers have been recorded in an isolated copy of the evidence database. Direct canon decisions, delegated financial reconciliation and unconfirmed calendar proposals are separate. The app, original source bytes and original workbook have not been changed.','','## Current annual budget','','Amounts below are USD billions. These are budget allotments, not assertions of actual cash expenditure.','','| Category | Before reconciliation | Reconciled |','|---|---:|---:|']
 for row in national:report.append(f"| {row['category']} | {row['previous_usd']/1e9:g} | {row['reconciled_usd']/1e9:g} |")
 report.extend(['| **Total** | **255** | **255** |','','Spending remains $255B and defense is $82B. Infrastructure gains $7B for the $2.9B Spine top-up and $4.1B Dalmatian top-up. Energy gains $13B for oil: $11B comes from defense and $2B from contingency. Contingency falls from $21B to $19B. The $18B defense transfer is therefore counted exactly once. The extra $0.2B defense-infrastructure top-up stays inside the Air Force envelope.','','The original notes described $20B as coming entirely from defense. That would leave $80B, conflicting with the user’s newer $82B decision. The reconciliation uses $18B from defense plus $2B from contingency. It preserves the $7.9B Navy figure and adjusts the Air Force envelope to $24.1B. These component choices are delegated model decisions, not newly discovered receipts or supplier invoices.','','The user’s account suggests Donahue was not informed. Presidential knowledge is marked “probably not informed”; the legal approval process is unknown. No presidential signature or parliamentary appropriation vote was fabricated.','','## Defense envelopes','','| Branch | USD billions |','|---|---:|'])
 for row in defense:report.append(f"| {row['branch']} | {row['amount']/1e9:g} |")
 report.extend(['| **Total** | **82** |','','The 16 Army equipment batches total **$4.541B**; the nine Air Force batches total **$3.553B**. The source quantities and batch prices are retained. The old unsupported “$23B spent” and residual figures are replaced by a reconciled planning breakdown. The Army’s $10B personnel line and Air Force’s $7B personnel line are retained. Remaining envelopes explicitly cover maintenance, spares, ammunition, training, fuel, base support and uncommitted reserves. Those allocations are estimates, not invented actual spending. `defense_allocations.csv` gives every line.','','At $160B revenue and $400B GDP, the projected annual deficit is **$95B**, or **23.75% of GDP**. Defense is **20.5% of GDP**. The $120B reported debt stock is unchanged. The app must not add a whole year’s projected deficit or an undrawn loan to today’s debt automatically.','','## Projects and cash distinctions','','The seven project authorizations total **$61.6B**, with **$24.72B** reported paid out and **$36.88B** committed. Their funding gaps are zero. The source’s $41.6B “after fudge” figure is retired because it mixed funding sources with cost. Full funding does not mean physical completion. The source paid-out entries are retained; no invoice-level cash history was created.','','For bookkeeping, the core-island Spine covers civil roads, ports and grid. The dedicated rail, Dalmatian, defense and oil packages are separately ledgered. Energy/industrial modernization excludes the separate oil package. These are explicit delegated accounting scopes. Earlier overlapping narrative descriptions remain in the evidence. Shared invoices must be assigned once; an eventual app must link one underlying asset/invoice across programs rather than charge it twice.','','The rail ETA formula error and the dashboard range omitting oil are documented. The original workbook remains unchanged. ETAs are forecasts and will be recalculated from a confirmed date; none causes automatic completion.','','## Economic scale correction','','The old 18–20B RMC GDP is retconned. For scale comparisons, the midpoint of 19B RMC is compared with the later pre-crisis 2.9T RMC baseline, a factor of about **152.632**. Explicit current programme totals override an obsolete estimate whenever they conflict. Equipment batch prices are retained as physical purchase prices.','','Delegated restatements:','','- The old 250M RMC reconstruction seed becomes approximately **38.16B RMC / $6.58B**, as a historical funding envelope inside later programs. It is not new money added to the current budget.','- The old first-term 1.5–2.0B RMC capital estimate corresponds to approximately **$39.47–52.63B** at the later scale. This is a historical comparison; it does not replace the seven later authorizations.','- The old 600–800M RMC nuclear-refit forecast corresponds to approximately **$15.79–21.05B**. This remains an indicative planning comparison. It creates no new appropriation or assertion that an additional nuclear programme is fully funded. Its scope/timing must be costed inside or after the existing industrial programme.','- The obsolete 150M RMC rail residual is replaced by the later $3.7B programme ledger: $1.2B paid and $2.5B committed. It is not multiplied into an extra fund.','- Bern’s old $425M in-kind total is restated to **$12B over six years**, aligned with the existing **$2B yearly Soviet treaty line**. This is a delegated scale adjustment; actual commodity deliveries remain unknown.','- The US loan stays **$90M**, per the user’s instruction that it is small. Its old GDP-burden annex is superseded. Its face value is **0.0225%** of current GDP. Actual tranche receipts and inclusion in the reported debt stock remain unknown.','','Other old amounts remain available in original sources. They must not become new current liabilities merely by being multiplied. Contextual restatements, current appropriations, procurement prices and actual payments are distinct data types.','','## Procurement and delivery','','All 25 modernization batches remain ordered. There are no confirmed deliveries or operational acceptances in these batches. Existing operational equipment from the earlier OOB remains a separate inventory.','','Most delivery estimates span **3–36 months after order**, depending on the batch. The two E-3s use a **24–48 month** planning window because they are complex integration purchases. These are user-authorized planning assumptions, not supplier-confirmed dates or historical delivery records. The actual order date is unknown; relative windows avoid manufacturing one.','','| Batch | Ordered | Batch cost USD millions | Planning window after order |','|---|---:|---:|---|'])
 for row in c.execute('SELECT * FROM procurement_batches ORDER BY branch,model'):report.append(f"| {row['model']} | {row['quantity_ordered']} | {row['batch_cost_usd']/1e6:g} | {row['earliest_month_after_order']}–{row['latest_month_after_order']} months |")
 report.extend(['','`delivery_plans.csv` splits each quantity into count-conserving waves. Every wave is planning-only. Delivery, acceptance, crew training and operational readiness remain separate steps. A calendar passing an ETA does not complete a delivery.','','## Institutional and historical decisions','','RIA is the domestic and foreign intelligence agency. RNG is the National Guard, formerly mixed into the same institutional structure and previously called GRI in confused drafts. RNIO is the reform Act’s historical title. No additional RNIA or separate external RNIO office is inferred. The source’s roughly 17,000 National Guard personnel belong to RNG, not a 17,000-person intelligence service.','','Ezra Hartman leads both NSF and the armed forces. His relationship to Ebin remains son-or-grandson. Ebin is the first elected president following the 1947 settlement; McPeak’s unsuccessful interim attempts are not converted into a completed presidential term.','','Henry Steiner is King Zo III’s cousin and Inferno commander. There is no heir. Jakob has been retconned out, and the previous duplicated heir designation is superseded. None of this removes the original evidence.','','Horizon voting ownership is Curro 70% and King 30%. Strevo’s investment is 70% of his own net worth, with the absolute amount unknown. State contracts are not a government equity stake. The $6B aerospace authorization across FY1993–95 is separate from the company’s estimated valuation and actual cash receipts.','','All four petroleum awards are binding: Exxon-led 6%, Shell-led 6%, French-led 4%, Younger-led domestic 4%, alongside the state’s 80%. Royla’s approximately 2% national entitlement is distinct from Shao Luxian’s 15% equity in Royla. The conditional Italian alternative is not a second award. Cross-border development obligations remain relevant. Current surveys do not constitute production.','','Unit 17 is operational under Ezra personally, without formal state approval. Its approximately 40-person source estimate is not added again to the regular armed-forces total.','','The Croatian draft is the signed treaty, including its broad restrictions and breach provisions. The north-of-Šibenik frontier and Šibenik DMZ override still govern. No boundary coordinates or annex maps were invented.','','## Calendar proposals','','Altis’s year is corrected to 1992. Its replacement Turkish report as of October 11 contains 71 effective personnel and 89 casualties from 160, categorized as 41 KIA, 33 WIA and 15 MIA. There is no reported POW figure.','','Ploče’s corridor completion has been assigned October 2 under the user’s delegation. The exact prior combat date remains unknown; no new battle is asserted on September 30. The second Bosnian peacekeeping force is noncanon.','','Two calendars await confirmation: October 18 current state with October 17 dissolution/Altis ceasefire; and June 21 election/June 23 inauguration followed by the confirmed June 25 Rehn-to-Curro succession. Original dates remain intact until those choices are made.','','Invalid November 31, 1945 and February 29, 1994 source dates retain unknown normalized exact days. Missing maps and relevant Discord attachments remain source gaps. Neither requires invented details.','','## All answers recorded','','| Question | Topic | Handling |','|---|---|---|'])
 for q in c.execute('SELECT id,topic,status FROM review_issues ORDER BY id'):report.append(f"| {q['id']} | {q['topic']} | {q['status'].replace('_',' ')} |")
 (R/'Reunion_Reconciliation_Report.md').write_text('\n'.join(report)+'\n')
 (R/'Altis_Corrected_Report.md').write_text('''# Altis Turkish lead package replacement casualty report

As of **04:30 local, 11 October 1992**. Replacement of the inconsistent headline in the supplied report, under the user’s Q22 decision. Other belligerents and phases are not merged into this return.

| Formation | Initial | Effective | KIA | WIA | MIA |
|---|---:|---:|---:|---:|---:|
| Company HQ | 10 | 4 | 2 | 4 | 0 |
| Alpha | 50 | 20 | 16 | 14 | 0 |
| Bravo | 45 | 12 | 17 | 1 | 15 |
| Charlie | 55 | 35 | 6 | 14 | 0 |
| **Total** | **160** | **71** | **41** | **33** | **15** |

Total reported casualties: **89**, or **55.625%** of initial strength. Effective strength is **44.375%**. POW is not reported. Zero MIA in the other subunit rows follows the exhaustive corrected total and existing subunit arithmetic; it is not a separate missing-person investigation result.

The original report and its 61-effective/44%-casualty headline remain preserved as superseded evidence.
''')
 (R/'README.md').write_text('''# Reunion revised canon review

All 27 user answers are recorded. This package is separate from the app. Original source bytes and the original tracker remain unchanged.

Start with `Reunion_Canon_Questions.md`: only two calendar choices need confirmation. `Reunion_Reconciliation_Report.md` explains the recorded decisions, the balanced $255B/$82B financial framework, 25 ordered procurement batches and delegated estimates.

`reunion_evidence.sqlite` contains the original evidence database plus the user’s answer source, append-only decision history, new canon records, supersession links, source annotations, restated amounts and planning tables. `candidate_claims` remains the earlier staging area. Use `canon_facts` and `active_canon` for new decisions, and the financial/program tables for reconciled calculations. No calendar proposal is silently promoted to history.

`user_answers.txt` preserves the supplied answers. `Original_Questions.md` preserves the old questionnaire. `decision_register.csv` records all 27 answers and statuses. The JSON and CSV files export each new table. `Altis_Corrected_Report.md` replaces the Turkish casualty headline while preserving original evidence.

`national_allocations` is an annual allotment framework. `defense_allocations` contains delegated spending estimates. `funding_transfers` contains reallocations, not additional revenue or cash expenditure. `project_accounts` retains multi-year authorizations and source-paid/source-committed balances. `procurement_batches` and `delivery_plans` never imply completion from elapsed time. `money_restatements` separates historical rescaling from current authorizations and actual payments.

No app file, app database, hosted record or published site was modified. Exact order dates, several actual receipts and map coordinates remain unknown. The two calendar proposals, relative delivery windows and estimated cost allocations are labeled accordingly.

Run `python3 validate_revision.py` for database, source-preservation, canon-override, accounting, schedule and backup checks. Python 3 standard library is sufficient. `reconcile_answers.py` is idempotent for this answer set and does not duplicate decisions on rerun. It reads only this review package. Do not run the old initial-ingestion/enrichment scripts over this revised database; those represent the pre-adjudication workflow.
''')
 c.close()

if __name__=='__main__':main()
