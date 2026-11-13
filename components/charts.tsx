import { formatKg } from '@/lib/utils'

export interface ChartPoint {
  label: string
  value: number
}

const W = 600
const H = 220
const PAD = { l: 48, r: 14, t: 14, b: 30 }
const innerW = W - PAD.l - PAD.r
const innerH = H - PAD.t - PAD.b

function scale(values: number[], zeroBased: boolean) {
  const max = Math.max(...values)
  const min = Math.min(...values)
  const span = max - min
  const lo = zeroBased || span === 0 ? 0 : Math.max(0, min - span * 0.25)
  const hi = (max + span * 0.1 || max || 1) * 1.02
  return { lo, hi, y: (v: number) => PAD.t + innerH - ((v - lo) / (hi - lo)) * innerH }
}

function Grid({ lo, hi, y, unit }: { lo: number; hi: number; y: (v: number) => number; unit: string }) {
  const ticks = [lo, (lo + hi) / 2, hi]
  return (
    <g className="text-muted-foreground">
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke="currentColor" strokeOpacity={0.18} />
          <text x={PAD.l - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill="currentColor">
            {formatKg(Math.round(t))}
            {i === ticks.length - 1 ? ` ${unit}` : ''}
          </text>
        </g>
      ))}
    </g>
  )
}

/** Línea de evolución. Lleva `role="img"` con resumen y una tabla equivalente para quien no ve el gráfico. */
export function LineChart({ points, unit = 'kg', label }: { points: ChartPoint[]; unit?: string; label: string }) {
  if (points.length === 0) return null
  const { lo, hi, y } = scale(points.map((p) => p.value), false)
  const x = (i: number) => (points.length === 1 ? PAD.l + innerW / 2 : PAD.l + (i * innerW) / (points.length - 1))
  const last = points[points.length - 1]
  const first = points[0]

  return (
    <figure className="space-y-3">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${label}: de ${formatKg(first.value)} a ${formatKg(last.value)} ${unit} en ${points.length} registros`}
        className="h-auto w-full"
      >
        <Grid lo={lo} hi={hi} y={y} unit={unit} />
        {points.length > 1 ? (
          <polyline
            fill="none"
            stroke="var(--chart-1)"
            strokeWidth={2.5}
            strokeLinejoin="round"
            points={points.map((p, i) => `${x(i)},${y(p.value)}`).join(' ')}
          />
        ) : null}
        {points.map((p, i) => (
          <circle key={i} cx={x(i)} cy={y(p.value)} r={4} fill="var(--chart-1)" stroke="var(--card)" strokeWidth={2} />
        ))}
        <g className="text-muted-foreground" fontSize={11} fill="currentColor">
          <text x={x(0)} y={H - 8} textAnchor={points.length === 1 ? 'middle' : 'start'}>
            {first.label}
          </text>
          {points.length > 1 ? (
            <text x={x(points.length - 1)} y={H - 8} textAnchor="end">
              {last.label}
            </text>
          ) : null}
        </g>
      </svg>
      <details className="text-sm">
        <summary className="inline-flex min-h-11 items-center text-muted-foreground">Ver como tabla</summary>
        <table className="mt-1 w-full text-left">
          <tbody>
            {points.map((p, i) => (
              <tr key={i} className="border-t">
                <td className="py-1.5 text-muted-foreground">{p.label}</td>
                <td className="py-1.5 text-right font-semibold">
                  {formatKg(p.value)} {unit}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  )
}

export function BarChart({ points, unit = 'kg', label }: { points: ChartPoint[]; unit?: string; label: string }) {
  if (points.length === 0) return null
  const { lo, hi, y } = scale(points.map((p) => p.value), true)
  const slot = innerW / points.length
  const bw = Math.min(40, slot * 0.6)

  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="h-auto w-full">
        <Grid lo={lo} hi={hi} y={y} unit={unit} />
        {points.map((p, i) => {
          const cx = PAD.l + slot * i + slot / 2
          const top = y(p.value)
          return (
            <g key={i}>
              <rect
                x={cx - bw / 2}
                y={top}
                width={bw}
                height={Math.max(0, PAD.t + innerH - top)}
                rx={3}
                fill="var(--chart-1)"
                opacity={i === points.length - 1 ? 1 : 0.7}
              >
                <title>{`${p.label}: ${formatKg(p.value)} ${unit}`}</title>
              </rect>
              <text x={cx} y={H - 8} textAnchor="middle" fontSize={11} fill="currentColor" className="text-muted-foreground">
                {p.label}
              </text>
            </g>
          )
        })}
      </svg>
    </figure>
  )
}
