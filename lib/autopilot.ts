export type ParseError = { code: 'empty' | 'invalid-format'; message: string }
export type ParseResult<T> = { ok: true; data: T } | { ok: false; error: ParseError }

export const VERSION_STATES = ['PLANIFICADA', 'EN CURSO', 'BLOQUEADA', 'COMPLETA'] as const
export type VersionState = (typeof VERSION_STATES)[number]

export type VersionStatus = { version: string; state: VersionState; note: string | null }

export type BacklogTask = {
  id: string
  done: boolean
  title: string
  dependsOn: string[]
  /** Texto de la línea `BLOQUEO:` bajo la tarea, si existe. */
  blocked: string | null
}

export type Backlog = { version: string; tasks: BacklogTask[] }

export type RutinaData = { versions: VersionStatus[]; backlogs: Backlog[] }

export type CheckStatus = 'pass' | 'fail' | 'not-run'

export type SessionEntry = {
  date: string
  time: string
  tasks: string[]
  title: string
  result: string | null
  durationMin: number | null
  timeTo90: string | null
  verification: { typecheck: CheckStatus | null; build: CheckStatus | null; tests: CheckStatus | null }
}

export type ResultsSummary = {
  sessions: string
  tasksOk: string
  tasksBlocked: string
  openPrs: string
  avgDurationMin: string
  avgTimeTo90Min: string
  updatedAt: string
}

export type ResultadosData = { summary: ResultsSummary | null; sessions: SessionEntry[] }

const fail = (code: ParseError['code'], message: string): { ok: false; error: ParseError } => ({ ok: false, error: { code, message } })

const toLines = (text: string): string[] => text.replaceAll('\r\n', '\n').split('\n')

/** Líneas de la sección `## <heading>` (sin el encabezado), o null si no existe. */
function section(lines: string[], matches: (heading: string) => boolean): string[] | null {
  const start = lines.findIndex((l) => l.startsWith('## ') && matches(l.slice(3).trim()))
  if (start === -1) return null
  const rest = lines.slice(start + 1)
  const end = rest.findIndex((l) => l.startsWith('## '))
  return end === -1 ? rest : rest.slice(0, end)
}

const isState = (s: string): s is VersionState => (VERSION_STATES as readonly string[]).includes(s)

function parseVersions(body: string[]): ParseResult<VersionStatus[]> {
  const versions: VersionStatus[] = []
  for (const line of body) {
    const m = /^- (v\d+\.\d+): ([^(]+?)(?: \((.*)\))?\s*$/.exec(line)
    if (!m) continue
    const state = m[2].trim()
    if (!isState(state)) return fail('invalid-format', `Estado de versión desconocido para ${m[1]}: "${state}".`)
    versions.push({ version: m[1], state, note: m[3] ?? null })
  }
  if (versions.length === 0) return fail('invalid-format', 'La sección de estado de versiones no tiene ninguna versión.')
  return { ok: true, data: versions }
}

function parseTasks(body: string[]): BacklogTask[] {
  const tasks: BacklogTask[] = []
  for (const line of body) {
    const m = /^- \[( |x|X)\] (T\d+) · (.*)$/.exec(line)
    if (m) {
      const [description, deps = ''] = m[3].split(/ · depende:/)
      const bold = /^\*\*(.+?):?\*\*/.exec(description)
      tasks.push({
        id: m[2],
        done: m[1] !== ' ',
        title: (bold ? bold[1] : description).trim().slice(0, 120),
        dependsOn: deps.match(/T\d+/g) ?? [],
        blocked: null,
      })
      continue
    }
    const last = tasks[tasks.length - 1]
    const b = /BLOQUEO:\s*(.*\S)/.exec(line)
    if (last && b && last.blocked === null) last.blocked = b[1]
  }
  return tasks
}

export function parseRutina(text: string): ParseResult<RutinaData> {
  if (text.trim() === '') return fail('empty', 'RUTINA.MD está vacío.')
  const lines = toLines(text)
  const stateBody = section(lines, (h) => h === 'ESTADO DE LAS VERSIONES')
  if (!stateBody) return fail('invalid-format', 'RUTINA.MD no tiene la sección "ESTADO DE LAS VERSIONES".')
  const versions = parseVersions(stateBody)
  if (!versions.ok) return versions

  const backlogs: Backlog[] = []
  for (const l of lines) {
    const m = /^## Backlog (v\d+\.\d+)\s*$/.exec(l)
    if (!m) continue
    const body = section(lines, (h) => h === `Backlog ${m[1]}`) ?? []
    backlogs.push({ version: m[1], tasks: parseTasks(body) })
  }
  return { ok: true, data: { versions: versions.data, backlogs } }
}

function parseSummary(body: string[]): ResultsSummary | null {
  const rows = body.filter((l) => l.trim().startsWith('|'))
  if (rows.length < 3) return null
  const cells = rows[2].split('|').slice(1, -1).map((c) => c.trim())
  if (cells.length < 7) return null
  return {
    sessions: cells[0],
    tasksOk: cells[1],
    tasksBlocked: cells[2],
    openPrs: cells[3],
    avgDurationMin: cells[4],
    avgTimeTo90Min: cells[5],
    updatedAt: cells[6],
  }
}

function checkStatus(raw: string | undefined): CheckStatus | null {
  if (!raw) return null
  if (/^PAS[ÓO]/i.test(raw)) return 'pass'
  if (/^FALL[ÓO]/i.test(raw)) return 'fail'
  if (/^NO (CORRIDO|APLICA|VERIFICADO)/i.test(raw)) return 'not-run'
  return null
}

const field = (entry: string, re: RegExp): string | undefined => re.exec(entry)?.[1].trim()

function durationOf(entry: string): number | null {
  const m = /inicio\s+~?(\d{2}):(\d{2})(?:\s*UTC)?\s*\/\s*fin\s+~?(\d{2}):(\d{2})([^\n]*)/.exec(entry)
  if (!m) return null
  const explicit = /,\s*~?\s*(\d+)\s*min/.exec(m[5])
  if (explicit) return Number(explicit[1])
  const start = Number(m[1]) * 60 + Number(m[2])
  const end = Number(m[3]) * 60 + Number(m[4])
  return end >= start ? end - start : end + 1440 - start
}

function parseEntry(heading: string, body: string): SessionEntry | null {
  const h = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}) \(UTC\) · (.+?) · (.+)$/.exec(heading)
  if (!h) return null
  const t90 = field(body, /Tiempo al 90 %:\s*(.+?)\s*$/m)
  return {
    date: h[1],
    time: h[2],
    tasks: h[3].match(/T\d+/g) ?? [],
    title: h[4].trim(),
    result: field(body, /^- Resultado:\s*(.+)$/m) ?? null,
    durationMin: durationOf(body),
    timeTo90: t90 ? t90.replace(/\.$/, '') : null,
    verification: {
      typecheck: checkStatus(field(body, /^\s*- pnpm typecheck:\s*(.+)$/m)),
      build: checkStatus(field(body, /^\s*- pnpm build:\s*(.+)$/m)),
      tests: checkStatus(field(body, /^\s*- (?:pnpm test|node --test):\s*(.+)$/m)),
    },
  }
}

export function parseResultados(text: string): ParseResult<ResultadosData> {
  if (text.trim() === '') return fail('empty', 'RESULTADOS.MD está vacío.')
  const lines = toLines(text)
  const body = section(lines, (h) => h === 'Sesiones')
  if (!body) return fail('invalid-format', 'RESULTADOS.MD no tiene la sección "Sesiones".')

  const sessions: SessionEntry[] = []
  let heading: string | null = null
  let buf: string[] = []
  const flush = () => {
    if (heading === null) return
    const entry = parseEntry(heading, buf.join('\n'))
    if (entry) sessions.push(entry)
  }
  for (const l of body) {
    if (l.startsWith('### ')) {
      flush()
      heading = l.slice(4).trim()
      buf = []
    } else buf.push(l)
  }
  flush()

  const summaryBody = section(lines, (h) => h === 'Resumen acumulado')
  return { ok: true, data: { summary: summaryBody ? parseSummary(summaryBody) : null, sessions } }
}

export type TaskProgress = { done: number; total: number; percent: number }

export function taskProgress(tasks: BacklogTask[]): TaskProgress {
  const done = tasks.filter((t) => t.done).length
  return { done, total: tasks.length, percent: tasks.length === 0 ? 0 : Math.round((done / tasks.length) * 100) }
}

export type TaskStatus = 'done' | 'blocked' | 'ready' | 'waiting'

/** `ready`: todas sus dependencias están hechas; `waiting`: alguna dependencia falta (o no existe en el backlog). */
export function taskStatus(task: BacklogTask, all: BacklogTask[]): TaskStatus {
  if (task.done) return 'done'
  if (task.blocked !== null) return 'blocked'
  const doneIds = new Set(all.filter((t) => t.done).map((t) => t.id))
  return task.dependsOn.every((d) => doneIds.has(d)) ? 'ready' : 'waiting'
}

/** Puntos para el gráfico de duración: más antigua primero; las sesiones sin duración medida se omiten. */
export function durationPoints(sessions: SessionEntry[]): { label: string; value: number }[] {
  return sessions
    .filter((s): s is SessionEntry & { durationMin: number } => s.durationMin !== null)
    .toSorted((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
    .map((s) => ({ label: s.date.slice(5), value: s.durationMin }))
}
