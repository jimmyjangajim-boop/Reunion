"use client";
import { useState } from "react";
import MilitaryTable from "./MilitaryTable";
import DeploymentWorkspace from "./DeploymentWorkspace";
import MilitaryUnitProfile from "./MilitaryUnitProfile";
import {
  procurementObservations,
  formationHierarchy,
  personnelLabel,
  activeAssignments,
  type FormationNode,
  type MilitaryUnit,
  type UnitObservation,
  type UnitState,
  type MilitaryAsset,
  type Assignment,
  type Movement,
  type Procurement,
  type MilitaryPhase,
  type MilitaryCasualty,
  type MilitaryBattle,
} from "../lib/military-view.ts";
type Props = {
  date: string;
  units: MilitaryUnit[];
  snapshot: UnitObservation[];
  states: UnitState[];
  assets: MilitaryAsset[];
  assignments: Assignment[];
  procurement: Procurement[];
  movements: Movement[];
  phases: MilitaryPhase[];
  casualties: MilitaryCasualty[];
  battles: MilitaryBattle[];
  selectedUnit: string | null;
  onUnit: (id: string | null) => void;
  onCreate: () => void;
  onUpdate: () => void;
  onOrder: () => void;
  onArrival: (m: Movement) => void;
  onAsset: () => void;
  onAssign: () => void;
  onBattle: () => void;
  openSource: (id: string, start?: number, end?: number) => void;
};
function Formation({
  node,
  nodes,
  search,
  onUnit,
}: {
  node: FormationNode;
  nodes: Map<string, FormationNode>;
  search: boolean;
  onUnit: (id: string) => void;
}) {
  const content = (
    <div className="formation-entry">
      <button
        className="text-button formation-name"
        onClick={() => onUnit(node.unit.id)}
      >
        {node.unit.name}
      </button>
      <span>
        {node.unit.branch} · {node.unit.unit_type}
        {!node.matches ? " · Context ancestor" : ""}
      </span>
      <small>
        {node.state
          ? `Observed ${node.state.observed_on} · personnel ${personnelLabel(node.state.personnel_low, node.state.personnel_high)}`
          : "No dated observation"}
      </small>
      {node.issue && <small className="formation-issue">{node.issue}</small>}
    </div>
  );
  return (
    <li>
      {node.children.length ? (
        <details open={search ? true : undefined}>
          <summary>
            {node.unit.name} · {node.children.length} subordinate record
            {node.children.length === 1 ? "" : "s"}
          </summary>
          {content}
          <ul>
            {node.children.map((id) => (
              <Formation
                key={id}
                node={nodes.get(id)!}
                nodes={nodes}
                search={search}
                onUnit={onUnit}
              />
            ))}
          </ul>
        </details>
      ) : (
        content
      )}
    </li>
  );
}
export default function MilitaryWorkspace(p: Props) {
  const [tab, setTab] = useState("Formations"),
    [query, setQuery] = useState(""),
    [branch, setBranch] = useState("all"),
    [scope, setScope] = useState("dated"),
    [equipmentScope, setEquipmentScope] = useState("dated");
  const tree = formationHierarchy(
    p.units,
    p.snapshot,
    p.date,
    query,
    branch,
    scope === "all",
  );
  const allNodes = formationHierarchy(
    p.units,
    p.snapshot,
    p.date,
    "",
    "all",
    true,
  ).nodes;
  const selected = p.selectedUnit ? allNodes.get(p.selectedUnit) : undefined;
  const visible = [...tree.nodes.values()].filter((n) => n.matches);
  const assignments =
    equipmentScope === "all"
      ? p.assignments
      : activeAssignments(p.assignments, p.date);
  const procurement = procurementObservations(
    p.procurement,
    p.date,
    equipmentScope === "all",
  ).filter((r) => r.name.toLowerCase().includes(query.trim().toLowerCase()));
  const assets = p.assets.filter((a) =>
    a.name.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const source = (id?: string | null) =>
    id ? (
      <button className="text-button" onClick={() => p.openSource(id)}>
        View source
      </button>
    ) : (
      "No linked source"
    );
  return (
    <div className="military-workspace">
      <div className="toolbar">
        <button onClick={p.onCreate}>+ Military unit</button>
        <button className="secondary" onClick={p.onUpdate}>
          Update unit / hierarchy
        </button>
        <button className="secondary" onClick={p.onOrder}>
          Order movement
        </button>
        <button className="secondary" onClick={p.onBattle}>
          Record battle
        </button>
      </div>
      <header className="military-masthead">
        <p className="eyebrow">Armed forces register · {p.date}</p>
        <h2>Organization & service records</h2>
        <p>
          A dated register of formations, equipment, observations and service
          records.
        </p>
      </header>
      <nav className="military-tabs" aria-label="Military registers">
        {["Formations", "Manpower", "Equipment", "Orders & deployments"].map(
          (t) => (
            <button
              className={tab === t ? "" : "secondary"}
              key={t}
              aria-pressed={tab === t}
              onClick={() => {
                setTab(t);
                setQuery("");
              }}
            >
              {t}
            </button>
          ),
        )}
      </nav>
      {["Formations", "Manpower"].includes(tab) && (
        <>
          <div className="military-filters">
            <label>
              Search formations
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Name, branch, commander or garrison"
              />
            </label>
            <label>
              Military branch
              <select
                aria-label="Military branch"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
              >
                <option value="all">All branches</option>
                {[...new Set(p.units.map((u) => u.branch))].sort().map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </label>
            <label>
              Formation register dates
              <select
                aria-label="Formation register dates"
                value={scope}
                onChange={(e) => setScope(e.target.value)}
              >
                <option value="dated">Within recorded formation dates</option>
                <option value="all">All registered identities</option>
              </select>
            </label>
          </div>
          <p>
            {tree.matches} matching formation records. Observations use the
            latest entry on or before {p.date}; they are not a simulated update.
            Unknown formation dates do not prove existence on the selected date.
          </p>
        </>
      )}
      {tab === "Formations" && (
        <section>
          <h3>Order of battle · {p.date}</h3>
          <p className="military-note">
            An unrecorded parent leaves the chain of command unknown. Search
            includes recorded ancestors; source issues are flagged for review.
          </p>
          {tree.roots.length ? (
            <ul className="formation-tree">
              {tree.roots.map((id) => (
                <Formation
                  key={id}
                  node={tree.nodes.get(id)!}
                  nodes={tree.nodes}
                  search={!!query.trim() || branch !== "all"}
                  onUnit={p.onUnit}
                />
              ))}
            </ul>
          ) : (
            <p className="empty">No matching formation records.</p>
          )}
        </section>
      )}
      {tab === "Manpower" && (
        <MilitaryTable
          headers={[
            "Formation",
            "Observed",
            "Personnel range",
            "Authorized",
            "Commander",
            "Garrison",
            "Readiness",
            "Evidence",
          ]}
          rows={visible.map((n) => [
            <button className="text-button" onClick={() => p.onUnit(n.unit.id)}>
              {n.unit.name}
            </button>,
            n.state?.observed_on,
            personnelLabel(n.state?.personnel_low, n.state?.personnel_high),
            n.state?.authorized,
            n.state?.commander,
            n.state?.garrison,
            n.state?.readiness,
            source(n.state?.observation_source_id),
          ])}
        />
      )}
      {tab === "Equipment" && (
        <section>
          <div className="section-heading">
            <h3>Equipment records</h3>
            <div className="inline-controls">
              <button className="secondary" onClick={p.onAsset}>
                + Asset
              </button>
              <button className="secondary" onClick={p.onAssign}>
                Assign asset
              </button>
            </div>
          </div>
          <div className="military-filters">
            <label>
              Search equipment
              <input value={query} onChange={(e) => setQuery(e.target.value)} />
            </label>
            <label>
              Equipment dates
              <select
                aria-label="Equipment dates"
                value={equipmentScope}
                onChange={(e) => setEquipmentScope(e.target.value)}
              >
                <option value="dated">
                  Selected-date observations / assignments
                </option>
                <option value="all">All recorded dates</option>
              </select>
            </label>
          </div>
          <h4>Procurement observations</h4>
          <p>
            Procurement batches are point observations on their recorded dates.
            Ordered, delivered and operational counts stay separate; no
            elapsed-time delivery or unit allocation is inferred.
          </p>
          <MilitaryTable
            headers={[
              "Equipment",
              "Observation",
              "Ordered",
              "Delivered, recorded",
              "Operational, recorded",
              "State / source",
            ]}
            rows={procurement.map((r) => [
              r.name,
              r.date,
              r.ordered,
              r.delivered,
              r.operational,
              <>
                {r.operation} {source(r.source_id)}
              </>,
            ])}
          />
          <h4>Explicit equipment assignments</h4>
          <MilitaryTable
            headers={["Asset", "Formation", "From", "Through"]}
            rows={assignments
              .filter((a) =>
                [a.asset, a.unit]
                  .join(" ")
                  .toLowerCase()
                  .includes(query.trim().toLowerCase()),
              )
              .map((a) => [
                a.asset,
                <button
                  className="text-button"
                  onClick={() => p.onUnit(a.unit_id)}
                >
                  {a.unit}
                </button>,
                a.start_date,
                a.end_date ?? "Open recorded assignment",
              ])}
          />
          <details>
            <summary>Asset identity register · state across all dates</summary>
            <p>
              Asset entry/serviceability dates are not fully modeled. This
              register state is not a historical condition or inventory total
              for {p.date}.
            </p>
            <MilitaryTable
              headers={[
                "Asset",
                "Type",
                "Register state, all dates",
                "Evidence",
              ]}
              rows={assets.map((a) => [
                a.name,
                a.type,
                a.operation,
                source(a.source_id),
              ])}
            />
          </details>
        </section>
      )}
      {tab === "Orders & deployments" && (
        <DeploymentWorkspace
          date={p.date}
          movements={p.movements}
          embedded
          onOrder={p.onOrder}
          onArrival={p.onArrival}
          onUnit={(id) => p.onUnit(id)}
          openSource={p.openSource}
        />
      )}
      <p className="footnote">
        Battle, casualty and loss records remain in the reviewed Battles
        workflow and in explicitly linked unit profiles.
      </p>
      {selected && (
        <MilitaryUnitProfile
          key={p.date}
          date={p.date}
          node={selected}
          units={p.units}
          states={p.states}
          assets={p.assets}
          assignments={p.assignments}
          movements={p.movements}
          phases={p.phases}
          casualties={p.casualties}
          battles={p.battles}
          onClose={() => p.onUnit(null)}
          onUnit={(id) => p.onUnit(id)}
          onOrder={p.onOrder}
          onArrival={p.onArrival}
          onBattle={p.onBattle}
          openSource={p.openSource}
        />
      )}
    </div>
  );
}
