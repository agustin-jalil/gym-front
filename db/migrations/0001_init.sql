create table exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) > 0),
  muscle_group text,
  equipment text,
  is_custom boolean not null default false,
  created_at timestamptz not null default now()
);

create table routines (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) > 0),
  type text not null default 'hipertrofia' check (type in ('hipertrofia', 'estres_metabolico')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table routine_days (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references routines(id) on delete cascade,
  position integer not null check (position >= 0),
  name text not null,
  weekday smallint check (weekday between 0 and 6),
  unique (routine_id, position)
);

create table routine_exercises (
  id uuid primary key default gen_random_uuid(),
  routine_day_id uuid not null references routine_days(id) on delete cascade,
  exercise_id uuid not null references exercises(id),
  position integer not null check (position >= 0),
  sets integer not null check (sets > 0),
  reps_min integer not null check (reps_min > 0),
  reps_max integer not null,
  weight_kg numeric(6,2) check (weight_kg >= 0),
  rest_seconds integer not null check (rest_seconds >= 0),
  check (reps_max >= reps_min),
  unique (routine_day_id, position)
);

create table workouts (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid references routines(id) on delete set null,
  routine_day_id uuid references routine_days(id) on delete set null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  notes text
);
create index workouts_started_at_idx on workouts (started_at desc);

create table workout_sets (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references workouts(id) on delete cascade,
  exercise_id uuid not null references exercises(id),
  set_number integer not null check (set_number > 0),
  weight_kg numeric(6,2) not null check (weight_kg >= 0),
  reps integer not null check (reps >= 0),
  rpe numeric(3,1) check (rpe between 1 and 10),
  created_at timestamptz not null default now()
);
create index workout_sets_exercise_idx on workout_sets (exercise_id, created_at desc);

create table body_measurements (
  id uuid primary key default gen_random_uuid(),
  measured_on date not null,
  body_weight_kg numeric(5,2) check (body_weight_kg > 0),
  waist_cm numeric(5,1) check (waist_cm > 0),
  hip_cm numeric(5,1) check (hip_cm > 0),
  chest_cm numeric(5,1) check (chest_cm > 0),
  shoulders_cm numeric(5,1) check (shoulders_cm > 0),
  neck_cm numeric(5,1) check (neck_cm > 0),
  arm_right_cm numeric(5,1) check (arm_right_cm > 0),
  arm_left_cm numeric(5,1) check (arm_left_cm > 0),
  forearm_cm numeric(5,1) check (forearm_cm > 0),
  thigh_right_cm numeric(5,1) check (thigh_right_cm > 0),
  thigh_left_cm numeric(5,1) check (thigh_left_cm > 0),
  calf_cm numeric(5,1) check (calf_cm > 0),
  created_at timestamptz not null default now()
);
create index body_measurements_date_idx on body_measurements (measured_on desc);
