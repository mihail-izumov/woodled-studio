/**
 * furniture.ts — Мебель и её влияние на свет
 *
 * Источник: woodled-v42.jsx (FURN, furnText).
 * Коэффициент ab — поглощение света. Отрицательный = отражение (только mirror).
 */

import type { FurnId } from './rooms'

/** Грамматический род — для согласования в тостах («убран/убрана/убрано»). */
export type Gender = 'm' | 'f' | 'n'

export interface Furn {
  name: string
  /** Коэффициент поглощения света. */
  ab: number
  /** Род названия. */
  g: Gender
}

export const FURN: Record<FurnId, Furn> = {
  sofa: { name: 'Диван', ab: 0.06, g: 'm' },
  armchair: { name: 'Кресло', ab: 0.03, g: 'n' },
  bookshelf: { name: 'Стеллаж', ab: 0.06, g: 'm' },
  dtable: { name: 'Обед. стол', ab: 0.05, g: 'm' },
  jtable: { name: 'Журн. стол', ab: 0.02, g: 'm' },
  island: { name: 'Остров', ab: 0.05, g: 'm' },
  bar: { name: 'Барная стойка', ab: 0.03, g: 'f' },
  bed: { name: 'Кровать', ab: 0.08, g: 'f' },
  wardrobe: { name: 'Шкаф', ab: 0.07, g: 'm' },
  dresser: { name: 'Комод', ab: 0.04, g: 'm' },
  nightstand: { name: 'Тумбочка', ab: 0.02, g: 'f' },
  desk: { name: 'Стол', ab: 0.04, g: 'm' },
  mirror: { name: 'Зеркало', ab: -0.03, g: 'n' },
  bathtub: { name: 'Ванна', ab: 0.04, g: 'f' },
  shower: { name: 'Душевая', ab: 0.03, g: 'f' },
  sink: { name: 'Раковина', ab: 0.02, g: 'f' },
  washer: { name: 'Стиральная', ab: 0.04, g: 'f' },
  fridge: { name: 'Холодильник', ab: 0.05, g: 'm' },
  kitchen_set: { name: 'Кух. гарнитур', ab: 0.06, g: 'm' },
  stove: { name: 'Плита', ab: 0.03, g: 'f' },
  tv_stand: { name: 'ТВ-тумба', ab: 0.03, g: 'f' },
  shoe_rack: { name: 'Полка для обуви', ab: 0.03, g: 'f' },
  coat_rack: { name: 'Вешалка', ab: 0.02, g: 'f' },
}

/** Согласование слова по роду: gword(g, 'добавлен','добавлена','добавлено'). */
export function gword(g: Gender, m: string, f: string, n: string): string {
  return g === 'f' ? f : g === 'n' ? n : m
}

/**
 * Текст рекомендации под чипами мебели.
 * Зависит от суммарного процента потерь света.
 */
export function furnText(furniture: FurnId[], pct: number): string {
  if (furniture.length === 0) return 'Пустая комната — свету ничего не мешает.'
  if (pct <= 5) return 'Мебели немного — света хватает.'
  if (pct <= 12)
    return 'Мебель даёт тени. Пара бра на стены сделает свет ровнее.'
  return `Мебель съедает ~${pct}% света — отсюда тёмные углы. Пара бра на стены это вернёт.`
}

/**
 * Короткий статус для бейджа потерь (Мало / Умеренно / Много / Нет потерь).
 */
export function furnStatus(pct: number): string {
  if (pct <= 0) return 'Без теней'
  if (pct <= 5) return 'Почти нет теней'
  if (pct <= 12) return 'Заметные тени'
  return 'Много теней'
}
