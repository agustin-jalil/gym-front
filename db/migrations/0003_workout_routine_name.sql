-- Conserva el nombre de la rutina aunque la rutina se borre (workouts.routine_id queda en null).
alter table workouts add column if not exists routine_name text;
