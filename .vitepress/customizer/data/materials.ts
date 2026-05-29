/**
 * materials.ts — Материалы и опции кастомизации
 *
 * Источник: WoodledSuperApp.jsx v8 (I_BWL, I_BT, I_MNT, I_DEFAULTS, I_OPT_TIPS).
 * Синхронизировано с SuperApp: чаши с ценами, id-based значения.
 */

import { WCOL as _WCOL, type Wood } from '../theme/tokens'

export const WCOL = _WCOL
export type { Wood } from '../theme/tokens'

/* ──────────────── Дерево ──────────────── */

export interface Material {
  id: Wood
  name: string
  color: string
}

export const MATS: readonly Material[] = [
  { id: 'oak', name: 'Дуб', color: _WCOL.oak },
  { id: 'walnut', name: 'Орех', color: _WCOL.walnut },
  { id: 'black', name: 'Чёрный дуб', color: _WCOL.black },
] as const

/* ──────────────── Чаши (7 шт с ценами) ──────────────── */

export interface Bowl {
  id: string
  name: string
  price: number
}

export const BOWLS: readonly Bowl[] = [
  { id: 'chrome_8',  name: 'Хром Ø8',       price: 0 },
  { id: 'black_8',   name: 'Чёрная Ø8',     price: 0 },
  { id: 'white_8',   name: 'Белая Ø8',       price: 0 },
  { id: 'wood_8',    name: 'Деревянная Ø8', price: 1200 },
  { id: 'nickel',    name: 'Никель',         price: 0 },
  { id: 'hook_10',   name: 'Хром крюк Ø10', price: 1200 },
  { id: 'chrome_14', name: 'Хром Ø14',       price: 1200 },
  { id: 'none',      name: 'Нет',            price: 0 },
] as const

/* ──────────────── Крепления ──────────────── */

export interface Mount {
  id: string
  name: string
  tip: string
}

export const MOUNTS: readonly Mount[] = [
  { id: 'ceiling', name: 'Потолочный',  tip: 'Классическое потолочное крепление' },
  { id: 'flush',   name: 'Вплотную',    tip: 'Вплотную к потолку — минимум зазора' },
  { id: 'pendant', name: 'Подвесной',   tip: 'На подвесе — свет ближе к столу' },
  { id: 'track',   name: 'Шинопровод',  tip: 'Шинопровод — гибкое позиционирование' },
] as const

/* ──────────────── Температуры ──────────────── */

export interface BTemp {
  id: string
  label: string
  kelvin: number
  tip: string
}

export const BTEMPS: readonly BTemp[] = [
  { id: '2700', label: 'Тёплый',        kelvin: 2700, tip: 'Уют, вечер, покой' },
  { id: '3000', label: 'Тёплый-нейтр.', kelvin: 3000, tip: 'Баланс уюта и ясности' },
  { id: '4000', label: 'Нейтральный',   kelvin: 4000, tip: 'Чётко видно, работа' },
] as const

/* ──────────────── Опции (дефолты + цены) ──────────────── */

export interface FxOpts {
  bowl: string
  mount: string
  wire: string
  btemp: string
  diffuser: boolean
  moisture: boolean
  bulbs: boolean
  bulbOpt?: string
  baseColor?: string
}

export const DEF_OPT: FxOpts = {
  bowl: 'black_8',
  mount: 'pendant',
  wire: 'none',
  btemp: '4000',
  diffuser: false,
  moisture: false,
  bulbs: true,
}

export const OPT_PRICE = {
  diffuser: 500,
  diffuserLoss: 0.25,
  moisture: 1000,
  bulbsPerLamp: 250,
} as const

/* ──────────────── Тексты тостов ──────────────── */

export const WOOD_TIPS: Record<Wood, string> = {
  oak: 'Дуб — тёплый, песочный, самый популярный',
  walnut: 'Орех — тёмный, шоколадный, благородный',
  black: 'Чёрный дуб — строгий, графичный, контрастный',
}

export const BOWL_TIPS: Record<string, string> = {
  chrome_8:  'Хром — блеск, отражения света',
  black_8:   'Чёрная чаша — строго, минималистично',
  white_8:   'Белая чаша — свежо, скандинавский стиль',
  wood_8:    'Деревянная накладка — цельный природный образ',
  nickel:    'Никель — мягкий металлический блеск',
  hook_10:   'Хром под крюк — для подвесного монтажа',
  chrome_14: 'Увеличенная хромированная чаша',
  none:      'Без чаши — чистый потолок',
}

export const MOUNT_TIPS: Record<string, string> = {
  ceiling: 'Классическое потолочное крепление',
  flush:   'Вплотную к потолку — минимум зазора',
  pendant: 'На подвесе — свет ближе к столу',
  track:   'Шинопровод — гибкое позиционирование',
}

export const BTEMP_TIPS: Record<string, string> = {
  '2700': 'Тёплый свет — уютная атмосфера, идеально для вечера',
  '3000': 'Тёплый нейтральный — баланс уюта и ясности',
  '4000': 'Нейтральный свет — всё видно чётко, для работы',
}

export const OPT_TIPS = {
  diffuser: {
    on: 'Рассеиватель смягчит свет и уберёт блики',
    off: 'Рассеиватель убран — свет станет направленнее',
  },
  moisture: {
    on: 'Влагозащита — обязательна для ванной',
    off: 'Влагозащита убрана',
  },
  bulbs: {
    on: 'Лампочки в комплекте — готово к включению',
    off: 'Лампочки убраны — подберёте свои',
  },
} as const
