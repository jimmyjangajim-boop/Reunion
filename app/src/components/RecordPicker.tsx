"use client";
import { useId, useState } from "react";
import {
  filterRecordChoices,
  recordChoiceGroup,
} from "../lib/record-choices.ts";
import type { RecordOption } from "../lib/record-choices.ts";

/** One ID-based chooser for legacy commands and guided records. Filtering never writes data. */
export default function RecordPicker({
  label,
  options,
  value,
  onChange,
  name,
  required = false,
  empty = "Select…",
  multiple = false,
}: {
  label: string;
  options: RecordOption[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  name?: string;
  required?: boolean;
  empty?: string;
  multiple?: boolean;
}) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("");
  const [page, setPage] = useState(1);
  const groups = [
    ...new Set(options.map((o) => recordChoiceGroup(o.kind))),
  ].sort();
  const matches = filterRecordChoices(options, group, query);
  const selected = new Set(Array.isArray(value) ? value : value ? [value] : []);
  // Keep selected values visible while narrowing a list, without silently clearing relationships.
  const pageSize = multiple ? 8 : 12;
  const pages = Math.max(1, Math.ceil(matches.length / pageSize));
  const currentPage = Math.min(page, pages);
  const pageMatches = matches.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const visible = multiple
    ? pageMatches
    : [
        ...options.filter(
          (o) => selected.has(o.id) && !pageMatches.some((m) => m.id === o.id),
        ),
        ...pageMatches,
      ];
  const toggle = (key: string) =>
    onChange(
      selected.has(key)
        ? [...selected].filter((s) => s !== key)
        : [...selected, key],
    );
  return (
    <div
      className="record-choice-picker"
      role="group"
      aria-label={`${label} chooser`}
    >
      <label htmlFor={id}>
        {label}
        {required ? " *" : ""}
      </label>
      {(options.length > 10 || groups.length > 1) && (
        <div className="picker-filters">
          {groups.length > 1 && (
            <label>
              Category
              <select
                aria-label={`${label} category`}
                value={group}
                onChange={(e) => {
                  setGroup(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All categories</option>
                {groups.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </label>
          )}
          <label>
            Find by name
            <input
              type="search"
              aria-label={`Find ${label}`}
              value={query}
              placeholder="Type a name or a few words…"
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
          </label>
        </div>
      )}
      {multiple ? (
        <>
          <div id={id} className="picker-checks" aria-label={label}>
            {visible.map((o) => (
              <label key={o.id}>
                <input
                  type="checkbox"
                  checked={selected.has(o.id)}
                  onChange={() => toggle(o.id)}
                />
                <span>
                  {o.name}
                  {o.kind ? ` · ${o.kind}` : ""}
                </span>
              </label>
            ))}
          </div>
          <div className="picker-pages">
            <button
              type="button"
              className="secondary"
              disabled={currentPage <= 1}
              onClick={() => setPage(currentPage - 1)}
            >
              Previous choices
            </button>
            <span>
              {matches.length ? (currentPage - 1) * pageSize + 1 : 0}–
              {Math.min(currentPage * pageSize, matches.length)} of{" "}
              {matches.length}
            </span>
            <button
              type="button"
              className="secondary"
              disabled={currentPage >= pages}
              onClick={() => setPage(currentPage + 1)}
            >
              Next choices
            </button>
          </div>
          {selected.size > 0 && (
            <div className="picker-selected" aria-label={`${label} selected`}>
              <small>
                Selected relationships (kept when searching another category)
              </small>
              {options
                .filter((o) => selected.has(o.id))
                .map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    className="secondary"
                    onClick={() => toggle(o.id)}
                    aria-label={`Remove ${o.name}`}
                  >
                    {o.name} ×
                  </button>
                ))}
            </div>
          )}
        </>
      ) : (
        <select
          id={id}
          aria-label={label}
          name={name}
          required={required}
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">{empty}</option>
          {groups.map((g) => (
            <optgroup key={g} label={g}>
              {visible
                .filter((o) => recordChoiceGroup(o.kind) === g)
                .map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
      )}
      {!multiple && pages > 1 && (
        <div className="picker-pages">
          <button
            type="button"
            className="secondary"
            disabled={currentPage <= 1}
            onClick={() => setPage(currentPage - 1)}
          >
            Previous choices
          </button>
          <small>
            Page {currentPage} of {pages} · search to narrow the list
          </small>
          <button
            type="button"
            className="secondary"
            disabled={currentPage >= pages}
            onClick={() => setPage(currentPage + 1)}
          >
            Next choices
          </button>
        </div>
      )}
      {!matches.length && (
        <small role="status">
          No matching records. Try another category or name.
        </small>
      )}
      {!multiple && options.length > 10 && (
        <small>
          {matches.length} matching records. Narrow by name
          {groups.length > 1 ? " or category" : ""}.
          {selected.size > 0
            ? " Your selection stays selected until you change it."
            : ""}
        </small>
      )}
    </div>
  );
}
