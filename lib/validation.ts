export type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

export interface ExerciseInput {
  id?: string;
  name: string;
  muscleGroup: string | null;
  equipment: string | null;
}

export interface RoutineExerciseInput {
  exerciseId: string;
  sets: number;
  repsMin: number;
  repsMax: number;
  weightKg: number | null;
  restSeconds: number;
}

export interface RoutineDayInput {
  name: string;
  weekday: number | null;
  exercises: RoutineExerciseInput[];
}

export interface RoutineInput {
  id?: string;
  name: string;
  type: "hipertrofia" | "estres_metabolico";
  days: RoutineDayInput[];
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_NAME = 100;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}

function fail<T>(error: string): Parsed<T> {
  return { ok: false, error };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function text(v: unknown, path: string): Parsed<string> {
  if (typeof v !== "string") return fail(`${path} debe ser texto`);
  const t = v.trim();
  if (t.length === 0 || t.length > MAX_NAME) return fail(`${path} debe tener entre 1 y ${MAX_NAME} caracteres`);
  return { ok: true, value: t };
}

function optionalText(v: unknown, path: string): Parsed<string | null> {
  if (v === undefined || v === null) return { ok: true, value: null };
  return text(v, path);
}

function int(v: unknown, path: string, min: number, max: number): Parsed<number> {
  if (typeof v !== "number" || !Number.isInteger(v) || v < min || v > max) {
    return fail(`${path} debe ser un entero entre ${min} y ${max}`);
  }
  return { ok: true, value: v };
}

function optionalId(v: unknown): Parsed<string | undefined> {
  if (v === undefined) return { ok: true, value: undefined };
  return isUuid(v) ? { ok: true, value: v } : fail("id debe ser un uuid");
}

const withId = (id: string | undefined) => (id === undefined ? {} : { id });

export function parseNewExercise(input: unknown): Parsed<ExerciseInput> {
  if (!isRecord(input)) return fail("El cuerpo debe ser un objeto");
  const id = optionalId(input.id);
  if (!id.ok) return id;
  const name = text(input.name, "name");
  if (!name.ok) return name;
  const muscleGroup = optionalText(input.muscleGroup, "muscleGroup");
  if (!muscleGroup.ok) return muscleGroup;
  const equipment = optionalText(input.equipment, "equipment");
  if (!equipment.ok) return equipment;
  return { ok: true, value: { ...withId(id.value), name: name.value, muscleGroup: muscleGroup.value, equipment: equipment.value } };
}

function parseExercise(input: unknown, path: string): Parsed<RoutineExerciseInput> {
  if (!isRecord(input)) return fail(`${path} debe ser un objeto`);
  if (!isUuid(input.exerciseId)) return fail(`${path}.exerciseId debe ser un uuid`);
  const sets = int(input.sets, `${path}.sets`, 1, 100);
  if (!sets.ok) return sets;
  const repsMin = int(input.repsMin, `${path}.repsMin`, 1, 1000);
  if (!repsMin.ok) return repsMin;
  const repsMax = int(input.repsMax, `${path}.repsMax`, 1, 1000);
  if (!repsMax.ok) return repsMax;
  if (repsMax.value < repsMin.value) return fail(`${path}.repsMax no puede ser menor que repsMin`);
  const rest = int(input.restSeconds, `${path}.restSeconds`, 0, 3600);
  if (!rest.ok) return rest;
  let weightKg: number | null = null;
  if (input.weightKg !== undefined && input.weightKg !== null) {
    const w = input.weightKg;
    if (typeof w !== "number" || !Number.isFinite(w) || w < 0 || w > 9999) {
      return fail(`${path}.weightKg debe ser un número entre 0 y 9999`);
    }
    weightKg = w;
  }
  return {
    ok: true,
    value: {
      exerciseId: input.exerciseId,
      sets: sets.value,
      repsMin: repsMin.value,
      repsMax: repsMax.value,
      weightKg,
      restSeconds: rest.value,
    },
  };
}

function parseDay(input: unknown, path: string): Parsed<RoutineDayInput> {
  if (!isRecord(input)) return fail(`${path} debe ser un objeto`);
  const name = text(input.name, `${path}.name`);
  if (!name.ok) return name;
  let weekday: number | null = null;
  if (input.weekday !== undefined && input.weekday !== null) {
    const w = int(input.weekday, `${path}.weekday`, 0, 6);
    if (!w.ok) return w;
    weekday = w.value;
  }
  if (!Array.isArray(input.exercises)) return fail(`${path}.exercises debe ser una lista`);
  const exercises: RoutineExerciseInput[] = [];
  for (const [i, e] of input.exercises.entries()) {
    const parsed = parseExercise(e, `${path}.exercises[${i}]`);
    if (!parsed.ok) return parsed;
    exercises.push(parsed.value);
  }
  return { ok: true, value: { name: name.value, weekday, exercises } };
}

export function parseNewRoutine(input: unknown): Parsed<RoutineInput> {
  if (!isRecord(input)) return fail("El cuerpo debe ser un objeto");
  const id = optionalId(input.id);
  if (!id.ok) return id;
  const name = text(input.name, "name");
  if (!name.ok) return name;
  if (input.type !== "hipertrofia" && input.type !== "estres_metabolico") {
    return fail("type debe ser 'hipertrofia' o 'estres_metabolico'");
  }
  if (!Array.isArray(input.days)) return fail("days debe ser una lista");
  const days: RoutineDayInput[] = [];
  for (const [i, d] of input.days.entries()) {
    const parsed = parseDay(d, `days[${i}]`);
    if (!parsed.ok) return parsed;
    days.push(parsed.value);
  }
  return { ok: true, value: { ...withId(id.value), name: name.value, type: input.type, days } };
}
