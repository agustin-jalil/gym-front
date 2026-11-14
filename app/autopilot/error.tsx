'use client'

import { CloudOff } from 'lucide-react'
import { PageContainer } from '@/components/page'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/states'

export default function AutopilotError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <PageContainer size="lg">
      <EmptyState
        icon={<CloudOff />}
        title="No se pudo mostrar el autopilot"
        description="Ocurrió un error inesperado al cargar la pantalla."
        action={<Button onClick={() => retry()}>Reintentar</Button>}
      />
    </PageContainer>
  )
}
