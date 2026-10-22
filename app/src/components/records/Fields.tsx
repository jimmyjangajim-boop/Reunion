"use client";
import type {
  RecordFormData,
  RecordContext,
} from "../../lib/record-registry.ts";
export type FormProps = {
  values: RecordFormData;
  set: (name: string, value: string | string[]) => void;
  context: RecordContext;
  quick: boolean;
};
export function value(p: FormProps, key: string) {
  return String(p.values[key] ?? "");
}
export function Text({
  p,
  name,
  label,
  area = false,
  type = "text",
  required = false,
  hint,
}: {
  p: FormProps;
  name: string;
  label: string;
  area?: boolean;
  type?: string;
  required?: boolean;
  hint?: string;
}) {
  const id = "record-" + name;
  return (
    <label className="record-field" htmlFor={id}>
      <span>
        {label}
        {required ? " *" : ""}
      </span>
      {area ? (
        <textarea
          id={id}
          aria-label={label}
          value={value(p, name)}
          onChange={(e) => p.set(name, e.target.value)}
          required={required}
          rows={4}
        />
      ) : (
        <input
          id={id}
          aria-label={label}
          type={type}
          value={value(p, name)}
          onChange={(e) => p.set(name, e.target.value)}
          required={required}
        />
      )}{" "}
      {hint && <small>{hint}</small>}
    </label>
  );
}
export function Select({
  p,
  name,
  label,
  options,
  empty = "Not recorded",
}: {
  p: FormProps;
  name: string;
  label: string;
  options: { id: string; name: string }[];
  empty?: string;
}) {
  return (
    <label className="record-field">
      <span>{label}</span>
      <select
        aria-label={label}
        value={value(p, name)}
        onChange={(e) => p.set(name, e.target.value)}
      >
        <option value="">{empty}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
    </label>
  );
}
export function Many({
  p,
  name,
  label,
  options,
}: {
  p: FormProps;
  name: string;
  label: string;
  options: { id: string; name: string }[];
}) {
  return (
    <label className="record-field">
      <span>{label}</span>
      <select
        aria-label={label}
        multiple
        size={5}
        value={
          Array.isArray(p.values[name]) ? (p.values[name] as string[]) : []
        }
        onChange={(e) =>
          p.set(
            name,
            Array.from(e.target.selectedOptions, (o) => o.value),
          )
        }
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
      <small>
        Choose any supplied related records. Use Ctrl/Command to select more
        than one on a computer.
      </small>
    </label>
  );
}
export function HistoricalDateFields({ p }: { p: FormProps }) {
  const precision = value(p, "date_precision") || "unknown";
  return (
    <fieldset>
      <legend>Historical date</legend>
      <p className="muted">
        Keep an uncertain date uncertain. Recording today does not establish the
        event date.
      </p>
      <Select
        p={p}
        name="date_precision"
        label="Date precision"
        empty="Unknown"
        options={[
          { id: "day", name: "Exact day" },
          { id: "month", name: "Month" },
          { id: "year", name: "Year" },
          { id: "range", name: "Date range" },
          { id: "relative", name: "Relative or approximate" },
        ]}
      />
      {precision !== "unknown" && (
        <Text
          p={p}
          name="date_label"
          label="Historical date or description"
          type={
            precision === "day"
              ? "date"
              : precision === "month"
                ? "month"
                : "text"
          }
          hint={precision === "year" ? "Four-digit year" : undefined}
        />
      )}{" "}
      {["range", "relative"].includes(precision) && (
        <div className="form-grid">
          <Text
            p={p}
            name="earliest"
            label="Earliest known bound"
            hint="Year, year-month or exact day; leave blank when unknown."
          />
          <Text p={p} name="latest" label="Latest known bound" />
        </div>
      )}
    </fieldset>
  );
}
export function CanonField({ p }: { p: FormProps }) {
  return (
    <Select
      p={p}
      name="canon"
      label="Canon status"
      empty="Choose status"
      options={[
        { id: "provisional", name: "Provisional" },
        { id: "confirmed", name: "Confirmed by your approval" },
        { id: "disputed", name: "Disputed" },
      ]}
    />
  );
}
export function EvidenceFields({ p }: { p: FormProps }) {
  const existing = !!value(p, "source_id");
  return (
    <fieldset>
      <legend>Source evidence</legend>
      <Select
        p={p}
        name="source_id"
        label="Cite a preserved source"
        empty="Supply original evidence below"
        options={p.context.sources.map((s) => ({ id: s.id, name: s.filename }))}
      />
      {existing ? (
        <div className="form-grid">
          <Text
            p={p}
            name="line_start"
            label="First source line"
            type="number"
            required
          />
          <Text
            p={p}
            name="line_end"
            label="Last source line"
            type="number"
            required
          />
        </div>
      ) : (
        <Text
          p={p}
          name="source_text"
          label="Original evidence or source citation"
          area
          required
          hint="Preserved exactly as entered. Include the source, wording and citation you know."
        />
      )}
    </fieldset>
  );
}
