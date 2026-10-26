"use client";
import { useEffect, useRef, useState } from "react";
import type { SavedRecordDetails as Details } from "../lib/record-registry.ts";

export default function SavedRecordDetails({
  receiptId,
  onSource,
  onRelated,
}: {
  receiptId: string;
  onSource: (id: string, start?: number, end?: number) => void;
  onRelated: (kind: "entity" | "unit", id: string) => void;
}) {
  const [record, setRecord] = useState<Details | null>(null);
  const [error, setError] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (record) heading.current?.focus();
  }, [record]);
  useEffect(() => {
    const controller = new AbortController();
    setRecord(null);
    setError("");
    fetch("/api/records?view=target&id=" + encodeURIComponent(receiptId), {
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
  }, [receiptId]);
  return (
    <section
      className="panel saved-record-details"
      aria-label="Saved record details"
      data-target-id={record?.id}
    >
      {error ? (
        <p role="alert">{error}</p>
      ) : !record ? (
        <p role="status">Opening saved record…</p>
      ) : (
        <>
          <p className="eyebrow">{record.type} · saved record</p>
          <h3 ref={heading} tabIndex={-1}>
            {record.title}
          </h3>
          <p className="muted">
            These are the current stored fields across all recorded dates. They
            are not a snapshot for the historical date selector. The original
            approval receipt above remains preserved separately.
          </p>
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
              {record.links.map((link) => (
                <p key={`${link.kind}-${link.id}-${link.relationship}`}>
                  {link.relationship}:{" "}
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => onRelated(link.kind, link.id)}
                  >
                    {link.label}
                  </button>
                </p>
              ))}
            </section>
          )}
          <section>
            <h4>Saved entry evidence</h4>
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
                No saved citation is available. Check the preserved receipt.
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
            <p>
              Saved at {record.savedAt} (recording timestamp). Approval:{" "}
              {record.approvalReason}
            </p>
          </section>
        </>
      )}
    </section>
  );
}
