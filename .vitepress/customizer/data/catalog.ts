/**
 * catalog.ts — Каталог светильников WOODLED ROTOR
 *
 * Источник: WoodledSuperApp.jsx v8 (I_MD, верификация 146/146).
 * 17 моделей · 4 зоны · 5 семейств · per-model опции.
 */

import type { Wood } from './materials'

/* ──────────────── Типы ──────────────── */

export type FxType = 'люстра' | 'спот' | 'бра' | 'настольная' | 'торшер'
export type ZoneId = 'ceiling' | 'wall' | 'floor' | 'table'
export type FamilyId = 'rotor' | 'rotor_x' | 'elliptical' | 'spot' | 'bra_v'

export type ModelId =
  | 'rotor_s' | 'rotor_m' | 'rotor_l' | 'rotor_1000'
  | 'rotor_x_m' | 'rotor_x_l'
  | 'elliptical_s' | 'elliptical_l'
  | 'spot_s' | 'spot_l'
  | 'unit'
  | 'bra_h' | 'bra_v_s' | 'bra_v_l'
  | 'table_lamp'
  | 'floor_lamp' | 'floor_lamp_s'

export interface ModelPrice { oak: number; walnut: number; black: number }

export interface BulbOption { id: string; label: string; price: number; tip?: string }
export interface WireOption { id: string; label: string; price: number; tip?: string }
export interface BaseColorOption { id: string; label: string; artSuffix: string }

export interface Model {
  name: string
  letter: string
  type: FxType
  family?: FamilyId
  lamps: number
  minL: number
  maxL: number
  lmPer: number
  sur: number
  sqMin: number
  sqMax: number
  p: ModelPrice
  /* Per-model опции кастомизации */
  avBowls: string[]
  hasMount: boolean
  hasDiffuser?: boolean
  bulbPrice?: number
  bulbOpts?: BulbOption[]
  wireOpts?: WireOption[]
  baseColors?: BaseColorOption[]
  bulbsIn: boolean
  diffLoss: number
  /* Габариты и лампа */
  dimD: string
  dimH: string
  ltName: string
  ltWatt: number | string
}

/* ──────────────── Чаши: наборы по моделям ──────────────── */

const BWL_ALL = ['chrome_8', 'black_8', 'white_8', 'wood_8', 'nickel', 'hook_10', 'chrome_14']
const BWL_X   = [...BWL_ALL, 'none']
const BWL_6   = ['chrome_8', 'black_8', 'white_8', 'wood_8', 'hook_10', 'chrome_14']
const BWL_4   = ['chrome_8', 'black_8', 'white_8', 'wood_8']

/* ──────────────── Wire: шаблоны ──────────────── */

const WIRE_4: WireOption[] = [
  { id: 'none',    label: 'Нет',              price: 0,   tip: 'Чисто, без проводов' },
  { id: 'wire',    label: 'Провод с вилкой',  price: 500, tip: 'Без штробления' },
  { id: 'button',  label: 'Кнопка',           price: 300, tip: 'На корпусе' },
  { id: 'sonetka', label: 'Сонетка',          price: 300, tip: 'Шнурок-выключатель' },
]
const WIRE_3: WireOption[] = WIRE_4.filter(w => w.id !== 'sonetka')

/* ──────────────── Каталог моделей ──────────────── */

export const MD: Record<ModelId, Model> = {

  /* ── Потолок: ROTOR ── */
  rotor_s: {
    name: 'Rotor S', letter: 'S', type: 'люстра', family: 'rotor',
    lamps: 4, minL: 4, maxL: 4, lmPer: 1070, sur: 1000,
    sqMin: 6, sqMax: 7, p: { oak: 14900, walnut: 17900, black: 15900 },
    avBowls: BWL_ALL, hasMount: true, diffLoss: 0, bulbsIn: false,
    bulbPrice: 1000, dimD: 'Ø45', dimH: '12', ltName: 'Шар малый E27', ltWatt: 13,
  },
  rotor_m: {
    name: 'Rotor M', letter: 'M', type: 'люстра', family: 'rotor',
    lamps: 4, minL: 4, maxL: 6, lmPer: 1500, sur: 1000,
    sqMin: 10, sqMax: 12, p: { oak: 19900, walnut: 22900, black: 20900 },
    avBowls: BWL_ALL, hasMount: true, diffLoss: 0, bulbsIn: false,
    bulbPrice: 1000, dimD: 'Ø54', dimH: '12', ltName: 'Груша E27', ltWatt: 15,
  },
  rotor_l: {
    name: 'Rotor L', letter: 'L', type: 'люстра', family: 'rotor',
    lamps: 4, minL: 4, maxL: 8, lmPer: 1500, sur: 1000,
    sqMin: 12, sqMax: 15, p: { oak: 26900, walnut: 30900, black: 27900 },
    avBowls: BWL_ALL, hasMount: true, diffLoss: 0, bulbsIn: false,
    bulbPrice: 1000, dimD: 'Ø66', dimH: '12', ltName: 'Груша E27', ltWatt: 15,
  },
  rotor_1000: {
    name: 'Rotor 1000', letter: '1000', type: 'люстра', family: 'rotor',
    lamps: 6, minL: 6, maxL: 12, lmPer: 1500, sur: 1000,
    sqMin: 15, sqMax: 20, p: { oak: 39900, walnut: 45900, black: 41900 },
    avBowls: [], hasMount: true, diffLoss: 0, bulbsIn: false,
    bulbPrice: 1500, dimD: 'Ø100', dimH: '12', ltName: 'Груша E27', ltWatt: 15,
  },

  /* ── Потолок: ROTOR X ── */
  rotor_x_m: {
    name: 'Rotor X M', letter: 'M', type: 'люстра', family: 'rotor_x',
    lamps: 3, minL: 3, maxL: 6, lmPer: 800, sur: 1000,
    sqMin: 4, sqMax: 6, p: { oak: 27900, walnut: 30900, black: 28900 },
    avBowls: BWL_X, hasMount: false, hasDiffuser: true,
    diffLoss: 0.25, bulbsIn: false,
    bulbOpts: [
      { id: 'none',  label: 'Нет',              price: 0,    tip: 'Чисто, без проводов' },
      { id: 'white', label: 'Белые матовые',    price: 3000 },
      { id: 'clear', label: 'Прозрачные',       price: 3600 },
    ],
    dimD: 'Ø54', dimH: '20', ltName: 'Шар Ø100мм E27', ltWatt: '8/10',
  },
  rotor_x_l: {
    name: 'Rotor X L', letter: 'L', type: 'люстра', family: 'rotor_x',
    lamps: 3, minL: 3, maxL: 8, lmPer: 800, sur: 1000,
    sqMin: 6, sqMax: 7, p: { oak: 34900, walnut: 36900, black: 35900 },
    avBowls: BWL_X, hasMount: false, hasDiffuser: true,
    diffLoss: 0.25, bulbsIn: false,
    bulbOpts: [
      { id: 'none',  label: 'Нет',              price: 0,    tip: 'Чисто, без проводов' },
      { id: 'white', label: 'Белые матовые',    price: 3000 },
      { id: 'clear', label: 'Прозрачные',       price: 3600 },
    ],
    dimD: 'Ø66', dimH: '20', ltName: 'Шар Ø120мм E27', ltWatt: '8/10',
  },

  /* ── Потолок: ELLIPTICAL ── */
  elliptical_s: {
    name: 'Elliptical S', letter: 'S', type: 'люстра', family: 'elliptical',
    lamps: 4, minL: 4, maxL: 8, lmPer: 970, sur: 500,
    sqMin: 5, sqMax: 15, p: { oak: 25900, walnut: 28900, black: 26900 },
    avBowls: BWL_6, hasMount: false, diffLoss: 0, bulbsIn: true,
    dimD: '84', dimH: '15', ltName: 'Таблетка GX53', ltWatt: 12,
  },
  elliptical_l: {
    name: 'Elliptical L', letter: 'L', type: 'люстра', family: 'elliptical',
    lamps: 6, minL: 6, maxL: 12, lmPer: 970, sur: 500,
    sqMin: 15, sqMax: 20, p: { oak: 38900, walnut: 43900, black: 40900 },
    avBowls: BWL_6, hasMount: false, diffLoss: 0, bulbsIn: true,
    dimD: '124', dimH: '28', ltName: 'Таблетка GX53', ltWatt: 12,
  },

  /* ── Потолок: SPOT ── */
  spot_s: {
    name: 'Spot S', letter: 'S', type: 'спот', family: 'spot',
    lamps: 1, minL: 1, maxL: 1, lmPer: 970, sur: 0,
    sqMin: 3, sqMax: 5, p: { oak: 8900, walnut: 9900, black: 8900 },
    avBowls: BWL_6, hasMount: false, diffLoss: 0, bulbsIn: true,
    dimD: 'Ø12', dimH: '12', ltName: 'Таблетка GX53', ltWatt: 12,
  },
  spot_l: {
    name: 'Spot L', letter: 'L', type: 'спот', family: 'spot',
    lamps: 1, minL: 1, maxL: 1, lmPer: 970, sur: 0,
    sqMin: 3, sqMax: 5, p: { oak: 10900, walnut: 11900, black: 10900 },
    avBowls: BWL_6, hasMount: false, diffLoss: 0, bulbsIn: true,
    dimD: 'Ø12', dimH: '30', ltName: 'Таблетка GX53', ltWatt: 12,
  },

  /* ── Стена: UNIT ── */
  unit: {
    name: 'Unit', letter: 'U', type: 'спот',
    lamps: 1, minL: 1, maxL: 1, lmPer: 970, sur: 0,
    sqMin: 3, sqMax: 5, p: { oak: 8900, walnut: 9900, black: 8900 },
    avBowls: BWL_4, hasMount: false, diffLoss: 0, bulbsIn: true,
    wireOpts: WIRE_4,
    dimD: 'Ø12', dimH: '12', ltName: 'Таблетка GX53', ltWatt: 12,
  },

  /* ── Стена: БРА ── */
  bra_h: {
    name: 'Бра Horizontal', letter: 'H', type: 'бра',
    lamps: 2, minL: 2, maxL: 2, lmPer: 905, sur: 0,
    sqMin: 4, sqMax: 6, p: { oak: 12900, walnut: 13900, black: 12900 },
    avBowls: [], hasMount: false, diffLoss: 0, bulbsIn: false,
    bulbPrice: 500, wireOpts: WIRE_4,
    dimD: '28', dimH: '14', ltName: 'Миньон E14', ltWatt: 11,
  },
  bra_v_s: {
    name: 'Бра Vertical S', letter: 'S', type: 'бра', family: 'bra_v',
    lamps: 2, minL: 2, maxL: 2, lmPer: 510, sur: 0,
    sqMin: 2, sqMax: 3, p: { oak: 17900, walnut: 20900, black: 18900 },
    avBowls: [], hasMount: false, diffLoss: 0, bulbsIn: true,
    wireOpts: WIRE_3,
    dimD: '12', dimH: '40', ltName: 'Холодильник E14', ltWatt: 5,
  },
  bra_v_l: {
    name: 'Бра Vertical L', letter: 'L', type: 'бра', family: 'bra_v',
    lamps: 2, minL: 2, maxL: 2, lmPer: 905, sur: 0,
    sqMin: 4, sqMax: 6, p: { oak: 21900, walnut: 24900, black: 22900 },
    avBowls: [], hasMount: false, diffLoss: 0, bulbsIn: false,
    bulbPrice: 500, wireOpts: WIRE_4,
    dimD: '18', dimH: '45', ltName: 'Миньон E14', ltWatt: 11,
  },

  /* ── Стол ── */
  table_lamp: {
    name: 'Настольная', letter: 'T', type: 'настольная',
    lamps: 1, minL: 1, maxL: 1, lmPer: 1500, sur: 0,
    sqMin: 2, sqMax: 4, p: { oak: 10900, walnut: 11900, black: 10900 },
    avBowls: [], hasMount: false, diffLoss: 0, bulbsIn: false,
    bulbPrice: 250,
    dimD: '14 × 14', dimH: '47', ltName: 'Груша E27', ltWatt: 15,
  },

  /* ── Пол ── */
  floor_lamp: {
    name: 'Торшер', letter: 'F', type: 'торшер',
    lamps: 1, minL: 1, maxL: 1, lmPer: 1500, sur: 0,
    sqMin: 5, sqMax: 7, p: { oak: 37900, walnut: 42900, black: 39900 },
    avBowls: [], hasMount: false, diffLoss: 0, bulbsIn: false,
    bulbPrice: 250,
    baseColors: [
      { id: 'white', label: 'Белое основание', artSuffix: '-01' },
      { id: 'black', label: 'Чёрное основание', artSuffix: '-02' },
    ],
    dimD: 'Ø53', dimH: '160', ltName: 'Груша E27', ltWatt: 15,
  },
  floor_lamp_s: {
    name: 'Торшер S', letter: 'Fs', type: 'торшер',
    lamps: 1, minL: 1, maxL: 1, lmPer: 1500, sur: 0,
    sqMin: 5, sqMax: 7, p: { oak: 26900, walnut: 28900, black: 27900 },
    avBowls: [], hasMount: false, diffLoss: 0, bulbsIn: false,
    bulbPrice: 250,
    dimD: 'Ø35', dimH: '170', ltName: 'Груша E27', ltWatt: 15,
  },
}

/* ──────────────── Семейства ──────────────── */

export const FAMILIES: Record<FamilyId, readonly ModelId[]> = {
  rotor: ['rotor_s', 'rotor_m', 'rotor_l', 'rotor_1000'],
  rotor_x: ['rotor_x_m', 'rotor_x_l'],
  elliptical: ['elliptical_s', 'elliptical_l'],
  spot: ['spot_s', 'spot_l'],
  bra_v: ['bra_v_s', 'bra_v_l'],
}

/* ──────────────── Зоны ──────────────── */

export interface Zone {
  id: ZoneId
  name: string
  models: readonly ModelId[]
  ghost: string
}

export const ALL_ZONES: readonly Zone[] = [
  { id: 'ceiling', name: 'Потолок', models: ['rotor_s', 'rotor_m', 'rotor_l', 'rotor_1000', 'rotor_x_m', 'rotor_x_l', 'elliptical_s', 'elliptical_l', 'spot_s', 'spot_l'], ghost: 'ceiling' },
  { id: 'wall', name: 'Стены', models: ['unit', 'bra_h', 'bra_v_s', 'bra_v_l'], ghost: 'bra' },
  { id: 'floor', name: 'Пол', models: ['floor_lamp', 'floor_lamp_s'], ghost: 'floor' },
  { id: 'table', name: 'Стол', models: ['table_lamp'], ghost: 'table' },
] as const

/* ──────────────── Fixture ──────────────── */

import type { FxOpts } from './materials'

export interface Fixture {
  m: ModelId
  q: number
  wood: Wood
  zone: ZoneId
  l?: number
  opts?: Partial<FxOpts>
  /** Список ID шагов чек-листа, которые юзер подтвердил («Готово»). */
  done?: string[]
}
