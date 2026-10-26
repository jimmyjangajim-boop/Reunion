"use client";
import { useEffect, useRef, useState } from "react";
import MilitaryTable from "./MilitaryTable";
import DeploymentWorkspace from "./DeploymentWorkspace";
import {
  personnelLabel,
  activeAssignments,
  unitBattleRecords,
  type FormationNode,
  type MilitaryUnit,
  type UnitState,
  type MilitaryAsset,
  type Assignment,
  type Movement,
  type MilitaryPhase,
  type MilitaryCasualty,
  type MilitaryBattle,
} from "../lib/military-view.ts";
type Props = {
  date: string;
  node: FormationNode;
  units: MilitaryUnit[];
  states: UnitState[];
  assets: MilitaryAsset[];
  assignments: Assignment[];
  movements: Movement[];
  phases: MilitaryPhase[];
  casualties: MilitaryCasualty[];
  battles: MilitaryBattle[];
  onClose: () => void;
  onUnit: (id: string) => void;
  onOrder: () => void;
  onArrival: (m: Movement) => void;
  onBattle: () => void;
  openSource: (id: string, start?: number, end?: number) => void;
};
const dateLabel = (s: string) => {
  try {
    return JSON.parse(s).label;
  } catch {
    return "Date unknown";
  }
};
export default function MilitaryUnitProfile(p: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [tab, setTab] = useState("Overview"),
    [all, setAll] = useState(false);
  useEffect(() => {
    dialog.current?.showModal();
    return () => dialog.current?.close();
  }, []);
  const u = p.node.unit,
    s = p.node.state;
  const source = (id?: string | null, start?: number, end?: number) =>
    id ? (
      <button
        className="text-button"
        onClick={() => {
          p.onClose();
          p.openSource(id, start, end);
        }}
      >
        View source{start ? ` · lines ${start}–${end}` : ""}
      </button>
    ) : (
      "No linked source"
    );
  const history = p.states.filter(
    (r) => r.unit_id === u.id && (all || r.date <= p.date),
  );
  const equipment = activeAssignments(p.assignments, p.date).filter(
    (a) => a.unit_id === u.id,
  );
  const records = unitBattleRecords(
    u.id,
    p.phases,
    p.casualties,
    p.battles,
    p.date,
    all,
  );
  return (
    <dialog
      ref={dialog}
      className="office-profile military-unit-profile"
      aria-labelledby="military-unit-title"
      onCancel={p.onClose}
      onClose={p.onClose}
    >
      <header className="profile-heading">
        <div>
          <p className="eyebrow">
            {u.branch} · {u.unit_type}
          </p>
          <h2 id="military-unit-title">{u.name}</h2>
          <p>Selected date {p.date}</p>
        </div>
        <button className="secondary" autoFocus onClick={p.onClose}>
          Close unit profile
        </button>
      </header>
      <div className="profile-body">
        <nav className="military-tabs" aria-label="Unit detail views">
          {[
            "Overview",
            "Observations",
            "Equipment",
            "Orders & deployments",
            "Battle records",
          ].map((t) => (
            <button
              className={tab === t ? "" : "secondary"}
              key={t}
              aria-pressed={tab === t}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </nav>
        {p.node.issue && (
          <p className="military-note">
            {p.node.issue}. Source records remain available; no hierarchy or
            operational status is inferred.
          </p>
        )}
        {tab === "Overview" && (
          <>
            <dl className="profile-facts">
              {[
                ["Observation", s?.observed_on ?? "No dated observation"],
                [
                  "Recorded personnel",
                  personnelLabel(s?.personnel_low, s?.personnel_high),
                ],
                ["Authorized strength", s?.authorized ?? "Unknown"],
                ["Commander", s?.commander ?? "Unknown"],
                ["Garrison", s?.garrison ?? "Unknown"],
                ["Readiness", s?.readiness ?? "Unknown"],
                ["Recorded state", s?.operation ?? "Unknown"],
                ["Mission", s?.mission ?? "Unknown"],
                ["Supply", s?.supply ?? "Unknown"],
                ["Formation date", u.formed_date ?? "Unknown"],
                ["Disbandment date", u.disbanded_date ?? "Unknown"],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            <p>
              These are recorded observations, not a calculated present
              strength. No national manpower total, automatic casualty deduction
              or readiness score is inferred.
            </p>
            <p>
              Recorded parent:{" "}
              {s?.parent_id ? (
                <button
                  className="text-button"
                  disabled={!p.units.some((r) => r.id === s.parent_id)}
                  onClick={() => p.onUnit(s.parent_id!)}
                >
                  {p.units.find((r) => r.id === s.parent_id)?.name ??
                    "Parent identity not available"}
                </button>
              ) : (
                "No parent established; independence is not inferred"
              )}
              .
            </p>
            <p>Identity evidence: {source(u.source_id)}</p>
            <p>Observation evidence: {source(s?.observation_source_id)}</p>
          </>
        )}
        {tab === "Observations" && (
          <>
            <label className="military-scope">
              Observation dates
              <select
                aria-label="Observation dates"
                value={all ? "all" : "dated"}
                onChange={(e) => setAll(e.target.value === "all")}
              >
                <option value="dated">Through selected date</option>
                <option value="all">All recorded dates</option>
              </select>
            </label>
            <MilitaryTable
              headers={[
                "Observed",
                "Parent",
                "Personnel",
                "Authorized",
                "Commander",
                "Readiness / state",
                "Evidence",
              ]}
              rows={history.map((r) => [
                r.date,
                r.parent_id
                  ? (p.units.find((u) => u.id === r.parent_id)?.name ??
                    "Missing parent")
                  : "No parent established",
                personnelLabel(r.personnel_low, r.personnel_high),
                r.authorized,
                r.commander,
                `${r.readiness ?? "Readiness unknown"} / ${r.operation}`,
                source(r.source_id),
              ])}
            />
            <p>
              Observations have their own dates. Full history may include later
              records; it is not the selected-date roster.
            </p>
          </>
        )}
        {tab === "Equipment" && (
          <>
            <h3>Recorded equipment assignments</h3>
            <p>
              Assignment intervals apply to {p.date}. They do not establish
              historical serviceability. The current asset-register state is
              kept outside this dated table.
            </p>
            <MilitaryTable
              headers={[
                "Asset",
                "Type",
                "Assigned from",
                "Through",
                "Evidence",
              ]}
              rows={equipment.map((a) => {
                const asset = p.assets.find((s) => s.id === a.asset_id);
                return [
                  a.asset,
                  asset?.type,
                  a.start_date,
                  a.end_date ?? "Open recorded assignment",
                  source(asset?.source_id),
                ];
              })}
            />
            <p>
              Only explicitly tracked assignments appear here. Procurement
              batches are not silently distributed to formations.
            </p>
          </>
        )}
        {tab === "Orders & deployments" && (
          <DeploymentWorkspace
            date={p.date}
            movements={p.movements}
            unitId={u.id}
            embedded
            onUnit={p.onUnit}
            onOrder={() => {
              p.onClose();
              p.onOrder();
            }}
            onArrival={(m) => {
              p.onClose();
              p.onArrival(m);
            }}
            openSource={(id, start, end) => {
              p.onClose();
              p.openSource(id, start, end);
            }}
          />
        )}
        {tab === "Battle records" && (
          <>
            <div className="section-heading">
              <h3>Linked after-action history</h3>
              <button
                className="secondary"
                onClick={() => {
                  p.onClose();
                  p.onBattle();
                }}
              >
                Open Battles & reports
              </button>
            </div>
            <label className="military-scope">
              Battle record dates
              <select
                aria-label="Battle record dates"
                value={all ? "all" : "dated"}
                onChange={(e) => setAll(e.target.value === "all")}
              >
                <option value="dated">Through selected date</option>
                <option value="all">All recorded dates</option>
              </select>
            </label>
            <p>
              Only explicitly linked formations and participant records appear.
              Categories and combat phases stay separate; reported losses are
              not automatically subtracted from strength.
            </p>
            {records.phases.length ? (
              records.phases.map((r) => (
                <section className="military-phase" key={r.id}>
                  <h4>
                    {r.battle} · {r.reference}
                  </h4>
                  <p>
                    {dateLabel(r.date_json)} · {r.outcome ?? "Outcome unknown"}{" "}
                    · battle canon:{" "}
                    {p.battles.find((b) => b.id === r.battle_id)?.canon ??
                      "Unknown"}
                  </p>
                  <MilitaryTable
                    headers={["Report group", "Category", "Count", "Canon"]}
                    rows={r.casualties.map((c) => [
                      c.report_group,
                      c.category,
                      c.count ?? "Unknown",
                      c.canon,
                    ])}
                  />
                  <MilitaryTable
                    headers={["Reported equipment", "Count", "State"]}
                    rows={r.losses.map((l) => [
                      l.equipment,
                      l.count ?? "Unknown",
                      l.state,
                    ])}
                  />
                  {r.evidence.map((e, i) => (
                    <span key={i}>
                      {source(e.source_id, e.line_start, e.line_end)}
                    </span>
                  ))}
                </section>
              ))
            ) : (
              <p className="empty">
                No linked after-action phases in this view.
              </p>
            )}
            <h4>Other sourced casualty records</h4>
            <MilitaryTable
              headers={[
                "Battle",
                "Report group",
                "Category",
                "Count",
                "Canon / evidence",
              ]}
              rows={records.legacy.map((c) => [
                p.battles.find((b) => b.id === c.battle_id)?.name,
                c.report_group,
                c.category,
                c.count ?? "Unknown",
                <>
                  {c.canon} {source(c.source_id)}
                </>,
              ])}
            />
            {!all && records.uncertain > 0 && (
              <p>
                {records.uncertain} linked phase records lie outside this dated
                view, including later or unresolved dates. Inspect All recorded
                dates for their evidence.
              </p>
            )}
          </>
        )}
      </div>
    </dialog>
  );
}
