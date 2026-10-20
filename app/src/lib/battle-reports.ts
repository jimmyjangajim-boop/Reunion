import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import { all, one, audit } from "./db.ts";
import type { DB, Row } from "./db.ts";
import { historicalDateSchema, dateValue, exactDate } from "./dates.ts";
export const casualtyCategories = [
  "KIA",
  "WIA",
  "MIA",
  "POW",
  "unspecified",
] as const;
const optionalText = z
  .string()
  .trim()
  .min(1)
  .max(2000)
  .nullable()
  .default(null);
const count = z.number().int().nonnegative().safe().nullable().default(null);
export const battleProposalSchema = z
  .object({
    battle_id: z.string().nullable().default(null),
    name: optionalText,
    reference: z
      .string()
      .trim()
      .max(120)
      .regex(/^[a-z0-9][a-z0-9_./-]*$/i)
      .transform((s) => s.toUpperCase())
      .nullable()
      .default(null),
    date_info: historicalDateSchema.default(() => dateValue()),
    location: optionalText,
    belligerents: optionalText,
    outcome: optionalText,
    participants: z
      .array(
        z
          .object({
            unit_id: z.string().nullable().default(null),
            name: optionalText,
            side: optionalText,
            create_unit: z.boolean().default(false),
            branch: optionalText,
            unit_type: optionalText,
            casualties: z
              .object({
                KIA: count,
                WIA: count,
                MIA: count,
                POW: count,
                unspecified: count,
              })
              .default(() => ({
                KIA: null,
                WIA: null,
                MIA: null,
                POW: null,
                unspecified: null,
              })),
          })
          .strict(),
      )
      .max(100)
      .default([]),
    losses: z
      .array(
        z
          .object({
            equipment: optionalText,
            count,
            state: z.enum(["lost", "damaged", "unknown"]).default("unknown"),
            asset_id: z.string().nullable().default(null),
            participant_index: z
              .number()
              .int()
              .nonnegative()
              .nullable()
              .default(null),
          })
          .strict(),
      )
      .max(200)
      .default([]),
  })
  .strict();
export const battleFields = {
  battle: battleProposalSchema.nullable().default(null),
  expected_battle_state: z.string().nullable().default(null),
};
function selectedBattle(db: DB, b: Row) {
  return b.battle_id
    ? one(db, "SELECT * FROM battles WHERE id=?", b.battle_id)
    : undefined;
}
function phase(db: DB, b: Row) {
  return b.battle_id && b.reference
    ? one(
        db,
        "SELECT * FROM battle_report_records WHERE battle_id=? AND reference=?",
        b.battle_id,
        b.reference,
      )
    : undefined;
}
function resolvedUnit(
  db: DB,
  p: Row | undefined,
  corroborating = false,
): Row | undefined {
  if (!p) return undefined;
  if (p.unit_id) return one(db, "SELECT * FROM units WHERE id=?", p.unit_id);
  if (p.create_unit && corroborating) {
    const matches = all(
      db,
      "SELECT * FROM units WHERE lower(name)=lower(?)",
      p.name,
    );
    if (matches.length === 1) return matches[0];
  }
  return undefined;
}
function signature(db: DB, b: Row, corroborating = false) {
  const participants = b.participants.map((p: Row) => {
    const unit = resolvedUnit(db, p, corroborating);
    return {
      key: unit?.id ?? p.name?.toLocaleLowerCase() ?? null,
      name: unit?.name ?? p.name,
      side: p.side,
      casualties: p.casualties,
    };
  });
  const losses = b.losses.map((l: Row) => ({
    ...l,
    participant_index: undefined,
    unit:
      l.participant_index === null
        ? null
        : (participants[l.participant_index]?.key ?? null),
  }));
  return createHash("sha256")
    .update(
      JSON.stringify({
        date: b.date_info,
        location: b.location,
        belligerents: b.belligerents,
        outcome: b.outcome,
        participants: participants.sort((a: Row, c: Row) =>
          JSON.stringify(a).localeCompare(JSON.stringify(c)),
        ),
        losses: losses.sort((a: Row, c: Row) =>
          JSON.stringify(a).localeCompare(JSON.stringify(c)),
        ),
      }),
    )
    .digest("hex");
}
export function battleState(db: DB, p: Row) {
  const b = p.battle;
  if (!b) return null;
  const battle = selectedBattle(db, b);
  const names = b.participants
    .filter((u: Row) => u.create_unit && u.name)
    .map((u: Row) => u.name.toLowerCase());
  const units = b.participants.map((u: Row) =>
    u.unit_id ? one(db, "SELECT * FROM units WHERE id=?", u.unit_id) : null,
  );
  const matching = names.flatMap((name: string) =>
    all(db, "SELECT * FROM units WHERE lower(name)=? ORDER BY id", name),
  );
  const assets = b.losses
    .filter((l: Row) => l.asset_id)
    .map((l: Row) => ({
      asset: one(db, "SELECT * FROM assets WHERE id=?", l.asset_id),
      assignments: all(
        db,
        "SELECT * FROM asset_assignments WHERE asset_id=? ORDER BY id",
        l.asset_id,
      ),
      effects: all(
        db,
        "SELECT * FROM battle_asset_effects WHERE asset_id=? ORDER BY loss_id",
        l.asset_id,
      ),
    }));
  return createHash("sha256")
    .update(
      JSON.stringify({
        battle: battle ?? null,
        nameMatches: b.battle_id
          ? null
          : all(
              db,
              "SELECT * FROM battles WHERE lower(name)=lower(?) ORDER BY id",
              b.name,
            ),
        phases: battle
          ? all(
              db,
              "SELECT * FROM battle_report_records WHERE battle_id=? ORDER BY id",
              battle.id,
            )
          : [],
        casualties: battle
          ? all(
              db,
              "SELECT * FROM casualties WHERE battle_id=? ORDER BY id",
              battle.id,
            )
          : [],
        units,
        matching,
        assets,
      }),
    )
    .digest("hex");
}
export function validateBattle(db: DB, p: Row) {
  const missing: string[] = [],
    warnings: string[] = [];
  const b = p.battle;
  if (!b)
    return {
      ready: false,
      missing: ["Supply the battle report details."],
      warnings,
      existing: undefined,
    };
  const battle = selectedBattle(db, b),
    existing = phase(db, b);
  if (b.battle_id && !battle)
    missing.push("The selected battle no longer exists.");
  if (!b.battle_id && !b.name)
    missing.push("Name the new battle or select an existing battle.");
  if (
    !b.battle_id &&
    b.name &&
    one(db, "SELECT id FROM battles WHERE lower(name)=lower(?)", b.name)
  )
    missing.push(
      "A battle already has this name. Select it for a follow-up report, or supply the distinct battle name.",
    );
  if (!b.reference)
    missing.push(
      "Supply a report or combat-phase reference to prevent duplicate casualty and loss records.",
    );
  if (p.expected_battle_state !== battleState(db, p))
    missing.push(
      "The battle, formation or asset records changed after this proposal. Save a reasoned correction before approval.",
    );
  if (b.date_info.precision === "unknown")
    warnings.push(
      "The engagement date remains unknown; no dated military snapshot will be inferred.",
    );
  warnings.push(
    "Casualty categories and combat phases remain separate. Unit personnel, readiness and anonymous inventory totals are not automatically reduced.",
  );
  const seen = new Set<string>();
  b.participants.forEach((u: Row, i: number) => {
    const unit = resolvedUnit(db, u, !!existing),
      key = unit?.id ?? u.name?.toLowerCase();
    if (key && seen.has(key))
      missing.push("List each formation once per combat phase.");
    if (key) seen.add(key);
    if (u.unit_id && !unit)
      missing.push(
        `Participant ${i + 1}: the selected formation no longer exists.`,
      );
    if (unit && u.name && unit.name.toLowerCase() !== u.name.toLowerCase())
      missing.push(
        `Participant ${i + 1}: the reported name and selected formation differ.`,
      );
    if (u.create_unit) {
      if (u.unit_id)
        missing.push("Select an existing formation or create one, not both.");
      if (!u.name || !u.branch || !u.unit_type)
        missing.push(
          "A new formation needs its supplied name, branch and type.",
        );
      if (
        !existing &&
        u.name &&
        one(db, "SELECT id FROM units WHERE lower(name)=lower(?)", u.name)
      )
        missing.push(
          "A formation already has this name. Select the existing formation.",
        );
      if (existing && !unit)
        missing.push(
          "The formation in the corroborating report cannot be resolved uniquely.",
        );
    } else if (!unit && u.name)
      warnings.push(
        `“${u.name}” is recorded as an unresolved participant; no new OOB formation will be invented.`,
      );
  });
  const assets = new Set<string>();
  b.losses.forEach((loss: Row, i: number) => {
    if (!loss.equipment)
      missing.push(
        `Equipment loss ${i + 1}: supply the reported equipment name.`,
      );
    if (
      loss.participant_index !== null &&
      !b.participants[loss.participant_index]
    )
      missing.push(
        "A loss refers to a participant that is not in this report.",
      );
    if (loss.asset_id) {
      if (assets.has(loss.asset_id))
        missing.push("A tracked asset can be listed only once per phase.");
      assets.add(loss.asset_id);
      const asset = one(db, "SELECT * FROM assets WHERE id=?", loss.asset_id);
      if (!asset) missing.push("The selected tracked asset no longer exists.");
      if (loss.count !== 1)
        missing.push(
          "A tracked asset represents one item; explicitly report a count of 1.",
        );
      if (loss.state === "unknown")
        missing.push("Choose lost or damaged before changing a tracked asset.");
      if (b.date_info.precision !== "day")
        missing.push(
          "An exact engagement date is required to update a tracked asset. Unidentified losses can remain undated.",
        );
      if (
        !existing &&
        asset &&
        ![
          "delivered",
          "accepted",
          "operational",
          "damaged",
          "under repair",
        ].includes(asset.operation)
      )
        missing.push(
          "The tracked asset is not in an eligible delivered/service state for a new loss.",
        );
      if (!existing && b.date_info.precision === "day") {
        const date = b.date_info.label;
        if (
          one(
            db,
            "SELECT loss_id FROM battle_asset_effects WHERE asset_id=? AND date>?",
            loss.asset_id,
            date,
          ) ||
          one(
            db,
            "SELECT id FROM asset_assignments WHERE asset_id=? AND start_date>?",
            loss.asset_id,
            date,
          )
        )
          missing.push(
            "A later asset state or assignment conflicts with this backdated loss. Preserve it for review.",
          );
        const participant =
          loss.participant_index === null
            ? undefined
            : resolvedUnit(db, b.participants[loss.participant_index]);
        const assignments = all(
          db,
          "SELECT * FROM asset_assignments WHERE asset_id=? AND start_date<=? AND COALESCE(end_date,'9999-12-31')>=?",
          loss.asset_id,
          date,
          date,
        );
        const reportedParticipant =
          loss.participant_index === null
            ? null
            : b.participants[loss.participant_index];
        if (
          (participant &&
            assignments.some((a) => a.unit_id !== participant.id)) ||
          (reportedParticipant?.create_unit && assignments.length > 0)
        )
          missing.push(
            "The asset was assigned to a different formation on this date.",
          );
      }
    }
  });
  if (existing) {
    if (existing.signature !== signature(db, b, true))
      missing.push(
        "This phase reference already identifies different battle facts, casualties or losses. Leave the conflict pending; do not overwrite or double-count it.",
      );
    else
      warnings.push(
        "This corroborates an existing combat phase. Only source evidence will be added.",
      );
  }
  return {
    ready: !missing.length,
    missing: [...new Set(missing)],
    warnings,
    existing,
  };
}
/** All effects share the existing report approval transaction. */
export function recordBattleReport(
  db: DB,
  p: Row,
  source: Row,
  reason: string,
) {
  const check = validateBattle(db, p);
  if (!check.ready) throw Error(check.missing.join(" "));
  const b = battleProposalSchema.parse(p.battle);
  let battleId = b.battle_id,
    recordId = check.existing?.id;
  if (!recordId) {
    if (!battleId) {
      battleId = randomUUID();
      db.prepare(
        "INSERT INTO battles(id,name,date_json,theater,outcome,canon,source_id) VALUES(?,?,?,?,?,?,?)",
      ).run(
        battleId,
        b.name,
        JSON.stringify(b.date_info),
        b.location,
        b.outcome,
        "confirmed",
        source.source_id,
      );
    }
    const participants = b.participants.map((u) => ({ ...u }));
    for (const u of participants)
      if (u.create_unit) {
        const id = randomUUID();
        db.prepare(
          "INSERT INTO units(id,name,branch,unit_type,source_id) VALUES(?,?,?,?,?)",
        ).run(id, u.name, u.branch, u.unit_type, source.source_id);
        u.unit_id = id;
        u.create_unit = false;
        audit(
          db,
          "create_battle_formation",
          id,
          null,
          { name: u.name, branch: u.branch, unit_type: u.unit_type },
          reason,
        );
      }
    const resolved = { ...b, battle_id: battleId, participants };
    recordId = randomUUID();
    db.prepare(
      "INSERT INTO battle_report_records(id,battle_id,reference,signature,date_json,location,belligerents,outcome) VALUES(?,?,?,?,?,?,?,?)",
    ).run(
      recordId,
      battleId,
      b.reference,
      signature(db, resolved),
      JSON.stringify(b.date_info),
      b.location,
      b.belligerents,
      b.outcome,
    );
    const participantIds: string[] = [];
    for (const u of participants) {
      const id = randomUUID(),
        unit = u.unit_id
          ? one(db, "SELECT * FROM units WHERE id=?", u.unit_id)
          : undefined;
      participantIds.push(id);
      db.prepare(
        "INSERT INTO battle_report_participants(id,record_id,unit_id,name,side) VALUES(?,?,?,?,?)",
      ).run(id, recordId, u.unit_id, unit?.name ?? u.name, u.side);
      for (const category of casualtyCategories)
        if (u.casualties[category] !== null) {
          const cid = randomUUID();
          db.prepare(
            "INSERT INTO casualties(id,battle_id,unit_id,report_group,category,count,canon,source_id) VALUES(?,?,?,?,?,?,?,?)",
          ).run(
            cid,
            battleId,
            u.unit_id,
            "after-action:" + recordId + ":" + id,
            category,
            u.casualties[category],
            "confirmed",
            source.source_id,
          );
          db.prepare(
            "INSERT INTO battle_report_casualties(casualty_id,record_id,participant_id) VALUES(?,?,?)",
          ).run(cid, recordId, id);
        }
    }
    for (const loss of b.losses) {
      const id = randomUUID(),
        unitId =
          loss.participant_index === null
            ? null
            : participants[loss.participant_index].unit_id;
      db.prepare(
        "INSERT INTO battle_report_losses(id,record_id,unit_id,equipment,count,state,asset_id,participant_id) VALUES(?,?,?,?,?,?,?,?)",
      ).run(
        id,
        recordId,
        unitId,
        loss.equipment,
        loss.count,
        loss.state,
        loss.asset_id,
        loss.participant_index === null
          ? null
          : participantIds[loss.participant_index],
      );
      if (loss.asset_id) {
        const before = one(
          db,
          "SELECT * FROM assets WHERE id=?",
          loss.asset_id,
        )!;
        const assignments = all(
          db,
          "SELECT * FROM asset_assignments WHERE asset_id=?",
          loss.asset_id,
        );
        db.prepare(
          "INSERT INTO battle_asset_effects(loss_id,asset_id,date,before_state,after_state,assignments_before) VALUES(?,?,?,?,?,?)",
        ).run(
          id,
          loss.asset_id,
          b.date_info.label,
          before.operation,
          loss.state,
          JSON.stringify(assignments),
        );
        db.prepare("UPDATE assets SET operation=? WHERE id=?").run(
          loss.state,
          loss.asset_id,
        );
        if (loss.state === "lost")
          db.prepare(
            "UPDATE asset_assignments SET end_date=? WHERE asset_id=? AND start_date<=? AND COALESCE(end_date,'9999-12-31')>? ",
          ).run(
            b.date_info.label,
            loss.asset_id,
            b.date_info.label,
            b.date_info.label,
          );
        audit(
          db,
          "battle_asset_loss",
          loss.asset_id,
          { asset: before, assignments },
          {
            state: loss.state,
            date: b.date_info.label,
            report_record_id: recordId,
          },
          reason,
        );
      }
    }
  }
  db.prepare(
    "INSERT INTO battle_report_evidence(record_id,source_id,line_start,line_end,report_action_id) VALUES(?,?,?,?,?)",
  ).run(
    recordId,
    source.source_id,
    source.line_start,
    source.line_end,
    source.action_id,
  );
  audit(
    db,
    "record_after_action",
    battleId!,
    null,
    { record_id: recordId, corroboration: !!check.existing },
    reason,
  );
  return {
    id: battleId!,
    record_id: recordId,
    corroboration: !!check.existing,
  };
}
/** Bounded suggestions only; every proposed detail remains editable before approval. */
export function suggestBattle(
  db: DB,
  input: { body: string; date: string | null },
) {
  const body = z.string().min(1).max(500000).parse(input.body),
    base = battleProposalSchema.parse({});
  const warnings: string[] = [];
  const iso = body.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  let date = input.date;
  if (iso) {
    date = exactDate.safeParse(iso[1]).success ? iso[1] : null;
    if (!date)
      warnings.push(
        "The report contains an invalid calendar date. Supply the documented date manually.",
      );
  }
  const natural = body.match(
    /\b(?:On\s+)?(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:,?\s+(\d{4}))?/i,
  );
  if (!iso && natural) {
    const month =
      [
        "january",
        "february",
        "march",
        "april",
        "may",
        "june",
        "july",
        "august",
        "september",
        "october",
        "november",
        "december",
      ].indexOf(natural[1].toLowerCase()) + 1;
    const year = natural[3] ?? input.date?.slice(0, 4);
    if (year) {
      const d = `${year}-${String(month).padStart(2, "0")}-${natural[2].padStart(2, "0")}`;
      if (
        historicalDateSchema.safeParse({ precision: "day", label: d }).success
      ) {
        date = d;
        if (!natural[3])
          warnings.push(
            "The suggested year uses the explicitly supplied report date context. Verify it.",
          );
      }
    } else date = null;
  }
  base.date_info = date ? dateValue("day", date) : dateValue();
  base.location =
    body.match(/\b(?:near|at)\s+([^.!?\n]+?)(?:[.!?\n]|$)/i)?.[1]?.trim() ??
    null;
  const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const units = all(db, "SELECT * FROM units").filter((u) =>
    new RegExp(
      "(?<![\\p{L}\\p{N}])" + escape(u.name) + "(?![\\p{L}\\p{N}])",
      "iu",
    ).test(body),
  );
  const mentioned = [
    ...body.matchAll(
      /\b(?:The\s+)?(\d+(?:st|nd|rd|th)\s+[\p{L} -]+?\s+(?:Brigade|Division|Regiment|Battalion))\b/giu,
    ),
  ].map((m) => m[1].toLowerCase());
  const unrecognized = mentioned.filter(
    (name) => !units.some((u) => u.name.toLowerCase() === name),
  );
  if (units.length === 1) {
    base.participants = [
      {
        unit_id: units[0].id,
        name: units[0].name,
        side: null,
        create_unit: false,
        branch: null,
        unit_type: null,
        casualties: {
          KIA: null,
          WIA: null,
          MIA: null,
          POW: null,
          unspecified: null,
        },
      },
    ];
  } else if (units.length > 1) {
    base.participants = units.map((u) => ({
      unit_id: u.id,
      name: u.name,
      side: null,
      create_unit: false,
      branch: null,
      unit_type: null,
      casualties: {
        KIA: null,
        WIA: null,
        MIA: null,
        POW: null,
        unspecified: null,
      },
    }));
    warnings.push(
      "Several formations are named. Casualty attribution requires review and was not assigned.",
    );
  } else {
    const name = body.match(
      /\b(?:The\s+)?(\d+(?:st|nd|rd|th)\s+[\p{L} -]+?\s+(?:Brigade|Division|Regiment|Battalion))\b/u,
    )?.[1];
    base.participants = [
      {
        unit_id: null,
        name: name ?? null,
        side: null,
        create_unit: false,
        branch: null,
        unit_type: null,
        casualties: {
          KIA: null,
          WIA: null,
          MIA: null,
          POW: null,
          unspecified: null,
        },
      },
    ];
    warnings.push(
      "No unique OOB formation was resolved. No formation has been created.",
    );
  }
  if (
    base.participants.length === 1 &&
    new Set([...units.map((u) => u.name.toLowerCase()), ...mentioned]).size ===
      1 &&
    unrecognized.length <= 1 &&
    !/\b(?:not|no|might|could|would|if|hypothetical|enemy|opposing)\b/i.test(
      body,
    )
  ) {
    for (const [category, word] of [
      ["KIA", "(?:killed|KIA)"],
      ["WIA", "(?:wounded|WIA)"],
      ["MIA", "(?:missing|MIA)"],
      ["POW", "(?:captured|POW)"],
    ] as const) {
      const matches = [
        ...body.matchAll(
          new RegExp(
            "(?<![\\d,.\\-])(\\d+(?:,\\d{3})*)\\s+" + word + "\\b",
            "gi",
          ),
        ),
      ];
      if (matches.length === 1) {
        const n = Number(matches[0][1].replaceAll(",", ""));
        if (Number.isSafeInteger(n))
          base.participants[0].casualties[category] = n;
      }
    }
  } else
    warnings.push(
      "Conditional, negative or multi-formation prose needs manual casualty review.",
    );
  warnings.push(
    "Suggestions are not a full language parser. Supply the battle name/reference and review attribution, dates, casualties, losses and outcome.",
  );
  return { battle: base, warnings };
}
