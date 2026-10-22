"use client";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  recordCategories,
  recordRegistry,
  guidedDefinition,
} from "../lib/record-registry.ts";
import type {
  RecordCategory,
  RecordContext,
  RecordDefinition,
  RecordDraft,
  RecordFormData,
  RecordReview,
  GuidedKind,
} from "../lib/record-registry.ts";
import { EvidenceFields } from "./records/Fields";
import IdentityForm from "./records/IdentityForm";
import BillForm from "./records/BillForm";
import AppointmentForm from "./records/AppointmentForm";
import MilitaryForm from "./records/MilitaryForm";
import ArchiveEventForm from "./records/ArchiveEventForm";
import TreatyForm from "./records/TreatyForm";
import type { FormProps } from "./records/Fields";

type DraftResult = RecordDraft & { receipt?: RecordReview };
type DraftSummary = Pick<
  RecordDraft,
  "id" | "kind" | "status" | "revision" | "updated_at" | "target_id"
> & { title: string };
const forms = {
  identity: (p: FormProps, _kind: GuidedKind) => <IdentityForm {...p} />,
  bill: (p: FormProps, _kind: GuidedKind) => <BillForm {...p} />,
  appointment: (p: FormProps, _kind: GuidedKind) => <AppointmentForm {...p} />,
  military: (p: FormProps, kind: GuidedKind) => (
    <MilitaryForm {...p} kind={kind} />
  ),
  archive: (p: FormProps, _kind: GuidedKind) => <ArchiveEventForm {...p} />,
  treaty: (p: FormProps, _kind: GuidedKind) => <TreatyForm {...p} />,
};
function defaults(): RecordFormData {
  return {
    date_precision: "unknown",
    date_label: "",
    canon: "provisional",
    source_id: "",
    line_start: "1",
    line_end: "1",
    related_ids: [],
    participant_ids: [],
    new_related_kind: "person",
  };
}
function Review({ review }: { review: RecordReview }) {
  return (
    <div className="record-review">
      <dl>
        {review.fields.map((field) => (
          <div key={field.label}>
            <dt>{field.label}</dt>
            <dd>{field.value}</dd>
          </div>
        ))}
      </dl>
      <h3>Related records</h3>
      {review.links.length ? (
        <ul>
          {review.links.map((link) => (
            <li key={link}>{link}</li>
          ))}
        </ul>
      ) : (
        <p>No related records will be linked.</p>
      )}
      <h3>What will change</h3>
      <ul>
        {review.changes.map((change) => (
          <li key={change}>{change}</li>
        ))}
      </ul>
      {review.unknowns.length > 0 && (
        <>
          <h3>Information that remains unknown</h3>
          <ul>
            {review.unknowns.map((unknown) => (
              <li key={unknown}>{unknown}</li>
            ))}
          </ul>
        </>
      )}
      <p className="alert">{review.approval}</p>
    </div>
  );
}

export default function NewRecordWorkspace({
  context,
  initialKind,
  onExisting,
  onSaved,
  onOpen,
}: {
  context: RecordContext;
  initialKind?: GuidedKind;
  onExisting: (definition: RecordDefinition) => void;
  onSaved: () => Promise<void>;
  onOpen: (kind: GuidedKind) => void;
}) {
  const initial = initialKind ? guidedDefinition(initialKind) : null;
  const [category, setCategory] = useState<RecordCategory | null>(
      initial?.category ?? null,
    ),
    [kind, setKind] = useState<GuidedKind | null>(initial?.id ?? null),
    [values, setValues] = useState<RecordFormData>(defaults),
    [draft, setDraft] = useState<DraftResult | null>(null),
    [review, setReview] = useState<RecordReview | null>(null),
    [stage, setStage] = useState<"choose" | "form" | "review" | "saved">(
      initial ? "form" : "choose",
    ),
    [drafts, setDrafts] = useState<DraftSummary[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [reason, setReason] = useState(""),
    [quick, setQuick] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null),
    mounted = useRef(false);
  async function list() {
    const response = await fetch("/api/records", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw Error(result.error);
    setDrafts(result.drafts);
  }
  useEffect(() => {
    list().catch((e) => setError(e.message));
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    if (mounted.current) heading.current?.focus();
    mounted.current = true;
  }, [stage]);
  const definition = kind ? guidedDefinition(kind) : null;
  const set = (name: string, next: string | string[]) => {
    setValues((old) => ({
      ...old,
      [name]: name === "date_precision" && next === "" ? "unknown" : next,
      ...(name === "sponsor_id" && next ? { new_sponsor_name: "" } : {}),
      ...(name === "person_id" && next ? { new_person_name: "" } : {}),
    }));
    setReview(null);
    setNotice("");
  };
  async function request(body: object) {
    const response = await fetch("/api/records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    if (!response.ok) throw Error(result.error || "Could not save record");
    return result;
  }
  async function withBusy(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function persist(): Promise<DraftResult> {
    const result = await request({
      action: "draft",
      kind,
      payload: values,
      ...(draft ? { id: draft.id, revision: draft.revision } : {}),
    });
    setDraft(result);
    await list();
    return result;
  }
  async function toReview(event: FormEvent) {
    event.preventDefault();
    await withBusy(async () => {
      const saved = await persist();
      const result = await request({ action: "review", id: saved.id });
      setReview(result);
      setReason("");
      setStage("review");
    });
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!draft || !review) return;
    await withBusy(async () => {
      const result = await request({
        action: "save",
        id: draft.id,
        revision: draft.revision,
        token: review.token,
        reason,
      });
      setDraft(result);
      setStage("saved");
      await list();
      await onSaved();
      setNotice("Record saved. The draft is now a preserved receipt.");
    });
  }
  async function open(id: string) {
    await withBusy(async () => {
      const response = await fetch(
        "/api/records?id=" + encodeURIComponent(id),
        { cache: "no-store" },
      );
      const result: DraftResult & { error?: string } = await response.json();
      if (!response.ok) throw Error(result.error);
      setKind(result.kind);
      setCategory(guidedDefinition(result.kind).category);
      setValues(result.payload);
      setDraft(result);
      setReview(result.receipt ?? null);
      setReason("");
      setStage(result.status === "saved" ? "saved" : "form");
    });
  }
  function start() {
    setKind(null);
    setCategory(null);
    setDraft(null);
    setReview(null);
    setValues(defaults());
    setStage("choose");
    setError("");
    setNotice("");
    setQuick(false);
  }
  function choose(choice: RecordDefinition) {
    if (choice.mode === "existing") {
      onExisting(choice);
      return;
    }
    setKind(choice.id);
    setValues(defaults());
    setDraft(null);
    setReview(null);
    setStage("form");
    setQuick(false);
    setError("");
  }
  const formProps = { values, set, context, quick };
  return (
    <div className="new-record-workspace" aria-busy={busy}>
      <ol className="record-steps" aria-label="Record creation progress">
        {[
          "Choose category",
          "Choose record type",
          "Complete form",
          "Review",
          "Save",
        ].map((label, index) => (
          <li
            key={label}
            aria-current={
              (stage === "choose"
                ? category
                  ? 1
                  : 0
                : stage === "form"
                  ? 2
                  : stage === "review"
                    ? 3
                    : 4) === index
                ? "step"
                : undefined
            }
          >
            <span>{index + 1}</span>
            {label}
          </li>
        ))}
      </ol>
      {error && (
        <div className="alert error" role="alert">
          {error}
          {stage === "review" && (
            <button
              type="button"
              className="secondary"
              onClick={() => {
                setStage("form");
                setReview(null);
              }}
            >
              Return to form and review again
            </button>
          )}
        </div>
      )}
      {notice && (
        <p role="status" className="notice">
          {notice}
        </p>
      )}
      <div className="section-heading">
        <div>
          <h2 ref={heading} tabIndex={-1}>
            {stage === "choose"
              ? "Create a national record"
              : stage === "review"
                ? "Review before saving"
                : stage === "saved"
                  ? "Saved record"
                  : definition?.title}
          </h2>
          <p className="muted">
            {stage === "choose"
              ? "Choose the record you need. Existing specialized workflows remain available here."
              : definition?.description}
          </p>
        </div>
        {stage !== "choose" && (
          <button
            type="button"
            className="secondary"
            onClick={start}
            disabled={busy}
          >
            Start another record
          </button>
        )}
      </div>
      {stage === "choose" && (
        <>
          <div className="record-picker">
            <nav aria-label="Record categories">
              {recordCategories.map((name) => (
                <button
                  key={name}
                  type="button"
                  className={category === name ? "selected" : "secondary"}
                  aria-pressed={category === name}
                  onClick={() => setCategory(name)}
                >
                  {name}
                </button>
              ))}
            </nav>
            <section aria-label="Record types">
              {category ? (
                <>
                  <h3>{category}</h3>
                  {recordRegistry
                    .filter((r) => r.category === category)
                    .map((choice) => (
                      <button
                        className="record-type"
                        key={choice.id}
                        type="button"
                        onClick={() => choose(choice)}
                      >
                        <strong>{choice.title}</strong>
                        <span>{choice.description}</span>
                        <small>
                          {choice.mode === "guided"
                            ? "Guided form · saved drafts · review"
                            : "Open existing workflow"}
                        </small>
                      </button>
                    ))}
                </>
              ) : (
                <p className="record-picker-intro">
                  Start with a category. Each record opens the form or workspace
                  suited to its purpose.
                </p>
              )}
            </section>
          </div>
          <p className="muted">
            Use Historical event for a sourced account that does not require an
            administrative action.
          </p>
        </>
      )}
      {stage === "form" && definition && (
        <form onSubmit={toReview} className="record-editor">
          <fieldset disabled={busy}>
            <legend className="sr-only">{definition.title} details</legend>
            {[
              "person",
              "institution",
              "organization",
              "historical_event",
            ].includes(definition.id) && (
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={quick}
                  onChange={(e) => setQuick(e.target.checked)}
                />
                Compact quick entry
              </label>
            )}
            {forms[definition.form](formProps, definition.id)}
            <EvidenceFields p={formProps} />
          </fieldset>
          <div className="record-actions">
            <button
              type="button"
              className="secondary"
              disabled={busy}
              onClick={() =>
                withBusy(async () => {
                  await persist();
                  setNotice("Draft saved. No national records changed.");
                })
              }
            >
              Save draft
            </button>
            <button type="submit" disabled={busy}>
              Review record
            </button>
          </div>
          <p className="muted">
            Drafts can be incomplete. Final saving requires validation and
            explicit approval.
          </p>
        </form>
      )}
      {stage === "review" && review && (
        <form onSubmit={save}>
          <Review review={review} />
          <label className="record-field">
            <span>Approval reason</span>
            <textarea
              required
              minLength={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </label>
          <div className="record-actions">
            <button
              type="button"
              className="secondary"
              disabled={busy}
              onClick={() => {
                setStage("form");
                setReview(null);
              }}
            >
              Edit details
            </button>
            <button type="submit" disabled={busy}>
              Approve and save record
            </button>
          </div>
        </form>
      )}
      {stage === "saved" && draft && (
        <section className="panel">
          <p>
            This record was saved once. Its original evidence and approval
            receipt are preserved.
          </p>
          {review && <Review review={review} />}
          <button type="button" onClick={() => onOpen(draft.kind)}>
            Open related registry
          </button>
        </section>
      )}
      {drafts.length > 0 && (
        <section className="record-draft-list">
          <h2>Saved drafts and receipts</h2>
          <p className="muted">
            The latest 100 drafts and receipts are stored in the database and
            included in full backups.
          </p>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Record</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {drafts.map((row) => (
                  <tr key={row.id}>
                    <td>{row.title || "Untitled draft"}</td>
                    <td>{guidedDefinition(row.kind).title}</td>
                    <td>
                      {row.status === "draft"
                        ? "Draft — not applied"
                        : "Saved receipt"}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="text-button"
                        disabled={busy}
                        onClick={() => open(row.id)}
                      >
                        {row.status === "draft"
                          ? "Resume draft"
                          : "View receipt"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
