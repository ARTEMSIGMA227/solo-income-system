'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

/* ─── настройки ─── */
const CELL = 13
const GAP = 3
const STEP = CELL + GAP
const DAYS = 91 // 13 полных недель
const LABEL_W = 28 // ширина колонки "Пн Ср Пт"

const COLORS: Record<number, string> = {
  0: '#1a1a2e',
  1: '#0e4429',
  2: '#006d32',
  3: '#26a641',
  4: '#39d353',
}

const MONTHS = [
  'Янв','Фев','Мар','Апр','Май','Июн',
  'Июл','Авг','Сен','Окт','Ноя','Дек',
]

const DAY_LABELS: [number, string][] = [
  [0, 'Пн'],
  [2, 'Ср'],
  [4, 'Пт'],
]

/* ─── утилиты ─── */
function fmtDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

/** Пн=0 … Вс=6 */
function mondayIdx(d: Date): number {
  const dow = d.getDay() // Вс=0
  return dow === 0 ? 6 : dow - 1
}

function level(n: number): number {
  if (n === 0) return 0
  if (n <= 1) return 1
  if (n <= 3) return 2
  if (n <= 6) return 3
  return 4
}

/* ─── типы ─── */
interface Cell {
  key: string
  col: number
  row: number
  count: number
  lvl: number
  tip: string
}

/* ─── компонент ─── */
export default function ActivityCalendar() {
  const supabase = createClient()

  const { data, isLoading } = useQuery({
    queryKey: ['activity-heatmap'],
    queryFn: async () => {
      const today = new Date()
      const start = new Date(today)
      start.setDate(start.getDate() - DAYS + 1)

      const startISO = fmtDate(start) + 'T00:00:00'
      const endISO = fmtDate(today) + 'T23:59:59'

      const [{ data: comp }, { data: xp }] = await Promise.all([
        supabase
          .from('completions')
          .select('completed_at')
          .gte('completed_at', startISO)
          .lte('completed_at', endISO),
        supabase
          .from('xp_events')
          .select('created_at')
          .gte('created_at', startISO)
          .lte('created_at', endISO),
      ])

      const map = new Map<string, number>()
      comp?.forEach((r) => {
        const k = fmtDate(new Date(r.completed_at))
        map.set(k, (map.get(k) ?? 0) + 1)
      })
      xp?.forEach((r) => {
        const k = fmtDate(new Date(r.created_at))
        map.set(k, (map.get(k) ?? 0) + 1)
      })
      return map
    },
    staleTime: 5 * 60_000,
  })

  if (isLoading) {
    return (
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
        <div className="h-[140px] animate-pulse rounded bg-zinc-800" />
      </div>
    )
  }

  const counts = data ?? new Map<string, number>()

  /* ── строим сетку ── */
  const today = new Date()
  const start = new Date(today)
  start.setDate(start.getDate() - DAYS + 1)

  const cells: Cell[] = []
  const monthMarks: { label: string; col: number }[] = []

  let col = 0
  let prevMonth = -1
  const cursor = new Date(start)

  // Сдвигаем начало на понедельник той же или предыдущей недели
  const startOffset = mondayIdx(cursor)
  cursor.setDate(cursor.getDate() - startOffset)

  while (cursor <= today) {
    const row = mondayIdx(cursor) // 0-6 = Пн-Вс
    const key = fmtDate(cursor)
    const c = counts.get(key) ?? 0

    // Первый день недели (понедельник) → новая колонка
    if (row === 0 && cells.length > 0) col++

    // Метка месяца
    const m = cursor.getMonth()
    if (m !== prevMonth) {
      monthMarks.push({ label: MONTHS[m], col })
      prevMonth = m
    }

    const tip = cursor.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })

    cells.push({
      key,
      col,
      row,
      count: c,
      lvl: level(c),
      tip: `${tip}: ${c} действий`,
    })

    cursor.setDate(cursor.getDate() + 1)
  }

  const totalCols = col + 1
  const svgW = LABEL_W + totalCols * STEP
  const svgH = 20 + 7 * STEP

  const totalActions = Array.from(counts.values()).reduce((s, v) => s + v, 0)
  const activeDays = Array.from(counts.values()).filter((v) => v > 0).length

  return (
    <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold text-white">📅 Активность за 90 дней</h3>
        <span className="text-xs text-zinc-500">
          {activeDays} дн · {totalActions} действий
        </span>
      </div>

      <div className="overflow-x-auto pb-1">
        <svg width={svgW} height={svgH}>
          {/* подписи месяцев */}
          {monthMarks.map((mm, i) => (
            <text
              key={`m${i}`}
              x={LABEL_W + mm.col * STEP}
              y={12}
              fill="#71717a"
              fontSize={10}
            >
              {mm.label}
            </text>
          ))}

          {/* подписи дней */}
          {DAY_LABELS.map(([row, label]) => (
            <text
              key={`d${row}`}
              x={0}
              y={20 + row * STEP + CELL - 2}
              fill="#52525b"
              fontSize={10}
            >
              {label}
            </text>
          ))}

          {/* ячейки */}
          {cells.map((c) => (
            <rect
              key={c.key}
              x={LABEL_W + c.col * STEP}
              y={20 + c.row * STEP}
              width={CELL}
              height={CELL}
              rx={2}
              ry={2}
              fill={COLORS[c.lvl]}
              className="hover:brightness-150 transition-all"
            >
              <title>{c.tip}</title>
            </rect>
          ))}
        </svg>
      </div>

      {/* легенда */}
      <div className="flex items-center justify-end gap-1.5 mt-3">
        <span className="text-[10px] text-zinc-500 mr-1">Меньше</span>
        {[0, 1, 2, 3, 4].map((l) => (
          <div
            key={l}
            className="rounded-sm"
            style={{ width: CELL, height: CELL, backgroundColor: COLORS[l] }}
          />
        ))}
        <span className="text-[10px] text-zinc-500 ml-1">Больше</span>
      </div>
    </div>
  )
}