/**
 * forest.ts — Настроение комнаты как ЛЕСНАЯ СЦЕНА.
 *
 * Имя = порода (по дереву) × место (по тому, где свет): «Ореховая роща».
 * Легенда = синтез всех параметров комнаты, собирается из кусочков (приём copy.ts):
 *   движок не сочиняет, а склеивает одобренные фрагменты — грамматика верна по построению.
 *
 * Заменяет старую тройку autoMood / moodPhase / moodDesc (она читала только яркость).
 * Теперь сцена зависит от РАСПРЕДЕЛЕНИЯ + ДЕРЕВА + ТЕМПЕРАТУРЫ + МЕБЕЛИ, а не от ratio.
 * Яркость остаётся в дашборде (BRIGHT / getBright); в имя «Ясный полдень» больше не лезет.
 *
 * Слова и правила — WOODLED_сцены_настроения_спека.md + WOODLED_tone_of_voice.md.
 */

import { type Fixture } from '../data/catalog'
import { DEF_OPT, type Wood } from '../data/materials'
import type { Room, RoomType } from '../data/rooms'
import { baseLm, fxLm, ratioOf, furnPct } from './brightness'
import { zoneLm } from './zone-engine'
import { assembleCards, type KnobCard } from './forest-cards'

export type { KnobCard } from './forest-cards'

/* ──────────────── Тип сцены ──────────────── */

/** Лесное место — по тому, где свет: роща (сверху/общий), чаща (внизу), поляна (точка). */
export type ForestPlace = 'grove' | 'thicket' | 'glade'

export interface ForestScene {
  /** Имя на карточку: «Ореховая роща». */
  name: string
  /** Фраза-синтез над карточками «Как это работает». */
  legend: string
  place: ForestPlace
  /** Доминирующее дерево. */
  wood: Wood
}

/* ──────────────── Словарь имени (порода × место) ──────────────── */

const PORODA: Record<Wood, string> = { oak: 'Дубовая', walnut: 'Ореховая', black: 'Вековая' }
const PLACE_RU: Record<ForestPlace, string> = { grove: 'роща', thicket: 'чаща', glade: 'поляна' }

/* ──────────────── Место: где свет ──────────────── */

/**
 * Место — по ВЕРТИКАЛИ света (где он, а не сколько):
 *   потолок доминирует → поляна (свет сверху, открыто)
 *   свет ушёл вниз     → чаща  (бра/торшеры, потолок слаб)
 *   между              → роща  (свет ровно по комнате)
 * Это распределение, а не яркость, поэтому имя не дублирует дашборд:
 * тусклый верхний свет — всё равно поляна, яркий нижний — чаща.
 */
const CEILING_HIGH = 0.6 // потолок несёт большинство → поляна
const CEILING_LOW = 0.25 // потолок слаб, свет внизу → чаща

function scenePlace(fx: Fixture[]): ForestPlace {
  const total = fxLm(fx)
  if (total <= 0) return 'grove'
  const ceilingShare = zoneLm(fx, 'ceiling') / total
  if (ceilingShare >= CEILING_HIGH) return 'glade' // поляна — свет сверху
  if (ceilingShare <= CEILING_LOW) return 'thicket' // чаща — свет внизу
  return 'grove' // роща — свет ровно по комнате
}

/* ──────────────── Дерево: доминанта (+ вторичное для смеси) ──────────────── */

/** Порядок деревьев по присутствию: число светильников, при равенстве — по люменам.
 *  Кастомные светильники (другой бренд) в «лес» не входят — это смысловой слой
 *  только про WOODLED-породы. См. обсуждение в чате с продуктом. */
function woodOrder(fx: Fixture[]): Wood[] {
  const own = fx.filter((f) => !f.custom)
  const byQ: Partial<Record<Wood, number>> = {}
  const byLm: Partial<Record<Wood, number>> = {}
  for (const f of own) {
    byQ[f.wood] = (byQ[f.wood] ?? 0) + (f.q ?? 1)
    byLm[f.wood] = (byLm[f.wood] ?? 0) + fxLm([f])
  }
  return (Object.keys(byQ) as Wood[]).sort(
    (a, b) => byQ[b]! - byQ[a]! || byLm[b]! - byLm[a]!,
  )
}

/* ──────────────── Температура: доминанта по люменам ──────────────── */

type Warmth = 'warm' | 'neutral' | 'clear'

function tempWarmth(fx: Fixture[]): Warmth {
  const w: Record<string, number> = {}
  for (const f of fx) {
    // Кастомы хранят температуру в custom.btemp (у них нет opts).
    const t = f.opts?.btemp ?? f.custom?.btemp ?? DEF_OPT.btemp
    w[t] = (w[t] ?? 0) + fxLm([f])
  }
  const top = Object.entries(w).sort((a, b) => b[1] - a[1])[0]?.[0] ?? DEF_OPT.btemp
  if (top === '2700') return 'warm'
  if (top === '3000') return 'neutral'
  return 'clear' // 4000 — «нейтральный/рабочий» в каталоге
}

/* ──────────────── Банки легенды (правятся как таблицы) ──────────────── */

const LEAD: Record<ForestPlace, string> = {
  glade: 'Главный свет идёт сверху', // поляна
  grove: 'Свет ровно по всей комнате', // роща
  thicket: 'Свет собрался внизу', // чаща
}

type Bright = 'dim' | 'norm' | 'full'
function brightLevel(ratio: number): Bright {
  /* Пороги синхронизированы со шкалой BRIGHT (moods.ts): 0.8 / 1.2.
     Раньше было 0.8 / 1.4 (наследие старой autoMood) — при ratio 1.3
     бейдж говорил «Ярко», а легенда — про норму. Теперь согласовано. */
  if (ratio < 0.8) return 'dim'
  if (ratio < 1.2) return 'norm'
  return 'full'
}

/** Яркость × тепло — одной живой связкой (ToV: без штампов, без «как»). */
const BRIGHT_WARM: Record<Bright, Record<Warmth, string>> = {
  dim: {
    warm: 'его немного, тёплый и мягкий',
    neutral: 'его немного, мягкий',
    clear: 'его немного, прохладный',
  },
  norm: {
    warm: 'тёплый, дневной',
    neutral: 'ровный и дневной',
    clear: 'дневной и ясный',
  },
  full: {
    warm: 'его вдоволь, тёплый',
    neutral: 'его вдоволь, ровный',
    clear: 'его вдоволь, ясный',
  },
}

const WOOD_NOM: Record<Wood, string> = { oak: 'дуб', walnut: 'орех', black: 'чёрный дуб' }
const WOOD_INS: Record<Wood, string> = { oak: 'дубом', walnut: 'орехом', black: 'чёрным дубом' }

/** «орех с дубом» / «дуб» — доминирующее дерево, при смеси добавляем вторичное. */
function woodPhrase(order: Wood[]): string {
  if (order.length === 0) return ''
  if (order.length === 1) return WOOD_NOM[order[0]]
  return `${WOOD_NOM[order[0]]} с ${WOOD_INS[order[1]]}`
}

function furnPhrase(pct: number): string {
  if (pct <= 0) return 'свету ничего не мешает'
  if (pct <= 12) return 'мебели немного'
  return 'у пола держится мягкая тень'
}

function cap(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s
}

/* ──────────────── Сборка сцены ──────────────── */

/** Пустая комната — не сцена. Защита на случай вызова без светильников. */
const EMPTY_SCENE: ForestScene = {
  name: '—',
  legend: 'Добавьте свет — и комната оживёт.',
  place: 'glade',
  wood: 'oak',
}

export function forestScene(rt: RoomType, room: Room): ForestScene {
  const fx = room.fixtures
  if (fx.length === 0) return EMPTY_SCENE

  // Лес = только WOODLED. Если все светильники в комнате — другие бренды,
  // сцены нет (нет дерева, по которому строить имя/легенду).
  const order = woodOrder(fx)
  if (order.length === 0) {
    return {
      name: '—',
      legend: 'В комнате только светильники других брендов — лес собирается из WOODLED.',
      place: scenePlace(fx),
      wood: 'oak',
    }
  }

  const wood = order[0]
  const place = scenePlace(fx)
  const name = `${PORODA[wood]} ${PLACE_RU[place]}`

  const ratio = ratioOf(baseLm(rt, room), fxLm(fx))
  const s1 = `${LEAD[place]}, ${BRIGHT_WARM[brightLevel(ratio)][tempWarmth(fx)]}.`
  /* Дерево и мебель — две разные мысли. Раньше склеивались через запятую
     («Орех с дубом, у пола держится мягкая тень») — читалось как одно
     предложение и сбивало. Теперь разделяем точкой: первое — про породу,
     второе — про мебель/тени, у каждой свой capFirst. */
  const s2 = `${cap(woodPhrase(order))}. ${cap(furnPhrase(furnPct(room.furniture)))}.`

  return { name, legend: `${s1} ${s2}`, place, wood }
}

/* ──────────────── Карточки «Как это работает» ──────────────── */

/**
 * Карточки строятся в `forest-cards.ts` — там банки фраз, сборщики
 * каждой карточки и логика скрытия (стены medium, мебель пустая, потолок 2.7
 * без подвеса). Тут — только реэкспорт, чтобы потребители продолжали
 * импортировать `roomKnobs` из `engine/forest`.
 */
export function roomKnobs(rt: RoomType, room: Room): KnobCard[] {
  return assembleCards(rt, room)
}
