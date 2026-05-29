/**
 * brightness.ts — Расчёт яркости
 *
 * Источник: woodled-v42.jsx (baseLm, fxLm, fxLamps, getArea).
 *
 * ТЗ-1: Добавлена функция ratioToAngle() для MoodArc.
 *
 * baseLm = lux × area × (ceilingH/2.7) × (1 + Σfurniture.ab)
 * fxLm = Σ lmPer × l × q
 */

import { MD, type Fixture } from '../data/catalog'
import { FURN } from '../data/furniture'
import type { Room, RoomType } from '../data/rooms'

/**
 * Площадь комнаты (м²).
 * При sizeIndex === 3 — кастомная площадь, фолбэк на Большую.
 */
export function getArea(rt: RoomType, r: Room): number {
  if (r.sizeIndex === 3) return r.customArea ?? rt.sizes[2]
  return rt.sizes[r.sizeIndex]
}

/**
 * Целевое количество люмен для комнаты.
 * Учитывает норму, площадь, высоту потолка и мебель.
 */
export function baseLm(rt: RoomType, r: Room): number {
  const furnFactor = r.furniture.reduce((s, f) => s + (FURN[f]?.ab ?? 0), 0)
  return Math.round(rt.lux * getArea(rt, r) * (r.ceilingH / 2.7) * (1 + furnFactor))
}

/**
 * Фактическое количество люмен от набора светильников.
 */
export function fxLm(fixtures: Fixture[]): number {
  return fixtures.reduce((sum, it) => {
    const m = MD[it.m]
    if (!m) return sum
    const l = it.l ?? m.lamps
    const q = it.q ?? 1
    return sum + m.lmPer * l * q
  }, 0)
}

/**
 * Общее количество ламп во всех светильниках (с учётом q).
 */
export function fxLamps(fixtures: Fixture[]): number {
  return fixtures.reduce((sum, it) => {
    const m = MD[it.m]
    if (!m) return sum
    const l = it.l ?? m.lamps
    const q = it.q ?? 1
    return sum + l * q
  }, 0)
}

/**
 * Отношение факта к плану.
 * Возвращает 0 если base === 0.
 */
export function ratioOf(base: number, actual: number): number {
  return base > 0 ? actual / base : 0
}

/**
 * Суммарный процент потерь от мебели (округлён до целого).
 */
export function furnPct(furniture: Room['furniture']): number {
  return Math.round(furniture.reduce((s, f) => s + (FURN[f]?.ab ?? 0) * 100, 0))
}

/**
 * Конвертирует ratio в угол (0—180°) для MoodArc.
 *
 * ТЗ-1: Каждый mood занимает 60° на полукруге:
 *   - 0—60°  : Тёплые сумерки  (ratio 0—0.8)
 *   - 60—120°: Утро в лесу     (ratio 0.8—1.4)
 *   - 120—180°: Ясный полдень  (ratio 1.4—3.0+)
 *
 * Cap на 180° для очень яркого света (ratio > 3.0).
 */
export function ratioToAngle(ratio: number): number {
  if (ratio <= 0)   return 0
  if (ratio <= 0.8) return (ratio / 0.8) * 60
  if (ratio < 1.4)  return 60 + ((ratio - 0.8) / 0.6) * 60
  if (ratio < 3.0)  return 120 + ((ratio - 1.4) / 1.6) * 60
  return 180
}
