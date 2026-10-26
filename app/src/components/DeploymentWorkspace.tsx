"use client";
import { useState } from "react";
import { movementAtDate, type Movement } from "../lib/military-view.ts";
import MilitaryTable from "./MilitaryTable";
export default function DeploymentWorkspace({
  date,
  movements,
  onOrder,
  onArrival,
  onUnit,
  openSource,
  unitId,
  embedded = false,
}: {
  date: string;
  movements: Movement[];
  onOrder: () => void;
  onArrival: (m: Movement) => void;
  onUnit: (id: string) => void;
  openSource: (id: string, start?: number, end?: number) => void;
  unitId?: string;
  embedded?: boolean;
}) {
  const [scope, setScope] = useState("dated"),
    [query, setQuery] = useState("");
  const rows = movements.filter(
    (m) =>
      (!unitId || m.unit_id === unitId) &&
      (scope === "all" || movementAtDate(m, date)) &&
      [m.unit, m.location, m.mission]
        .join(" ")
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  return (
    <section className="deployment-workspace">
      <div className="section-heading">
        <h2>
          {embedded ? "Movement orders & deployments" : "Deployment register"}
        </h2>
        <button onClick={onOrder}>+ Movement order</button>
      </div>
      {!embedded && (
        <p className="military-note">
          Named locations are preserved. No verified operational map geometry is
          available; coordinates and markers are not guessed.
        </p>
      )}
      <p>
        Orders, plans and confirmed arrivals are distinct. Elapsed time does not
        complete an order. Cancellation dates are not stored in the existing
        register.
      </p>
      <div className="military-filters">
        <label>
          Search movement records
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Formation, place or mission"
          />
        </label>
        <label>
          Movement dates
          <select
            aria-label="Movement dates"
            value={scope}
            onChange={(e) => setScope(e.target.value)}
          >
            <option value="dated">Through selected date</option>
            <option value="all">All recorded dates</option>
          </select>
        </label>
      </div>
      <MilitaryTable
        headers={[
          "Formation",
          "Destination",
          "Order date",
          "Recorded status",
          "Arrival",
          "Mission / authority",
          "Action",
        ]}
        rows={rows.map((m) => {
          const state =
            scope === "all"
              ? { status: m.operation, arrival: m.completed_date }
              : movementAtDate(m, date)!;
          return [
            <button className="text-button" onClick={() => onUnit(m.unit_id)}>
              {m.unit}
            </button>,
            m.location,
            m.date,
            state.status,
            state.arrival,
            <>
              <p>{m.mission}</p>
              {m.evidence?.length || m.authority?.length ? (
                <details>
                  <summary>Order evidence & approval</summary>
                  {m.evidence?.map((e, i) => (
                    <button
                      key={i}
                      className="text-button"
                      onClick={() =>
                        openSource(e.source_id, e.line_start, e.line_end)
                      }
                    >
                      Source lines {e.line_start}–{e.line_end}
                    </button>
                  ))}
                  {m.authority
                    ?.filter(
                      (a) =>
                        scope === "all" ||
                        a.action !== "complete_movement" ||
                        !!(m.completed_date && m.completed_date <= date),
                    )
                    .map((a, i) => (
                      <p key={i}>
                        {a.action === "complete_movement"
                          ? "Arrival confirmation"
                          : "Recorded order authority"}
                        : {a.explanation}
                      </p>
                    ))}
                </details>
              ) : (
                <small>No linked evidence in this register.</small>
              )}
            </>,
            <>
              {m.warning && <p>{m.warning}</p>}
              {m.override_reason &&
                (scope === "all" ||
                  m.operation !== "completed" ||
                  !!(m.completed_date && m.completed_date <= date)) && (
                  <p>Override: {m.override_reason}</p>
                )}
              {m.operation === "ordered" && m.date <= date && (
                <button className="secondary" onClick={() => onArrival(m)}>
                  Confirm arrival
                </button>
              )}
            </>,
          ];
        })}
      />
      <p className="footnote">
        {scope === "all"
          ? "Full register includes later and undated completion states; it is not an as-of view."
          : `Order and arrival dates are evaluated through ${date}. A completed record with a later arrival is shown as ordered; it cannot be confirmed a second time.`}{" "}
        Original orders and arrival explanations remain in their source/audit
        records.
      </p>
    </section>
  );
}
