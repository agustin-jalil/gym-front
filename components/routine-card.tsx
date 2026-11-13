'use client'

import { Pencil, Play } from 'lucide-react'
import { Badge, Card } from '@/components/ui/card'
import { ButtonLink } from '@/components/ui/button'
import { WEEK } from '@/lib/utils'
import type { Exercise, Routine } from '@/lib/types'

export function RoutineCard({
  routine,
  exercises,
  highlight,
}: {
  routine: Routine
  exercises: Exercise[]
  highlight?: boolean
}) {
  const names = routine.exercises
    .map((re) => exercises.find((e) => e.id === re.exerciseId)?.name)
    .filter((n): n is string => !!n)
  const sets = routine.exercises.reduce((a, e) => a + e.sets, 0)
  const empty = routine.exercises.length === 0

  return (
    <Card className={highlight ? 'border-primary/60' : undefined}>
      <div className="space-y-3 p-4 medium:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <h3 className="truncate font-display text-xl leading-tight">{routine.name}</h3>
            <p className="text-sm text-muted-foreground">
              {empty ? 'Sin ejercicios todavía' : `${routine.exercises.length} ejercicios · ${sets} series`}
            </p>
          </div>
          <div className="flex shrink-0 gap-1" aria-label="Días">
            {WEEK.filter((d) => routine.days.includes(d.day)).map((d) => (
              <Badge key={d.day} tone="primary" title={d.long}>
                {d.short}
              </Badge>
            ))}
          </div>
        </div>
        {names.length > 0 ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">{names.join(' · ')}</p>
        ) : null}
        <div className="flex gap-2">
          {empty ? null : (
            <ButtonLink href={`/entrenar/${routine.id}`} className="flex-1 medium:flex-none">
              <Play /> Empezar
            </ButtonLink>
          )}
          <ButtonLink href={`/rutinas/${routine.id}`} variant="outline" className={empty ? 'flex-1 medium:flex-none' : undefined}>
            <Pencil /> {empty ? 'Armar rutina' : 'Editar'}
          </ButtonLink>
        </div>
      </div>
    </Card>
  )
}
