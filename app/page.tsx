'use client'

import Link from 'next/link'
import { CalendarCheck, ClipboardList, Flame, Play, RotateCcw, Weight } from 'lucide-react'
import { PageContainer, PageHeader, SectionHeader } from '@/components/page'
import { RoutineCard } from '@/components/routine-card'
import { WeekStrip } from '@/components/week-strip'
import { Badge, Card } from '@/components/ui/card'
import { Button, ButtonLink } from '@/components/ui/button'
import { EmptyState, StatCard } from '@/components/ui/states'
import { GymLoading } from '@/components/gym-loading'
import { useGym, gym } from '@/lib/store'
import { sessionVolume, sessionsThisWeek, streakWeeks, weeklyVolume } from '@/lib/stats'
import { dateLong, dateShort, formatKg } from '@/lib/utils'

function greeting(now: Date) {
  const h = now.getHours()
  return h < 6 ? '¡A entrenar de madrugada!' : h < 13 ? '¡Buen día!' : h < 20 ? '¡Buenas tardes!' : '¡Buenas noches!'
}

export default function HoyPage() {
  const g = useGym()
  if (!g.hydrated)
    return (
      <PageContainer>
        <GymLoading />
      </PageContainer>
    )

  const now = new Date()
  const todays = g.routines.filter((r) => r.days.includes(now.getDay()))
  const others = g.routines.filter((r) => !r.days.includes(now.getDay()))
  const week = sessionsThisWeek(g.sessions, now)
  const volume = weeklyVolume(g.sessions, 1, now)[0]?.volume ?? 0
  const streak = streakWeeks(g.sessions, now)
  const last = g.sessions[0]

  return (
    <PageContainer>
      <PageHeader title={greeting(now)} description={<span className="capitalize">{dateLong(now)}</span>} />

      <Card>
        <div className="p-4 medium:p-5">
          <WeekStrip sessions={g.sessions} routines={g.routines} now={now} />
        </div>
      </Card>

      {g.draft ? (
        <Card className="border-primary/60">
          <div className="flex flex-col gap-3 p-4 medium:flex-row medium:items-center medium:justify-between medium:p-5">
            <div className="space-y-0.5">
              <Badge tone="gold">En curso</Badge>
              <p className="font-display text-xl">{g.draft.routineName}</p>
              <p className="text-sm text-muted-foreground">Tenés un entrenamiento sin terminar.</p>
            </div>
            <div className="flex gap-2">
              <ButtonLink href={`/entrenar/${g.draft.routineId}`} className="flex-1 medium:flex-none">
                <RotateCcw /> Continuar
              </ButtonLink>
            </div>
          </div>
        </Card>
      ) : null}

      <section aria-label="Resumen de la semana" className="grid grid-cols-3 gap-3">
        <StatCard
          label="Esta semana"
          icon={<CalendarCheck />}
          value={week.length}
          hint={week.length === 1 ? 'entrenamiento' : 'entrenamientos'}
        />
        <StatCard label="Volumen" icon={<Weight />} value={formatKg(volume)} hint="kg movidos" />
        <StatCard
          label="Racha"
          icon={<Flame className="text-gold" />}
          value={streak}
          hint={streak === 1 ? 'semana seguida' : 'semanas seguidas'}
        />
      </section>

      {g.routines.length === 0 ? (
        <EmptyState
          icon={<ClipboardList />}
          title="Todavía no tenés rutinas"
          description="Armá tu primera rutina con los ejercicios que hacés y empezá a registrar tus series."
          action={<ButtonLink href="/rutinas">Crear rutina</ButtonLink>}
        />
      ) : (
        <>
          <section className="space-y-3">
            <SectionHeader title={todays.length > 0 ? 'Te toca hoy' : 'Hoy es día libre'} />
            {todays.length > 0 ? (
              <div className="grid gap-3 medium:grid-cols-2">
                {todays.map((r) => (
                  <RoutineCard key={r.id} routine={r} exercises={g.exercises} highlight />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No tenés ninguna rutina asignada a este día. Si querés entrenar igual, elegí una de abajo.
              </p>
            )}
          </section>

          {others.length > 0 ? (
            <section className="space-y-3">
              <SectionHeader
                title={todays.length > 0 ? 'Otras rutinas' : 'Tus rutinas'}
                actions={
                  <Link href="/rutinas" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary hover:underline">
                    Ver todas
                  </Link>
                }
              />
              <div className="grid gap-3 medium:grid-cols-2">
                {others.map((r) => (
                  <RoutineCard key={r.id} routine={r} exercises={g.exercises} />
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}

      {last ? (
        <section className="space-y-3">
          <SectionHeader title="Último entrenamiento" />
          <Card>
            <div className="flex items-center justify-between gap-3 p-4 medium:p-5">
              <div>
                <p className="font-display text-lg">{last.routineName}</p>
                <p className="text-sm text-muted-foreground">
                  {dateShort(last.finishedAt)} · {formatKg(sessionVolume(last))} kg
                </p>
              </div>
              <ButtonLink href="/historial" variant="outline" size="sm">
                Ver historial
              </ButtonLink>
            </div>
          </Card>
        </section>
      ) : g.routines.length > 0 ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Play className="size-4" /> Cuando termines tu primer entrenamiento vas a verlo acá.
        </p>
      ) : null}

      {/* Acceso discreto para volver a cargar los ejemplos si se borró todo. */}
      {g.routines.length === 0 ? (
        <div className="flex justify-center">
          <Button variant="ghost" size="sm" onClick={() => gym.reset()}>
            Cargar rutinas de ejemplo
          </Button>
        </div>
      ) : null}
    </PageContainer>
  )
}
