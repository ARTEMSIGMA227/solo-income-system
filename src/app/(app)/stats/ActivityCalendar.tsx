'use client'

import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useT } from '@/lib/i18n'

/* ─── settings ─── */
const CELL = 13
const GAP = 3
const STEP = CELL + GAP
const LABEL_W = 28

const COLORS: Record<number, string> = {
  0: '#1a1a2e',
  1: '#0e4429',
  2: '#006d32',
  3: '#26a641',
  4: '#39d353',
}

const MONTHS_RU = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек']
const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const DAY_LABELS_RU: [number, string][] = [[0, 'Пн'], [2, 'Ср'], [4, 'Пт']]
const DAY_LABELS_EN: [number, string][] = [[0, 'Mo'], [2, 'We'], [4, 'Fr']]

/* ─── utils ─── */
function fmtDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

function mondayIdx(d: Date): number {
  const dow = d.getDay()
  return dow === 0 ? 6 : dow - 1
}

function level(n: number): number {
  if (n === 0) return 0
  if (n <= 1) return 1
  if (n <= 3) return 2
  if (n <= 6) return 3
  return 4
}

/* ─── types ─── */
interface CellData {
  key: string
  col: number
  row: number
  count: number
  lvl: number
  tip: string
}

/* ─── component ─── */
export default function ActivityCalendar() {
  const supabase = createClient()
  const scrollRef = useRef<HTMLDivElement>(null)
  const { t, locale } = useT()

  const MONTHS = locale === 'ru' ? MONTHS_RU : MONTHS_EN
  const DAY_LABELS = locale === 'ru' ? DAY_LABELS_RU : DAY_LABELS_EN

  const { data, isLoading } = useQuery({
    queryKey: ['activity-heatmap'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return { counts: new Map<string, number>(), firstDate: null as string | null }

      // Get user's first activity date
      const [{ data: firstComp }, { data: firstXp }] = await Promise.all([
        supabase
          .from('completions')
          .select('completed_at')
          .eq('user_id', user.id)
          .order('completed_at', { ascending: true })
          .limit(1),
        supabase
          .from('xp_events')
          .select('created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
          .limit(1),
      ])

      const dates: string[] = []
      if (firstComp?.[0]?.completed_at) dates.push(firstComp[0].completed_at)
      if (firstXp?.[0]?.created_at) dates.push(firstXp[0].created_at)

      if (dates.length === 0) {
        return { counts: new Map<string, number>(), firstDate: null }
      }

      const firstDate = dates.sort()[0]
      const startISO = firstDate.split('T')[0] + 'T00:00:00'
      const endISO = fmtDate(new Date()) + 'T23:59:59'

      const [{ data: comp }, { data: xp }] = await Promise.all([
        supabase
          .from('completions')
          .select('completed_at')
          .eq('user_id', user.id)
          .gte('completed_at', startISO)
          .lte('completed_at', endISO),
        supabase
          .from('xp_events')
          .select('created_at')
          .eq('user_id', user.id)
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

      return { counts: map, firstDate: firstDate.split('T')[0] }
    },
    staleTime: 5 * 60_000,
  })

  // Auto-scroll to the right (most recent)
  useEffect(() => {
    if (!isLoading && scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth
    }
  }, [isLoading, data])

  if (isLoading) {
    return (
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 mb-4">
        <div className="h-[140px] animate-pulse rounded bg-zinc-800" />
      </div>
    )
  }

  const counts = data?.counts ?? new Map<string, number>()
  const firstDate = data?.firstDate

  if (!firstDate) {
    return (
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-white">
            📅 {locale === 'ru' ? 'Активность' : 'Activity'}
          </h3>
        </div>
        <div className="text-center text-zinc-500 py-6 text-sm">
          {locale === 'ru' ? 'Нет данных' : 'No data yet'}
        </div>
      </div>
    )
  }

  /* ── build grid ── */
  const today = new Date()
  const start = new Date(firstDate)

  // Align start to Monday of that week
  const startOffset = mondayIdx(start)
  start.setDate(start.getDate() - startOffset)

  const cells: CellData[] = []
  const monthMarks: { label: string; col: number }[] = []

  let col = 0
  let prevMonth = -1
  const cursor = new Date(start)
  const dateLocale = locale === 'ru' ? 'ru-RU' : 'en-US'

  while (cursor <= today) {
    const row = mondayIdx(cursor)
    const key = fmtDate(cursor)
    const c = counts.get(key) ?? 0

    if (row === 0 && cells.length > 0) col++

    const m = cursor.getMonth()
    if (m !== prevMonth) {
      monthMarks.push({ label: MONTHS[m], col })
      prevMonth = m
    }

    const tip = cursor.toLocaleDateString(dateLocale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })

    const actionsLabel = locale === 'ru' ? 'действий' : 'actions'

    cells.push({
      key,
      col,
      row,
      count: c,
      lvl: level(c),
      tip: `${tip}: ${c} ${actionsLabel}`,
    })

    cursor.setDate(cursor.getDate() + 1)
  }

  const totalCols = col + 1
  const svgW = LABEL_W + totalCols * STEP
  const svgH = 20 + 7 * STEP

  const totalActions = Array.from(counts.values()).reduce((s, v) => s + v, 0)
  const activeDays = Array.from(counts.values()).filter((v) => v > 0).length

  // Calculate total days tracked
  const firstD = new Date(firstDate)
  const totalDays = Math.ceil((today.getTime() - firstD.getTime()) / (1000 * 60 * 60 * 24)) + 1

  const lessLabel = locale === 'ru' ? 'Меньше' : 'Less'
  const moreLabel = locale === 'ru' ? 'Больше' : 'More'
  const daysLabel = locale === 'ru' ? 'дн' : 'd'
  const actionsShort = locale === 'ru' ? 'действий' : 'actions'
  const titleText = locale === 'ru'
    ? `📅 Активность за ${totalDays} дней`
    : `📅 Activity over ${totalDays} days`

  return (
    <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold text-white">{titleText}</h3>
        <span className="text-xs text-zinc-500">
          {activeDays} {daysLabel} · {totalActions} {actionsShort}
        </span>
      </div>

      <div ref={scrollRef} className="overflow-x-auto pb-1" style={{ scrollBehavior: 'smooth' }}>
        <svg width={svgW} height={svgH}>
          {/* month labels */}
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

          {/* day labels */}
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

          {/* cells */}
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

      {/* legend */}
      <div className="flex items-center justify-end gap-1.5 mt-3">
        <span className="text-[10px] text-zinc-500 mr-1">{lessLabel}</span>
        {[0, 1, 2, 3, 4].map((l) => (
          <div
            key={l}
            className="rounded-sm"
            style={{ width: CELL, height: CELL, backgroundColor: COLORS[l] }}
          />
        ))}
        <span className="text-[10px] text-zinc-500 ml-1">{moreLabel}</span>
      </div>
    </div>
  )
}
