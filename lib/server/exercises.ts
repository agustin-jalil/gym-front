import "server-only";
import type { Pool, PoolClient } from "pg";

export type Queryable = Pick<Pool | PoolClient, "query">;

export interface ExerciseRecord {
  id: string;
  name: string;
  muscleGroup: string | null;
  equipment: string | null;
  isCustom: boolean;
}

export interface NewExercise {
  id?: string;
  name: string;
  muscleGroup?: string | null;
  equipment?: string | null;
  isCustom?: boolean;
}

interface ExerciseRow {
  id: string;
  name: string;
  muscle_group: string | null;
  equipment: string | null;
  is_custom: boolean;
}

const COLUMNS = "id, name, muscle_group, equipment, is_custom";

function toRecord(row: ExerciseRow): ExerciseRecord {
  return {
    id: row.id,
    name: row.name,
    muscleGroup: row.muscle_group,
    equipment: row.equipment,
    isCustom: row.is_custom,
  };
}

export async function listExercises(db: Queryable): Promise<ExerciseRecord[]> {
  const res = await db.query<ExerciseRow>(`select ${COLUMNS} from exercises order by name`);
  return res.rows.map(toRecord);
}

export async function getExercise(db: Queryable, id: string): Promise<ExerciseRecord | null> {
  const res = await db.query<ExerciseRow>(`select ${COLUMNS} from exercises where id = $1`, [id]);
  return res.rows[0] ? toRecord(res.rows[0]) : null;
}

export async function createExercise(db: Queryable, input: NewExercise): Promise<ExerciseRecord> {
  const res = await db.query<ExerciseRow>(
    `insert into exercises (id, name, muscle_group, equipment, is_custom)
     values (coalesce($1::uuid, gen_random_uuid()), $2, $3, $4, $5) returning ${COLUMNS}`,
    [input.id ?? null, input.name, input.muscleGroup ?? null, input.equipment ?? null, input.isCustom ?? true],
  );
  return toRecord(res.rows[0]);
}

/** Solo borra ejercicios propios y que ninguna rutina ni serie use. Devuelve si borró. */
export async function deleteExercise(db: Queryable, id: string): Promise<boolean> {
  const res = await db.query("delete from exercises where id = $1 and is_custom", [id]);
  return (res.rowCount ?? 0) > 0;
}
