'use client'

import { useRouter } from 'next/navigation'
import { ClipboardList, Dumbbell, Plus } from 'lucide-react'
import { PageContainer, PageHeader } from '@/components/page'
import { RoutineCard } from '@/components/routine-card'
import { Button, ButtonLink } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/states'
import { GymLoading } from '@/components/gym-loading'
import { gym, useGym } from '@/lib/store'

export default function RutinasPage() {
  const g = useGym()
  const router = useRouter()

  const create = () => router.push(`/rutinas/${gym.createRoutine()}`)

  return (
    <PageContainer>
      <PageHeader
        title="Rutinas"
        description="Los días y ejercicios de tu plan."
        actions={
          <>
            <ButtonLink href="/ejercicios" variant="outline">
              <Dumbbell /> Ejercicios
            </ButtonLink>
            <Button onClick={create}>
              <Plus /> Nueva rutina
            </Button>
          </>
        }
      />

      {!g.hydrated ? (
        <GymLoading />
      ) : g.routines.length === 0 ? (
        <EmptyState
          icon={<ClipboardList />}
          title="Sin rutinas"
          description="Creá una rutina, elegí qué días entrenás y sumá tus ejercicios."
          action={<Button onClick={create}>Crear rutina</Button>}
        />
      ) : (
        <div className="grid gap-3 medium:grid-cols-2">
          {g.routines.map((r) => (
            <RoutineCard key={r.id} routine={r} exercises={g.exercises} />
          ))}
        </div>
      )}
    </PageContainer>
  )
}
