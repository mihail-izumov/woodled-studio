/**
 * story-engine.ts — Генерация слайдов «Посмотрите на свой лес»
 *
 * ТЗ-3: Переработка из 9 слайдов в 8 с нарративной аркой.
 * Синхронизация с mood-системой (dusk/morning/zenith).
 * Обогащение moodMap визуалом pills из WelcomeScreen.
 *
 * 4 фазы:
 *   Фаза 1 — Что вы построили (слайды 1–2)
 *   Фаза 2 — Что это создаёт (слайды 3–5)
 *   Фаза 3 — Что на это влияет (слайды 6–7)
 *   Фаза 4 — Финал (слайд 8)
 */

import { FURN } from '../data/furniture'
import { MATS } from '../data/materials'
import { MOODS, autoMood, type Mood, type MoodId } from '../data/moods'
import { T, ROOM_TINTS } from '../theme/tokens'
import type { Wood } from '../theme/tokens'
import { getArea, baseLm, fxLm, fxLamps } from './brightness'
import { zoneLm } from './zone-engine'
import { woodNames, lw, tw, rw } from './i18n'
import { getRT, type Room, type RoomTypeId } from '../data/rooms'

/* ──────────────── Типы ──────────────── */

export type StoryBlock = [string, string, string?] // [label, value, unit?]

export interface StorySlide {
  title: string
  sub: string | null
  iconKey: string
  color: string
  blocks?: StoryBlock[] | null
  /** Вывести карту настроений (слайд 4). */
  moodMap?: boolean
  /** Вывести сетку зон (слайд 6). */
  zoneMap?: boolean
  /** Показывать sub крупнее заголовка. */
  bigSub?: boolean
  /** Слайд 3: три строки с mood-словарём. */
  moodIntro?: boolean
  /** Слайд 6: подзаголовок по распределению. */
  zoneSubtitle?: string
}

export interface MoodMapEntry {
  name: string
  mood: Mood
  /** ROOM_TINTS[r.typeId] */
  tint: string
  /** Массив пород из fixtures (для tree-сфер). */
  woods: Wood[]
  /** Для pillStyle. */
  typeId: RoomTypeId
}

export interface StoryContext {
  name: string
  rooms: Room[]
  filledRooms: Room[]
  totalLm: number
  totalLamps: number
  totalArea: number
  totalTrees: number
  allWoods: string
  lmPerM2: number
  dominantWood: string
  moodMap: MoodMapEntry[]
  dominantMood: Mood
  avgKelvin: string
  furnPctAvg: number
  hasMirror: boolean
  contrastPair: {
    soft: string
    bright: string
    softMood: Mood
    brightMood: Mood
  } | null
  zoneShare: (zid: 'ceiling' | 'wall' | 'floor' | 'table') => number
}

/* ──────────────── Порядок mood для контраста ──────────────── */

const MOOD_ORDER: MoodId[] = ['dusk', 'morning', 'zenith']

/* ──────────────── Построение контекста ──────────────── */

export function buildStoryContext(rooms: Room[], name: string): StoryContext {
  const filledRooms = rooms.filter((r) => r.fixtures.length > 0)

  const totalLm = rooms.reduce((s, r) => s + fxLm(r.fixtures), 0)
  const totalLamps = rooms.reduce((s, r) => s + fxLamps(r.fixtures), 0)
  const totalArea = rooms.reduce((s, r) => {
    const rt = getRT(r.typeId)
    return s + getArea(rt, r)
  }, 0)
  const totalTrees = rooms.reduce(
    (s, r) => s + r.fixtures.reduce((a, f) => a + (f.q ?? 1), 0),
    0,
  )

  const allFx = rooms.flatMap((r) => r.fixtures)
  const allWoods = woodNames(allFx)
  const lmPerM2 = totalArea > 0 ? Math.round(totalLm / totalArea) : 0

  /* Доминирующее дерево */
  const woodCounts: Record<string, number> = {}
  for (const f of allFx) {
    const w = f.wood ?? 'oak'
    woodCounts[w] = (woodCounts[w] ?? 0) + (f.q ?? 1)
  }
  const topWoodId = Object.entries(woodCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
  const dominantWood = topWoodId ? (MATS.find((m) => m.id === topWoodId)?.name ?? '—') : '—'

  /* Карта настроений — обогащённая tint/woods/typeId */
  const moodMap: MoodMapEntry[] = filledRooms.map((r) => {
    const rt = getRT(r.typeId)
    const base = baseLm(rt, r)
    const actual = fxLm(r.fixtures)
    const ratio = base > 0 ? actual / base : 0
    const woods: Wood[] = []
    for (const fx of r.fixtures) {
      const q = fx.q ?? 1
      for (let i = 0; i < q; i++) woods.push((fx.wood ?? 'oak') as Wood)
    }
    return {
      name: r.customName || rt.name,
      mood: autoMood(ratio),
      tint: ROOM_TINTS[r.typeId],
      woods,
      typeId: r.typeId,
    }
  })

  /* Доминирующее настроение */
  const moodCounts: Record<string, number> = {}
  for (const m of moodMap) {
    moodCounts[m.mood.id] = (moodCounts[m.mood.id] ?? 0) + 1
  }
  const topMoodId = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
  const dominantMood = topMoodId ? (MOODS.find((m) => m.id === topMoodId) ?? MOODS[1]) : MOODS[1]

  /* zoneShare */
  const zoneShare = (zid: 'ceiling' | 'wall' | 'floor' | 'table'): number => {
    const lm = rooms.reduce((s, r) => s + zoneLm(r.fixtures, zid), 0)
    return totalLm > 0 ? Math.round((lm / totalLm) * 100) : 0
  }

  /* Средняя температура */
  let avgKelvin = '—'
  if (filledRooms.length > 0) {
    const denom = Math.max(1, totalTrees)
    const sum = filledRooms
      .flatMap((r) => r.fixtures)
      .reduce((s, f) => {
        const k = parseInt(f.opts?.btemp ?? '4000К') || 4000
        return s + k * (f.q ?? 1)
      }, 0)
    avgKelvin = '~' + Math.round(sum / denom) + 'К'
  }

  /* Средний процент потерь от мебели */
  const furnPctAvg =
    filledRooms.length > 0
      ? Math.round(
          filledRooms.reduce(
            (s, r) => s + r.furniture.reduce((a, f) => a + (FURN[f]?.ab ?? 0) * 100, 0),
            0,
          ) / filledRooms.length,
        )
      : 0

  const hasMirror = rooms.some((r) => r.furniture.includes('mirror'))

  /* Контрастная пара — крайние mood по MOOD_ORDER */
  let contrastPair: StoryContext['contrastPair'] = null
  if (moodMap.length >= 2) {
    const uniqueIds = [...new Set(moodMap.map(m => m.mood.id))]
      .filter(id => id !== 'empty')
      .sort((a, b) => MOOD_ORDER.indexOf(a as MoodId) - MOOD_ORDER.indexOf(b as MoodId))

    if (uniqueIds.length >= 2) {
      const darkest = moodMap.find(m => m.mood.id === uniqueIds[0])!
      const brightest = moodMap.find(m => m.mood.id === uniqueIds[uniqueIds.length - 1])!
      contrastPair = {
        soft: darkest.name,
        bright: brightest.name,
        softMood: darkest.mood,
        brightMood: brightest.mood,
      }
    }
  }

  return {
    name,
    rooms,
    filledRooms,
    totalLm,
    totalLamps,
    totalArea,
    totalTrees,
    allWoods,
    lmPerM2,
    dominantWood,
    moodMap,
    dominantMood,
    avgKelvin,
    furnPctAvg,
    hasMirror,
    contrastPair,
    zoneShare,
  }
}

/* ──────────────── Helper-функции слайдов ──────────────── */

function treesSub(ctx: StoryContext): string {
  if (ctx.dominantWood === ctx.allWoods) {
    return `Единый ${ctx.dominantWood.toLowerCase()}овый лес`
  }
  return `Смешанный лес: ${ctx.allWoods}`
}

/** Подзаголовок moodMap — story.md §6: двоеточие при двух mood. */
function moodPhrase(ctx: StoryContext): string {
  const counts: Record<string, number> = {}
  for (const m of ctx.moodMap) {
    counts[m.mood.id] = (counts[m.mood.id] ?? 0) + 1
  }
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1])
  if (entries.length === 1) {
    const m = MOODS.find((x) => x.id === entries[0][0])
    return m ? `Везде ${m.name.toLowerCase()} — целостное настроение` : ''
  }
  if (entries.length === 2) {
    const m1 = MOODS.find((x) => x.id === entries[0][0])?.name
    const m2 = MOODS.find((x) => x.id === entries[1][0])?.name
    return `Смешение: ${m1} и ${m2}`
  }
  return 'Все три настроения живут вместе'
}

function formSub(ctx: StoryContext): string {
  if (ctx.furnPctAvg > 0 && ctx.hasMirror) {
    return `Мебель забирает ${ctx.furnPctAvg}% света, но зеркала возвращают часть. Температура ${ctx.avgKelvin} задаёт тон.`
  }
  if (ctx.furnPctAvg > 0) {
    return `Мебель забирает ${ctx.furnPctAvg}% света — тени делают свет объёмным, не плоским. Температура ${ctx.avgKelvin} задаёт тон.`
  }
  return `Температура ${ctx.avgKelvin} определяет оттенок: чем теплее — тем ближе к вечернему свету, чем холоднее — тем ближе к дневному.`
}

function zoneSubtitle(zoneShareFn: (zid: 'ceiling' | 'wall' | 'floor' | 'table') => number): string {
  const c = zoneShareFn('ceiling')
  const w = zoneShareFn('wall')
  const f = zoneShareFn('floor')
  const t = zoneShareFn('table')

  if (c > 60) return 'Основной свет сверху — классическая схема'
  if (w + f + t > c) return 'Акцентный свет доминирует — камерная атмосфера'

  const vals = [c, w, f, t].filter(v => v > 0)
  if (vals.length >= 2) {
    const spread = Math.max(...vals) - Math.min(...vals)
    if (spread < 15) return 'Свет распределён равномерно'
  }

  const zones: [string, number][] = [
    ['Потолок', c], ['Стены', w], ['Пол', f], ['Стол', t],
  ]
  const top = zones.sort((a, b) => b[1] - a[1])[0]
  return `${top[0]} — основной источник`
}

/* ──────────────── Построение слайдов (8 штук) ──────────────── */

export function buildStorySlides(rooms: Room[], name: string): StorySlide[] {
  const ctx = buildStoryContext(rooms, name)
  const slides: StorySlide[] = []

  /* ═══ Фаза 1: Что вы построили ═══ */

  /* Слайд 1 · Интро */
  slides.push({
    title: ctx.name,
    sub: `${ctx.totalTrees} ${tw(ctx.totalTrees)} в ${ctx.filledRooms.length} ${rw(ctx.filledRooms.length)}`,
    iconKey: 'house',
    color: T.neutral,
  })

  /* Слайд 2 · Ваш лес (слияние бывших слайдов 2+3) */
  slides.push({
    title: ctx.totalTrees > 5
      ? `Целый лес — ${ctx.totalTrees} деревьев`
      : ctx.totalTrees > 3
        ? `${ctx.totalTrees} ${tw(ctx.totalTrees)} в вашем доме`
        : `${ctx.totalTrees} ${tw(ctx.totalTrees)}`,
    sub: treesSub(ctx),
    iconKey: 'trees',
    color: T.oak,
    blocks: [
      ['Яркость', ctx.totalLm.toLocaleString('ru-RU'), 'лм'],
      ['Плотность', String(ctx.lmPerM2), 'лм/м²'],
    ],
  })

  /* ═══ Фаза 2: Что это создаёт ═══ */

  /* Слайд 3 · Три настроения света (НОВЫЙ — образовательный мост) */
  slides.push({
    title: 'Три настроения света',
    sub: 'Баланс света и пространства определяет атмосферу каждой комнаты',
    iconKey: 'sun',
    color: T.neutral,
    moodIntro: true,
  })

  /* Слайд 4 · Настроение вашего дома (обогащённый moodMap) */
  slides.push({
    title: 'Настроение вашего дома',
    sub: moodPhrase(ctx),
    iconKey: 'dotDashed',
    color: ctx.dominantMood.color,
    moodMap: true,
  })

  /* Слайд 5 · Дыхание дома (всегда виден, две ветки) */
  if (ctx.contrastPair) {
    slides.push({
      title: 'Дом дышит',
      sub: `${ctx.contrastPair.soft} отдыхает в ${ctx.contrastPair.softMood.name} — ${ctx.contrastPair.bright} работает в ${ctx.contrastPair.brightMood.name}. Диммер позволит переключаться.`,
      iconKey: 'wind',
      color: T.dawn,
    })
  } else {
    slides.push({
      title: 'Единое настроение',
      sub: `${ctx.dominantMood.name} — ${ctx.dominantMood.desc}`,
      iconKey: 'wind',
      color: ctx.dominantMood.color,
    })
  }

  /* ═══ Фаза 3: Что на это влияет ═══ */

  /* Слайд 6 · Где живёт свет */
  slides.push({
    title: 'Где живёт свет',
    sub: null,
    iconKey: 'grid',
    color: T.noon,
    zoneMap: true,
    zoneSubtitle: zoneSubtitle(ctx.zoneShare),
  })

  /* Слайд 7 · Что формирует настроение (слияние бывших слайдов 7+8) */
  const k = parseInt(ctx.avgKelvin.replace(/[^\d]/g, '')) || 0
  const formBlocks: StoryBlock[] = [
    ['Температура', ctx.avgKelvin],
  ]
  if (ctx.furnPctAvg > 0) {
    formBlocks.push(['Мебель забирает', `${ctx.furnPctAvg}%`])
  }
  slides.push({
    title: 'Что формирует настроение',
    sub: formSub(ctx),
    iconKey: 'thermo',
    color: k < 3500 ? T.dawn : T.noon,
    blocks: formBlocks,
  })

  /* ═══ Фаза 4: Финал ═══ */

  /* Слайд 8 · Финал */
  slides.push({
    title: `${ctx.totalLamps} ${lw(ctx.totalLamps)}`,
    sub: 'Каждая продолжает светить',
    iconKey: 'bulb',
    color: T.clearing,
  })

  return slides
}
