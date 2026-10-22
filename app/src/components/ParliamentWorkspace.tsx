"use client";
import { useState, type ReactNode } from "react";
import ParliamentComposition from "./ParliamentComposition";
import {
  parliamentView,
  billAtDate,
  parliamentaryEvents,
  type Chamber,
  type PartySeats,
  type Bill,
  type BillEvent,
  type Vote,
  type ParliamentEvent,
} from "../lib/parliament-view.ts";
type Props = {
  date: string;
  chambers: Chamber[];
  parties: PartySeats[];
  bills: Bill[];
  events: BillEvent[];
  votes: Vote[];
  timeline: ParliamentEvent[];
  onBill: () => void;
  onVote: () => void;
  onDate: (date: string) => void;
  openSource: (id: string, start?: number, end?: number) => void;
};
function Registry({
  headers,
  rows,
}: {
  headers: string[];
  rows: ReactNode[][];
}) {
  return rows.length ? (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((v, j) => (
                <td key={j}>{v ?? "Not recorded"}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <p className="empty">No matching records in this view.</p>
  );
}
export default function ParliamentWorkspace(p: Props) {
  const [partyId, setParty] = useState<string | null>(null),
    [tab, setTab] = useState("Legislation"),
    [scope, setScope] = useState("dated"),
    [query, setQuery] = useState(""),
    [billId, setBill] = useState<string | null>(null);
  const v = parliamentView(p.date, p.chambers, p.parties),
    party = v.parties.find((x) => x.id === partyId);
  const source = (id?: string, start?: number, end?: number) =>
    id ? (
      <button
        className="text-button"
        onClick={() => p.openSource(id, start, end)}
      >
        View source{start ? ` · lines ${start}–${end}` : ""}
      </button>
    ) : (
      "No linked source"
    );
  const search = (values: (string | null | undefined)[]) =>
    values
      .join(" ")
      .toLocaleLowerCase()
      .includes(query.toLocaleLowerCase().trim());
  const bills = p.bills.filter(
    (b) =>
      (scope === "all" || billAtDate(b, p.events, p.date).visible) &&
      search([b.identifier, b.title, b.sponsor, b.summary]),
  );
  const votes = p.votes.filter(
    (r) =>
      (scope === "all" || r.date <= p.date) &&
      search([
        r.date,
        r.result,
        p.bills.find((b) => b.id === r.bill_id)?.identifier,
      ]),
  );
  const events = p.events.filter(
    (e) =>
      (scope === "all" || !!(e.date && e.date <= p.date)) &&
      search([e.identifier, e.stage, e.date]),
  );
  const bill = p.bills.find(
    (b) =>
      b.id === billId &&
      (scope === "all" || billAtDate(b, p.events, p.date).visible),
  );
  const chronology = parliamentaryEvents(p.timeline, p.date);
  return (
    <div className="parliament-workspace">
      <div className="section-heading">
        <h2>Assembly record</h2>
        <div className="inline-controls">
          <button onClick={p.onBill}>+ Bill</button>
          <button className="secondary" onClick={p.onVote}>
            Record vote
          </button>
        </div>
      </div>
      <header className="parliament-masthead">
        <p className="eyebrow">Assembly of the Republic · {p.date}</p>
        <h2>The parliamentary record</h2>
        <p>
          {v.chamber
            ? v.chamber.session_status
            : v.ambiguous
              ? "Several composition observations conflict on this date; review the sources."
              : "No composition or session status is established for this date."}
        </p>
      </header>
      {v.chamber ? (
        <>
          <p className="parliament-constitutional">
            <strong>
              Constitutional maximum {v.chamber.legal_max ?? "not established"}
            </strong>
            . The recorded practice of {v.chamber.actual_seats} seats is
            preserved separately from the legal limit. No amending authority or
            reconciliation is inferred.
          </p>
          <ParliamentComposition
            chamber={v.chamber}
            parties={v.parties}
            valid={v.valid}
            total={v.total}
            selected={party?.id ?? null}
            onParty={setParty}
            source={source}
          />
          {party && (
            <section
              className="party-profile"
              aria-label={`${party.party} profile`}
            >
              <div className="section-heading">
                <h3>{party.party}</h3>
                <button className="secondary" onClick={() => setParty(null)}>
                  Clear party selection
                </button>
              </div>
              <p>
                {party.seats} recorded seats · observed {v.chamber.date}.{" "}
                {party.support}.
              </p>
              <p>
                Individual mandates, party leadership and membership lists are
                not established by this seat count.
              </p>
              {source(party.source_id)}
            </section>
          )}
        </>
      ) : (
        <p className="empty">
          Choose a recorded observation below to inspect its composition. A
          dated snapshot does not carry forward, and the end of a suspension
          period does not prove Parliament reopened.
        </p>
      )}
      <details className="parliament-observations">
        <summary>Recorded composition observations · all dates</summary>
        <Registry
          headers={[
            "Observation",
            "Seats in practice",
            "Occupied",
            "Constitutional maximum",
            "Status / source",
          ]}
          rows={p.chambers.map((c) => [
            <button className="text-button" onClick={() => p.onDate(c.date)}>
              Inspect {c.date}
            </button>,
            c.actual_seats,
            c.occupied_seats ?? "Not separately documented",
            c.legal_max,
            <>
              {c.session_status}
              <br />
              {source(c.source_id)}
            </>,
          ])}
        />
      </details>
      <nav className="parliament-tabs" aria-label="Parliament registers">
        {["Legislation", "Votes", "Historical events", "Members"].map((t) => (
          <button
            key={t}
            className={tab === t ? "" : "secondary"}
            aria-pressed={tab === t}
            onClick={() => {
              setTab(t);
              setQuery("");
              setBill(null);
            }}
          >
            {t}
          </button>
        ))}
      </nav>
      {["Legislation", "Votes"].includes(tab) && (
        <div className="parliament-filters">
          <label>
            Search {tab.toLowerCase()}
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                tab === "Legislation"
                  ? "Identifier, title, sponsor or summary"
                  : "Bill, result or date"
              }
            />
          </label>
          <label>
            Registry dates
            <select
              aria-label="Parliament registry dates"
              value={scope}
              onChange={(e) => setScope(e.target.value)}
            >
              <option value="dated">Through selected date</option>
              <option value="all">All recorded dates</option>
            </select>
          </label>
        </div>
      )}
      {tab === "Legislation" && (
        <section>
          <h3>Legislation</h3>
          <p>
            {scope === "dated"
              ? `Introduction and sourced stages reported through ${p.date}. Future and undated stages cannot establish this view.`
              : "Complete register across dates. The furthest reported stage may be future or undated relative to the historical selector."}
          </p>
          <Registry
            headers={[
              "Identifier / profile",
              "Bill",
              "Sponsor",
              "Stage",
              "Introduction",
              "Effective date reported",
              "Evidence",
            ]}
            rows={bills.map((b) => {
              const dated = billAtDate(b, p.events, p.date);
              return [
                <button className="text-button" onClick={() => setBill(b.id)}>
                  {b.identifier}
                </button>,
                b.title || "Title not reported",
                b.sponsor,
                scope === "all" ? b.stage : dated.stage,
                b.introduced_date,
                scope === "all" ? b.effective_date : dated.effective,
                source(b.source_id),
              ];
            })}
          />
          {bill && (
            <section
              className="bill-profile"
              aria-label={`${bill.identifier} bill profile`}
            >
              <div className="section-heading">
                <h3>
                  {bill.identifier} · {bill.title || "Title not reported"}
                </h3>
                <button className="secondary" onClick={() => setBill(null)}>
                  Close bill details
                </button>
              </div>
              <p>{bill.summary || "Summary not recorded"}</p>
              <p>
                Sponsor: {bill.sponsor ?? "Not recorded"}. A linked sponsor does
                not establish a parliamentary mandate.
              </p>
              <p>
                {scope === "all"
                  ? `Furthest reported stage: ${bill.stage}`
                  : `Dated stage: ${billAtDate(bill, p.events, p.date).stage}`}
                . Passage does not itself establish enactment or commencement.
              </p>
              {source(bill.source_id)}
            </section>
          )}
          <details>
            <summary>Reported legislative history</summary>
            <Registry
              headers={[
                "Bill",
                "Stage",
                "Reported date",
                "Effective date",
                "Evidence",
              ]}
              rows={events.map((e) => [
                e.identifier,
                e.stage,
                e.date ?? "Unknown",
                e.effective_date,
                <>
                  {e.evidence?.map((s, i) => (
                    <span key={i}>
                      {source(s.source_id, s.line_start, s.line_end)}
                    </span>
                  ))}
                </>,
              ])}
            />
          </details>
        </section>
      )}
      {tab === "Votes" && (
        <section>
          <h3>Vote history</h3>
          <p>
            Recorded results and configured rules, independent of the
            composition snapshot. No unrecorded party votes or individual
            ballots are inferred.
          </p>
          <Registry
            headers={[
              "Date",
              "Bill",
              "Chamber observation",
              "Yes",
              "No",
              "Abstain",
              "Absent",
              "Vacancies",
              "Recorded result / rule",
            ]}
            rows={votes.map((r) => [
              r.date,
              p.bills.find((b) => b.id === r.bill_id)?.identifier ??
                "Unknown bill",
              p.chambers.find((c) => c.id === r.chamber_id)?.date ?? "Unknown",
              r.yes,
              r.no,
              r.abstain,
              r.absent,
              r.vacancies,
              <>
                {r.result}
                <br />
                {r.rule_source}
                {r.threshold !== null ? ` · threshold ${r.threshold}` : ""}
              </>,
            ])}
          />
        </section>
      )}
      {tab === "Historical events" && (
        <section>
          <h3>Parliamentary historical events</h3>
          <p>
            Recorded parliamentary titles and explicit Parliament links through{" "}
            {p.date}. Uncertain ranges are included only once their upper bound
            has passed; labels retain their original precision. This is
            historical evidence, not an invented sitting calendar.
          </p>
          <Registry
            headers={[
              "Historical date",
              "Event",
              "Canon / operation",
              "Evidence",
            ]}
            rows={chronology.map((e) => [
              JSON.parse(e.date_json).label,
              e.title,
              `${e.canon} / ${e.operation}`,
              source(e.source_id, e.line_start, e.line_end),
            ])}
          />
        </section>
      )}
      {tab === "Members" && (
        <section>
          <h3>Individual member records</h3>
          <p className="empty">
            No verified individual mandate register is available. Party seat
            totals and bill sponsors do not identify the members occupying those
            seats. A searchable member register requires sourced membership and
            term records; none are invented here.
          </p>
        </section>
      )}
    </div>
  );
}
