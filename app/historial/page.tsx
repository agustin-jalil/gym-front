'use client'

import { useState } from 'react'
import { History, Trash2 } from 'lucide-react'
import { PageContainer, PageHeader, SectionHeader } from '@/components/page'
import { Badge, Card } from '@/components/ui/card'
import { Button, ButtonLink } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { EmptyState, LoadingState } from '@/components/ui/states'
import { gym, useGym } from '@/lib/store'
import { sessionSets, sessionVolume } from '@/lib/stats'
import type { Session } from '@/lib/types'
import { dateLong, formatDuration, formatKg, monthYear } from '@/lib/utils'

export default function HistorialPage() {
  const g = useGym()
  const [toDelete, setToDelete] = useState<string | null>(null)

  if (!g.hydrated)
    return (
      <PageContainer>
        <LoadingState />
      </PageContainer>
    )

  // Agrupa por mes (las sesiones ya vienen de la más nueva a la más vieja).
  const groups = new Map<string, Session[]>()
  for (const s of g.sessions) {
    const key = monthYear(s.finishedAt)
    groups.set(key, [...(groups.get(key) ?? []), s])
  }

  return (
    <PageContainer size="sm">
      <PageHeader title="Historial" description={g.sessions.length > 0 ? `${g.sessions.length} entrenamientos registrados.` : undefined} />

      {g.sessions.length === 0 ? (
        <EmptyState
          icon={<History />}
          title="Todavía no entrenaste"
          description="Cuando termines un entrenamiento, queda guardado acá con todas tus series."
          action={<ButtonLink href="/">Ir a entrenar</ButtonLink>}
        />
      ) : (
        [...groups.entries()].map(([month, sessions]) => (
          <section key={month} className="space-y-3">
            <SectionHeader title={month.charAt(0).toUpperCase() + month.slice(1)} />
            {sessions.map((s) => (
              <Card key={s.id}>
                <details className="group">
                  <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-3 p-4 marker:hidden [&::-webkit-details-marker]:hidden">
                    <div className="min-w-0">
                      <p className="truncate font-display text-lg leading-tight">{s.routineName}</p>
                      <p className="text-sm capitalize text-muted-foreground">{dateLong(s.finishedAt)}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <Badge tone="primary">{formatKg(sessionVolume(s))} kg</Badge>
                      <span className="text-xs text-muted-foreground">
                        {sessionSets(s)} series · {formatDuration(new Date(s.finishedAt).getTime() - new Date(s.startedAt).getTime())}
                      </span>
                    </div>
                  </summary>
                  <div className="space-y-3 border-t px-4 py-3">
                    {s.exercises.map((e, i) => (
                      <div key={i}>
                        <p className="text-sm font-semibold">{g.exercises.find((x) => x.id === e.exerciseId)?.name ?? 'Ejercicio eliminado'}</p>
                        <p className="text-sm text-muted-foreground">{e.sets.map((x) => `${x.reps}×${formatKg(x.weight)} kg`).join(' · ')}</p>
                      </div>
                    ))}
                    <Button variant="ghost" size="sm" className="text-destructive-ink" onClick={() => setToDelete(s.id)}>
                      <Trash2 /> Borrar
                    </Button>
                  </div>
                </details>
              </Card>
            ))}
          </section>
        ))
      )}

      <ConfirmDialog
        open={toDelete !== null}
        destructive
        title="¿Borrar este entrenamiento?"
        description="Se saca del historial y de tus estadísticas."
        confirmLabel="Borrar"
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) gym.deleteSession(toDelete)
          setToDelete(null)
        }}
      />
    </PageContainer>
  )
}
