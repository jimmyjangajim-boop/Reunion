"use client";
import { Text, Select, value } from "./Fields";
import type { FormProps } from "./Fields";
export default function BillForm(p: FormProps) {
  return (
    <>
      <div className="form-grid">
        <Text p={p} name="identifier" label="Bill identifier" required />
        <Text
          p={p}
          name="date"
          label="Introduction date"
          type="date"
          required
        />
      </div>
      <Text p={p} name="title" label="Bill title" required />
      <Text p={p} name="summary" label="Bill summary" area required />
      <Select
        p={p}
        name="sponsor_id"
        label="Existing sponsor"
        options={p.context.entities.filter((e) => e.kind === "person")}
        empty="Unknown or name a new sponsor below"
      />
      {!value(p, "sponsor_id") && (
        <Text
          p={p}
          name="new_sponsor_name"
          label="New sponsor name"
          hint="Optional. Creates this person together with the bill after review."
        />
      )}
      <p className="muted">
        This registers a bill. It does not record passage, a vote or enactment.
      </p>
    </>
  );
}
