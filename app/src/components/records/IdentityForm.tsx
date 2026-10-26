"use client";
import { Text, CanonField, HistoricalDateFields } from "./Fields";
import type { FormProps } from "./Fields";
export default function IdentityForm(p: FormProps) {
  return (
    <>
      <Text p={p} name="name" label="Name" required />
      <Text
        p={p}
        name="description"
        label="Known description and notes"
        area
        hint="Leave unknown biographical details unrecorded."
      />
      <CanonField p={p} />
      {!p.quick && <HistoricalDateFields p={p} />}
    </>
  );
}
