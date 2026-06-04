/**
 * i18n.ts — Русские склонения и форматирование
 *
 * Источник: woodled-v42.jsx (lw, pw, woodNames).
 */

import type { Fixture, FxType } from '../data/catalog'
import type { Wood } from '../data/materials'

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

/**
 * Фраза «все N точек заняты» с верным согласованием (включая 1).
 *  1   → «Единственная точка занята»
 *  2-4 → «Все N точки заняты»
 *  5+  → «Все N точек заняты»
 */
export function occupiedPhrase(n: number): string {
  if (n === 1) return 'Единственная точка занята'
  return `Все ${n} ${pw(n)} заняты`
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
 * Склонение типа светильника по числу.
 * «бра» — несклоняемое (одинаково для любого count).
 *   1   → люстра / торшер / настольная / спот / бра
 *   2–4 → люстры / торшера / настольные / спота / бра
 *   5+  → люстр / торшеров / настольных / спотов / бра
 */
export function kindWord(kind: FxType, n: number): string {
  if (kind === 'бра') return 'бра'
  const a = Math.abs(n)
  const l = a % 10
  const lt = a % 100
  const five = (lt >= 11 && lt <= 19) || l === 0 || l >= 5
  const one = l === 1 && lt !== 11
  const few = !five && !one
  if (kind === 'люстра')    return one ? 'люстра'    : few ? 'люстры'    : 'люстр'
  if (kind === 'торшер')    return one ? 'торшер'    : few ? 'торшера'   : 'торшеров'
  if (kind === 'настольная') return one ? 'настольная' : few ? 'настольные' : 'настольных'
  if (kind === 'спот')      return one ? 'спот'      : few ? 'спота'     : 'спотов'
  return kind
}

/**
 * Склонение породы дерева.
 *   1   → дуб / орех / чёрный дуб
 *   2–4 → дуба / ореха / чёрных дуба
 *   5+  → дубов / орехов / чёрных дубов
 */
export function woodWord(wood: Wood, n: number): string {
  const a = Math.abs(n)
  const l = a % 10
  const lt = a % 100
  const five = (lt >= 11 && lt <= 19) || l === 0 || l >= 5
  const one = l === 1 && lt !== 11
  if (wood === 'oak')    return one ? 'дуб'        : five ? 'дубов'         : 'дуба'
  if (wood === 'walnut') return one ? 'орех'       : five ? 'орехов'        : 'ореха'
  /* black */            return one ? 'чёрный дуб' : five ? 'чёрных дубов' : 'чёрных дуба'
}

/**
 * Список через запятую и «и» — для перечислений:
 *   ['a']             → 'a'
 *   ['a','b']         → 'a и b'
 *   ['a','b','c']     → 'a, b и c'
 *   ['a','b','c','d'] → 'a, b, c и d'
 */
export function joinList(arr: string[]): string {
  const xs = arr.filter(Boolean)
  if (xs.length === 0) return ''
  if (xs.length === 1) return xs[0]
  if (xs.length === 2) return `${xs[0]} и ${xs[1]}`
  return xs.slice(0, -1).join(', ') + ' и ' + xs[xs.length - 1]
}

/**
 * Названия деревьев в формате «2 дуба и 1 орех» / «6 орехов и 3 чёрных дуба».
 * Склонения проходят через `woodWord` — поддерживает 5+.
 */
export function woodNames(fixtures: Fixture[]): string {
  const grouped: Record<Wood, number> = { oak: 0, walnut: 0, black: 0 }
  for (const f of fixtures) {
    const w = (f.wood ?? 'oak') as Wood
    grouped[w] += (f.q ?? 1)
  }
  const parts: string[] = []
  for (const w of ['oak', 'walnut', 'black'] as Wood[]) {
    const cnt = grouped[w]
    if (cnt > 0) {
      /* count=1 → просто «дуб» / «орех» / «чёрный дуб»; иначе число + правильная форма. */
      parts.push(cnt === 1 ? woodWord(w, 1) : `${cnt} ${woodWord(w, cnt)}`)
    }
  }
  return parts.join(' и ')
}
