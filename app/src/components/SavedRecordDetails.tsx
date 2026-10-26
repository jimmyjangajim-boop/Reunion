"use client";
import RecordDetails from "./RecordDetails";
export default function SavedRecordDetails(props: {
  receiptId: string;
  onSource: (id: string, start?: number, end?: number) => void;
  onRelated: (kind: "entity" | "unit", id: string) => void;
}) {
  return <RecordDetails {...props} />;
}
