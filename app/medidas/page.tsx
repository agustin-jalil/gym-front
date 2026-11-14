'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CloudOff, Pencil, Plus, Ruler, Trash2 } from 'lucide-react'
import { PageContainer, PageHeader, SectionHeader } from '@/components/page'
import { Alert } from '@/components/alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Field, Input } from '@/components/ui/fields'
import { EmptyState, LoadingState } from '@/components/ui/states'
import { MEASUREMENT_FIELDS, type MeasurementField } from '@/lib/measurements'
import {
  formatDelta,
  MEASUREMENT_LABELS,
  parseFieldText,
  unitOf,
  variations,
  type MeasurementEntry,
} from '@/lib/measurement-history'

type Draft = { id: string | null; measuredOn: string; values: Record<MeasurementField, string>; errors: Partial<Record<MeasurementField | 'measuredOn', string>> }

const dateShort = (d: string) =>
  new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(d))
const today = () => new Date().toISOString().slice(0, 10)
const emptyValues = () => Object.fromEntries(MEASUREMENT_FIELDS.map((f) => [f, ''])) as Record<MeasurementField, string>
const newDraft = (): Draft => ({ id: null, measuredOn: today(), values: emptyValues(), errors: {} })
const editDraft = (m: MeasurementEntry): Draft => ({
  id: m.id,
  measuredOn: m.measuredOn,
  values: Object.fromEntries(MEASUREMENT_FIELDS.map((f) => [f, m[f] === null ? '' : String(m[f]).replace('.', ',')])) as Record<MeasurementField, string>,
  errors: {},
})

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(path, { ...init, headers: init?.body ? { 'content-type': 'application/json' } : undefined })
  } catch {
    throw new Error('No se pudo conectar con el servidor.')
  }
  if (!res.ok) {
    let message = 'El servidor respondió con un error.'
    try {
      const body: unknown = await res.json()
      if (typeof body === 'object' && body !== null && 'error' in body && typeof body.error === 'string') message = body.error
    } catch {
      /* sin cuerpo JSON */
    }
    throw new Error(message)
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T)
}

export default function MedidasPage() {
  const [entries, setEntries] = useState<MeasurementEntry[] | null>(null)
  const [loadError, setLoadError] = useState('')
  const [draft, setDraft] = useState<Draft | null>(null)
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState('')
  const [toDelete, setToDelete] = useState<MeasurementEntry | null>(null)

  const load = useCallback(async () => {
    setLoadError('')
    try {
      setEntries(await request<MeasurementEntry[]>('/api/measurements'))
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Error desconocido.')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const rows = useMemo(() => variations(entries ?? []), [entries])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!draft) return
    const errors: Draft['errors'] = {}
    const body: Record<string, unknown> = { measuredOn: draft.measuredOn }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.measuredOn)) errors.measuredOn = 'Elegí una fecha.'
    for (const f of MEASUREMENT_FIELDS) {
      const parsed = parseFieldText(draft.values[f])
      if (!parsed.ok) errors[f] = 'Número mayor que 0 y hasta 500.'
      else body[f] = parsed.value
    }
    if (Object.keys(errors).length === 0 && MEASUREMENT_FIELDS.every((f) => body[f] === null)) {
      setDraft({ ...draft, errors: {} })
      setActionError('Cargá al menos una medida.')
      return
    }
    if (Object.keys(errors).length > 0) {
      setActionError('')
      setDraft({ ...draft, errors })
      return
    }
    setSaving(true)
    setActionError('')
    try {
      await request(draft.id ? `/api/measurements/${draft.id}` : '/api/measurements', {
        method: draft.id ? 'PUT' : 'POST',
        body: JSON.stringify(body),
      })
      setDraft(null)
      await load()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Error desconocido.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (m: MeasurementEntry) => {
    setToDelete(null)
    setActionError('')
    try {
      await request(`/api/measurements/${m.id}`, { method: 'DELETE' })
      await load()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Error desconocido.')
    }
  }

  if (entries === null)
    return (
      <PageContainer size="md">
        {loadError ? (
          <EmptyState
            icon={<CloudOff />}
            title="No se pudieron cargar tus medidas"
            description={loadError}
            action={<Button onClick={() => void load()}>Reintentar</Button>}
          />
        ) : (
          <LoadingState />
        )}
      </PageContainer>
    )

  return (
    <PageContainer size="md">
      <PageHeader
        title="Medidas"
        description="Perímetros en cm y peso en kg. Todo es opcional: cargá lo que te midas."
        actions={
          draft ? null : (
            <Button onClick={() => { setActionError(''); setDraft(newDraft()) }}>
              <Plus /> Nueva medición
            </Button>
          )
        }
      />

      {actionError ? <Alert tone="error">{actionError}</Alert> : null}

      {draft ? (
        <Card>
          <form onSubmit={save} className="space-y-4 p-4" noValidate>
            <h2 className="font-display text-xl">{draft.id ? 'Editar medición' : 'Nueva medición'}</h2>
            <Field label="Fecha" error={draft.errors.measuredOn} className="medium:w-56">
              <Input type="date" value={draft.measuredOn} onChange={(e) => setDraft({ ...draft, measuredOn: e.target.value })} />
            </Field>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 medium:grid-cols-3">
              {MEASUREMENT_FIELDS.map((f) => (
                <Field key={f} label={`${MEASUREMENT_LABELS[f]} (${unitOf(f)})`} error={draft.errors[f]}>
                  <Input
                    inputMode="decimal"
                    autoComplete="off"
                    value={draft.values[f]}
                    onChange={(e) => setDraft({ ...draft, values: { ...draft.values, [f]: e.target.value } })}
                  />
                </Field>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? 'Guardando…' : 'Guardar'}
              </Button>
              <Button variant="outline" disabled={saving} onClick={() => { setActionError(''); setDraft(null) }}>
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      {rows.length === 0 ? (
        draft ? null : (
          <EmptyState
            icon={<Ruler />}
            title="Todavía no cargaste medidas"
            description="Registrá tu primera medición para ver cómo cambia tu cuerpo entre una y otra."
          />
        )
      ) : (
        <section className="space-y-3">
          <SectionHeader title="Historial" />
          <ul className="space-y-3">
            {rows.map(({ entry, deltas }) => {
              const present = MEASUREMENT_FIELDS.filter((f) => entry[f] !== null)
              return (
                <li key={entry.id}>
                  <Card className="space-y-3 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-display text-lg">{dateShort(entry.measuredOn)}</h3>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" aria-label={`Editar la medición del ${dateShort(entry.measuredOn)}`} onClick={() => { setActionError(''); setDraft(editDraft(entry)) }}>
                          <Pencil />
                        </Button>
                        <Button variant="ghost" size="icon" aria-label={`Borrar la medición del ${dateShort(entry.measuredOn)}`} onClick={() => setToDelete(entry)}>
                          <Trash2 />
                        </Button>
                      </div>
                    </div>
                    <dl className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2 medium:grid-cols-3">
                      {present.map((f) => (
                        <div key={f} className="flex items-baseline justify-between gap-2 border-b py-1 text-sm">
                          <dt className="text-muted-foreground">{MEASUREMENT_LABELS[f]}</dt>
                          <dd className="font-medium">
                            {String(entry[f]).replace('.', ',')} {unitOf(f)}{' '}
                            <span className="text-xs text-muted-foreground" aria-label="variación respecto de la medición anterior">
                              ({formatDelta(deltas[f], unitOf(f))})
                            </span>
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </Card>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        title="¿Borrar esta medición?"
        description="No se puede deshacer."
        confirmLabel="Borrar"
        destructive
        onConfirm={() => toDelete && void remove(toDelete)}
        onCancel={() => setToDelete(null)}
      />
    </PageContainer>
  )
}
