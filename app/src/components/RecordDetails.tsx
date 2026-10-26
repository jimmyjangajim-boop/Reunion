"use client";
import { useEffect, useRef, useState } from "react";
import type { DomainKind, DomainRecordDetails } from "../lib/record-catalog.ts";
type Details = DomainRecordDetails & {
  savedAt?: string;
  approvalReason?: string;
};

export default function RecordDetails({
  receiptId,
  target,
  onSource,
  onRelated,
}: {
  receiptId?: string;
  target?: { kind: DomainKind; id: string };
  onSource: (id: string, start?: number, end?: number) => void;
  onRelated: (kind: "entity" | "unit", id: string) => void;
}) {
  const [trail, setTrail] = useState<{ kind: DomainKind; id: string }[]>([]);
  const [linkPage, setLinkPage] = useState(1);
  const active = trail.at(-1) ?? target;
  const isReceipt = !active && !!receiptId;
  const url = active
    ? `/api/search?view=record&kind=${encodeURIComponent(active.kind)}&id=${encodeURIComponent(active.id)}`
    : `/api/records?view=target&id=${encodeURIComponent(receiptId ?? "")}`;
  const [record, setRecord] = useState<Details | null>(null);
  const [error, setError] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (record) heading.current?.focus();
  }, [record]);
  useEffect(() => {
    const controller = new AbortController();
    setRecord(null);
    setLinkPage(1);
    setError("");
    fetch(url, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok)
          throw Error(data.error || "Could not open the saved record.");
        if (!controller.signal.aborted) setRecord(data);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      });
    return () => controller.abort();
  }, [url]);
  return (
    <section
      className="panel saved-record-details"
      aria-label={
        isReceipt ? "Saved record details" : "Registry record details"
      }
      data-target-id={record?.id}
    >
      {trail.length > 0 && (
        <button
          type="button"
          className="secondary"
          onClick={() => setTrail((items) => items.slice(0, -1))}
        >
          Back to previous record
        </button>
      )}
      {error ? (
        <p role="alert">{error}</p>
      ) : !record ? (
        <p role="status">Opening saved record…</p>
      ) : (
        <>
          <p className="eyebrow">
            {record.type} · {isReceipt ? "saved record" : "registry record"}
          </p>
          <h3 ref={heading} tabIndex={-1}>
            {record.title}
          </h3>
          <p className="muted">
            These are the current stored fields across all recorded dates. They
            are not a snapshot for the historical date selector.{" "}
            {isReceipt
              ? "The original approval receipt above remains preserved separately."
              : "Open the evidence to check the source and historical context."}
          </p>
          {record.note && <p className="alert">{record.note}</p>}
          <dl className="profile-facts">
            {record.fields.map((field) => (
              <div key={field.label}>
                <dt>{field.label}</dt>
                <dd>{field.value}</dd>
              </div>
            ))}
          </dl>
          {record.links.length > 0 && (
            <section>
              <h4>Connected records</h4>
              {record.links
                .slice((linkPage - 1) * 12, linkPage * 12)
                .map((link) => (
                  <p key={`${link.kind}-${link.id}-${link.relationship}`}>
                    {link.relationship}:{" "}
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => {
                        if (link.kind === "entity" || link.kind === "unit")
                          onRelated(link.kind, link.id);
                        else {
                          const next = { kind: link.kind, id: link.id };
                          setTrail((items) => [...items, next]);
                        }
                      }}
                    >
                      {link.label}
                    </button>
                  </p>
                ))}
            </section>
          )}
          {record.links.length > 12 && (
            <div className="picker-pages">
              <button
                type="button"
                className="secondary"
                disabled={linkPage <= 1}
                onClick={() => setLinkPage(linkPage - 1)}
              >
                Previous links
              </button>
              <span>
                Page {linkPage} of {Math.ceil(record.links.length / 12)}
              </span>
              <button
                type="button"
                className="secondary"
                disabled={linkPage * 12 >= record.links.length}
                onClick={() => setLinkPage(linkPage + 1)}
              >
                Next links
              </button>
            </div>
          )}
          <section>
            <h4>{isReceipt ? "Saved entry evidence" : "Recorded evidence"}</h4>
            {record.evidence.map((e) => (
              <p key={`${e.source_id}-${e.line_start}-${e.line_end}`}>
                <button
                  type="button"
                  className="text-button"
                  onClick={() =>
                    onSource(e.source_id, e.line_start, e.line_end)
                  }
                >
                  {e.filename} · lines {e.line_start}–{e.line_end}
                </button>
              </p>
            ))}
            {!record.evidence.length && (
              <p className="muted">
                No exact line citation is recorded here. A source link below,
                when available, opens the whole preserved source.
              </p>
            )}
            {record.currentSource &&
              !record.evidence.some(
                (e) => e.source_id === record.currentSource?.id,
              ) && (
                <p>
                  Current record source:{" "}
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => onSource(record.currentSource!.id)}
                  >
                    {record.currentSource.filename}
                  </button>
                </p>
              )}
            {isReceipt && (
              <p>
                Saved at {record.savedAt} (recording timestamp). Approval:{" "}
                {record.approvalReason}
              </p>
            )}
          </section>
        </>
      )}
    </section>
  );
}
