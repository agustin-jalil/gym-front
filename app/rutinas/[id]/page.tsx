'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowDown, ArrowUp, ClipboardList, Play, Plus, Trash2 } from 'lucide-react'
import { PageContainer, PageHeader, SectionHeader } from '@/components/page'
import { Card } from '@/components/ui/card'
import { Button, ButtonLink } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Field, Input, NativeSelect, NumField } from '@/components/ui/fields'
import { EmptyState } from '@/components/ui/states'
import { GymLoading } from '@/components/gym-loading'
import { gym, useGym } from '@/lib/store'
import { MUSCLES, WEEK, cn } from '@/lib/utils'

export default function EditarRutinaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const g = useGym()
  const router = useRouter()
  const [pick, setPick] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!g.hydrated)
    return (
      <PageContainer size="sm">
        <GymLoading />
      </PageContainer>
    )

  const routine = g.routines.find((r) => r.id === id)
  if (!routine)
    return (
      <PageContainer size="sm">
        <EmptyState
          icon={<ClipboardList />}
          title="Esa rutina no existe"
          description="Pudo haberse borrado."
          action={<ButtonLink href="/rutinas">Volver a rutinas</ButtonLink>}
        />
      </PageContainer>
    )

  const toggleDay = (day: number) =>
    gym.updateRoutine(id, { days: routine.days.includes(day) ? routine.days.filter((d) => d !== day) : [...routine.days, day] })

  const add = () => {
    if (!pick) return
    gym.addRoutineExercise(id, pick)
    setPick('')
  }

  return (
    <PageContainer size="sm">
      <PageHeader
        back={{ href: '/rutinas', label: 'Rutinas' }}
        title="Editar rutina"
        actions={
          routine.exercises.length > 0 ? (
            <ButtonLink href={`/entrenar/${id}`}>
              <Play /> Empezar
            </ButtonLink>
          ) : undefined
        }
      />

      <Card>
        <div className="space-y-5 p-4 medium:p-5">
          <Field label="Nombre">
            <Input value={routine.name} maxLength={40} onChange={(e) => gym.updateRoutine(id, { name: e.target.value })} />
          </Field>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Días que entrenás</legend>
            <div className="flex gap-1.5">
              {WEEK.map((d) => {
                const on = routine.days.includes(d.day)
                return (
                  <button
                    key={d.day}
                    type="button"
                    aria-pressed={on}
                    aria-label={d.long}
                    onClick={() => toggleDay(d.day)}
                    className={cn(
                      'h-11 flex-1 rounded-md border text-sm font-bold transition-colors',
                      on ? 'border-transparent bg-primary text-primary-foreground' : 'border-input bg-card hover:bg-accent',
                    )}
                  >
                    {d.short}
                  </button>
                )
              })}
            </div>
          </fieldset>
        </div>
      </Card>

      <section className="space-y-3">
        <SectionHeader title="Ejercicios" />

        {routine.exercises.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no sumaste ejercicios. Elegí uno de la lista de abajo.</p>
        ) : (
          <ul className="space-y-3">
            {routine.exercises.map((re, i) => {
              const ex = g.exercises.find((e) => e.id === re.exerciseId)
              return (
                <li key={`${re.exerciseId}-${i}`}>
                  <Card>
                    <div className="space-y-3 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="min-w-0 truncate font-display text-lg">{ex?.name ?? 'Ejercicio eliminado'}</p>
                        <div className="flex shrink-0">
                          <Button variant="ghost" size="icon" aria-label="Subir" disabled={i === 0} onClick={() => gym.moveRoutineExercise(id, i, -1)}>
                            <ArrowUp />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Bajar"
                            disabled={i === routine.exercises.length - 1}
                            onClick={() => gym.moveRoutineExercise(id, i, 1)}
                          >
                            <ArrowDown />
                          </Button>
                          <Button variant="ghost" size="icon" aria-label="Quitar ejercicio" onClick={() => gym.removeRoutineExercise(id, i)}>
                            <Trash2 />
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        <Field label="Series">
                          <NumField value={re.sets} onChange={(n) => gym.updateRoutineExercise(id, i, { sets: Math.max(1, Math.round(n)) })} />
                        </Field>
                        <Field label="Reps">
                          <NumField value={re.reps} onChange={(n) => gym.updateRoutineExercise(id, i, { reps: Math.max(1, Math.round(n)) })} />
                        </Field>
                        <Field label="Kg">
                          <NumField value={re.weight} onChange={(n) => gym.updateRoutineExercise(id, i, { weight: n })} />
                        </Field>
                        <Field label="Desc. (s)">
                          <NumField value={re.restSec} onChange={(n) => gym.updateRoutineExercise(id, i, { restSec: Math.round(n) })} />
                        </Field>
                      </div>
                    </div>
                  </Card>
                </li>
              )
            })}
          </ul>
        )}

        <Card>
          <div className="flex flex-col gap-2 p-4 medium:flex-row medium:items-end">
            <Field label="Agregar ejercicio" className="flex-1">
              <NativeSelect value={pick} onChange={(e) => setPick(e.target.value)}>
                <option value="">Elegí un ejercicio…</option>
                {MUSCLES.map((m) => (
                  <optgroup key={m.id} label={m.label}>
                    {g.exercises
                      .filter((e) => e.muscle === m.id)
                      .map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.name}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </NativeSelect>
            </Field>
            <Button onClick={add} disabled={!pick}>
              <Plus /> Agregar
            </Button>
          </div>
        </Card>
      </section>

      <div className="pt-2">
        <Button variant="outline" onClick={() => setConfirmDelete(true)} className="text-destructive-ink">
          <Trash2 /> Borrar rutina
        </Button>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        destructive
        title="¿Borrar esta rutina?"
        description="Tu historial de entrenamientos se conserva."
        confirmLabel="Borrar"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          gym.deleteRoutine(id)
          router.replace('/rutinas')
        }}
      />
    </PageContainer>
  )
}
