/**
 * i18n.ts — Русские склонения и форматирование
 *
 * Источник: woodled-v42.jsx (lw, pw, woodNames).
 */

import type { Fixture } from '../data/catalog'
import { MATS } from '../data/materials'

/** Плюрализация «ламп»: 1 → «лампа», 2–4 → «лампы», 0/5+/11–19 → «ламп». */
export function lw(n: number): string {
  const a = Math.abs(n)
  const l = a % 10
  const lt = a % 100
  if (lt >= 11 && lt <= 19) return 'ламп'
  if (l === 1) return 'лампа'
  if (l >= 2 && l <= 4) return 'лампы'
  return 'ламп'
}

/** Плюрализация «точек»: 1 → «точка», 2–4 → «точки», 0/5+/11–19 → «точек». */
export function pw(n: number): string {
  const a = Math.abs(n)
  const l = a % 10
  const lt = a % 100
  if (lt >= 11 && lt <= 19) return 'точек'
  if (l === 1) return 'точка'
  if (l >= 2 && l <= 4) return 'точки'
  return 'точек'
}

/** Плюрализация «комнат». */
export function rw(n: number): string {
  const a = Math.abs(n)
  const l = a % 10
  const lt = a % 100
  if (lt >= 11 && lt <= 19) return 'комнат'
  if (l === 1) return 'комната'
  if (l >= 2 && l <= 4) return 'комнаты'
  return 'комнат'
}

/** Плюрализация «деревьев» (для сториз). */
export function tw(n: number): string {
  const a = Math.abs(n)
  const l = a % 10
  const lt = a % 100
  if (lt >= 11 && lt <= 19) return 'деревьев'
  if (l === 1) return 'дерево'
  if (l >= 2 && l <= 4) return 'дерева'
  return 'деревьев'
}

/**
 * Названия деревьев в формате «2 дуба и 1 орех».
 * Склонения привязаны к конкретным словам (Дуб/Орех/Чёрный дуб).
 */
export function woodNames(fixtures: Fixture[]): string {
  const grouped: Record<string, number> = {}

  for (const f of fixtures) {
    const w = f.wood ?? 'oak'
    const n = f.q ?? 1
    const name = MATS.find((m) => m.id === w)?.name ?? 'Дуб'
    grouped[name] = (grouped[name] ?? 0) + n
  }

  const parts = Object.entries(grouped).map(([name, cnt]) => {
    if (name === 'Дуб') return cnt > 1 ? `${cnt} дуба` : 'дуб'
    if (name === 'Орех') return cnt > 1 ? `${cnt} ореха` : 'орех'
    // Чёрный дуб
    return cnt > 1 ? `${cnt} чёрных дуба` : 'чёрный дуб'
  })

  return parts.join(' и ')
}
