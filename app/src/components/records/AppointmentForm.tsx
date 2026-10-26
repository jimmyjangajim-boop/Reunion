"use client";
import { Text, Select, HistoricalDateFields, value } from "./Fields";
import type { FormProps } from "./Fields";
export default function AppointmentForm(p: FormProps) {
  return (
    <>
      <Select
        p={p}
        name="office_id"
        label="Office"
        empty="Choose a recorded office"
        options={p.context.offices}
      />
      <Select
        p={p}
        name="person_id"
        label="Existing appointee"
        empty="Choose a person or supply a new name"
        options={(p.context.currentEntities ?? p.context.entities).filter(
          (e) => e.kind === "person",
        )}
      />
      {!value(p, "person_id") && (
        <Text p={p} name="new_person_name" label="New appointee name" />
      )}
      <Text
        p={p}
        name="date"
        label="Exact appointment date, if known"
        type="date"
      />
      {!value(p, "date") && <HistoricalDateFields p={p} />}
      <Select
        p={p}
        name="arrangement"
        label="Appointment arrangement"
        empty="Choose arrangement"
        options={[
          { id: "exclusive", name: "Exclusive officeholder" },
          { id: "acting", name: "Acting appointment" },
          { id: "joint", name: "Joint appointment" },
        ]}
      />
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={value(p, "reshuffle") === "yes"}
          onChange={(e) => p.set("reshuffle", e.target.checked ? "yes" : "")}
        />
        Explicitly approve ending an eligible preceding exclusive term
      </label>
      <Text
        p={p}
        name="explanation"
        label="Appointment authority and explanation"
        area
        required
      />
      <p className="muted">
        Unknown earlier terms require chronology review; this form does not
        invent their dates.
      </p>
    </>
  );
}
