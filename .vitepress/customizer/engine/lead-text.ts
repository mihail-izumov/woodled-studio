/**
 * lead-text.ts — Сериализатор заявок для менеджера.
 *
 * Превращает Room/Fixture в plain text для отправки в Telegram-чат
 * с менеджером (через GAS-бот). Цель — менеджер за один взгляд видит
 * все параметры, которые нужны для подбора по каталогу WOODLED или
 * для понимания, что юзер хочет под чужой бренд.
 *
 * Три точки входа:
 *   • buildFixtureLead(room, fxIdx) — заявка по одному светильнику.
 *   • buildForestLead(rooms)        — заявка по всему дому.
 *   • buildConsultLead(rooms)       — консультация (структура та же,
 *                                     заголовок другой — выбирается на
 *                                     стороне отправки).
 *
 * Формат: plain text без markdown/эмодзи (по требованию задачи).
 * Сами заголовки («Заявка на светильник» / «Новый Лес WOODLED» / …)
 * формирует GAS из `payload.source` — здесь не дублируем.
 *
 * ВАЖНО про имена моделей:
 *   В UI-текстах (карточки настроения, дашборд, NamingSpec) нельзя
 *   использовать `MD[m].name` и `collection` — там работает только
 *   тип+чип (см. NAMING_SPEC.md). Но это операционный лист для
 *   менеджера, не UI для конечного пользователя. Артикульное имя
 *   `MD[m].name` («Rotor 1000») здесь ЕСТЬ — без него менеджер
 *   не сможет подобрать модель в каталоге.
 */

import type { Room } from '../data/rooms'
import { getRT, ROOM_PREP } from '../data/rooms'
import type { Fixture } from '../data/catalog'
import { MD, fxTitle } from '../data/catalog'
import { MATS, BTEMPS, BOWLS, MOUNTS, DEF_OPT } from '../data/materials'
import { FURN } from '../data/furniture'

/* ──────────── Словари для печати ──────────── */

const ZONE_LABEL: Record<string, string> = {
  ceiling: 'потолок',
  wall:    'стена',
  floor:   'пол',
  table:   'мебель',
}

const WALL_LABEL: Record<string, string> = {
  light:  'светлые',
  medium: 'средние',
  dark:   'тёмные',
}

const WIRE_LABEL: Record<string, string> = {
  none:    'без провода',
  wire:    'провод с вилкой',
  button:  'кнопка на корпусе',
  sonetka: 'сонетка (шнурок-выключатель)',
}

const BASE_COLOR_LABEL: Record<string, string> = {
  white: 'белое',
  black: 'чёрное',
}

const CUSTOM_SOURCE_LABEL: Record<string, string> = {
  bulb: 'лампа в патроне',
  led:  'LED-модуль',
  tape: 'LED-лента',
}

const CUSTOM_BODY_LABEL: Record<string, string> = {
  '1.0': 'открытый',
  '0.8': 'абажур',
  '0.6': 'ламели',
}

/* ──────────── Хелперы ──────────── */

function roomName(r: Room): string {
  if (r.customName && r.customName.trim()) return r.customName.trim()
  return getRT(r.typeId).name
}

function roomArea(r: Room): number {
  if (r.sizeIndex === 3) return r.customArea ?? 0
  const rt = getRT(r.typeId)
  return rt.sizes[r.sizeIndex] ?? 0
}

function wallLabel(wf?: string): string {
  return WALL_LABEL[wf ?? 'medium'] ?? 'средние'
}

function bowlName(id: string): string {
  return BOWLS.find((b) => b.id === id)?.name ?? id
}

function mountName(id: string): string {
  return MOUNTS.find((m) => m.id === id)?.name ?? id
}

function btempLabel(id: string): string {
  const b = BTEMPS.find((x) => x.id === id)
  if (!b) return id
  return `${b.kelvin}K (${b.label.toLowerCase()})`
}

function woodName(id: string): string {
  return MATS.find((m) => m.id === id)?.name ?? id
}

function furnList(ids: string[]): string {
  if (!ids || !ids.length) return ''
  return ids
    .map((id) => FURN[id as keyof typeof FURN]?.name ?? id)
    .filter(Boolean)
    .join(', ')
}

/* ──────────── Светильник WOODLED → строки ──────────── */

function woodledFxLines(fx: Fixture, index?: number): string[] {
  const m = MD[fx.m]
  const opts = fx.opts ?? {}
  const lines: string[] = []

  const header = index != null
    ? `Светильник ${index + 1}: ${m.name} (${fxTitle(fx.m).toLowerCase()})`
    : `Светильник: ${m.name} (${fxTitle(fx.m).toLowerCase()})`
  lines.push(header)
  lines.push(`Артикул: ${m.name}`)
  lines.push(`Дерево: ${woodName(fx.wood ?? 'oak')}`)

  const btemp = opts.btemp ?? DEF_OPT.btemp
  lines.push(`Температура: ${btempLabel(btemp)}`)

  const wattStr = typeof m.ltWatt === 'string' ? m.ltWatt : `${m.ltWatt}`
  lines.push(`Источник: ${m.ltName}, ${wattStr} Вт`)

  const lamps = fx.l ?? m.lamps
  lines.push(`Ламп: ${lamps}`)
  lines.push(`Количество: ${fx.q ?? 1}`)
  lines.push(`Зона: ${ZONE_LABEL[fx.zone ?? 'ceiling'] ?? fx.zone}`)

  // Опции, имеющие смысл — печатаем по факту наличия.
  if (m.avBowls && m.avBowls.length > 0) {
    lines.push(`Чаша: ${bowlName(opts.bowl ?? DEF_OPT.bowl)}`)
  }
  if (m.hasMount) {
    lines.push(`Крепление: ${mountName(opts.mount ?? DEF_OPT.mount)}`)
  }
  if (m.hasDiffuser) {
    lines.push(`Рассеиватель: ${opts.diffuser ? 'да' : 'нет'}`)
  }
  if (m.wireOpts) {
    const wireId = opts.wire ?? DEF_OPT.wire
    lines.push(`Подключение: ${WIRE_LABEL[wireId] ?? wireId}`)
  }
  if (m.baseColors) {
    const bc = opts.baseColor ?? 'white'
    lines.push(`Цвет основания: ${BASE_COLOR_LABEL[bc] ?? bc}`)
  }
  if (m.bulbOpts) {
    const bo = m.bulbOpts.find((x) => x.id === (opts.bulbOpt ?? 'none'))
    lines.push(`Лампочки в комплекте: ${bo?.label ?? (opts.bulbOpt ?? 'нет')}`)
  } else if (!m.bulbsIn && m.bulbPrice) {
    lines.push(`Лампочки в комплекте: ${opts.bulbs ?? DEF_OPT.bulbs ? 'да' : 'нет'}`)
  }

  // Габариты — менеджеру для понимания размера.
  if (m.dimD || m.dimH) {
    const dims = [m.dimD, m.dimH ? `h${m.dimH}` : ''].filter(Boolean).join(' × ')
    if (dims) lines.push(`Габариты: ${dims} см`)
  }

  return lines
}

/* ──────────── Кастомный светильник → строки ──────────── */

function customFxLines(fx: Fixture, index?: number): string[] {
  const c = fx.custom!
  const lines: string[] = []

  const brand = (c.brand || 'Свой бренд').trim()
  const name = (c.name || c.type).trim()
  const header = index != null
    ? `Светильник ${index + 1}: ${brand} ${name} (другой бренд)`
    : `Светильник: ${brand} ${name} (другой бренд)`
  lines.push(header)

  lines.push(`Бренд: ${brand}`)
  lines.push(`Название: ${name}`)
  if (c.url) lines.push(`Ссылка на товар: ${c.url}`)
  lines.push(`Тип: ${c.type}${c.chip ? ' ' + c.chip : ''}`)
  lines.push(`Цвет: ${c.tint?.hex ?? '—'}${c.tint?.id ? ` (${c.tint.id})` : ''}`)

  const src = CUSTOM_SOURCE_LABEL[c.source] ?? c.source
  if (c.source === 'bulb') {
    const sock = c.socket ?? '—'
    const watt = c.inputs?.watt?.[sock] ?? '—'
    lines.push(`Источник: ${src}, ${sock}, ${watt} Вт`)
  } else if (c.source === 'tape') {
    const w = c.inputs?.tapeW
    const len = c.inputs?.tapeLen
    if (w && len) {
      lines.push(`Источник: LED-лента ${w} Вт/м × ${len} м`)
    } else {
      lines.push(`Источник: LED-лента`)
    }
  } else {
    lines.push(`Источник: ${src}`)
  }

  lines.push(`Люмены (расчёт): ${Math.round(c.lmPer * c.lamps)} лм`)
  lines.push(`Ламп: ${c.lamps}`)
  lines.push(`Количество: ${fx.q ?? 1}`)
  lines.push(`Зона: ${ZONE_LABEL[fx.zone ?? c.zone] ?? c.zone}`)

  const bodyLabel = CUSTOM_BODY_LABEL[String(c.body)] ?? `КПД ${c.body}`
  lines.push(`Корпус: ${bodyLabel}`)
  lines.push(`Температура: ${btempLabel(c.btemp ?? DEF_OPT.btemp)}`)

  return lines
}

/* ──────────── Светильник (диспетчер) ──────────── */

function fixtureLines(fx: Fixture, index?: number): string[] {
  if (fx.custom) return customFxLines(fx, index)
  return woodledFxLines(fx, index)
}

/* ──────────── Комната → строки ──────────── */

function roomBlock(r: Room, withFixtures: boolean): string[] {
  const lines: string[] = []
  const name = roomName(r)
  const rtName = getRT(r.typeId).name
  const title = name.toLowerCase() === rtName.toLowerCase()
    ? name.toUpperCase()
    : `${name.toUpperCase()} (${rtName.toLowerCase()})`
  lines.push(title)

  const area = roomArea(r)
  const areaStr = area ? `${area} м²` : 'размер не указан'
  lines.push(`Размеры: ${areaStr}, потолок ${r.ceilingH} м, стены ${wallLabel(r.wallFinish)}`)

  const furn = furnList(r.furniture as string[])
  if (furn) lines.push(`Мебель: ${furn}`)

  if (withFixtures && r.fixtures.length > 0) {
    r.fixtures.forEach((fx, i) => {
      lines.push('')
      lines.push(...fixtureLines(fx, i))
    })
  }

  return lines
}

/* ──────────── API ──────────── */

/** Заявка на один светильник (с контекстом его комнаты).
 *  Если переданы allRooms — добавим строку «В доме всего: …», чтобы
 *  менеджер сразу видел, одиночная это покупка или часть большого
 *  набора. Сама ссылка на дом не печатается тут — она уйдёт отдельным
 *  полем payload.houseShareUrl и аккуратно отрендерится GAS-ом
 *  (с уже сокращённым URL). */
export function buildFixtureLead(
  room: Room,
  fxIdx: number,
  allRooms?: Room[],
): string {
  const fx = room.fixtures[fxIdx]
  if (!fx) return ''
  const lines: string[] = []
  const name = roomName(room)
  const prep = ROOM_PREP[room.typeId] ?? `в ${name}`
  lines.push(`Светильник ${prep.toLowerCase()}`)
  lines.push('')
  lines.push(...roomBlock(room, false))
  lines.push('')
  lines.push(...fixtureLines(fx))

  if (allRooms && allRooms.length) {
    const { roomCount, fixtureCount } = leadCounts(allRooms)
    if (fixtureCount > 1) {
      lines.push('')
      lines.push(
        `В доме всего: ${fixtureCount} ${pluralRu(fixtureCount, 'светильник', 'светильника', 'светильников')}` +
        ` в ${roomCount} ${pluralRu(roomCount, 'комнате', 'комнатах', 'комнатах')}`,
      )
    }
  }

  return lines.join('\n')
}

/** Плюрализатор для русских числительных (1 / 2-4 / 5+). */
function pluralRu(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n) % 100
  const n1 = abs % 10
  if (abs > 10 && abs < 20) return many
  if (n1 > 1 && n1 < 5) return few
  if (n1 === 1) return one
  return many
}

/** Заявка на весь лес (все комнаты со всеми светильниками). */
export function buildForestLead(rooms: Room[]): string {
  const filled = rooms.filter((r) => r.fixtures.length > 0)
  if (!filled.length) return ''
  const lines: string[] = []
  filled.forEach((r, idx) => {
    if (idx > 0) {
      lines.push('')
      lines.push('---')
      lines.push('')
    }
    lines.push(...roomBlock(r, true))
  })
  return lines.join('\n')
}

/** Консультация: тот же снимок что и forest (для контекста разговора). */
export function buildConsultLead(rooms: Room[]): string {
  // Если светильников нет вообще — отдадим хотя бы перечисление комнат
  // (юзер может писать менеджеру до того как что-то добавил).
  const anyFx = rooms.some((r) => r.fixtures.length > 0)
  if (anyFx) return buildForestLead(rooms)

  if (!rooms.length) return '(дом ещё пустой)'
  const lines: string[] = []
  lines.push('Комнаты:')
  rooms.forEach((r) => {
    const area = roomArea(r)
    lines.push(`- ${roomName(r)}${area ? ` (${area} м²)` : ''}`)
  })
  return lines.join('\n')
}

/** Сводные счётчики для метаданных лида. */
export function leadCounts(rooms: Room[]): { roomCount: number; fixtureCount: number } {
  const filled = rooms.filter((r) => r.fixtures.length > 0)
  const fxCount = filled.reduce((sum, r) => sum + r.fixtures.length, 0)
  return { roomCount: filled.length, fixtureCount: fxCount }
}

