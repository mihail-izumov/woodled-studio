/**
 * story-engine.ts — Генерация слайдов «Посмотрите на свой лес»
 *
 * 8 слайдов с нарративной аркой:
 *   Фаза 1 — Что вы построили  (слайды 1–2)
 *   Фаза 2 — Что это создаёт   (слайды 3–5)
 *   Фаза 3 — Что на это влияет (слайды 6–7)
 *   Фаза 4 — Финал             (слайд 8)
 *
 * Story показывает ДОМ ЦЕЛИКОМ (агрегация по комнатам). ForestMood работает
 * ПОКОМНАТНО. Алгоритмы общие (forestScene/scenePlace), нарратив разный —
 * чтобы Story не дублировал страницу комнаты, а давал верхнеуровневый взгляд.
 *
 * Тексты — по `WOODLED_tone_of_voice.md`.
 */

import { FURN } from '../data/furniture'
import { MATS } from '../data/materials'
import { MD } from '../data/catalog'
import { T, ROOM_TINTS } from '../theme/tokens'
import type { Wood } from '../theme/tokens'
import { getArea, baseLm, fxLm, fxLamps } from './brightness'
import { zoneLm } from './zone-engine'
import { woodNames, lw, tw, rw } from './i18n'
import { getRT, type Room, type RoomTypeId } from '../data/rooms'
import { forestScene, type ForestScene, type ForestPlace } from './forest'

/* ──────────────── Типы ──────────────── */

export type StoryBlock = [string, string, string?] // [label, value, unit?]

export interface StorySlide {
  title: string
  sub: string | null
  iconKey: string
  color: string
  blocks?: StoryBlock[] | null
  /** Слайд 4: карта комнат с именами сцен. */
  sceneMap?: boolean
  /** Слайд 6: сетка зон с подзаголовком. */
  zoneMap?: boolean
  /** Показывать sub крупнее заголовка. */
  bigSub?: boolean
  /** Слайд 3: три карточки «места леса». */
  placeIntro?: boolean
  /** Подзаголовок над зонной сеткой (слайд 6). */
  zoneSubtitle?: string
}

export interface SceneMapEntry {
  name: string
  scene: ForestScene
  /** ROOM_TINTS[r.typeId] — основной акцент строки. */
  tint: string
  /** Цвет, соответствующий ForestPlace (для бейджа сцены). */
  placeColor: string
  /** Короткая фраза о свете комнаты (первое предложение легенды). */
  lead: string
  /** Массив пород из fixtures (для tree-сфер). */
  woods: Wood[]
  /** Для pillStyle. */
  typeId: RoomTypeId
}

/** Цоколь — типовая опора лампы. Берётся из `MD[m].ltName`. */
export type Cap = 'E27' | 'GX53' | 'E14'

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
  /** Карта комнат с лесными сценами. */
  sceneMap: SceneMapEntry[]
  /** Самое частое место леса в доме. */
  dominantPlace: ForestPlace
  /** Цвет доминирующего места — для акцентов слайдов 4 и 5. */
  dominantColor: string
  avgKelvin: string
  furnPctAvg: number
  hasMirror: boolean
  /** Раскладка ламп по цоколю — для финального слайда. */
  lampsByCap: Record<Cap, number>
  /**
   * Две комнаты с разными сценами — для слайда «Дом дышит».
   * Берётся пара с максимальным контрастом мест (glade ↔ thicket в первую очередь).
   */
  contrastPair: {
    soft: SceneMapEntry
    bright: SceneMapEntry
  } | null
  zoneShare: (zid: 'ceiling' | 'wall' | 'floor' | 'table') => number
}

/** Извлекает цоколь из имени лампы модели (`MD[m].ltName`). */
function detectCap(ltName: string): Cap {
  if (/GX53/i.test(ltName)) return 'GX53'
  if (/E14/i.test(ltName)) return 'E14'
  return 'E27'
}

/* ──────────────── Места леса (palette + порядок «вечер → день») ──────────────── */

/** Цвет места: glade — дневной мёд, grove — спокойный шалфей, thicket — вечерний персик. */
export const PLACE_COLOR: Record<ForestPlace, string> = {
  glade: T.noon,
  grove: T.clearing,
  thicket: T.dawn,
}
/** Заголовки мест. */
export const PLACE_TITLE: Record<ForestPlace, string> = {
  glade: 'Поляна',
  grove: 'Роща',
  thicket: 'Чаща',
}
/** Короткое описание места под заголовком в слайде 3 «Три места леса». */
export const PLACE_QUOTE: Record<ForestPlace, string> = {
  glade: 'Главный свет идёт сверху. Открыто и просторно.',
  grove: 'Свет идёт ровно — и сверху, и снизу. Спокойно.',
  thicket: 'Свет собрался внизу. Тихо, для отдыха.',
}
/** Иконка для слайда 3. */
export const PLACE_ICON: Record<ForestPlace, string> = {
  glade: 'arrowUpRight',
  grove: 'arrowRight',
  thicket: 'arrowDownRight',
}

/** «Дальность» места — для расчёта контраста между комнатами (poляна → чаща). */
const PLACE_DIST: Record<ForestPlace, number> = { glade: 2, grove: 1, thicket: 0 }

/* ──────────────── Построение контекста ──────────────── */

export function buildStoryContext(rooms: Room[], name: string): StoryContext {
  const filledRooms = rooms.filter((r) => r.fixtures.length > 0)

  const totalLm = rooms.reduce((s, r) => s + fxLm(r.fixtures), 0)
  // Лампы и цоколи (слайд 8) считаем только по WOODLED — у кастомов другие
  // цоколи и LED-модули, в одну упаковку не положишь.
  const totalLamps = rooms.reduce(
    (s, r) => s + fxLamps(r.fixtures.filter((f) => !f.custom)),
    0,
  )
  const totalArea = rooms.reduce((s, r) => {
    const rt = getRT(r.typeId)
    return s + getArea(rt, r)
  }, 0)
  // «Деревья» — это только WOODLED-светильники (кастомы не из дерева).
  const totalTrees = rooms.reduce(
    (s, r) => s + r.fixtures.reduce((a, f) => a + (f.custom ? 0 : (f.q ?? 1)), 0),
    0,
  )

  const allFx = rooms.flatMap((r) => r.fixtures)
  const allWoods = woodNames(allFx)
  const lmPerM2 = totalArea > 0 ? Math.round(totalLm / totalArea) : 0

  /* Доминирующее дерево по точкам. Кастомные светильники (другие бренды)
     не считаем — лес собирается только из WOODLED-пород. */
  const ownFx = allFx.filter((f) => !f.custom)
  const woodCounts: Record<string, number> = {}
  for (const f of ownFx) {
    const w = f.wood ?? 'oak'
    woodCounts[w] = (woodCounts[w] ?? 0) + (f.q ?? 1)
  }
  const topWoodId = Object.entries(woodCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
  const dominantWood = topWoodId ? (MATS.find((m) => m.id === topWoodId)?.name ?? '—') : '—'

  /* Карта комнат с лесными сценами. */
  const sceneMap: SceneMapEntry[] = filledRooms.map((r) => {
    const rt = getRT(r.typeId)
    const scene = forestScene(rt, r)
    const woods: Wood[] = []
    for (const fx of r.fixtures) {
      if (fx.custom) continue // другие бренды в «лес» не входят
      const q = fx.q ?? 1
      for (let i = 0; i < q; i++) woods.push((fx.wood ?? 'oak') as Wood)
    }
    /* «Лид» — первое предложение легенды до запятой («Главный свет идёт сверху», ...). */
    const lead = scene.legend.split(',')[0] ?? ''
    return {
      name: r.customName || rt.name,
      scene,
      tint: ROOM_TINTS[r.typeId],
      placeColor: PLACE_COLOR[scene.place],
      lead,
      woods,
      typeId: r.typeId,
    }
  })

  /* Доминирующее место — по числу комнат с таким местом. */
  const placeCounts: Record<ForestPlace, number> = { glade: 0, grove: 0, thicket: 0 }
  for (const e of sceneMap) placeCounts[e.scene.place]++
  const dominantPlace: ForestPlace =
    (Object.entries(placeCounts) as [ForestPlace, number][])
      .sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'grove'
  const dominantColor = PLACE_COLOR[dominantPlace]

  /* Контрастная пара — две комнаты с максимально удалёнными местами. */
  let contrastPair: StoryContext['contrastPair'] = null
  if (sceneMap.length >= 2) {
    let best: { soft: SceneMapEntry; bright: SceneMapEntry; gap: number } | null = null
    for (let i = 0; i < sceneMap.length; i++) {
      for (let j = i + 1; j < sceneMap.length; j++) {
        const a = sceneMap[i]
        const b = sceneMap[j]
        const ga = PLACE_DIST[a.scene.place]
        const gb = PLACE_DIST[b.scene.place]
        const gap = Math.abs(ga - gb)
        if (gap > 0 && (!best || gap > best.gap)) {
          /* «Тихий» = thicket (ниже), «яркий» = glade (выше). */
          if (ga < gb) best = { soft: a, bright: b, gap }
          else best = { soft: b, bright: a, gap }
        }
      }
    }
    if (best) contrastPair = { soft: best.soft, bright: best.bright }
  }

  /* zoneShare — доля каждой зоны в общем доме. */
  const zoneShare = (zid: 'ceiling' | 'wall' | 'floor' | 'table'): number => {
    const lm = rooms.reduce((s, r) => s + zoneLm(r.fixtures, zid), 0)
    return totalLm > 0 ? Math.round((lm / totalLm) * 100) : 0
  }

  /* Средняя температура (по WOODLED-точкам). У кастомов температура
     лежит в f.custom.btemp, а не в f.opts.btemp — но «Характер дома»
     в Story говорит про WOODLED-лес, поэтому считаем только по своим
     (иначе denom=totalTrees без кастомов и sum по всем — перекос). */
  let avgKelvin = '—'
  if (filledRooms.length > 0) {
    const denom = Math.max(1, totalTrees)
    const sum = ownFx.reduce((s, f) => {
      const k = parseInt(f.opts?.btemp ?? '4000') || 4000
      return s + k * (f.q ?? 1)
    }, 0)
    avgKelvin = denom > 0 ? '~' + Math.round(sum / denom) + 'K' : '—'
  }

  /* Средний процент потерь от мебели. */
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

  /* Цоколи: считаем лампы (l × q) по типу. Только WOODLED — у кастомов
     может быть встроенный LED или лента, в Cap-таблицу не вписать. */
  const lampsByCap: Record<Cap, number> = { E27: 0, GX53: 0, E14: 0 }
  for (const f of ownFx) {
    const m = MD[f.m]
    if (!m) continue
    const cap = detectCap(m.ltName)
    lampsByCap[cap] += (f.l ?? m.lamps) * (f.q ?? 1)
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
    sceneMap,
    dominantPlace,
    dominantColor,
    avgKelvin,
    furnPctAvg,
    hasMirror,
    lampsByCap,
    contrastPair,
    zoneShare,
  }
}

/* ──────────────── Helper-функции слайдов ──────────────── */

function treesSub(ctx: StoryContext): string {
  const wood = ctx.dominantWood === ctx.allWoods
    ? `Единый ${ctx.dominantWood.toLowerCase()}овый лес`
    : `Смешанный лес: ${ctx.allWoods}`
  return `${wood}. ${densityComment(ctx.lmPerM2)}`
}

/** Комментарий к плотности света — чтобы цифры не висели без объяснения. */
function densityComment(lmPerM2: number): string {
  if (lmPerM2 < 80) return 'Света приглушённо — комната для отдыха.'
  if (lmPerM2 < 160) return 'Привычный уровень для жилых комнат.'
  if (lmPerM2 < 260) return 'С запасом — подойдёт и для работы.'
  return 'Света с большим запасом — диммер пригодится.'
}

/** Комментарий к финалу — что значит N ламп + цоколи. */
function lampsComment(ctx: StoryContext): string {
  const parts: string[] = []
  const caps: Array<[string, number]> = [
    ['E27', ctx.lampsByCap.E27],
    ['GX53', ctx.lampsByCap.GX53],
    ['E14', ctx.lampsByCap.E14],
  ].filter(([, n]) => (n as number) > 0) as Array<[string, number]>

  if (caps.length === 1) {
    parts.push(`Все на цоколе ${caps[0][0]} — можно покупать упаковкой.`)
  } else if (caps.length > 1) {
    const list = caps.map(([cap, n]) => `${n} на ${cap}`).join(', ')
    parts.push(`Цоколи: ${list}.`)
  }
  parts.push('Меняются за минуту — каждая продолжит светить.')
  return parts.join(' ')
}

/** Подзаголовок слайда 4 — что у дома с местами леса. */
function houseSceneSub(ctx: StoryContext): string {
  const uniq = new Set(ctx.sceneMap.map((e) => e.scene.place))
  if (uniq.size === 1) {
    const p = ctx.dominantPlace
    if (p === 'glade') return 'Везде поляны — свет идёт сверху по всему дому.'
    if (p === 'thicket') return 'Везде чащи — свет ушёл вниз, дом получается камерным.'
    return 'Везде рощи — свет ровно по комнатам, дом дышит спокойно.'
  }
  if (uniq.size === 2) {
    const titles = [...uniq].map((p) => PLACE_TITLE[p].toLowerCase())
    return `Сочетание: ${titles[0]} и ${titles[1]}. Каждая комната звучит по-своему.`
  }
  return 'И поляны, и рощи, и чащи — три типа леса живут под одной крышей.'
}

/** Слайд 5 (контраст или единое настроение). */
function breathingSub(ctx: StoryContext): string {
  if (ctx.contrastPair) {
    const { soft, bright } = ctx.contrastPair
    return `${bright.name} светится как ${PLACE_TITLE[bright.scene.place].toLowerCase()}, а ${soft.name.toLowerCase()} затихает как ${PLACE_TITLE[soft.scene.place].toLowerCase()}. Дом дышит ритмом дня.`
  }
  /* Все одинаковые — единое настроение. */
  const p = ctx.dominantPlace
  const tone =
    p === 'glade' ? 'дневное и открытое'
    : p === 'thicket' ? 'вечернее и тихое'
    : 'ровное и спокойное'
  return `Везде ${PLACE_TITLE[p].toLowerCase()} — дом звучит в одной интонации, ${tone}.`
}

/** Слайд 6 (zone subtitle). */
function zoneSubtitle(zoneShareFn: (zid: 'ceiling' | 'wall' | 'floor' | 'table') => number): string {
  const c = zoneShareFn('ceiling')
  const w = zoneShareFn('wall')
  const f = zoneShareFn('floor')
  const t = zoneShareFn('table')

  if (c > 60) return 'Главный свет — сверху. Классическая схема.'
  if (w + f + t > c) return 'Свет ушёл вниз — дом становится камерным.'

  const vals = [c, w, f, t].filter((v) => v > 0)
  if (vals.length >= 2) {
    const spread = Math.max(...vals) - Math.min(...vals)
    if (spread < 15) return 'Свет распределён ровно — по всем зонам понемногу.'
  }

  const zones: [string, number][] = [
    ['Потолок', c], ['Стены', w], ['Пол', f], ['Мебель', t],
  ]
  const top = zones.sort((a, b) => b[1] - a[1])[0]
  return `Главный источник — ${top[0].toLowerCase()}.`
}

/** Слайд 7 (что формирует характер). */
function formSub(ctx: StoryContext): string {
  if (ctx.furnPctAvg > 0 && ctx.hasMirror) {
    return `Мебель забирает около ${ctx.furnPctAvg}% света, зеркала немного возвращают. Температура ${ctx.avgKelvin} задаёт характер.`
  }
  if (ctx.furnPctAvg > 0) {
    return `Мебель забирает около ${ctx.furnPctAvg}% света — углы получают мягкие тени, свет становится объёмным. Температура ${ctx.avgKelvin} задаёт характер.`
  }
  return `Температура ${ctx.avgKelvin} задаёт характер: тёплая — для вечера, рабочая — для дня.`
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

  /* Слайд 2 · Ваш лес */
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

  /* Слайд 3 · Три места леса — образовательный мост */
  slides.push({
    title: 'Три места леса',
    sub: 'Куда направлен свет в комнате — такой и характер у пространства.',
    iconKey: 'sun',
    color: T.neutral,
    placeIntro: true,
  })

  /* Слайд 4 · Карта дома */
  slides.push({
    title: 'Сцены вашего дома',
    sub: houseSceneSub(ctx),
    iconKey: 'dotDashed',
    color: ctx.dominantColor,
    sceneMap: true,
  })

  /* Слайд 5 · Дом дышит */
  slides.push({
    title: ctx.contrastPair ? 'Дом дышит' : 'Единое настроение',
    sub: breathingSub(ctx),
    iconKey: 'wind',
    color: ctx.contrastPair ? T.dawn : ctx.dominantColor,
  })

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

  /* Слайд 7 · Характер дома */
  const k = parseInt(ctx.avgKelvin.replace(/[^\d]/g, '')) || 0
  const formBlocks: StoryBlock[] = [
    ['Температура', ctx.avgKelvin],
  ]
  if (ctx.furnPctAvg > 0) {
    formBlocks.push(['Мебель забирает', `${ctx.furnPctAvg}%`])
  }
  slides.push({
    title: 'Характер дома',
    sub: formSub(ctx),
    iconKey: 'thermo',
    color: k < 3500 ? T.dawn : T.noon,
    blocks: formBlocks,
  })

  /* ═══ Фаза 4: Финал ═══ */

  /* Слайд 8 · Финал — лампы и цоколи */
  slides.push({
    title: `${ctx.totalLamps} ${lw(ctx.totalLamps)}`,
    sub: lampsComment(ctx),
    iconKey: 'bulb',
    color: T.clearing,
  })

  return slides
}
