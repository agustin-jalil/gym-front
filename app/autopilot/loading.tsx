import { PageContainer } from '@/components/page'
import { LoadingState } from '@/components/ui/states'

export default function Loading() {
  return (
    <PageContainer size="lg">
      <LoadingState rows={4} />
    </PageContainer>
  )
}
