'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Ruler, TrendingUp } from 'lucide-react'
import { PageContainer, PageHeader, SectionHeader } from '@/components/page'
import { BarChart, LineChart } from '@/components/charts'
import { Card } from '@/components/ui/card'
import { ButtonLink } from '@/components/ui/button'
import { Field, NativeSelect } from '@/components/ui/fields'
import { EmptyState, LoadingState, StatCard } from '@/components/ui/states'
import { Alert } from '@/components/alert'
import { Button } from '@/components/ui/button'
import { GymLoading } from '@/components/gym-loading'
import { useGym } from '@/lib/store'
import { exerciseHistory, weeklyVolume } from '@/lib/stats'
import { dateShort, formatKg } from '@/lib/utils'
import type { MeasurementField } from '@/lib/measurements'
import {
  fieldsWithData,
  formatDelta,
  MEASUREMENT_LABELS,
  measurementSeries,
  unitOf,
  type MeasurementEntry,
} from '@/lib/measurement-history'

const dayUtc = (d: string) =>
  new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(d))

function MeasurementsProgress() {
  const [entries, setEntries] = useState<MeasurementEntry[] | null>(null)
  const [error, setError] = useState('')
  const [chosen, setChosen] = useState<MeasurementField | ''>('')

  const load = useCallback(async () => {
    setError('')
    try {
      const res = await fetch('/api/measurements')
      if (!res.ok) throw new Error()
      setEntries((await res.json()) as MeasurementEntry[])
    } catch {
      setError('No se pudieron cargar las medidas.')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const fields = useMemo(() => fieldsWithData(entries ?? []), [entries])
  const field = fields.find((f) => f === chosen) ?? fields[0]
  const series = useMemo(() => (field && entries ? measurementSeries(entries, field) : []), [entries, field])

  return (
    <section className="space-y-3">
      <SectionHeader title="Medidas corporales" />
      {error ? (
        <Alert tone="error">
          <div className="flex flex-wrap items-center gap-3">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={() => void load()}>
              Reintentar
            </Button>
          </div>
        </Alert>
      ) : entries === null ? (
        <LoadingState rows={1} />
      ) : !field ? (
        <EmptyState
          icon={<Ruler />}
          title="Aún no cargaste medidas"
          description="Registrá tu primera medición para ver cómo cambia tu cuerpo."
          action={<ButtonLink href="/medidas">Ir a medidas</ButtonLink>}
        />
      ) : (
        <>
          <Field label="Medida" className="medium:max-w-sm">
            <NativeSelect value={field} onChange={(e) => setChosen(e.target.value as MeasurementField)}>
              {fields.map((f) => (
                <option key={f} value={f}>
                  {MEASUREMENT_LABELS[f]}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Card>
            <div className="space-y-2 p-4">
              <LineChart
                label={MEASUREMENT_LABELS[field]}
                unit={unitOf(field)}
                points={series.map((p) => ({ label: dayUtc(p.measuredOn), value: p.value }))}
              />
              <p className="text-sm text-muted-foreground">
                {series.length > 1
                  ? `Cambio desde la primera medición: ${formatDelta(Math.round((series[series.length - 1].value - series[0].value) * 10) / 10, unitOf(field))}`
                  : 'Necesitás 2 mediciones para ver el cambio.'}
              </p>
            </div>
          </Card>
        </>
      )}
    </section>
  )
}


export default function ProgresoPage() {
  const g = useGym()
  const [chosen, setChosen] = useState('')

  // Solo los ejercicios que ya tienen historia.
  const trained = useMemo(() => {
    const ids = new Set(g.sessions.flatMap((s) => s.exercises.map((e) => e.exerciseId)))
    return g.exercises.filter((e) => ids.has(e.id))
  }, [g.sessions, g.exercises])

  if (!g.hydrated)
    return (
      <PageContainer>
        <GymLoading />
      </PageContainer>
    )

  if (g.sessions.length === 0)
    return (
      <PageContainer size="sm">
        <PageHeader title="Progreso" />
        <EmptyState
          icon={<TrendingUp />}
          title="Aún no hay datos para mostrar"
          description="Con tu primer entrenamiento empezás a ver la evolución de tus pesos y tu volumen semanal."
          action={<ButtonLink href="/">Ir a entrenar</ButtonLink>}
        />
      </PageContainer>
    )

  const exerciseId = trained.some((e) => e.id === chosen) ? chosen : (trained[0]?.id ?? '')
  const history = exerciseHistory(g.sessions, exerciseId)
  const best = history.reduce((m, p) => Math.max(m, p.e1rm), 0)
  const topEver = history.reduce((m, p) => Math.max(m, p.topWeight), 0)
  const first = history[0]
  const last = history[history.length - 1]
  const delta = first && last ? last.topWeight - first.topWeight : 0
  const weeks = weeklyVolume(g.sessions, 8)

  return (
    <PageContainer size="md">
      <PageHeader title="Progreso" description="Cómo evolucionan tus pesos y cuánto entrenás." />

      <section className="space-y-3">
        <SectionHeader title="Volumen por semana" />
        <Card>
          <div className="p-4">
            <BarChart
              label="Volumen semanal de las últimas 8 semanas"
              points={weeks.map((w) => ({ label: dateShort(new Date(w.start)), value: Math.round(w.volume) }))}
            />
          </div>
        </Card>
      </section>

      <section className="space-y-3">
        <SectionHeader title="Por ejercicio" />
        <Field label="Ejercicio" className="medium:max-w-sm">
          <NativeSelect value={exerciseId} onChange={(e) => setChosen(e.target.value)}>
            {trained.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </NativeSelect>
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Mejor peso" value={formatKg(topEver)} hint="kg" />
          <StatCard label="1RM estimado" value={formatKg(Math.round(best))} hint="kg (Epley)" />
          <StatCard
            label="Cambio"
            value={`${delta > 0 ? '+' : ''}${formatKg(delta)}`}
            hint={history.length > 1 ? 'kg desde el primero' : 'necesitás 2 registros'}
          />
        </div>

        <Card>
          <div className="p-4">
            <LineChart
              label="Peso máximo por entrenamiento"
              points={history.map((p) => ({ label: dateShort(p.date), value: p.topWeight }))}
            />
          </div>
        </Card>
      </section>

      <MeasurementsProgress />
    </PageContainer>
  )
}
