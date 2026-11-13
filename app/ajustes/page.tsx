'use client'

import { useRef, useState } from 'react'
import { Download, RotateCcw, Upload } from 'lucide-react'
import { PageContainer, PageHeader, SectionHeader } from '@/components/page'
import { ThemeToggle } from '@/components/theme'
import { Alert } from '@/components/alert'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { gym } from '@/lib/store'

export default function AjustesPage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)

  const exportData = () => {
    const blob = new Blob([gym.exportJson()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gym-respaldo-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMsg({ tone: 'success', text: 'Respaldo descargado.' })
  }

  const importData = async (file: File) => {
    const ok = gym.importJson(await file.text())
    setMsg(ok ? { tone: 'success', text: 'Datos restaurados.' } : { tone: 'error', text: 'Ese archivo no es un respaldo válido.' })
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <PageContainer size="sm">
      <PageHeader title="Ajustes" />

      {msg ? <Alert tone={msg.tone}>{msg.text}</Alert> : null}

      <section className="space-y-3">
        <SectionHeader title="Apariencia" />
        <Card>
          <div className="space-y-2 p-4">
            <p className="text-sm text-muted-foreground">«Sistema» sigue el modo claro u oscuro de tu dispositivo.</p>
            <ThemeToggle />
          </div>
        </Card>
      </section>

      <section className="space-y-3">
        <SectionHeader title="Tus datos" />
        <Card>
          <div className="space-y-4 p-4">
            <p className="text-sm text-muted-foreground">
              Todo se guarda solo en este dispositivo, en el navegador. Si cambiás de celular o borrás los datos del
              navegador, se pierde: descargá un respaldo de vez en cuando.
            </p>
            <div className="flex flex-col gap-2 medium:flex-row">
              <Button variant="outline" onClick={exportData}>
                <Download /> Descargar respaldo
              </Button>
              <Button variant="outline" onClick={() => fileRef.current?.click()}>
                <Upload /> Restaurar respaldo
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                className="sr-only"
                tabIndex={-1}
                aria-label="Archivo de respaldo"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) void importData(f)
                }}
              />
            </div>
          </div>
        </Card>

        <Card>
          <div className="space-y-3 p-4">
            <p className="text-sm text-muted-foreground">Borra todo y vuelve a cargar las rutinas de ejemplo.</p>
            <Button variant="destructive" onClick={() => setConfirmReset(true)}>
              <RotateCcw /> Borrar todos los datos
            </Button>
          </div>
        </Card>
      </section>

      <ConfirmDialog
        open={confirmReset}
        destructive
        title="¿Borrar todos tus datos?"
        description="Se pierden rutinas, ejercicios propios e historial. Esto no se puede deshacer."
        confirmLabel="Borrar todo"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          gym.reset()
          setConfirmReset(false)
          setMsg({ tone: 'success', text: 'Datos borrados.' })
        }}
      />
    </PageContainer>
  )
}
