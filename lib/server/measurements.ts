import "server-only";
import { MEASUREMENT_FIELDS, type MeasurementField, type MeasurementInput } from "../measurements.ts";
import type { Queryable } from "./exercises";

export type MeasurementRecord = { id: string; measuredOn: string; createdAt: string } & Record<MeasurementField, number | null>;

const COLUMN: Record<MeasurementField, string> = {
  bodyWeightKg: "body_weight_kg",
  waistCm: "waist_cm",
  hipCm: "hip_cm",
  chestCm: "chest_cm",
  shouldersCm: "shoulders_cm",
  neckCm: "neck_cm",
  armRightCm: "arm_right_cm",
  armLeftCm: "arm_left_cm",
  forearmCm: "forearm_cm",
  thighRightCm: "thigh_right_cm",
  thighLeftCm: "thigh_left_cm",
  calfCm: "calf_cm",
};

const SELECT = `id, to_char(measured_on, 'YYYY-MM-DD') as measured_on, created_at, ${MEASUREMENT_FIELDS.map(
  (f) => `${COLUMN[f]}::float8 as ${COLUMN[f]}`,
).join(", ")}`;

type Row = Record<string, unknown> & { id: string; measured_on: string; created_at: Date };

function toRecord(row: Row): MeasurementRecord {
  const values = {} as Record<MeasurementField, number | null>;
  for (const f of MEASUREMENT_FIELDS) {
    const v = row[COLUMN[f]];
    values[f] = typeof v === "number" ? v : null;
  }
  return { id: row.id, measuredOn: row.measured_on, createdAt: row.created_at.toISOString(), ...values };
}

const valueParams = (input: MeasurementInput) => MEASUREMENT_FIELDS.map((f) => input[f]);

export async function listMeasurements(db: Queryable): Promise<MeasurementRecord[]> {
  const res = await db.query<Row>(`select ${SELECT} from body_measurements order by measured_on desc, created_at desc, id`);
  return res.rows.map(toRecord);
}

export async function getMeasurement(db: Queryable, id: string): Promise<MeasurementRecord | null> {
  const res = await db.query<Row>(`select ${SELECT} from body_measurements where id = $1`, [id]);
  return res.rows[0] ? toRecord(res.rows[0]) : null;
}

export async function createMeasurement(db: Queryable, input: MeasurementInput): Promise<MeasurementRecord> {
  const cols = MEASUREMENT_FIELDS.map((f) => COLUMN[f]);
  const placeholders = MEASUREMENT_FIELDS.map((_, i) => `$${i + 3}`);
  const res = await db.query<Row>(
    `insert into body_measurements (id, measured_on, ${cols.join(", ")})
     values (coalesce($1::uuid, gen_random_uuid()), $2::date, ${placeholders.join(", ")}) returning ${SELECT}`,
    [input.id ?? null, input.measuredOn, ...valueParams(input)],
  );
  return toRecord(res.rows[0]);
}

/** Reemplaza fecha y todas las medidas. Devuelve null si no existe. */
export async function updateMeasurement(db: Queryable, id: string, input: MeasurementInput): Promise<MeasurementRecord | null> {
  const sets = MEASUREMENT_FIELDS.map((f, i) => `${COLUMN[f]} = $${i + 3}`);
  const res = await db.query<Row>(
    `update body_measurements set measured_on = $2::date, ${sets.join(", ")} where id = $1 returning ${SELECT}`,
    [id, input.measuredOn, ...valueParams(input)],
  );
  return res.rows[0] ? toRecord(res.rows[0]) : null;
}

export async function deleteMeasurement(db: Queryable, id: string): Promise<boolean> {
  const res = await db.query("delete from body_measurements where id = $1", [id]);
  return (res.rowCount ?? 0) > 0;
}
