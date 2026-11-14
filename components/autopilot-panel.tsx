import { Badge, Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart } from '@/components/charts'
import { SectionHeader } from '@/components/page'
import { EmptyState } from '@/components/ui/states'
import {
  durationPoints,
  taskProgress,
  taskStatus,
  type BacklogTask,
  type CheckStatus,
  type ResultadosData,
  type RutinaData,
  type SessionEntry,
  type TaskStatus,
  type VersionState,
} from '@/lib/autopilot'

const STATE_LABEL: Record<VersionState, string> = {
  PLANIFICADA: 'Planificada',
  'EN CURSO': 'En curso',
  BLOQUEADA: 'Bloqueada',
  COMPLETA: 'Completa',
}

const STATE_TONE: Record<VersionState, 'neutral' | 'primary' | 'success' | 'gold'> = {
  PLANIFICADA: 'neutral',
  'EN CURSO': 'primary',
  BLOQUEADA: 'gold',
  COMPLETA: 'success',
}

const TASK_LABEL: Record<TaskStatus, string> = {
  done: 'Hecha',
  blocked: 'Bloqueada',
  ready: 'Lista para empezar',
  waiting: 'Espera dependencias',
}

const TASK_TONE: Record<TaskStatus, 'neutral' | 'primary' | 'success' | 'gold'> = {
  done: 'success',
  blocked: 'gold',
  ready: 'primary',
  waiting: 'neutral',
}

function ProgressBar({ done, total, percent, label }: { done: number; total: number; percent: number; label: string }) {
  return (
    <div className="space-y-1.5">
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        aria-valuetext={`${done} de ${total} tareas hechas`}
        className="h-2.5 w-full overflow-hidden rounded-full bg-muted"
      >
        <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
      </div>
      <p className="text-sm text-muted-foreground">
        {done} de {total} tareas hechas · {percent} %
      </p>
    </div>
  )
}

function TaskRow({ task, all }: { task: BacklogTask; all: BacklogTask[] }) {
  const status = taskStatus(task, all)
  return (
    <li className="flex flex-col gap-1.5 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold">{task.id}</span>
        <Badge tone={TASK_TONE[status]}>{TASK_LABEL[status]}</Badge>
      </div>
      <p className="text-sm">{task.title}</p>
      <p className="text-xs text-muted-foreground">
        {task.dependsOn.length === 0 ? 'Sin dependencias' : `Depende de: ${task.dependsOn.join(', ')}`}
      </p>
      {task.blocked ? <p className="text-xs text-muted-foreground">Bloqueo: {task.blocked}</p> : null}
    </li>
  )
}

export function AutopilotVersions({ rutina }: { rutina: RutinaData }) {
  return (
    <section className="space-y-3">
      <SectionHeader title="Versiones" />
      {rutina.versions.map((v) => {
        const tasks = rutina.backlogs.find((b) => b.version === v.version)?.tasks ?? []
        const progress = taskProgress(tasks)
        return (
          <Card key={v.version} aria-labelledby={`v-${v.version}`}>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle id={`v-${v.version}`}>{v.version}</CardTitle>
                <Badge tone={STATE_TONE[v.state]}>{STATE_LABEL[v.state]}</Badge>
              </div>
              {v.note ? <p className="text-sm text-muted-foreground">{v.note}</p> : null}
            </CardHeader>
            <CardContent className="space-y-3">
              {tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">Esta versión todavía no tiene tareas.</p>
              ) : (
                <>
                  <ProgressBar {...progress} label={`Progreso de ${v.version}`} />
                  <ul className="divide-y">
                    {tasks.map((t) => (
                      <TaskRow key={t.id} task={t} all={tasks} />
                    ))}
                  </ul>
                </>
              )}
            </CardContent>
          </Card>
        )
      })}
    </section>
  )
}

const CHECK_LABEL: Record<CheckStatus | 'unknown', string> = { pass: 'Pasó', fail: 'Falló', 'not-run': 'No corrido', unknown: 'Sin dato' }
const CHECK_TONE: Record<CheckStatus | 'unknown', 'neutral' | 'primary' | 'success' | 'gold'> = {
  pass: 'success',
  fail: 'gold',
  'not-run': 'neutral',
  unknown: 'neutral',
}

function Check({ name, status }: { name: string; status: CheckStatus | null }) {
  const key = status ?? 'unknown'
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span className="text-muted-foreground">{name}</span>
      <Badge tone={CHECK_TONE[key]}>{CHECK_LABEL[key]}</Badge>
    </span>
  )
}

const RECENT = 10

function SessionRow({ s }: { s: SessionEntry }) {
  return (
    <li className="flex flex-col gap-1.5 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold">
          {s.date} {s.time} UTC
        </span>
        {s.result ? <Badge tone={s.result.startsWith('OK') ? 'success' : 'gold'}>{s.result}</Badge> : null}
      </div>
      <p className="text-sm">
        {s.tasks.join(', ')} · {s.title}
      </p>
      <p className="text-xs text-muted-foreground">
        Duración: {s.durationMin === null ? 'sin dato' : `${s.durationMin} min`} · Tiempo al 90 %: {s.timeTo90 ?? 'sin dato'}
      </p>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <Check name="Typecheck" status={s.verification.typecheck} />
        <Check name="Build" status={s.verification.build} />
        <Check name="Tests" status={s.verification.tests} />
      </div>
    </li>
  )
}

export function AutopilotSessions({ resultados }: { resultados: ResultadosData }) {
  const recent = resultados.sessions.toSorted((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`)).slice(0, RECENT)
  const points = durationPoints(recent)
  return (
    <section className="space-y-3">
      <SectionHeader title="Últimas sesiones" />
      {recent.length === 0 ? (
        <EmptyState title="Todavía no hay sesiones" description="RESULTADOS.MD no tiene entradas de sesión." />
      ) : (
        <>
          {points.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Duración por sesión</CardTitle>
              </CardHeader>
              <CardContent>
                <BarChart points={points} unit="min" label="Duración por sesión" />
              </CardContent>
            </Card>
          ) : null}
          <Card>
            <CardContent className="pt-1 medium:pt-1">
              <ul className="divide-y">
                {recent.map((s) => (
                  <SessionRow key={`${s.date}-${s.time}-${s.tasks.join('-')}`} s={s} />
                ))}
              </ul>
            </CardContent>
          </Card>
        </>
      )}
    </section>
  )
}
