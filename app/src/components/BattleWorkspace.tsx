"use client";
import React, { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
type R = Record<string, any>;
const cats = ["KIA", "WIA", "MIA", "POW", "unspecified"];
const counts = () => ({
  KIA: null,
  WIA: null,
  MIA: null,
  POW: null,
  unspecified: null,
});
const participant = () => ({
  unit_id: null,
  name: null,
  side: null,
  create_unit: false,
  branch: null,
  unit_type: null,
  casualties: counts(),
});
const dateInfo = (date?: string) => ({
  precision: date ? "day" : "unknown",
  label: date || "Unknown",
  earliest: null,
  latest: null,
  relation: null,
});
const blank = (date?: string) => ({
  battle_id: null,
  name: null,
  reference: null,
  date_info: dateInfo(date),
  location: null,
  belligerents: null,
  outcome: null,
  participants: [],
  losses: [],
});
const dated = (r: R) => {
  try {
    return JSON.parse(r.date_json).label;
  } catch {
    return "Unknown";
  }
};
export function BattleSummary({
  battle,
  units = [],
  battles = [],
  assets = [],
}: {
  battle: R;
  units?: R[];
  battles?: R[];
  assets?: R[];
}) {
  return (
    <div className="battle-summary">
      <dl className="profile-facts">
        <div>
          <dt>Battle</dt>
          <dd>
            {battle.battle_id
              ? battles.find((b) => b.id === battle.battle_id)?.name ||
                "Selected battle"
              : battle.name || "Name unknown"}
          </dd>
        </div>
        <div>
          <dt>Combat-phase reference</dt>
          <dd>{battle.reference || "Unknown"}</dd>
        </div>
        <div>
          <dt>Date</dt>
          <dd>
            {battle.date_info.label} · {battle.date_info.precision}
          </dd>
        </div>
        <div>
          <dt>Location</dt>
          <dd>{battle.location || "Unknown"}</dd>
        </div>
        <div>
          <dt>Belligerents</dt>
          <dd>{battle.belligerents || "Unknown"}</dd>
        </div>
        <div>
          <dt>Reported outcome</dt>
          <dd>{battle.outcome || "Not reported"}</dd>
        </div>
      </dl>
      <h3>Participants and reported casualties</h3>
      {battle.participants.length ? (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Formation / side</th>
                {cats.map((c) => (
                  <th key={c}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {battle.participants.map((u: R, i: number) => (
                <tr key={i}>
                  <td>
                    {u.unit_id
                      ? units.find((x) => x.id === u.unit_id)?.name || u.name
                      : u.name || "Formation unidentified"}
                    {u.side && <small className="row-detail">{u.side}</small>}
                    {u.create_unit && (
                      <small className="row-detail">
                        Create formation: {u.branch || "Branch unknown"} ·{" "}
                        {u.unit_type || "Type unknown"}
                      </small>
                    )}
                  </td>
                  {cats.map((c) => (
                    <td key={c}>
                      {u.casualties[c] === null
                        ? "Not reported"
                        : u.casualties[c].toLocaleString()}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="muted">No participants or casualty figures reported.</p>
      )}
      <h3>Reported equipment losses</h3>
      {battle.losses.length ? (
        <ul>
          {battle.losses.map((l: R, i: number) => (
            <li key={i}>
              {l.equipment || "Equipment unidentified"} ·{" "}
              {l.count === null ? "Count unknown" : l.count} · {l.state}
              {l.participant_index !== null && (
                <span>
                  {" "}
                  ·{" "}
                  {battle.participants[l.participant_index]?.name ||
                    units.find(
                      (u) =>
                        u.id ===
                        battle.participants[l.participant_index]?.unit_id,
                    )?.name ||
                    "Formation unidentified"}
                </span>
              )}
              {l.asset_id ? (
                <span>
                  {" "}
                  · Tracked asset:{" "}
                  {assets.find((a) => a.id === l.asset_id)?.name ||
                    l.asset_id}{" "}
                  ({l.asset_id})
                </span>
              ) : (
                ""
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">No equipment losses reported.</p>
      )}
    </div>
  );
}
function Editor({
  value,
  onChange,
  battles,
  units,
  assets,
}: {
  value: R;
  onChange: (b: R) => void;
  battles: R[];
  units: R[];
  assets: R[];
}) {
  const change = (key: string, v: any) => onChange({ ...value, [key]: v });
  const patchParticipant = (i: number, patch: R) =>
    change(
      "participants",
      value.participants.map((p: R, j: number) =>
        j === i ? { ...p, ...patch } : p,
      ),
    );
  const patchLoss = (i: number, patch: R) =>
    change(
      "losses",
      value.losses.map((p: R, j: number) => (j === i ? { ...p, ...patch } : p)),
    );
  return (
    <div className="battle-editor">
      <div className="battle-fields">
        <label>
          Battle
          <select
            value={value.battle_id || ""}
            onChange={(e) =>
              onChange({
                ...value,
                battle_id: e.target.value || null,
                name: null,
              })
            }
          >
            <option value="">Create a new battle</option>
            {battles.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} · {dated(b)}
              </option>
            ))}
          </select>
        </label>
        {!value.battle_id && (
          <label>
            New battle name
            <input
              maxLength={2000}
              value={value.name || ""}
              onChange={(e) => change("name", e.target.value || null)}
            />
          </label>
        )}
        <label>
          Report / combat-phase reference
          <input
            maxLength={120}
            placeholder="Your unique report reference"
            value={value.reference || ""}
            onChange={(e) => change("reference", e.target.value || null)}
          />
          <small>
            Reuse this reference for another account of the same phase.
            Different phases need different references.
          </small>
        </label>
        <label>
          Date precision
          <select
            value={value.date_info.precision}
            onChange={(e) =>
              change("date_info", {
                ...dateInfo(),
                precision: e.target.value,
                label: e.target.value === "unknown" ? "Unknown" : "",
              })
            }
          >
            {[
              ["unknown", "Unknown"],
              ["day", "Exact day"],
              ["month", "Month"],
              ["year", "Year"],
              ["relative", "Approximate / described"],
            ].map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        {value.date_info.precision !== "unknown" && (
          <label>
            Engagement date
            <input
              type={
                value.date_info.precision === "day"
                  ? "date"
                  : value.date_info.precision === "month"
                    ? "month"
                    : "text"
              }
              placeholder={
                value.date_info.precision === "year"
                  ? "YYYY"
                  : "Describe what is known"
              }
              value={value.date_info.label}
              onChange={(e) =>
                change("date_info", {
                  ...value.date_info,
                  label: e.target.value,
                })
              }
            />
          </label>
        )}
        <label>
          Location, if known
          <input
            maxLength={2000}
            value={value.location || ""}
            onChange={(e) => change("location", e.target.value || null)}
          />
        </label>
        <label>
          Belligerents, if known
          <input
            maxLength={2000}
            value={value.belligerents || ""}
            onChange={(e) => change("belligerents", e.target.value || null)}
          />
        </label>
        <label>
          Reported operational outcome
          <input
            maxLength={2000}
            placeholder="Leave blank if not established"
            value={value.outcome || ""}
            onChange={(e) => change("outcome", e.target.value || null)}
          />
        </label>
      </div>
      <div className="section-heading">
        <h3>Participants and casualties</h3>
        <button
          type="button"
          className="secondary"
          onClick={() =>
            change("participants", [...value.participants, participant()])
          }
        >
          Add participant
        </button>
      </div>
      <p className="muted">
        Leave unknown counts blank. Zero means explicitly reported zero.
        Categories and combat phases are kept separate.
      </p>
      {value.participants.map((p: R, i: number) => (
        <fieldset className="battle-participant" key={i}>
          <legend>Participant {i + 1}</legend>
          <div className="battle-fields">
            <label>
              Existing formation
              <select
                disabled={p.create_unit}
                value={p.unit_id || ""}
                onChange={(e) =>
                  patchParticipant(i, {
                    unit_id: e.target.value || null,
                    name:
                      units.find((u) => u.id === e.target.value)?.name ?? null,
                  })
                }
              >
                <option value="">Unidentified / reported name only</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Reported formation name
              <input
                disabled={!!p.unit_id}
                maxLength={2000}
                value={p.name || ""}
                onChange={(e) =>
                  patchParticipant(i, { name: e.target.value || null })
                }
              />
            </label>
            <label>
              Side / belligerent
              <input
                maxLength={2000}
                value={p.side || ""}
                onChange={(e) =>
                  patchParticipant(i, { side: e.target.value || null })
                }
              />
            </label>
          </div>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={p.create_unit}
              onChange={(e) =>
                patchParticipant(i, {
                  create_unit: e.target.checked,
                  unit_id: null,
                })
              }
            />{" "}
            Create this supplied formation in the OOB when approved
          </label>
          {p.create_unit && (
            <div className="battle-fields">
              <label>
                Formation branch
                <input
                  value={p.branch || ""}
                  onChange={(e) =>
                    patchParticipant(i, { branch: e.target.value || null })
                  }
                />
              </label>
              <label>
                Formation type
                <input
                  value={p.unit_type || ""}
                  onChange={(e) =>
                    patchParticipant(i, { unit_type: e.target.value || null })
                  }
                />
              </label>
            </div>
          )}
          <div className="casualty-inputs">
            {cats.map((c) => (
              <label key={c}>
                {c}
                <input
                  aria-label={`Participant ${i + 1} ${c}`}
                  type="number"
                  min={0}
                  step={1}
                  max={Number.MAX_SAFE_INTEGER}
                  value={p.casualties[c] ?? ""}
                  onChange={(e) =>
                    patchParticipant(i, {
                      casualties: {
                        ...p.casualties,
                        [c]:
                          e.target.value === "" ? null : Number(e.target.value),
                      },
                    })
                  }
                />
              </label>
            ))}
          </div>
          <button
            type="button"
            className="text-button"
            onClick={() =>
              onChange({
                ...value,
                participants: value.participants.filter(
                  (_: R, j: number) => i !== j,
                ),
                losses: value.losses.map((l: R) => ({
                  ...l,
                  participant_index:
                    l.participant_index === i
                      ? null
                      : l.participant_index !== null && l.participant_index > i
                        ? l.participant_index - 1
                        : l.participant_index,
                })),
              })
            }
          >
            Remove participant
          </button>
        </fieldset>
      ))}
      <div className="section-heading">
        <h3>Equipment losses</h3>
        <button
          type="button"
          className="secondary"
          onClick={() =>
            change("losses", [
              ...value.losses,
              {
                equipment: null,
                count: null,
                state: "unknown",
                asset_id: null,
                participant_index: null,
              },
            ])
          }
        >
          Add equipment loss
        </button>
      </div>
      {value.losses.map((l: R, i: number) => (
        <fieldset className="battle-participant" key={i}>
          <legend>Equipment loss {i + 1}</legend>
          <div className="battle-fields">
            <label>
              Reported equipment
              <input
                value={l.equipment || ""}
                onChange={(e) =>
                  patchLoss(i, { equipment: e.target.value || null })
                }
              />
            </label>
            <label>
              Known count
              <input
                type="number"
                min={0}
                step={1}
                value={l.count ?? ""}
                onChange={(e) =>
                  patchLoss(i, {
                    count:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              />
            </label>
            <label>
              Reported state
              <select
                value={l.state}
                onChange={(e) => patchLoss(i, { state: e.target.value })}
              >
                <option value="unknown">Unknown</option>
                <option value="lost">Lost / destroyed</option>
                <option value="damaged">Damaged</option>
              </select>
            </label>
            <label>
              Associated participant
              <select
                value={
                  l.participant_index === null
                    ? ""
                    : String(l.participant_index)
                }
                onChange={(e) =>
                  patchLoss(i, {
                    participant_index:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              >
                <option value="">Unknown / not attributed</option>
                {value.participants.map((u: R, j: number) => (
                  <option key={j} value={j}>
                    {u.name ||
                      units.find((x) => x.id === u.unit_id)?.name ||
                      `Participant ${j + 1}`}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Tracked asset to update, if explicitly identified
              <select
                value={l.asset_id || ""}
                onChange={(e) =>
                  patchLoss(i, { asset_id: e.target.value || null })
                }
              >
                <option value="">Record the loss only</option>
                {assets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} · {a.operation}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="muted">
            A tracked asset update requires a count of 1 and an exact date.
            Anonymous losses do not reduce an invented inventory.
          </p>
          <button
            type="button"
            className="text-button"
            onClick={() =>
              change(
                "losses",
                value.losses.filter((_: R, j: number) => i !== j),
              )
            }
          >
            Remove equipment loss
          </button>
        </fieldset>
      ))}
    </div>
  );
}
export default function BattleWorkspace({
  date,
  battles,
  units,
  assets,
  phases,
  casualties = [],
  onChanged,
  openSource,
  initialReportId,
}: {
  date: string;
  battles: R[];
  units: R[];
  assets: R[];
  phases: R[];
  casualties?: R[];
  onChanged: () => Promise<void>;
  openSource: (id: string, line?: number, end?: number) => void;
  initialReportId?: string | null;
}) {
  const [draft, setDraft] = useState<R>(() => blank(date)),
    [body, setBody] = useState(""),
    [title, setTitle] = useState(""),
    [mode, setMode] = useState("record"),
    [report, setReport] = useState<R | null>(null),
    [history, setHistory] = useState<R[]>([]),
    [filter, setFilter] = useState(""),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [suggestions, setSuggestions] = useState<string[]>([]);
  const editor = useRef<HTMLElement>(null);
  async function loadHistory() {
    const r = await fetch("/api/reports");
    const data = await r.json();
    if (!r.ok) throw Error(data.error);
    setHistory(data.reports.filter((r: R) => r.battle_count));
  }
  function show(r: R) {
    setReport(r);
    setDraft(r.actions.find((a: R) => a.kind === "battle").payload.battle);
    setBody(r.body);
    setTitle(r.title);
    setMode(r.mode);
  }
  async function open(id: string) {
    try {
      const r = await fetch("/api/reports?id=" + encodeURIComponent(id));
      const data = await r.json();
      if (!r.ok) throw Error(data.error);
      show(data);
      editor.current?.scrollIntoView({ block: "start" });
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    loadHistory().catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    if (initialReportId) open(initialReportId);
  }, [initialReportId]);
  async function send(input: R) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const r = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const result = await r.json();
      if (!r.ok) throw Error(result.error);
      return result;
    } catch (e) {
      setError((e as Error).message);
      throw e;
    } finally {
      setBusy(false);
    }
  }
  function fresh(battle?: R) {
    setReport(null);
    setDraft({ ...blank(date), battle_id: battle?.id ?? null });
    setBody("");
    setTitle(battle ? `${battle.name}: after-action report` : "");
    setMode("record");
    setError("");
    setNotice("");
    setSuggestions([]);
    editor.current?.scrollIntoView({ block: "start" });
  }
  async function save(e: FormEvent) {
    e.preventDefault();
    try {
      const r = await send({
        action: "submit",
        title: title || draft.name || "After-action report",
        body,
        mode,
        date:
          draft.date_info.precision === "day" ? draft.date_info.label : null,
        battle: draft,
      });
      show(r);
      await loadHistory();
      setNotice(
        r.duplicate
          ? "This report already exists; its review was opened."
          : "Original report saved. Review every proposed detail before approval.",
      );
    } catch {}
  }
  async function correct(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget),
      a = report!.actions.find((a: R) => a.kind === "battle");
    try {
      show(
        await send({
          action: "edit",
          report_id: report!.id,
          action_id: a.id,
          revision: report!.revision,
          payload: { ...a.payload, battle: draft },
          reason: f.get("reason"),
        }),
      );
      await loadHistory();
      setNotice("Proposal corrected. The original report is unchanged.");
    } catch {}
  }
  async function approve(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const rejected =
      ((e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null)
        ?.value === "reject";
    try {
      show(
        await send({
          action: "approve",
          report_id: report!.id,
          revision: report!.revision,
          action_ids: rejected
            ? []
            : [report!.actions.find((a: R) => a.kind === "battle").id],
          reject_ids: rejected
            ? [report!.actions.find((a: R) => a.kind === "battle").id]
            : [],
          reason: f.get("reason"),
        }),
      );
      await loadHistory();
      await onChanged();
      setNotice(
        rejected
          ? "Proposal rejected. The original report and review remain preserved."
          : "Battle, participants, known casualties and selected asset effects saved together.",
      );
    } catch {}
  }
  const action = report?.actions.find((a: R) => a.kind === "battle");
  return (
    <div className="battle-workspace">
      <div className="section-heading">
        <div>
          <h2>Battles and after-action reports</h2>
          <p className="muted">
            Write the engagement, review its records, and approve once.
          </p>
        </div>
        <button onClick={() => fresh()}>
          New Battle / After-Action Report
        </button>
      </div>
      {error && (
        <div role="alert" className="alert error">
          {error}
        </div>
      )}
      {notice && (
        <div role="status" className="alert">
          {notice}
        </div>
      )}
      <section
        className="panel battle-report-editor"
        ref={editor}
        aria-label="After-action report editor"
      >
        {!report ? (
          <form onSubmit={save} className="report-form">
            <label>
              Report title
              <input
                value={title}
                maxLength={200}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
            <label>
              Original engagement report
              <textarea
                required
                rows={7}
                maxLength={500000}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Describe the engagement and what was reported. Leave unknown details out."
              />
            </label>
            <button
              type="button"
              className="secondary"
              disabled={busy || !body.trim()}
              onClick={async () => {
                try {
                  const r = await send({
                    action: "suggest_battle",
                    body,
                    date:
                      draft.date_info.precision === "day"
                        ? draft.date_info.label
                        : null,
                  });
                  setDraft({
                    ...r.battle,
                    battle_id: draft.battle_id,
                    name: draft.name,
                    reference: draft.reference,
                  });
                  setSuggestions(r.warnings);
                } catch {}
              }}
            >
              Suggest details from report
            </button>
            {suggestions.length > 0 && (
              <details open>
                <summary>Suggestion review notes</summary>
                {suggestions.map((s) => (
                  <p className="muted" key={s}>
                    {s}
                  </p>
                ))}
              </details>
            )}
            <Editor
              value={draft}
              onChange={setDraft}
              battles={battles}
              units={units}
              assets={assets}
            />
            <label>
              Report mode
              <select value={mode} onChange={(e) => setMode(e.target.value)}>
                <option value="record">Record what happened</option>
                <option value="simulate">Hypothetical scenario</option>
              </select>
            </label>
            <button disabled={busy || !body.trim()}>
              Save report and review
            </button>
            <small>
              Submission preserves the original. It does not yet create a
              battle, casualties or losses.
            </small>
          </form>
        ) : (
          <>
            <div className="section-heading">
              <h2>{report.title}</h2>
              <span>
                {report.status} · {report.mode}
              </span>
            </div>
            <button
              className="text-button"
              onClick={() => openSource(report.source_id)}
            >
              View immutable original report
            </button>
            <BattleSummary
              battle={action.payload.battle}
              assets={assets}
              units={units}
              battles={battles}
            />
            {action.status === "pending" &&
              action.missing.map((s: string) => (
                <p className="alert" key={s}>
                  {s}
                </p>
              ))}
            {action.status === "pending" &&
              action.warnings.map((s: string) => (
                <p className="muted" key={s}>
                  {s}
                </p>
              ))}
            {action.status === "pending" && (
              <>
                <details>
                  <summary>Correct proposed details</summary>
                  <form onSubmit={correct} className="report-form">
                    <Editor
                      value={draft}
                      onChange={setDraft}
                      battles={battles}
                      units={units}
                      assets={assets}
                    />
                    <label>
                      Reason for correction
                      <input
                        name="reason"
                        required
                        minLength={3}
                        maxLength={2000}
                      />
                    </label>
                    <button disabled={busy}>Save proposed correction</button>
                  </form>
                </details>
                {report.mode === "record" ? (
                  <form onSubmit={approve} className="report-form">
                    <label>
                      Approval reason
                      <input
                        name="reason"
                        required
                        minLength={3}
                        maxLength={2000}
                      />
                    </label>
                    <button
                      name="decision"
                      value="approve"
                      disabled={busy || !action.ready}
                    >
                      Approve battle report and military records
                    </button>
                    <button
                      name="decision"
                      value="reject"
                      className="secondary"
                      disabled={busy}
                    >
                      Reject proposed changes
                    </button>
                  </form>
                ) : (
                  <p className="alert">
                    This remains a scenario. It cannot update canon or military
                    records.
                  </p>
                )}
              </>
            )}
            <details>
              <summary>Review history</summary>
              {report.reviews.map((r: R) => (
                <p key={r.id}>
                  {r.recorded_at} · {r.reason}
                </p>
              ))}
            </details>
          </>
        )}
      </section>
      <section className="panel">
        <div className="section-heading">
          <h2>Battle register</h2>
          <input
            aria-label="Search battles"
            placeholder="Find a battle…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Battle</th>
                <th>Recorded date</th>
                <th>Reported outcome</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {battles
                .filter((b) =>
                  [b.name, b.theater]
                    .join(" ")
                    .toLowerCase()
                    .includes(filter.toLowerCase()),
                )
                .map((b) => (
                  <tr key={b.id}>
                    <td>
                      {b.name}
                      <small className="row-detail">{b.canon}</small>
                    </td>
                    <td>
                      {dated(b)}
                      {/altis/i.test(b.name) && /1993/.test(b.date_json) && (
                        <small>Year correction pending: 1992</small>
                      )}
                    </td>
                    <td>{b.outcome || "Not established"}</td>
                    <td>
                      <button className="text-button" onClick={() => fresh(b)}>
                        Add after-action report
                      </button>
                      {b.source_id && (
                        <button
                          className="text-button row-detail"
                          onClick={() => openSource(b.source_id)}
                        >
                          Original record
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="panel">
        <details>
          <summary>Historical casualty records</summary>
          <p className="muted">
            Original categories and report groups remain separate. These records
            are not combined into totals.
          </p>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Battle</th>
                  <th>Formation</th>
                  <th>Report group</th>
                  <th>Category</th>
                  <th>Count</th>
                  <th>Status / source</th>
                </tr>
              </thead>
              <tbody>
                {casualties.map((c) => (
                  <tr key={c.id}>
                    <td>
                      {battles.find((b) => b.id === c.battle_id)?.name ||
                        "Unidentified battle"}
                    </td>
                    <td>
                      {units.find((u) => u.id === c.unit_id)?.name ||
                        "Unidentified"}
                    </td>
                    <td>{c.report_group}</td>
                    <td>{c.category}</td>
                    <td>{c.count}</td>
                    <td>
                      {c.canon}
                      {c.source_id && (
                        <button
                          className="text-button row-detail"
                          onClick={() => openSource(c.source_id)}
                        >
                          Source
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>
      <section className="panel">
        <h2>Report review queue and history</h2>
        {history.length ? (
          history.map((r) => (
            <p key={r.id}>
              <button className="text-button" onClick={() => open(r.id)}>
                {r.title}
              </button>{" "}
              · {r.status} · {r.mode}
            </p>
          ))
        ) : (
          <p>No battle reports submitted yet.</p>
        )}
      </section>
      <section className="panel">
        <h2>Approved combat phases</h2>
        {phases.length ? (
          phases.map((p) => (
            <details key={p.id}>
              <summary>
                {p.battle} · {p.reference} · {dated(p)}
              </summary>
              <p>
                {p.location || "Location unknown"} ·{" "}
                {p.belligerents || "Belligerents unknown"}
              </p>
              <p>{p.outcome || "Outcome not reported"}</p>
              {p.participants.map((u: R) => (
                <p key={u.id}>
                  {u.name || "Formation unidentified"}
                  {u.side ? ` · ${u.side}` : ""}:{" "}
                  {cats
                    .map((c) => {
                      const r = p.casualties.find(
                        (x: R) => x.participant_id === u.id && x.category === c,
                      );
                      return `${c} ${r ? r.count : "not reported"}`;
                    })
                    .join(" · ")}
                </p>
              ))}
              {p.losses.map((l: R) => (
                <p key={l.id}>
                  {l.equipment} · {l.count ?? "Count unknown"} · {l.state}
                  {l.participant_id && (
                    <span>
                      {" "}
                      ·{" "}
                      {p.participants.find((u: R) => u.id === l.participant_id)
                        ?.name || "Formation unidentified"}
                    </span>
                  )}
                  {l.asset_id && (
                    <span>
                      {" "}
                      · Tracked asset:{" "}
                      {assets.find((a) => a.id === l.asset_id)?.name ||
                        l.asset_id}
                    </span>
                  )}
                </p>
              ))}
              {p.evidence.map((e: R) => (
                <button
                  key={e.report_action_id}
                  className="text-button row-detail"
                  onClick={() =>
                    openSource(e.source_id, e.line_start, e.line_end)
                  }
                >
                  Source lines {e.line_start}–{e.line_end}
                </button>
              ))}
            </details>
          ))
        ) : (
          <p>
            No structured combat phases approved yet. Existing historical battle
            and casualty records remain preserved.
          </p>
        )}
      </section>
    </div>
  );
}
