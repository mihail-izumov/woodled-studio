/**
 * fx-gallery.ts — Алгоритм Hero и Interior галерей на странице светильника.
 *
 * Источник правды → public/photo-tagging/tagger.html (вкладка «Симулятор»).
 * Этот файл — TS-портация. При расхождении доверяй теггеру и обнови этот файл.
 *
 * Архитектура:
 *   – Один матчер `pickFxPhotos(config, mode)`:
 *       hero      = clean BG (studio + detail), слои strict → partial → woodSubstitute
 *       interiors = shot=interior, слои strict → partial (без woodSubstitute)
 *   – sameSize — тайбрейкер в сортировке, не отдельный tier.
 *   – Поля в матчере зависят от коллекции (HERO_FIELDS / GALLERY_FIELDS).
 *
 * Чек-лист «Покрытие → pickFxPhotos» в теггере должен давать те же цифры:
 *   strict 43 · partial 0 · substitute 8 · empty 0  (для 51 каталожной комбинации).
 */

import { FX_PHOTOS, type FxPhoto, type FxShot } from '../data/fx-photos'
import type { ModelId } from '../data/catalog'
import type { Wood } from '../data/materials'

/* ──────────────── Семейства для cross-size fallback ────────────────
 * spot_s ≠ spot_l физически (Ø12×12 куб vs Ø12×30 длинная труба) — не семья.
 * Остальные размеры внутри коллекции выглядят как один продукт.
 */
export const FAMILIES: Record<string, string> = {
  rotor_s: 'rotor', rotor_m: 'rotor', rotor_l: 'rotor', rotor_1000: 'rotor',
  rotor_x_m: 'rotor_x', rotor_x_l: 'rotor_x',
  elliptical_s: 'elliptical', elliptical_l: 'elliptical',
  bra_v_s: 'bra_v', bra_v_l: 'bra_v',
}
export const familyOf = (m: string): string => FAMILIES[m] || m

/* ──────────────── HERO_FIELDS — визуальная идентичность ────────────────
 *   wood       — везде (главный признак)
 *   mount      — только rotor (catalog.hasMount:true; pendant vs flush меняет силуэт)
 *   diffuser   — только rotor_x (плафон с/без)
 *   bodyColor  — только floor_lamp (catalog.baseColors: white/black)
 *
 * НЕ в матчере (на фото не видно или нет разметки):
 *   bowl (0/179), btemp (9/179), patrons (3/179), socket, lamps count, on.
 */
export const HERO_FIELDS: Record<string, readonly string[]> = {
  rotor:        ['wood', 'mount'],
  rotor_x:      ['wood', 'diffuser'],
  elliptical:   ['wood'],
  spot:         ['wood'],
  unit:         ['wood'],
  bra_h:        ['wood'],
  bra_v:        ['wood'],
  table_lamp:   ['wood'],
  floor_lamp:   ['wood', 'bodyColor'],
  floor_lamp_s: ['wood'],
}

/* ──────────────── GALLERY_FIELDS — для интерьеров (мягче) ────────────────
 * На интерьерных фото мелкие детали (diffuser/bowl) читаются плохо.
 * Юзеры замечают именно дерево + цвет ножки/подвеса.
 */
export const GALLERY_FIELDS: Record<string, readonly string[]> = {
  rotor:        ['wood', 'mount'],
  rotor_x:      ['wood'],
  elliptical:   ['wood'],
  spot:         ['wood'],
  unit:         ['wood'],
  bra_h:        ['wood'],
  bra_v:        ['wood'],
  table_lamp:   ['wood'],
  floor_lamp:   ['wood', 'bodyColor'],
  floor_lamp_s: ['wood'],
}

export function fieldsFor(coll: string, mode: 'hero' | 'gallery'): readonly string[] {
  const src = mode === 'gallery' ? GALLERY_FIELDS : HERO_FIELDS
  return src[coll] || ['wood']
}

/* ──────────────── Маппинг user-pick mount → photo-tag mount ────────────────
 * FxEditor предлагает: ceiling / flush / pendant / track (materials.MOUNTS).
 * На фото размечено: pendant / flush / wall / floor / table / track.
 * 'ceiling' визуально = 'flush' (вплотную к потолку); остальные совпадают.
 */
export function normalizeMount(uiMount: string): string {
  if (uiMount === 'ceiling') return 'flush'
  return uiMount
}

/* ──────────────── User-facing copy для плашек на карточках ────────────────
 * Источник правды для строк — здесь, чтобы UI не магичил кастомные тексты.
 */
export const MATCH_BADGE: Record<string, string> = {
  strict:         '',
  partial:        'деталь может отличаться',
  woodSubstitute: 'цвет на фото отличается',
}

/** Глобальный disclaimer под Hero-слайдером. Не зависит от слоя — общее свойство Hero. */
export const HERO_DISCLAIMER = 'Фото не отражает выбор цоколя, температуры и количества ламп'

/* ──────────────── Конфиг матчера (входной объект для pickFxPhotos) ──────────────── */
export interface FxPhotoConfig {
  model: ModelId
  wood: Wood | ''
  mount?: string
  diffuser?: string  // 'yes' | 'no' | ''
  bodyColor?: string // 'white' | 'black' | ''
}

/** Builder из Fixture в config для матчера. Изолирует UI-маппинги в одном месте. */
export function fxToConfig(fx: {
  m: ModelId
  wood?: Wood
  opts?: { mount?: string; diffuser?: boolean; baseColor?: string }
}): FxPhotoConfig {
  const o = fx.opts || {}
  return {
    model: fx.m,
    wood: fx.wood || '',
    mount: o.mount ? normalizeMount(o.mount) : '',
    diffuser: o.diffuser === undefined ? '' : (o.diffuser ? 'yes' : 'no'),
    bodyColor: o.baseColor || '',
  }
}

/* ──────────────── Результат матчинга ──────────────── */
export type FxPhotoLayer = 'strict' | 'partial' | 'woodSubstitute'

export interface FxPhotoMatch {
  photo: FxPhoto
  matchCount: number
  sameSize: boolean
  layer: FxPhotoLayer
}

export interface FxPickResult {
  hero: {
    strict: FxPhotoMatch[]
    partial: FxPhotoMatch[]
    woodSubstitute: FxPhotoMatch[]
  }
  interiors: {
    strict: FxPhotoMatch[]
    partial: FxPhotoMatch[]
  }
}

/* ──────────────── Внутренности ──────────────── */
function hasValue(v: unknown): boolean {
  return v !== '' && v !== null && v !== undefined
}
function pvHasValue(pv: unknown): boolean {
  if (Array.isArray(pv)) return pv.length > 0
  return hasValue(pv)
}
function valueMatches(cv: unknown, pv: unknown): boolean {
  if (Array.isArray(pv)) return (pv as unknown[]).includes(cv)
  return String(cv) === String(pv)
}

interface EvalResult {
  excluded: boolean
  matchCount: number
  strictMatch: boolean
}

function evalMatch(
  photo: FxPhoto,
  config: FxPhotoConfig,
  fields: readonly string[],
): EvalResult {
  let matchCount = 0
  let userFilterCount = 0
  let strictMatch = true
  for (const field of fields) {
    const cv = (config as Record<string, unknown>)[field]
    const pv = (photo as unknown as Record<string, unknown>)[field]
    const cvOk = hasValue(cv)
    const pvOk = pvHasValue(pv)
    if (cvOk) userFilterCount++
    if (cvOk && pvOk) {
      if (valueMatches(cv, pv)) matchCount++
      else return { excluded: true, matchCount: 0, strictMatch: false }
    } else if (cvOk && !pvOk) {
      strictMatch = false
    }
  }
  if (userFilterCount === 0) strictMatch = true
  return { excluded: false, matchCount, strictMatch }
}

function sortLayer(arr: FxPhotoMatch[]): FxPhotoMatch[] {
  return arr.sort((a, b) => {
    if (b.matchCount !== a.matchCount) return b.matchCount - a.matchCount
    if (a.sameSize !== b.sameSize) return a.sameSize ? -1 : 1
    return 0
  })
}

/* ──────────────── Главная функция ──────────────── */

/**
 * Выбирает фото для Hero и Interior галерей.
 *
 * @param config — снапшот выбора юзера в FxEditor (через fxToConfig)
 * @param mode   — 'hero' (clean BG, с woodSubstitute) или 'gallery' (интерьеры)
 *
 * Hero пуст → UI рисует CTA «Посмотреть в интерьерах ↓» (плашка-якорь).
 * Interiors пуст → нижнего блока на странице нет, никаких плашек.
 */
export function pickFxPhotos(
  config: FxPhotoConfig,
  mode: 'hero' | 'gallery' = 'hero',
): FxPickResult {
  const fam = familyOf(config.model)
  const hero = { strict: [] as FxPhotoMatch[], partial: [] as FxPhotoMatch[], woodSubstitute: [] as FxPhotoMatch[] }
  const interiors = { strict: [] as FxPhotoMatch[], partial: [] as FxPhotoMatch[] }

  for (const p of FX_PHOTOS) {
    if (familyOf(p.model) !== fam) continue
    const fields = fieldsFor(p.collection, mode)
    const m = evalMatch(p, config, fields)
    if (m.excluded) continue
    const sameSize = p.model === config.model
    const layer: FxPhotoLayer = m.strictMatch ? 'strict' : 'partial'
    const entry: FxPhotoMatch = { photo: p, matchCount: m.matchCount, sameSize, layer }
    const bucket = (p.shot === 'interior') ? interiors : hero
    if (m.strictMatch) bucket.strict.push(entry)
    else bucket.partial.push(entry)
  }

  // Hero-only: woodSubstitute. Если strict+partial пусты — пробуем без wood.
  if (mode === 'hero' && hero.strict.length === 0 && hero.partial.length === 0 && hasValue(config.wood)) {
    const cfgNoWood: FxPhotoConfig = { ...config, wood: '' }
    for (const p of FX_PHOTOS) {
      if (familyOf(p.model) !== fam) continue
      if (p.shot === 'interior') continue // substitute — только clean
      const baseFields = fieldsFor(p.collection, 'hero')
      const fields = baseFields.filter((f) => f !== 'wood')
      const m = evalMatch(p, cfgNoWood, fields)
      if (m.excluded || !m.strictMatch) continue
      hero.woodSubstitute.push({
        photo: p,
        matchCount: m.matchCount,
        sameSize: p.model === config.model,
        layer: 'woodSubstitute',
      })
    }
  }

  sortLayer(hero.strict); sortLayer(hero.partial); sortLayer(hero.woodSubstitute)
  sortLayer(interiors.strict); sortLayer(interiors.partial)

  return { hero, interiors }
}

/** Удобный хелпер: вытащить активный слой Hero (strict / partial / substitute / null). */
export function activeHeroLayer(result: FxPickResult): FxPhotoLayer | null {
  if (result.hero.strict.length > 0) return 'strict'
  if (result.hero.partial.length > 0) return 'partial'
  if (result.hero.woodSubstitute.length > 0) return 'woodSubstitute'
  return null
}

/** Активный слой Hero как массив фото. Пустой массив = Hero пуст → CTA в интерьеры. */
export function activeHeroPhotos(result: FxPickResult): FxPhotoMatch[] {
  const layer = activeHeroLayer(result)
  if (!layer) return []
  return result.hero[layer]
}
