import { Check } from 'lucide-react'
import { weekStart } from '@/lib/stats'
import type { Routine, Session } from '@/lib/types'
import { WEEK, cn } from '@/lib/utils'

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`

/** Los 7 días de la semana: check si entrenaste, aro si es hoy, punto si te toca entrenar. */
export function WeekStrip({ sessions, routines, now }: { sessions: Session[]; routines: Routine[]; now: Date }) {
  const start = weekStart(now)
  const trained = new Set(sessions.map((s) => dayKey(new Date(s.finishedAt))))
  const today = dayKey(now)

  return (
    <ol aria-label="Tu semana" className="grid grid-cols-7 gap-1.5">
      {WEEK.map((w, i) => {
        const d = new Date(start)
        d.setDate(start.getDate() + i)
        const key = dayKey(d)
        const done = trained.has(key)
        const isToday = key === today
        const planned = routines.some((r) => r.days.includes(d.getDay()))
        const label = `${w.long}${done ? ': entrenaste' : planned ? ': te toca entrenar' : ''}${isToday ? ' (hoy)' : ''}`

        return (
          <li key={w.day} aria-label={label} className="flex flex-col items-center gap-1.5">
            <span className={cn('text-xs font-semibold', isToday ? 'text-primary' : 'text-muted-foreground')}>{w.short}</span>
            <span
              className={cn(
                'flex size-10 items-center justify-center rounded-full border text-sm font-bold transition-colors',
                done
                  ? 'border-transparent bg-primary text-primary-foreground'
                  : isToday
                    ? 'border-primary text-primary ring-2 ring-primary/25'
                    : 'border-border text-muted-foreground',
              )}
            >
              {done ? <Check className="size-5" /> : d.getDate()}
            </span>
            <span className={cn('size-1.5 rounded-full', planned ? 'bg-gold' : 'bg-transparent')} aria-hidden />
          </li>
        )
      })}
    </ol>
  )
}
