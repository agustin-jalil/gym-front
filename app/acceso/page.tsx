'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Lock } from 'lucide-react'
import { Alert } from '@/components/alert'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/fields'
import { PageContainer, PageHeader } from '@/components/page'
import { safeNext } from '@/lib/auth'

function AccesoForm() {
  const params = useSearchParams()
  const [secret, setSecret] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/acceso', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ secret }),
      })
      if (res.ok) {
        // Recarga completa: así el navegador envía la cookie nueva en todo lo que sigue.
        window.location.assign(safeNext(params.get('next')))
        return
      }
      setError(res.status === 401 ? 'Clave incorrecta.' : 'El servidor no pudo validar la clave.')
    } catch {
      setError('No se pudo conectar con el servidor.')
    }
    setBusy(false)
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error ? <Alert tone="error">{error}</Alert> : null}
      <Field label="Clave de acceso">
        <Input type="password" autoComplete="current-password" autoFocus value={secret} onChange={(e) => setSecret(e.target.value)} />
      </Field>
      <Button type="submit" disabled={busy || secret === ''}>
        <Lock /> {busy ? 'Entrando…' : 'Entrar'}
      </Button>
    </form>
  )
}

export default function AccesoPage() {
  return (
    <PageContainer size="sm">
      <PageHeader title="Acceso" description="Esta app es privada. Ingresá la clave para continuar." />
      <Suspense>
        <AccesoForm />
      </Suspense>
    </PageContainer>
  )
}
