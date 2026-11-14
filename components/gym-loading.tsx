'use client'

import { CloudOff } from 'lucide-react'
import { Alert } from '@/components/alert'
import { Button } from '@/components/ui/button'
import { EmptyState, LoadingState } from '@/components/ui/states'
import { gym, useGym } from '@/lib/store'

/** Mientras llegan los datos del servidor: esqueleto, o el error con un botón para reintentar. */
export function GymLoading() {
  const { error } = useGym()
  if (!error) return <LoadingState />
  return (
    <EmptyState
      icon={<CloudOff />}
      title="No se pudieron cargar tus datos"
      description={error}
      action={<Button onClick={() => gym.reload()}>Reintentar</Button>}
    />
  )
}

/** Aviso cuando un cambio no se pudo guardar (los datos ya se recargaron desde el servidor). */
export function SyncErrorBanner() {
  const { syncError } = useGym()
  if (!syncError) return null
  return (
    <div className="mx-auto max-w-3xl space-y-2 px-4 pt-4">
      <Alert tone="error">No se pudo guardar el último cambio: {syncError}</Alert>
      <Button variant="outline" size="sm" onClick={() => gym.dismissSyncError()}>
        Entendido
      </Button>
    </div>
  )
}
