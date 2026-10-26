"use client";
import {
  hemicycle,
  partyColors,
  type Chamber,
  type PartySeats,
} from "../lib/parliament-view.ts";
export default function ParliamentComposition({
  chamber,
  parties,
  valid,
  total,
  selected,
  onParty,
  source,
}: {
  chamber: Chamber;
  parties: PartySeats[];
  valid: boolean;
  total: number;
  selected: string | null;
  onParty: (id: string) => void;
  source: (id?: string) => React.ReactNode;
}) {
  const points = hemicycle(valid ? chamber.actual_seats : 0);
  let start = 0;
  return (
    <section className="parliament-composition">
      <div>
        <h2>{chamber.actual_seats} seats in practice</h2>
        <p>
          Composition observed {chamber.date}. Occupied seats:{" "}
          {chamber.occupied_seats ?? "not separately documented"}.
        </p>
        {valid ? (
          <svg
            className="parliament-seats"
            viewBox="0 0 520 290"
            role="img"
            aria-label={`${chamber.actual_seats} recorded parliamentary seats by party; not a named member roster`}
          >
            <title>Recorded party composition</title>
            {parties.map((p, index) => {
              const assigned = points.slice(start, start + p.seats);
              start += p.seats;
              return (
                <g
                  key={p.id}
                  fill={partyColors[index % partyColors.length]}
                  opacity={!selected || selected === p.id ? 1 : 0.22}
                >
                  {assigned.map((point, i) => (
                    <circle
                      key={i}
                      data-party={p.party}
                      cx={point.x}
                      cy={point.y}
                      r={3.1}
                    />
                  ))}
                </g>
              );
            })}
            <text x={260} y={238} textAnchor="middle">
              {chamber.actual_seats} recorded seats
            </text>
            <text
              className="chart-subtitle"
              x={260}
              y={258}
              textAnchor="middle"
            >
              {chamber.occupied_seats === null
                ? "Party shares · occupancy unknown"
                : "Party shares · recorded allocation"}
            </text>
          </svg>
        ) : (
          <p className="alert">
            The party total ({total}) does not form a valid composition for{" "}
            {chamber.actual_seats} seats. The chart is withheld; source counts
            remain below.
          </p>
        )}
        <p className="footnote">
          Colors and layout distinguish records. They do not establish
          ideological seating or identify individual members.
        </p>
        {source(chamber.source_id)}
      </div>
      <div className="party-legend" aria-label="Party composition">
        {parties.map((p, i) => (
          <button
            className="party-choice secondary"
            key={p.id}
            aria-pressed={selected === p.id}
            onClick={() => onParty(p.id)}
          >
            <span
              className="party-swatch"
              style={{ background: partyColors[i % partyColors.length] }}
            />
            <span>{p.party}</span>
            <strong>
              {p.seats}{" "}
              <small>
                ·{" "}
                {chamber.actual_seats > 0
                  ? ((p.seats / chamber.actual_seats) * 100).toFixed(2)
                  : "?"}
                %
              </small>
            </strong>
          </button>
        ))}
      </div>
    </section>
  );
}
