/**
 * share.ts — Сериализация конфигурации в URL-hash для шаринга.
 *
 * Формат:
 *   v2 (текущий): #s=2.<lz-string-compressed>
 *   v1 (legacy):  #s=<base64url-json>
 *
 * v1 ссылки продолжают декодироваться — старые ссылки в чатах не ломаются.
 * Префикс «2.» однозначно отличает v2: точка не входит в base64url-алфавит.
 *
 * Минимизация имён полей (t/n/si/ca/h/fx/fu/lim/m/q/w/z/l/o/d) сохранена —
 * lz-string добавляет 3–4× компрессию поверх. На реальном state ~2300 → ~600 chars.
 *
 * Работает без бэкенда, без истории, без сторонних сервисов.
 */

import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from './lz-string'
import type { Room, WallFinish } from '../data/rooms'
import type { Fixture } from '../data/catalog'
import type { FxOpts } from '../data/materials'

const V2_PREFIX = '2.'

/* ──────────────── Сериализация ──────────────── */

interface PackedFixture {
  m: string
  q?: number
  w?: string     // wood
  z?: string     // zone
  l?: number     // lamps override
  o?: Partial<FxOpts> // options (включая bulbOpt/baseColor)
  d?: string[]   // done — выполненные шаги чек-листа
}

interface PackedRoom {
  t: string            // typeId
  n?: string           // customName
  si?: number          // sizeIndex (если !==1)
  ca?: number          // customArea
  h?: number           // ceilingH (если !==2.7)
  wf?: string          // wallFinish (если !=='medium')
  cc?: string          // cardColor (HEX) — единый цвет комнаты:
                       //   и тинт UI, и источник цвета стен через wallFinishOf.
                       //   Без него на другом устройстве комната теряет цвет,
                       //   а проценты яркости расходятся (меняется UF→baseLm).
  fx?: PackedFixture[] // fixtures
  fu?: string[]        // furniture ids
  lim?: Record<string, number> // limits
}

interface PackedState {
  n?: string           // name
  r: PackedRoom[]      // rooms
}

function packFixture(fx: Fixture): PackedFixture {
  const out: PackedFixture = { m: fx.m }
  if ((fx.q ?? 1) !== 1) out.q = fx.q
  if (fx.wood && fx.wood !== 'oak') out.w = fx.wood
  if (fx.zone && fx.zone !== 'ceiling') out.z = fx.zone
  if (fx.l != null) out.l = fx.l
  if (fx.opts && Object.keys(fx.opts).length > 0) out.o = fx.opts
  if (fx.done && fx.done.length > 0) out.d = fx.done
  return out
}

function unpackFixture(p: PackedFixture): Fixture {
  return {
    m: p.m as Fixture['m'],
    q: p.q ?? 1,
    wood: (p.w ?? 'oak') as Fixture['wood'],
    zone: (p.z ?? 'ceiling') as Fixture['zone'],
    l: p.l,
    opts: p.o,
    done: p.d,
  }
}

function packRoom(r: Room): PackedRoom {
  const out: PackedRoom = { t: r.typeId }
  if (r.customName) out.n = r.customName
  if (r.sizeIndex !== 1) out.si = r.sizeIndex
  if (r.customArea != null) out.ca = r.customArea
  if (r.ceilingH !== 2.7) out.h = r.ceilingH
  if (r.wallFinish && r.wallFinish !== 'medium') out.wf = r.wallFinish
  if (r.cardColor) out.cc = r.cardColor
  if (r.fixtures.length > 0) out.fx = r.fixtures.map(packFixture)
  if (r.furniture.length > 0) out.fu = [...r.furniture]
  if (r.limits && Object.keys(r.limits).length > 0) {
    out.lim = { ...r.limits } as Record<string, number>
  }
  return out
}

function unpackRoom(p: PackedRoom, id: string): Room {
  return {
    id,
    typeId: p.t as Room['typeId'],
    customName: p.n ?? '',
    sizeIndex: ((p.si ?? 1) as 0 | 1 | 2 | 3),
    customArea: p.ca ?? null,
    ceilingH: p.h ?? 2.7,
    wallFinish: (p.wf ?? 'medium') as WallFinish,
    cardColor: p.cc,
    fixtures: (p.fx ?? []).map(unpackFixture),
    furniture: (p.fu ?? []) as Room['furniture'],
    limits: (p.lim ?? {}) as Room['limits'],
  }
}

/* ──────────────── Legacy v1 decoder (base64url-json) ──────────────── */
/* Используется ТОЛЬКО при чтении старых ссылок. Новые ссылки идут через v2. */

function base64ToUtf8(b: string): string {
  const utf8 = atob(b)
  let hex = ''
  for (let i = 0; i < utf8.length; i++) {
    const c = utf8.charCodeAt(i).toString(16).padStart(2, '0')
    hex += '%' + c
  }
  return decodeURIComponent(hex)
}

function fromUrlSafe(b: string): string {
  let s = b.replace(/-/g, '+').replace(/_/g, '/')
  while (s.length % 4) s += '='
  return s
}

/* ──────────────── Encoding helpers ──────────────── */

function encodePayload(packed: unknown): string {
  const json = JSON.stringify(packed)
  return V2_PREFIX + compressToEncodedURIComponent(json)
}

function decodePayload(encoded: string): unknown | null {
  try {
    let json: string | null
    if (encoded.startsWith(V2_PREFIX)) {
      // v2: lz-string compressed
      json = decompressFromEncodedURIComponent(encoded.slice(V2_PREFIX.length))
    } else {
      // v1 (legacy): base64url-encoded JSON
      json = base64ToUtf8(fromUrlSafe(encoded))
    }
    if (!json) return null
    return JSON.parse(json)
  } catch {
    return null
  }
}

/* ──────────────── Публичный API: State ──────────────── */

/**
 * Сериализует state в компактную строку для URL.
 * Возвращает v2-формат (с префиксом '2.').
 */
export function encodeState(name: string, rooms: Room[]): string {
  const packed: PackedState = {
    r: rooms.map(packRoom),
  }
  if (name && name !== 'Живой Дом') packed.n = name
  return encodePayload(packed)
}

/**
 * Декодирует строку обратно в state.
 * Поддерживает оба формата: v2 (с префиксом '2.') и v1 (legacy base64url).
 * Генерирует id'шники через функцию nextId (store передаёт свою).
 * Возвращает null при любой ошибке разбора.
 */
export function decodeState(
  encoded: string,
  nextId: () => string,
): { name: string | null; rooms: Room[] } | null {
  const packed = decodePayload(encoded) as PackedState | null
  if (!packed || !Array.isArray(packed.r)) return null
  return {
    name: packed.n ?? null,
    rooms: packed.r.map((p) => unpackRoom(p, nextId())),
  }
}

/**
 * Формирует полную ссылку с текущим origin + pathname + hash.
 */
export function buildShareUrl(name: string, rooms: Room[]): string {
  const enc = encodeState(name, rooms)
  const base = window.location.origin + window.location.pathname
  return `${base}#s=${enc}`
}

/**
 * Читает hash из window.location — возвращает encoded-часть или null.
 */
export function readHashState(): string | null {
  if (typeof window === 'undefined') return null
  const hash = window.location.hash
  if (!hash) return null
  const match = hash.match(/[#&]s=([^&]+)/)
  return match ? match[1] : null
}

/* ──────────────── Публичный API: Fixture (#fx=...) ──────────────── */

/**
 * Кодирует один светильник в строку для URL (v2 формат).
 */
export function encodeFixture(fx: Fixture): string {
  return encodePayload(packFixture(fx))
}

/**
 * Декодирует строку обратно в Fixture.
 * Поддерживает оба формата (v2 lz-string + v1 legacy).
 */
export function decodeFixture(encoded: string): Fixture | null {
  const packed = decodePayload(encoded) as PackedFixture | null
  if (!packed) return null
  return unpackFixture(packed)
}

/**
 * Формирует ссылку на один светильник.
 */
export function buildFixtureShareUrl(fx: Fixture): string {
  const enc = encodeFixture(fx)
  const base = window.location.origin + window.location.pathname
  return `${base}#fx=${enc}`
}

/**
 * Читает #fx=... из URL.
 */
export function readHashFixture(): string | null {
  if (typeof window === 'undefined') return null
  const hash = window.location.hash
  if (!hash) return null
  const match = hash.match(/[#&]fx=([^&]+)/)
  return match ? match[1] : null
}
