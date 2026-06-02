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

import { ALL_ZONES, MD, type Fixture } from '../data/catalog'
import { DEF_OPT, type Wood } from '../data/materials'
import type { Room, RoomType, WallFinish } from '../data/rooms'
import { baseLm, fxLm, ratioOf, furnPct } from './brightness'
import { zoneLm } from './zone-engine'

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

/** Порядок деревьев по присутствию: число светильников, при равенстве — по люменам. */
function woodOrder(fx: Fixture[]): Wood[] {
  const byQ: Partial<Record<Wood, number>> = {}
  const byLm: Partial<Record<Wood, number>> = {}
  for (const f of fx) {
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
    const t = f.opts?.btemp ?? DEF_OPT.btemp
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
  if (ratio < 0.8) return 'dim'
  if (ratio < 1.4) return 'norm'
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

  const order = woodOrder(fx)
  const wood = order[0] ?? 'oak'
  const place = scenePlace(fx)
  const name = `${PORODA[wood]} ${PLACE_RU[place]}`

  const ratio = ratioOf(baseLm(rt, room), fxLm(fx))
  const s1 = `${LEAD[place]}, ${BRIGHT_WARM[brightLevel(ratio)][tempWarmth(fx)]}.`
  const s2 = `${cap(woodPhrase(order))}, ${furnPhrase(furnPct(room.furniture))}.`

  return { name, legend: `${s1} ${s2}`, place, wood }
}

/* ──────────────── Карточки «Как это работает» ──────────────── */

/** Одна карточка-параметр под слайдер: заголовок + бейдж-значение + текст. */
export interface KnobCard {
  title: string
  chip?: string
  text: string
}

const WALL_TEXT: Record<WallFinish, string> = {
  light: 'Стены светлые — отражают свет, его нужно меньше.',
  medium: 'У вас средние стены — на свет не влияют. Светлые добавили бы яркости, тёмные — наоборот.',
  dark: 'Стены тёмные — забирают часть света. Сделаете светлее — комната прибавит.',
}

const WOOD_CHAR: Record<Wood, string> = {
  oak: 'Дуб — светлый и тёплый.',
  walnut: 'Орех — глубокий и тёплый.',
  black: 'Чёрный дуб — строгий и глубокий.',
}
const WOOD_CHIP: Record<Wood, string> = { oak: 'дуб', walnut: 'орех', black: 'чёрный дуб' }

/** Есть ли подвесной потолочный светильник (для карточки «Потолок и подвес»). */
function hasPendant(fx: Fixture[]): boolean {
  return fx.some(
    (f) =>
      !!MD[f.m]?.hasMount &&
      (f.zone ?? 'ceiling') === 'ceiling' &&
      (f.opts?.mount ?? 'pendant') === 'pendant',
  )
}

/**
 * Карточки «Как это работает» — на реальных значениях ЭТОЙ комнаты, без внутренних
 * коэффициентов (×0.65 и пр.). Тексты по ToV: «вы», живой русский, без «как».
 */
export function roomKnobs(rt: RoomType, room: Room): KnobCard[] {
  const fx = room.fixtures
  if (fx.length === 0) return []

  const total = fxLm(fx)
  const ratio = ratioOf(baseLm(rt, room), total)
  const place = scenePlace(fx)
  const cards: KnobCard[] = []

  // 1. Где свет
  const lit = ALL_ZONES.map((z) => ({ z, lm: zoneLm(fx, z.id) }))
    .filter((s) => s.lm > 0)
    .sort((a, b) => b.lm - a.lm)
  const top = lit[0]
  cards.push({
    title: 'Где свет',
    chip: top && total > 0 ? `${top.z.name.toLowerCase()} ${Math.round((top.lm / total) * 100)}%` : undefined,
    text:
      place === 'glade'
        ? 'Свет в основном сверху, открыто и ровно по комнате. Чем ниже источник, тем уютнее и тем больше тени по углам.'
        : place === 'thicket'
          ? 'Свет ушёл вниз, к бра и торшерам — потолок слабый. Оттого уютно и углы в тени.'
          : 'Свет и сверху, и по нижним источникам — ровно по всей комнате.',
  })

  // 2. Сколько света
  const bl = brightLevel(ratio)
  cards.push({
    title: 'Сколько света',
    chip: `${Math.round(ratio * 100)}%`,
    text:
      bl === 'dim'
        ? 'Собрано меньше нормы, пока неярко. Можно добавить света.'
        : bl === 'norm'
          ? 'Собрано около нормы. Всё видно, для вечера часть можно приглушить.'
          : 'Света с запасом — глазам столько не нужно. Можно приглушить.',
  })

  // 3. Стены
  cards.push({ title: 'Стены', text: WALL_TEXT[room.wallFinish ?? 'medium'] })

  // 4. Дерево
  const order = woodOrder(fx)
  const counts: Partial<Record<Wood, number>> = {}
  for (const f of fx) counts[f.wood] = (counts[f.wood] ?? 0) + (f.q ?? 1)
  cards.push({
    title: 'Дерево',
    chip: order.map((w) => `${counts[w]} ${WOOD_CHIP[w]}`).join(', '),
    text: `Свет проходит сквозь деревянные ламели и оттого мягкий, без резкости. ${WOOD_CHAR[order[0] ?? 'oak']}`,
  })

  // 5. Мебель
  const fp = furnPct(room.furniture)
  cards.push({
    title: 'Мебель',
    chip: fp > 0 ? `−${fp}%` : 'пусто',
    text:
      fp <= 0
        ? 'Мебели нет — свету ничего не мешает.'
        : fp <= 12
          ? 'Мебели немного — света хватает.'
          : 'Мебель забирает часть света, в углах темнее. Пара бра на стены это выровняет.',
  })

  // 6. Оттенок света
  const temps = new Set(fx.map((f) => f.opts?.btemp ?? DEF_OPT.btemp))
  const mixed = temps.size > 1
  const wm = tempWarmth(fx)
  cards.push({
    title: 'Оттенок света',
    chip: mixed ? 'смешанный' : `${[...temps][0]}K`,
    text: mixed
      ? 'Оттенки разные — тёплый для уюта, рабочий для дел.'
      : wm === 'warm'
        ? 'Свет тёплый — комната вечерняя, уютная.'
        : wm === 'neutral'
          ? 'Свет тёплый-нейтральный — баланс уюта и ясности.'
          : 'Свет рабочий, нейтральный — всё чётко. Сделаете теплее, станет вечерним.',
  })

  // 7. Потолок и подвес
  const h = room.ceilingH
  const pendant = hasPendant(fx)
  cards.push({
    title: 'Потолок и подвес',
    chip: `${h} м${pendant ? ' · подвес' : ''}`,
    text:
      (h > 2.7 ? `Потолок ${h} м, выше обычного — свету идти дальше.` : `Потолок ${h} м.`) +
      (pendant ? ' На подвесе люстра ближе к комнате, и света от неё чуть больше.' : ''),
  })

  return cards
}
