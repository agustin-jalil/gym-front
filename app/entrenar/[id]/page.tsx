'use client'

import { use, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ClipboardList, Minus, Plus, Timer, X } from 'lucide-react'
import { PageContainer } from '@/components/page'
import { Card } from '@/components/ui/card'
import { Button, ButtonLink } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { NumField } from '@/components/ui/fields'
import { EmptyState, LoadingState } from '@/components/ui/states'
import { gym, useGym } from '@/lib/store'
import { lastTime } from '@/lib/stats'
import { cn, formatClock, formatDuration, formatKg } from '@/lib/utils'

/** Reloj que se actualiza solo (para el tiempo transcurrido y el descanso). */
function useNow(intervalMs = 500) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(t)
  }, [intervalMs])
  return now
}

export default function EntrenarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const g = useGym()
  const router = useRouter()
  const now = useNow()
  const [rest, setRest] = useState<{ end: number; total: number } | null>(null)
  const [confirm, setConfirm] = useState<'discard' | null>(null)
  const leaving = useRef(false)

  const routine = g.routines.find((r) => r.id === id)
  const draft = g.draft

  // Al entrar sin entrenamiento en curso, arranca uno nuevo con los pesos de la última vez.
  useEffect(() => {
    if (g.hydrated && routine && !draft && !leaving.current) gym.startWorkout(id)
  }, [g.hydrated, routine, draft, id])

  // Aviso al terminar el descanso (vibra si el dispositivo puede).
  const restDone = rest !== null && now >= rest.end
  useEffect(() => {
    if (restDone) {
      try {
        navigator.vibrate?.([200, 100, 200])
      } catch {
        /* sin soporte */
      }
    }
  }, [restDone])

  const doneSets = useMemo(
    () => draft?.exercises.reduce((a, e) => a + e.sets.filter((s) => s.done).length, 0) ?? 0,
    [draft],
  )
  const totalSets = useMemo(() => draft?.exercises.reduce((a, e) => a + e.sets.length, 0) ?? 0, [draft])

  if (!g.hydrated)
    return (
      <PageContainer size="sm">
        <LoadingState />
      </PageContainer>
    )

  if (!routine)
    return (
      <PageContainer size="sm">
        <EmptyState
          icon={<ClipboardList />}
          title="Esa rutina no existe"
          action={<ButtonLink href="/rutinas">Ver rutinas</ButtonLink>}
        />
      </PageContainer>
    )

  // Hay un entrenamiento de otra rutina a medio hacer: se decide qué hacer con él.
  if (draft && draft.routineId !== id)
    return (
      <PageContainer size="sm">
        <EmptyState
          icon={<Timer />}
          title="Ya tenés un entrenamiento en curso"
          description={`Estás a mitad de "${draft.routineName}". Terminalo o descartalo antes de empezar "${routine.name}".`}
          action={
            <div className="flex flex-col gap-2 medium:flex-row">
              <ButtonLink href={`/entrenar/${draft.routineId}`}>Continuar el anterior</ButtonLink>
              <Button variant="outline" onClick={() => gym.discardWorkout()}>
                Descartar y empezar este
              </Button>
            </div>
          }
        />
      </PageContainer>
    )

  if (!draft)
    return (
      <PageContainer size="sm">
        <LoadingState />
      </PageContainer>
    )

  const elapsed = now - new Date(draft.startedAt).getTime()
  const restLeft = rest ? Math.max(0, (rest.end - now) / 1000) : 0

  const finish = () => {
    leaving.current = true
    const sid = gym.finishWorkout()
    if (!sid) leaving.current = false
    else router.replace('/historial')
  }

  const discard = () => {
    leaving.current = true
    gym.discardWorkout()
    router.replace('/')
  }

  return (
    <div className="mx-auto max-w-2xl pb-28">
      <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur-xl">
        <div className="flex items-center gap-2 px-3 py-2 medium:px-6">
          <Button variant="ghost" size="icon" aria-label="Salir (se guarda tu progreso)" onClick={() => router.push('/')}>
            <X />
          </Button>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-lg leading-tight">{draft.routineName}</p>
            <p className="text-xs text-muted-foreground">
              {formatDuration(elapsed)} · {doneSets}/{totalSets} series
            </p>
          </div>
          <Button onClick={finish} disabled={doneSets === 0}>
            Terminar
          </Button>
        </div>

        {rest ? (
          <div
            role="timer"
            aria-live="off"
            className={cn(
              'flex items-center gap-2 px-3 pb-2 medium:px-6',
              restDone ? 'text-primary' : 'text-foreground',
            )}
          >
            <Timer className="size-4 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold">{restDone ? '¡A la próxima serie!' : `Descanso ${formatClock(restLeft)}`}</p>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-500 ease-linear"
                  style={{ width: `${restDone ? 100 : 100 - (restLeft / rest.total) * 100}%` }}
                />
              </div>
            </div>
            <Button variant="ghost" size="sm" aria-label="Restar 15 segundos" onClick={() => setRest({ ...rest, end: rest.end - 15000 })}>
              −15
            </Button>
            <Button variant="ghost" size="sm" aria-label="Sumar 15 segundos" onClick={() => setRest({ ...rest, end: rest.end + 15000, total: rest.total + 15 })}>
              +15
            </Button>
            <Button variant="outline" size="sm" onClick={() => setRest(null)}>
              Omitir
            </Button>
          </div>
        ) : null}
      </header>

      <div className="rise space-y-4 px-4 py-4 medium:px-6">
        {draft.exercises.map((le, ei) => {
          const ex = g.exercises.find((e) => e.id === le.exerciseId)
          const prev = lastTime(g.sessions, le.exerciseId)
          return (
            <Card key={`${le.exerciseId}-${ei}`}>
              <div className="space-y-3 p-4">
                <div>
                  <h2 className="font-display text-xl leading-tight">{ex?.name ?? 'Ejercicio eliminado'}</h2>
                  {prev ? (
                    <p className="text-xs text-muted-foreground">
                      Última vez: {prev.map((s) => `${s.reps}×${formatKg(s.weight)}`).join(' · ')} kg
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Primera vez con este ejercicio.</p>
                  )}
                </div>

                <div className="grid grid-cols-[2rem_1fr_1fr_2.75rem] items-center gap-x-2 gap-y-2">
                  <span className="text-xs font-medium text-muted-foreground">Serie</span>
                  <span className="text-center text-xs font-medium text-muted-foreground">Kg</span>
                  <span className="text-center text-xs font-medium text-muted-foreground">Reps</span>
                  <span className="sr-only">Hecha</span>

                  {le.sets.map((set, si) => (
                    <SetRow
                      key={si}
                      index={si}
                      set={set}
                      onWeight={(n) => gym.updateSet(ei, si, { weight: n })}
                      onReps={(n) => gym.updateSet(ei, si, { reps: Math.max(0, Math.round(n)) })}
                      onToggle={() => {
                        gym.updateSet(ei, si, { done: !set.done })
                        if (!set.done && le.restSec > 0) setRest({ end: Date.now() + le.restSec * 1000, total: le.restSec })
                      }}
                    />
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => gym.addSet(ei)}>
                    <Plus /> Serie
                  </Button>
                  {le.sets.length > 1 ? (
                    <Button variant="ghost" size="sm" onClick={() => gym.removeSet(ei, le.sets.length - 1)}>
                      <Minus /> Quitar última
                    </Button>
                  ) : null}
                </div>
              </div>
            </Card>
          )
        })}

        <div className="pt-2 text-center">
          <Button variant="ghost" onClick={() => setConfirm('discard')} className="text-destructive-ink">
            Descartar entrenamiento
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirm === 'discard'}
        destructive
        title="¿Descartar el entrenamiento?"
        description="Se pierde lo que registraste en esta sesión."
        confirmLabel="Descartar"
        onCancel={() => setConfirm(null)}
        onConfirm={discard}
      />
    </div>
  )
}

function SetRow({
  index,
  set,
  onWeight,
  onReps,
  onToggle,
}: {
  index: number
  set: { reps: number; weight: number; done: boolean }
  onWeight: (n: number) => void
  onReps: (n: number) => void
  onToggle: () => void
}) {
  return (
    <>
      <span className={cn('text-sm font-bold', set.done ? 'text-primary' : 'text-muted-foreground')}>{index + 1}</span>
      <NumField value={set.weight} onChange={onWeight} aria-label={`Serie ${index + 1}: kilos`} className={set.done ? 'border-primary/40 bg-primary/10' : undefined} />
      <NumField value={set.reps} onChange={onReps} aria-label={`Serie ${index + 1}: repeticiones`} className={set.done ? 'border-primary/40 bg-primary/10' : undefined} />
      <button
        type="button"
        aria-pressed={set.done}
        aria-label={`Serie ${index + 1} ${set.done ? 'hecha' : 'pendiente'}`}
        onClick={onToggle}
        className={cn(
          'flex size-11 items-center justify-center rounded-xl border transition-all',
          set.done
            ? 'border-transparent bg-primary text-primary-foreground shadow-[0_6px_18px_-8px_var(--primary)]'
            : 'border-input bg-transparent text-muted-foreground hover:bg-accent',
        )}
      >
        <Check className="size-5" />
      </button>
    </>
  )
}
