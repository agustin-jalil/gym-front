'use client'

import { useState } from 'react'
import { Plus, Search, Trash2 } from 'lucide-react'
import { PageContainer, PageHeader } from '@/components/page'
import { Badge, Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Chips, Field, Input, NativeSelect } from '@/components/ui/fields'
import { EmptyState, LoadingState } from '@/components/ui/states'
import { gym, useGym } from '@/lib/store'
import type { MuscleGroup } from '@/lib/types'
import { MUSCLES, muscleLabel } from '@/lib/utils'

type Filter = MuscleGroup | 'todos'

export default function EjerciciosPage() {
  const g = useGym()
  const [filter, setFilter] = useState<Filter>('todos')
  const [q, setQ] = useState('')
  const [name, setName] = useState('')
  const [muscle, setMuscle] = useState<MuscleGroup>('pecho')
  const [error, setError] = useState('')

  if (!g.hydrated)
    return (
      <PageContainer size="sm">
        <LoadingState />
      </PageContainer>
    )

  const used = new Set(g.routines.flatMap((r) => r.exercises.map((e) => e.exerciseId)))
  const query = q.trim().toLowerCase()
  const list = g.exercises
    .filter((e) => (filter === 'todos' || e.muscle === filter) && e.name.toLowerCase().includes(query))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))

  const add = (e: React.FormEvent) => {
    e.preventDefault()
    const clean = name.trim()
    if (clean.length < 2) return setError('Escribí al menos 2 letras.')
    if (g.exercises.some((x) => x.name.toLowerCase() === clean.toLowerCase())) return setError('Ya existe un ejercicio con ese nombre.')
    gym.addExercise(clean, muscle)
    setName('')
    setError('')
  }

  return (
    <PageContainer size="sm">
      <PageHeader title="Ejercicios" description="El catálogo que usás para armar tus rutinas." />

      <Card>
        <form onSubmit={add} className="flex flex-col gap-3 p-4 medium:flex-row medium:items-start">
          <Field label="Nuevo ejercicio" error={error} className="flex-1">
            <Input value={name} maxLength={50} placeholder="Ej: Press Arnold" onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Músculo" className="medium:w-44">
            <NativeSelect value={muscle} onChange={(e) => setMuscle(e.target.value as MuscleGroup)}>
              {MUSCLES.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Button type="submit" className="medium:mt-[1.625rem]">
            <Plus /> Agregar
          </Button>
        </form>
      </Card>

      <div className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" aria-label="Buscar ejercicio" placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <Chips<Filter>
          label="Filtrar por músculo"
          value={filter}
          onChange={setFilter}
          options={[{ id: 'todos', label: 'Todos' }, ...MUSCLES]}
        />
      </div>

      {list.length === 0 ? (
        <EmptyState title="No hay ejercicios con ese filtro" description="Probá con otra búsqueda o agregá uno nuevo arriba." />
      ) : (
        <ul className="divide-y rounded-lg border bg-card">
          {list.map((e) => (
            <li key={e.id} className="flex min-h-14 items-center justify-between gap-3 px-4 py-2">
              <div className="min-w-0">
                <p className="truncate font-medium">{e.name}</p>
                <Badge className="mt-0.5">{muscleLabel(e.muscle)}</Badge>
              </div>
              {e.custom ? (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={used.has(e.id) ? `${e.name}: está en una rutina, quitalo de ahí para borrarlo` : `Borrar ${e.name}`}
                  disabled={used.has(e.id)}
                  onClick={() => gym.deleteExercise(e.id)}
                >
                  <Trash2 />
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  )
}
