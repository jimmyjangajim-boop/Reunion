"use client";
import { Text, Select } from "./Fields";
import type { FormProps } from "./Fields";
import type { GuidedKind } from "../../lib/record-registry.ts";
export default function MilitaryForm(p: FormProps & { kind: GuidedKind }) {
  return p.kind === "unit" ? (
    <>
      <Text p={p} name="name" label="Formation name" required />
      <div className="form-grid">
        <Text p={p} name="branch" label="Service branch" required />
        <Text p={p} name="unit_type" label="Formation type" required />
      </div>
      <p className="muted">
        Registers an identity. Strength, readiness, hierarchy and formation date
        remain unrecorded.
      </p>
    </>
  ) : (
    <>
      <Select
        p={p}
        name="unit_id"
        label="Formation"
        empty="Choose an existing formation"
        options={p.context.units}
      />
      <Select
        p={p}
        name="location_id"
        label="Destination"
        empty="Choose a named location"
        options={p.context.locations}
      />
      <Text p={p} name="date" label="Order date" type="date" required />
      <Select
        p={p}
        name="operation"
        label="Movement status"
        empty="Choose status"
        options={[
          { id: "planned", name: "Planned" },
          { id: "ordered", name: "Ordered" },
        ]}
      />
      <Text p={p} name="mission" label="Mission or order" area required />
      <Text
        p={p}
        name="override_reason"
        label="Treaty override reason, if required"
        area
      />
      <p className="muted">
        Arrival is confirmed separately. A plan or order does not complete a
        deployment.
      </p>
    </>
  );
}
