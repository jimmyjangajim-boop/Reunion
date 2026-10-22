"use client";
import {
  Text,
  Select,
  Many,
  CanonField,
  HistoricalDateFields,
  value,
} from "./Fields";
import type { FormProps } from "./Fields";
export default function ArchiveEventForm(p: FormProps) {
  return (
    <>
      <Text p={p} name="title" label="Event title" required />
      <Select
        p={p}
        name="category"
        label="Historical subject"
        empty="Choose subject"
        options={[
          "history",
          "political",
          "military",
          "economic",
          "diplomatic",
          "domestic",
          "territory",
          "constitutional",
        ].map((id) => ({ id, name: id[0].toUpperCase() + id.slice(1) }))}
      />
      <Text
        p={p}
        name="description"
        label="Historical account and notes"
        area
        required
      />
      <HistoricalDateFields p={p} />
      <CanonField p={p} />
      <Many
        p={p}
        name="related_ids"
        label="Related people, places and organizations"
        options={p.context.entities}
      />
      {!p.quick && (
        <details>
          <summary>Create a missing related entity</summary>
          <Text p={p} name="new_related_name" label="New related entity name" />
          {value(p, "new_related_name") && (
            <Select
              p={p}
              name="new_related_kind"
              label="Related entity type"
              options={[
                "person",
                "institution",
                "organization",
                "place",
                "nation",
              ].map((id) => ({ id, name: id[0].toUpperCase() + id.slice(1) }))}
            />
          )}
        </details>
      )}
      <p className="muted">
        Entity links record a supplied relationship to this event. They do not
        update appointments, deployments or accounts.
      </p>
    </>
  );
}
