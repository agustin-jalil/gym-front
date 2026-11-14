import { connection } from 'next/server'
import { CloudOff } from 'lucide-react'
import { PageContainer, PageHeader } from '@/components/page'
import { EmptyState } from '@/components/ui/states'
import { AutopilotSessions, AutopilotVersions } from '@/components/autopilot-panel'
import { readAutopilotData } from '@/lib/server/autopilot-files'

export const metadata = { title: 'Autopilot' }

export default async function AutopilotPage() {
  await connection()
  const result = await readAutopilotData()

  return (
    <PageContainer size="lg">
      <PageHeader title="Autopilot" description="Estado de las versiones y de sus tareas, leído de los archivos del repositorio." />
      {!result.ok ? (
        <EmptyState icon={<CloudOff />} title="No se pudo leer el estado del autopilot" description={result.error.message} />
      ) : result.data.rutina.versions.length === 0 ? (
        <EmptyState title="Todavía no hay versiones" description="RUTINA.MD no lista ninguna versión." />
      ) : (
        <>
          <AutopilotVersions rutina={result.data.rutina} />
          <AutopilotSessions resultados={result.data.resultados} />
        </>
      )}
    </PageContainer>
  )
}
