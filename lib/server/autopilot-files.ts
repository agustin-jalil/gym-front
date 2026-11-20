import 'server-only'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parseResultados, parseRutina, type ResultadosData, type RutinaData } from '../autopilot.ts'

export const AUTOPILOT_FILES = ['RUTINA.MD', 'RESULTADOS.MD', 'VERSIONES.MD'] as const
export type AutopilotFile = (typeof AUTOPILOT_FILES)[number]

export type AutopilotError = {
  code: 'missing-file' | 'unreadable' | 'empty' | 'invalid-format'
  file: AutopilotFile
  message: string
}

export type AutopilotData = { rutina: RutinaData; resultados: ResultadosData }
export type AutopilotResult = { ok: true; data: AutopilotData } | { ok: false; error: AutopilotError }

type ReadResult = { ok: true; text: string } | { ok: false; error: AutopilotError }

async function read(root: string, file: AutopilotFile): Promise<ReadResult> {
  try {
    return { ok: true, text: await readFile(join(root, file), 'utf8') }
  } catch (e) {
    const missing = e instanceof Error && 'code' in e && e.code === 'ENOENT'
    return {
      ok: false,
      error: missing
        ? { code: 'missing-file', file, message: `No se encontró ${file} en la raíz del proyecto.` }
        : { code: 'unreadable', file, message: `No se pudo leer ${file}.` },
    }
  }
}

/** Lee y parsea los archivos del autopilot. Solo lectura; los errores no incluyen rutas del servidor. */
export async function readAutopilotData(root: string = process.cwd()): Promise<AutopilotResult> {
  const [rutina, resultados, versiones] = await Promise.all(AUTOPILOT_FILES.map((f) => read(root, f)))
  for (const r of [rutina, resultados, versiones]) if (!r.ok) return r

  const parsedRutina = parseRutina(rutina.ok ? rutina.text : '')
  if (!parsedRutina.ok) return { ok: false, error: { ...parsedRutina.error, file: 'RUTINA.MD' } }
  const parsedResultados = parseResultados(resultados.ok ? resultados.text : '')
  if (!parsedResultados.ok) return { ok: false, error: { ...parsedResultados.error, file: 'RESULTADOS.MD' } }
  if (versiones.ok && versiones.text.trim() === '') {
    return { ok: false, error: { code: 'empty', file: 'VERSIONES.MD', message: 'VERSIONES.MD está vacío.' } }
  }
  return { ok: true, data: { rutina: parsedRutina.data, resultados: parsedResultados.data } }
}
