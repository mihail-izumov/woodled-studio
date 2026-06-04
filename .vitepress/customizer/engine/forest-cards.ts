/**
 * forest-cards.ts — Карточки «Как это работает» в блоке настроения.
 *
 * Тексты привязаны к КОНКРЕТНОЙ сборке комнаты:
 *   - модель + размер: «огромная люстра», «два торшера», «пара бра»;
 *   - порода с группами: «Орех у люстры и торшеров», «Дуб у бра и настольной»;
 *   - температура с распределением: «два торшера 2700K, люстра и бра 4000K»;
 *   - мебель: имена с %, совет на основе FURN_HINT и реально пустых зон комнаты;
 *   - стены / потолок: скрываются, если стандартные.
 *
 * Правка текстов = правка таблиц-банков в этом файле. Никакой импровизации
 * в рантайме — движок только выбирает и склеивает.
 *
 * Голос — `WOODLED_tone_of_voice.md`. Словарь — `WOODLED_словарь_карточек_настроения.md`.
 */

import { MD, FX_FACTORS, ALL_ZONES, type Fixture, type ModelId, type ZoneId, type FxType } from '../data/catalog'
import { FURN, FURN_HINT, FURN_GEN } from '../data/furniture'
import { DEF_OPT, type Wood } from '../data/materials'
import type { Room, RoomType, RoomTypeId } from '../data/rooms'
import { baseLm, fxLm, ratioOf, furnPct, getArea } from './brightness'
import { zoneLm, zoneFxCount } from './zone-engine'
import { kindWord, woodWord, joinList } from './i18n'
import { wallFinishOf, wallColorOf, normalizeHex } from './wall-color'

/* ──────────────── Тип карточки ──────────────── */

export interface KnobCard {
  title: string
  chip?: string
  text: string
  /** Опциональный цвет-«квадратик» рядом с chip (HEX). Сейчас используется
   *  только карточкой «Стены», когда задан свой wallColor — чтобы пользователь
   *  видел тот же оттенок, что выбрал в RoomSettings. */
  swatch?: string
}

/* ──────────────── Анти-повтор ──────────────── */

function pick<T>(arr: readonly T[], seed: number): T {
  const i = ((Math.trunc(seed) % arr.length) + arr.length) % arr.length
  return arr[i]
}

function capFirst(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s
}

function fmtLm(n: number): string {
  return n.toLocaleString('ru-RU')
}

/* ──────────────── Группировка светильников ──────────────── */

interface FxGroup {
  modelId: ModelId
  kind: FxType
  size: string
  count: number
  lm: number
  wood: Wood
  btemp: string
  zone: ZoneId
}

function fixtureLm(f: Fixture): number {
  const m = MD[f.m]
  if (!m) return 0
  const l = f.l ?? m.lamps
  const q = f.q ?? 1
  const diff = f.opts?.diffuser && m.diffLoss ? 1 - m.diffLoss : 1
  const k = FX_FACTORS[f.m] ?? { body: 1, ambient: 1 }
  return Math.round(m.lmPer * l * q * k.body * diff * k.ambient)
}

/** Группировка по модели + дерево + температура — отдельная группа для разных параметров. */
function groupByModel(fx: Fixture[]): FxGroup[] {
  const map = new Map<string, FxGroup>()
  for (const f of fx) {
    const m = MD[f.m]
    if (!m) continue
    const q = f.q ?? 1
    const lm = fixtureLm(f)
    const wood = (f.wood ?? 'oak') as Wood
    const btemp = f.opts?.btemp ?? DEF_OPT.btemp
    const zone = (f.zone ?? 'ceiling') as ZoneId
    const key = `${f.m}|${wood}|${btemp}|${zone}`
    const existing = map.get(key)
    if (existing) {
      existing.count += q
      existing.lm += lm
    } else {
      map.set(key, {
        modelId: f.m,
        kind: m.type,
        size: m.chip || '',
        count: q,
        lm,
        wood,
        btemp,
        zone,
      })
    }
  }
  return [...map.values()].sort((a, b) => b.lm - a.lm)
}

/** «огромная люстра» / «два торшера» / «пара бра» / «настольная» — именительный. */
function fxNameNom(modelId: ModelId, count: number): string {
  const m = MD[modelId]
  if (!m) return ''
  const kind = m.type
  const noun = kindWord(kind, count)

  if (count === 1) {
    /* Размер прилагается только для люстр — он там содержательно меняется. */
    if (kind === 'люстра' && /^(малая|средняя|большая|огромная)$/.test(m.chip || '')) {
      return `${m.chip} ${noun}`
    }
    return noun
  }

  /* count >= 2 */
  if (kind === 'бра') {
    return count === 2 ? 'пара бра' : `${count} бра`
  }

  const fem = kind === 'люстра' || kind === 'настольная'
  let num: string
  if (count === 2) num = fem ? 'две' : 'два'
  else if (count === 3) num = 'три'
  else if (count === 4) num = 'четыре'
  else num = String(count)

  return `${num} ${noun}`
}

/** Родительный падеж (для «от/у/без X»): «огромной люстры», «двух торшеров», «пары бра». */
function fxNameGen(modelId: ModelId, count: number): string {
  const m = MD[modelId]
  if (!m) return ''
  const kind = m.type

  if (count === 1) {
    if (kind === 'бра') return 'бра'
    if (kind === 'торшер') return 'торшера'
    if (kind === 'настольная') return 'настольной'
    if (kind === 'спот') return 'спота'
    if (kind === 'люстра') {
      const sizeMap: Record<string, string> = {
        'малая': 'малой', 'средняя': 'средней', 'большая': 'большой', 'огромная': 'огромной',
      }
      const sizeGen = sizeMap[m.chip || ''] || ''
      return sizeGen ? `${sizeGen} люстры` : 'люстры'
    }
  }

  /* count >= 2 — gen plural */
  if (kind === 'бра') {
    if (count === 2) return 'пары бра'
    if (count === 3) return 'трёх бра'
    if (count === 4) return 'четырёх бра'
    return `${count} бра`
  }
  const nounGenPl =
    kind === 'люстра' ? 'люстр'
      : kind === 'торшер' ? 'торшеров'
        : kind === 'настольная' ? 'настольных'
          : kind === 'спот' ? 'спотов'
            : kind
  let num: string
  if (count === 2) num = 'двух'
  else if (count === 3) num = 'трёх'
  else if (count === 4) num = 'четырёх'
  else num = String(count)
  return `${num} ${nounGenPl}`
}

/** Дательный падеж (для «к X»): «огромной люстре», «двум торшерам», «паре бра». */
function fxNameDat(modelId: ModelId, count: number): string {
  const m = MD[modelId]
  if (!m) return ''
  const kind = m.type

  if (count === 1) {
    if (kind === 'бра') return 'бра'
    if (kind === 'торшер') return 'торшеру'
    if (kind === 'настольная') return 'настольной'
    if (kind === 'спот') return 'споту'
    if (kind === 'люстра') {
      const sizeMap: Record<string, string> = {
        'малая': 'малой', 'средняя': 'средней', 'большая': 'большой', 'огромная': 'огромной',
      }
      const sizeDat = sizeMap[m.chip || ''] || ''
      return sizeDat ? `${sizeDat} люстре` : 'люстре'
    }
  }

  if (kind === 'бра') {
    if (count === 2) return 'паре бра'
    if (count === 3) return 'трём бра'
    if (count === 4) return 'четырём бра'
    return `${count} бра`
  }
  const nounDatPl =
    kind === 'люстра' ? 'люстрам'
      : kind === 'торшер' ? 'торшерам'
        : kind === 'настольная' ? 'настольным'
          : kind === 'спот' ? 'спотам'
            : kind
  let num: string
  if (count === 2) num = 'двум'
  else if (count === 3) num = 'трём'
  else if (count === 4) num = 'четырём'
  else num = String(count)
  return `${num} ${nounDatPl}`
}

/* ──────────────── 1. Где свет ──────────────── */

type Place = 'glade' | 'grove' | 'thicket'

const CEILING_HIGH = 0.6
const CEILING_LOW = 0.25

function scenePlace(fx: Fixture[]): Place {
  const total = fxLm(fx)
  if (total <= 0) return 'grove'
  const cs = zoneLm(fx, 'ceiling') / total
  if (cs >= CEILING_HIGH) return 'glade'
  if (cs <= CEILING_LOW) return 'thicket'
  return 'grove'
}

/* Лиды получают обе формы доминанта (именительный/родительный) и сами выбирают, какую вставить. */
const GLADE_LEAD: readonly ((nom: string, gen: string) => string)[] = [
  (_n, gen) => `Главный свет — от ${gen} сверху.`,
  (nom) => `Сверху держит ${nom}.`,
  (_n, gen) => `Свет идёт от ${gen} сверху.`,
]
const GROVE_LEAD: readonly ((nom: string) => string)[] = [
  (nom) => `${capFirst(nom)} светит сверху,`,
  (nom) => `Сверху держит ${nom},`,
]
/* В thicket падежи родительный/дательный — безопасно для любого числа источников. */
const THICKET_LEAD: readonly ((gen: string, dat: string) => string)[] = [
  (gen) => `Потолок тихий — свет внизу, у ${gen}.`,
  (_g, dat) => `Свет ушёл вниз — к ${dat}.`,
]

const GLADE_ROLES = ['добирают объём по краям', 'подсвечивают зоны', 'снимают тени по углам'] as const
const GROVE_ROLES = ['работают снизу — свет ложится ровно', 'подсвечивают комнату по краям'] as const

const GLADE_TEACH = [
  'Один потолочный задаёт простой контур, а нижние источники добавляют объём.',
  'Когда свет идёт и сверху, и снизу — он мягче, чем один источник из одной точки.',
] as const
const GROVE_TEACH = [
  'Свет идёт со всех сторон — самое спокойное распределение для жилой комнаты.',
  'И сверху, и снизу — в комнате нет тёмных островков, всё освещено ровно.',
] as const
const THICKET_TEACH = [
  'Свет снизу не бьёт в глаза — комната располагает к покою. Для работы за столом добавьте сверху.',
  'Низкий свет хорош для тихого вечера — для уроков или готовки добавьте потолочный.',
] as const

function whereCard(_rt: RoomType, room: Room, seed: number): KnobCard | null {
  const fx = room.fixtures
  if (fx.length === 0) return null
  const total = fxLm(fx)
  if (total <= 0) return null

  const place = scenePlace(fx)
  const groups = groupByModel(fx)

  /* Топовая зона + % для чипа */
  const litZones = ALL_ZONES.map((z) => ({ z, lm: zoneLm(fx, z.id) }))
    .filter((s) => s.lm > 0)
    .sort((a, b) => b.lm - a.lm)
  const top = litZones[0]
  const chip = top ? `${top.z.name.toLowerCase()} ${Math.round((top.lm / total) * 100)}%` : undefined

  const ceilingGroups = groups.filter((g) => g.zone === 'ceiling')
  const lowerGroups = groups.filter((g) => g.zone !== 'ceiling')

  let text = ''
  if (place === 'glade') {
    const dom = ceilingGroups[0] ?? groups[0]
    const domNom = fxNameNom(dom.modelId, dom.count)
    const domGen = fxNameGen(dom.modelId, dom.count)
    text = pick(GLADE_LEAD, seed)(domNom, domGen)
    if (lowerGroups.length > 0) {
      const secPhrase = joinList(lowerGroups.map((g) => fxNameNom(g.modelId, g.count)))
      text += ` ${capFirst(secPhrase)} ${pick(GLADE_ROLES, seed + 1)}.`
    } else {
      text += ' Нижних источников пока нет — простой контур.'
    }
    text += ` ${pick(GLADE_TEACH, seed + 2)}`
  } else if (place === 'grove') {
    const dom = ceilingGroups[0] ?? groups[0]
    const domNom = fxNameNom(dom.modelId, dom.count)
    const lead = pick(GROVE_LEAD, seed)(domNom)
    if (lowerGroups.length > 0) {
      const secPhrase = joinList(lowerGroups.map((g) => fxNameNom(g.modelId, g.count)))
      text = `${lead} ${secPhrase} ${pick(GROVE_ROLES, seed + 1)}.`
    } else {
      text = lead.replace(/,$/, '.')
    }
    text += ` ${pick(GROVE_TEACH, seed + 2)}`
  } else {
    /* thicket */
    const secGen = lowerGroups.length > 0
      ? joinList(lowerGroups.map((g) => fxNameGen(g.modelId, g.count)))
      : 'нижних источников'
    const secDat = lowerGroups.length > 0
      ? joinList(lowerGroups.map((g) => fxNameDat(g.modelId, g.count)))
      : 'нижним источникам'
    text = pick(THICKET_LEAD, seed)(secGen, secDat)
    text += ` ${pick(THICKET_TEACH, seed + 1)}`
  }

  return { title: 'Где свет', chip, text }
}

/* ──────────────── 2. Сколько света ──────────────── */

type Bright = 'dim' | 'norm' | 'full'
function brightLevel(ratio: number): Bright {
  /* Пороги синхронизированы со шкалой BRIGHT в moods.ts (0.8 / 1.2). */
  if (ratio < 0.8) return 'dim'
  if (ratio < 1.2) return 'norm'
  return 'full'
}

/** Дательный падеж имени комнаты (для «{Гостиной} нужно ~10 200 лм»). */
const ROOM_DAT: Record<RoomTypeId, string> = {
  living:   'Гостиной',
  kitchen:  'Кухне',
  bedroom:  'Спальне',
  kids:     'Детской',
  office:   'Кабинету',
  hallway:  'Коридору',
  bathroom: 'Ванной',
  stairs:   'Лестнице',
}

/** Почему этой комнате нужно именно столько (для «нужно ~X лм — {why}»). */
const WHY_ROOM: Record<RoomTypeId, string> = {
  kitchen:  'там готовка и нож',
  bedroom:  'здесь читают и отдыхают',
  living:   'для гостей и для вечера',
  office:   'за столом работают с документами',
  kids:     'за уроками глазам нужно много света',
  hallway:  'здесь проходят, не задерживаются',
  bathroom: 'у зеркала нужно много света',
  stairs:   'важно видеть, куда ставить ногу',
}

const VERDICT_DIM: readonly ((actual: number, pct: number) => string)[] = [
  (actual, p) => `у вас ${fmtLm(actual)} — на ${p}% от нормы, маловато`,
  (actual) => `у вас ${fmtLm(actual)} — света не хватает`,
]
const VERDICT_NORM: readonly ((actual: number) => string)[] = [
  (actual) => `у вас ${fmtLm(actual)} — попадаете в норму`,
  (actual) => `у вас ${fmtLm(actual)} — то, что нужно`,
  (actual) => `${fmtLm(actual)} — норма с лёгким запасом`,
]
const VERDICT_FULL: readonly ((actual: number) => string)[] = [
  (actual) => `у вас ${fmtLm(actual)} — света с запасом`,
  (actual) => `${fmtLm(actual)} — больше нормы`,
]

const TEACH_DIM_UNI = [
  'На вечер хватит, для дел добавьте света.',
  'Поставьте ещё один источник — света станет достаточно.',
] as const
const TEACH_DIM: Partial<Record<RoomTypeId, readonly string[]>> = {
  kitchen: ['За готовкой будет темновато — добавьте свет над рабочей зоной.'],
  bedroom: ['Для отдыха достаточно, для чтения мало.'],
  office:  ['Для бумаги мало — глаза устанут.'],
}

const TEACH_NORM_UNI = [
  'Захотите вечером мягче — поможет диммер.',
] as const
const TEACH_NORM: Partial<Record<RoomTypeId, readonly string[]>> = {
  living:  ['Этого хватит и на гостей, и на тихий вечер.'],
  bedroom: ['Хватает на чтение, не давит на сон.'],
  kitchen: ['С готовкой справится, и с утра не режет глаза.'],
  office:  ['За документами видно, к концу дня глаза не устанут.'],
}

const TEACH_FULL_UNI = [
  'Глазам этого даже много — поставьте диммер, будете крутить под настроение.',
  'Поставьте диммер — приглушите вечером.',
] as const

function howMuchCard(rt: RoomType, room: Room, seed: number): KnobCard | null {
  const fx = room.fixtures
  if (fx.length === 0) return null
  const actual = fxLm(fx)
  const base = baseLm(rt, room)
  if (base <= 0) return null

  const ratio = ratioOf(base, actual)
  const ratioPct = Math.round(ratio * 100)
  const bl = brightLevel(ratio)
  const area = getArea(rt, room)
  const why = WHY_ROOM[room.typeId] ?? ''
  const roomDat = ROOM_DAT[room.typeId] ?? rt.name

  const baseLine = `${roomDat} ${area} м² нужно ~${fmtLm(base)} лм${why ? ` — ${why}` : ''}.`

  let verdict = ''
  if (bl === 'dim') verdict = pick(VERDICT_DIM, seed)(actual, ratioPct)
  else if (bl === 'norm') verdict = pick(VERDICT_NORM, seed)(actual)
  else verdict = pick(VERDICT_FULL, seed)(actual)

  let teach = ''
  if (bl === 'dim') {
    const per = TEACH_DIM[room.typeId]
    teach = per ? pick(per, seed + 1) : pick(TEACH_DIM_UNI, seed + 1)
  } else if (bl === 'norm') {
    const per = TEACH_NORM[room.typeId]
    teach = per ? pick(per, seed + 1) : pick(TEACH_NORM_UNI, seed + 1)
  } else {
    teach = pick(TEACH_FULL_UNI, seed + 1)
  }

  return {
    title: 'Сколько света',
    chip: `${ratioPct}%`,
    text: `${baseLine} ${capFirst(verdict)}. ${teach}`,
  }
}

/* ──────────────── 3. Стены ──────────────── */

const WALL_LIGHT = [
  'Светлые стены отражают часть света — норма получается на ~10% ниже обычной.',
  'Стены работают на вас: светлые поверхности возвращают часть света. Это −10% к норме.',
  'Светлые стены — союзник: отражают свет обратно. Норма на 10% мягче.',
] as const
const WALL_MEDIUM = [
  'Стены нейтрального тона: ни возвращают свет, ни глушат — норма комнаты как из учебника.',
  'Нейтральные стены работают по-честному: без поправок в обе стороны.',
  'Стены среднего тона держат свет ровно — ни помощи, ни помехи, норма без скидок.',
] as const
const WALL_DARK = [
  'Тёмные стены глушат свет — к норме добавляется ~15%.',
  'Тёмные стены съедают часть света. Учитываем это: норма на 15% выше обычной.',
  'Тёмные стены забирают часть света — комнате нужно на 15% больше.',
] as const

const WALL_CHIP: Record<'light' | 'medium' | 'dark', string> = {
  light: 'светлые',
  medium: 'нейтральные',
  dark: 'тёмные',
}

/* Карточка «Стены» показывается ВСЕГДА. Источник истины — wallFinishOf:
   если задан свой HEX (wallColor), категория считается автоматически по
   relative luminance; если нет — пресет wallFinish.
   Когда HEX задан — в карточке появляется swatch (тот же оттенок) и
   chip-текст вида «#E8E0D4 · светлые». */
function wallsCard(_rt: RoomType, room: Room, seed: number): KnobCard | null {
  const wf = wallFinishOf(room)
  const chipLabel = WALL_CHIP[wf]
  const text = pick(
    wf === 'light' ? WALL_LIGHT : wf === 'dark' ? WALL_DARK : WALL_MEDIUM,
    seed,
  )
  const customHex = normalizeHex(room.wallColor ?? '')
  if (customHex) {
    return {
      title: 'Стены',
      chip: `${customHex.toUpperCase()} · ${chipLabel}`,
      swatch: customHex,
      text,
    }
  }
  return { title: 'Стены', chip: chipLabel, text }
}

/* ──────────────── 4. Дерево ──────────────── */

const WOOD_CHAR: Record<Wood, readonly string[]> = {
  oak:    ['Дуб — светлый, тёплый.', 'Светлое дерево, тёплый тон.', 'Дуб — самый светлый из ламелей, спокойный тон.'],
  walnut: ['Орех — глубокий, тёплый.', 'Тёмное тёплое дерево.', 'Орех — глубокий тон, мягкая теплота.'],
  black:  ['Чёрный дуб — строгий, плотный.', 'Самое тёмное дерево из трёх — строгий характер.'],
}
const WOOD_NOM: Record<Wood, string> = { oak: 'Дуб', walnut: 'Орех', black: 'Чёрный дуб' }
const WOOD_SHORT: Record<Wood, string> = {
  oak:    'светлый, тёплый',
  walnut: 'глубокий, тёплый',
  black:  'строгий, плотный',
}
const WOOD_TEACH = [
  'Ламели пропускают около двух третей света, и он становится мягким.',
  'Свет проходит сквозь ламели, и резкость уходит — комната получает мягкое освещение.',
  'Около трети света остаётся в дереве — так получается настроение живого леса.',
] as const

function woodCard(_rt: RoomType, room: Room, seed: number): KnobCard | null {
  const fx = room.fixtures
  if (fx.length === 0) return null
  const groups = groupByModel(fx)

  /* Подсчёт точек по дереву. */
  const counts: Partial<Record<Wood, number>> = {}
  for (const g of groups) counts[g.wood] = (counts[g.wood] ?? 0) + g.count
  const woods = (Object.keys(counts) as Wood[])
    .filter((w) => (counts[w] ?? 0) > 0)
    .sort((a, b) => (counts[b]! - counts[a]!))
  if (woods.length === 0) return null

  const chip = woods.map((w) => `${counts[w]} ${woodWord(w, counts[w]!)}`).join(' · ')

  let text = ''
  if (woods.length === 1) {
    const w = woods[0]
    text = `${pick(WOOD_CHAR[w], seed)} ${pick(WOOD_TEACH, seed + 1)}`
  } else {
    /* Смесь — где какое дерево (группа моделей по дереву). «У X» требует родительный. */
    const phrases: string[] = []
    for (const w of woods) {
      const subgroups = groups.filter((g) => g.wood === w)
      const whereList = joinList(subgroups.map((g) => fxNameGen(g.modelId, g.count)))
      phrases.push(`${WOOD_NOM[w]} у ${whereList} — ${WOOD_SHORT[w]}.`)
    }
    text = `${phrases.join(' ')} ${pick(WOOD_TEACH, seed + 1)}`
  }

  return { title: 'Дерево', chip, text }
}

/* ──────────────── 5. Мебель ──────────────── */

function furnitureCard(rt: RoomType, room: Room, seed: number): KnobCard | null {
  const furn = room.furniture
  if (!furn || furn.length === 0) return null

  const items = furn
    .map((id) => ({ id, ab: FURN[id]?.ab ?? 0, name: FURN[id]?.name ?? '' }))
    .filter((x) => x.name)
  if (items.length === 0) return null

  /* Только зеркало (или зеркала) — отдельная коротенькая карточка. */
  const onlyMirror = items.every((x) => x.id === 'mirror')
  if (onlyMirror) {
    return {
      title: 'Мебель',
      chip: 'зеркало',
      text: 'Зеркало возвращает 3% света — немного помогает.',
    }
  }

  const fp = furnPct(furn)
  const sorted = [...items].filter((x) => x.ab > 0).sort((a, b) => b.ab - a.ab)
  const hasMirror = items.some((x) => x.id === 'mirror')

  /* Топовая мебель + проценты. */
  let topPhrase = ''
  if (sorted.length === 1) {
    topPhrase = `${sorted[0].name} забирает ${Math.round(sorted[0].ab * 100)}% света.`
  } else if (sorted.length === 2) {
    const p1 = Math.round(sorted[0].ab * 100)
    const p2 = Math.round(sorted[1].ab * 100)
    if (p1 === p2) {
      topPhrase = `${sorted[0].name} и ${sorted[1].name.toLowerCase()} забирают по ${p1}% каждый.`
    } else {
      topPhrase = `${sorted[0].name} и ${sorted[1].name.toLowerCase()} забирают ${p1}% и ${p2}%.`
    }
  } else {
    const p1 = Math.round(sorted[0].ab * 100)
    const p2 = Math.round(sorted[1].ab * 100)
    const restPct = Math.round(sorted.slice(2).reduce((s, x) => s + x.ab, 0) * 100)
    if (p1 === p2) {
      topPhrase = `${sorted[0].name} и ${sorted[1].name.toLowerCase()} забирают по ${p1}% каждый, остальная мебель — ещё ${restPct}%.`
    } else {
      topPhrase = `${sorted[0].name} и ${sorted[1].name.toLowerCase()} забирают ${p1}% и ${p2}%, остальная мебель — ещё ${restPct}%.`
    }
  }

  /* Последствие — насколько заметно. */
  let consequence = ''
  if (fp <= 5) consequence = 'Тени почти не заметны.'
  else if (fp <= 12) consequence = 'Углы у мебели в тени, но без потерь сцены.'
  else {
    const topId = sorted[0]?.id
    const topGen = (topId && FURN_GEN[topId]) || sorted[0]?.name.toLowerCase() || 'мебели'
    consequence = pick([`Углы у ${topGen} в тени.`, `Тени собираются у ${topGen}.`], seed)
  }

  /* Совет — на основе FURN_HINT и пустых зон комнаты. */
  let advice = ''
  const availZones = new Set(rt.zones)
  const usedZones = new Set<ZoneId>(
    room.fixtures.map((f) => (f.zone ?? 'ceiling') as ZoneId),
  )

  for (const item of sorted) {
    const hint = FURN_HINT[item.id]
    if (!hint) continue
    if (!availZones.has(hint.zone)) continue
    const isUsed = usedZones.has(hint.zone)
    if (isUsed) {
      /* Сколько реально подключено в этой зоне — определяет число и форму глагола. */
      const present = zoneFxCount(room.fixtures, hint.zone)
      const kindNom = zoneKindNom(hint.zone, present)
      const plural = present >= 2
      const phrases = plural
        ? [
          `${capFirst(kindNom)} ${hint.where} делают своё дело — комната дышит.`,
          `${capFirst(kindNom)} ${hint.where} уже выравнивают тени.`,
        ]
        : [
          `${capFirst(kindNom)} ${hint.where} делает своё дело — комната дышит.`,
          `${capFirst(kindNom)} ${hint.where} уже выравнивает тени.`,
        ]
      advice = pick(phrases, seed + 2)
    } else {
      /* «Добавьте {sing} {where} — {benefit}» — рекомендуем добавить один источник. */
      const kindSing = zoneKindNom(hint.zone, 1)
      const phrases = [
        `Добавьте ${kindSing} ${hint.where} — ${hint.benefit}.`,
        `${capFirst(kindSing)} ${hint.where} ${hint.benefit}.`,
      ]
      advice = pick(phrases, seed + 2)
    }
    break
  }

  let text = `${topPhrase} ${consequence}`
  if (advice) text += ` ${advice}`
  if (hasMirror) text += ' Зеркало возвращает 3% света — немного помогает.'

  return { title: 'Мебель', chip: `−${fp}%`, text }
}

/**
 * Имя источника света по зоне и числу (для совета в карточке «Мебель»):
 *   wall  · n=1 → «бра»,   n=2 → «два бра»,         n=5+ → «5 бра»
 *   floor · n=1 → «торшер», n=2 → «два торшера»,    n=5+ → «5 торшеров»
 *   table · n=1 → «настольная», n=2 → «две настольные», n=5+ → «5 настольных»
 *   ceiling · n=1 → «люстра», n=2 → «две люстры»,   n=5+ → «5 люстр»
 */
function zoneKindNom(zone: ZoneId, n: number): string {
  if (n <= 0) return ''
  if (zone === 'wall') {
    if (n === 1) return 'бра'
    if (n === 2) return 'два бра'
    if (n === 3) return 'три бра'
    if (n === 4) return 'четыре бра'
    return `${n} бра`
  }
  if (zone === 'floor') {
    if (n === 1) return 'торшер'
    if (n === 2) return 'два торшера'
    if (n === 3) return 'три торшера'
    if (n === 4) return 'четыре торшера'
    return `${n} торшеров`
  }
  if (zone === 'table') {
    if (n === 1) return 'настольная'
    if (n === 2) return 'две настольные'
    if (n === 3) return 'три настольные'
    if (n === 4) return 'четыре настольные'
    return `${n} настольных`
  }
  if (zone === 'ceiling') {
    if (n === 1) return 'люстра'
    if (n === 2) return 'две люстры'
    if (n === 3) return 'три люстры'
    if (n === 4) return 'четыре люстры'
    return `${n} люстр`
  }
  return ''
}

/* ──────────────── 6. Оттенок света ──────────────── */

const TEMP_LABEL: Record<string, string> = { '2700': '2700K', '3000': '3000K', '4000': '4000K' }
/** Назначение температуры в фразе смеси («X светят 2700K — {purpose}»). */
const TEMP_PURPOSE: Record<string, string> = {
  '2700': 'это вечерний свет',
  '3000': 'получается тёплый и нейтральный свет',
  '4000': 'получается полноценный рабочий свет',
}

const SINGLE_TEMP: Record<string, readonly string[]> = {
  '2700': [
    'Везде тёплый 2700K — комната вечерняя.',
    'Тёплый 2700K — для покоя. Для работы за столом маловат.',
    '2700K — самый тёплый из трёх. Тёплый вечер по умолчанию.',
  ],
  '3000': [
    'Тёплый-нейтр. 3000K — компромисс. И поработать можно, и расслабиться.',
    '3000K — между уютом и ясностью.',
  ],
  '4000': [
    'Везде 4000K — получается полноценный рабочий свет. Видно всё чётко.',
    '4000K — нейтральный, без тёплого оттенка. Видно текстуры и цвета как есть.',
  ],
}
const SINGLE_TEMP_TEACH: Record<string, readonly string[]> = {
  '2700': ['Захотите ясности — поставьте лампы 4000K вместо 2700K.'],
  '3000': ['Тёплая нейтральность подходит почти всем сценам.'],
  '4000': ['Сделаете теплее (3000 или 2700K) — комната станет вечерней.'],
}
const MIX_TEACH = [
  'Переключайте торшерами и бра — поймёте, что хочется.',
  'Тёплый и рабочий рядом — это самая гибкая схема.',
] as const

function tempCard(_rt: RoomType, room: Room, seed: number): KnobCard | null {
  const fx = room.fixtures
  if (fx.length === 0) return null
  const groups = groupByModel(fx)
  const byTemp = new Map<string, FxGroup[]>()
  for (const g of groups) {
    if (!byTemp.has(g.btemp)) byTemp.set(g.btemp, [])
    byTemp.get(g.btemp)!.push(g)
  }
  const temps = [...byTemp.keys()]
  if (temps.length === 0) return null

  if (temps.length === 1) {
    const t = temps[0]
    const desc = SINGLE_TEMP[t] ?? SINGLE_TEMP['4000']
    const teach = SINGLE_TEMP_TEACH[t]
    let text = pick(desc, seed)
    if (teach && teach.length > 0) text += ` ${pick(teach, seed + 1)}`
    return { title: 'Оттенок света', chip: TEMP_LABEL[t] ?? `${t}K`, text }
  }

  /* Смесь — тёплая и рабочая группы. */
  const sortedT = [...temps].sort()
  const chip = sortedT.map((t) => TEMP_LABEL[t] ?? `${t}K`).join(' · ')
  const warm = sortedT[0]
  const clear = sortedT[sortedT.length - 1]
  const warmGroups = byTemp.get(warm) ?? []
  const clearGroups = byTemp.get(clear) ?? []
  const warmPhrase = joinList(warmGroups.map((g) => fxNameNom(g.modelId, g.count)))
  const clearPhrase = joinList(clearGroups.map((g) => fxNameNom(g.modelId, g.count)))

  const text = `${capFirst(warmPhrase)} светят ${TEMP_LABEL[warm]} — ${TEMP_PURPOSE[warm]}. ${capFirst(clearPhrase)} — на ${TEMP_LABEL[clear]}, ${TEMP_PURPOSE[clear]}. ${pick(MIX_TEACH, seed)}`

  return { title: 'Оттенок света', chip, text }
}

/* ──────────────── 7. Потолок и подвес ──────────────── */

function hasCeilingPendant(fx: Fixture[]): boolean {
  return fx.some((f) => {
    const m = MD[f.m]
    if (!m) return false
    if ((f.zone ?? 'ceiling') !== 'ceiling') return false
    if (!m.hasMount) return false
    return (f.opts?.mount ?? 'pendant') === 'pendant'
  })
}

function topCeilingPhrase(fx: Fixture[]): string {
  const ceil = groupByModel(fx).filter((g) => g.zone === 'ceiling')
  if (ceil.length === 0) return 'потолочный'
  const top = ceil[0]
  return fxNameNom(top.modelId, top.count)
}

function ceilingCard(_rt: RoomType, room: Room, seed: number): KnobCard | null {
  const h = room.ceilingH
  const pendant = hasCeilingPendant(room.fixtures)
  /* Скрыть стандартный 2.7 без подвеса — нечего сказать. */
  if (Math.abs(h - 2.7) < 0.05 && !pendant) return null

  const chip = `${h} м${pendant ? ' · подвес' : ''}`

  let heightLead = ''
  if (h >= 3.05) heightLead = `Потолок ${h} м — высокий.`
  else if (h >= 2.95) heightLead = 'Потолок 3 м — выше обычного.'
  else if (Math.abs(h - 2.7) < 0.05) heightLead = `Стандартные ${h} м.`
  else if (h < 2.7) heightLead = `Потолок ${h} м — невысокий.`
  else heightLead = `Потолок ${h} м.`

  let middle = ''
  if (pendant) {
    const dom = topCeilingPhrase(room.fixtures)
    /* Обе фразы — именительный, чтобы не плодить винительный («опускает X»). */
    const phrases = [
      `На подвесе ${dom} ближе к комнате — возвращает около 6% света.`,
      `${capFirst(dom)} на подвесе — на 40 см ближе к работе, чем без него.`,
    ]
    middle = pick(phrases, seed)
  } else if (h > 2.7) {
    middle = 'Без подвеса источники остаются у потолка — свету идти дальше.'
  } else if (h < 2.7) {
    middle = 'Без подвеса источник близко к ламелям — следите, чтобы не били в глаза.'
  }

  let teach = ''
  if (h > 3 && !pendant) teach = ' Если поставить подвес, света станет заметно больше.'
  else if (h < 2.7) teach = ' При низком потолке свет концентрируется — переборщить здесь легко.'

  const text = middle ? `${heightLead} ${middle}${teach}` : `${heightLead}${teach}`

  return { title: 'Потолок и подвес', chip, text }
}

/* ──────────────── Сборка ──────────────── */

/**
 * Собирает массив карточек для комнаты. Карточки с null отфильтрованы
 * (прячутся, если данных нет). Сид анти-повтора — стабильный по сборке.
 */
export function assembleCards(rt: RoomType, room: Room): KnobCard[] {
  const fx = room.fixtures
  if (fx.length === 0) return []
  const seed = fx.length * 17 + furnPct(room.furniture)

  const all: (KnobCard | null)[] = [
    whereCard(rt, room, seed),
    howMuchCard(rt, room, seed),
    wallsCard(rt, room, seed),
    woodCard(rt, room, seed),
    furnitureCard(rt, room, seed),
    tempCard(rt, room, seed),
    ceilingCard(rt, room, seed),
  ]
  return all.filter((c): c is KnobCard => c !== null)
}
