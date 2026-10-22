"use client";
import { Text, Select, Many, HistoricalDateFields } from "./Fields";
import type { FormProps } from "./Fields";
export default function TreatyForm(p: FormProps) {
  return (
    <>
      <Text p={p} name="name" label="Treaty or agreement name" required />
      <Select
        p={p}
        name="operation"
        label="Agreement status"
        empty="Choose status"
        options={[
          { id: "proposal", name: "Proposed" },
          { id: "approved", name: "Approved" },
          { id: "completed", name: "Completed" },
          { id: "canceled", name: "Canceled" },
        ]}
      />
      <HistoricalDateFields p={p} />
      <Text p={p} name="terms" label="Reported terms and notes" area required />
      <Many
        p={p}
        name="participant_ids"
        label="Participating states"
        options={p.context.entities.filter((e) => e.kind === "nation")}
      />
      <Text
        p={p}
        name="new_nation_name"
        label="Missing participating state name"
        hint="Optional. Creates the supplied state and links it when the agreement is saved."
      />
      <p className="muted">
        No treaty restriction, border or financial effect is inferred. Use the
        existing treaty tools for explicit location restrictions.
      </p>
    </>
  );
}
