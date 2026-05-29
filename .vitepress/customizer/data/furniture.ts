/**
 * furniture.ts — Мебель и её влияние на свет
 *
 * Источник: woodled-v42.jsx (FURN, furnText).
 * Коэффициент ab — поглощение света. Отрицательный = отражение (только mirror).
 */

import type { FurnId } from './rooms'

export interface Furn {
  name: string
  /** Коэффициент поглощения света. */
  ab: number
}

export const FURN: Record<FurnId, Furn> = {
  sofa: { name: 'Диван', ab: 0.06 },
  armchair: { name: 'Кресло', ab: 0.03 },
  bookshelf: { name: 'Стеллаж', ab: 0.06 },
  dtable: { name: 'Обед. стол', ab: 0.05 },
  jtable: { name: 'Журн. стол', ab: 0.02 },
  island: { name: 'Остров', ab: 0.05 },
  bar: { name: 'Барная стойка', ab: 0.03 },
  bed: { name: 'Кровать', ab: 0.08 },
  wardrobe: { name: 'Шкаф', ab: 0.07 },
  dresser: { name: 'Комод', ab: 0.04 },
  nightstand: { name: 'Тумбочка', ab: 0.02 },
  desk: { name: 'Стол', ab: 0.04 },
  mirror: { name: 'Зеркало', ab: -0.03 },
  bathtub: { name: 'Ванна', ab: 0.04 },
  shower: { name: 'Душевая', ab: 0.03 },
  sink: { name: 'Раковина', ab: 0.02 },
  washer: { name: 'Стиральная', ab: 0.04 },
  fridge: { name: 'Холодильник', ab: 0.05 },
  kitchen_set: { name: 'Кух. гарнитур', ab: 0.06 },
  stove: { name: 'Плита', ab: 0.03 },
  tv_stand: { name: 'ТВ-тумба', ab: 0.03 },
  shoe_rack: { name: 'Полка для обуви', ab: 0.03 },
  coat_rack: { name: 'Вешалка', ab: 0.02 },
}

/**
 * Текст рекомендации под чипами мебели.
 * Зависит от суммарного процента потерь света.
 */
export function furnText(furniture: FurnId[], pct: number): string {
  if (furniture.length === 0) return 'Пустая комната — весь свет доходит без потерь.'
  if (pct <= 5) return 'Минимальные потери. Света хватает.'
  if (pct <= 12)
    return 'Добавьте бра на стены — это компенсирует тени от мебели и сделает свет равномернее.'
  return `Добавьте 2 бра на стены и спот на потолок — это вернёт потерянные ${pct}% света и уберёт тёмные углы.`
}

/**
 * Короткий статус для бейджа потерь (Мало / Умеренно / Много / Нет потерь).
 */
export function furnStatus(pct: number): string {
  if (pct <= 0) return 'Нет потерь'
  if (pct <= 5) return 'Мало'
  if (pct <= 12) return 'Умеренно'
  return 'Много'
}
