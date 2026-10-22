import { randomUUID } from "node:crypto";
import { z } from "zod";
import { one, audit } from "./db.ts";
import type { DB } from "./db.ts";

/** Caller owns the transaction, including the parent record. */
export function relatedPerson(
  db: DB,
  existing: string | undefined,
  supplied: string | undefined,
  reason: string,
) {
  const name = supplied?.trim();
  if (name && existing?.trim())
    throw Error("Select an existing person or supply a new name, not both.");
  if (!name) {
    if (!existing) return null;
    const person = one(
      db,
      "SELECT * FROM entities WHERE id=? AND kind='person'",
      existing,
    );
    if (!person) throw Error("Select a person");
    return person;
  }
  z.string().max(200).parse(name);
  if (
    one(
      db,
      "SELECT 1 FROM entities WHERE lower(name)=lower(?) AND kind='person'",
      name,
    )
  )
    throw Error("A person with this name already exists. Select that person.");
  const id = randomUUID();
  db.prepare(
    "INSERT INTO entities(id,name,kind,description) VALUES(?,?,'person','')",
  ).run(id, name);
  audit(
    db,
    "create_related_person",
    id,
    null,
    { name, kind: "person" },
    reason,
  );
  return { id, name, kind: "person" };
}
