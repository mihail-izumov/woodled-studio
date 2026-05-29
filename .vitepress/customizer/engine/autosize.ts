/**
 * autosize.ts — Автоподбор размера светильника + рекомендации
 *
 * v2: Исправлена логика — не завышает размер, выбирает сбалансированный.
 *
 * pickBestSize  — при добавлении
 * buildSizeRecommendation — массив для FxEditor
 *
 * Принцип: баланс, а не яркость. Из двух «комфортных» — тот,
 * чей projectedRatio ближе к 1.0, при прочих равных — меньший (дешевле).
 */

import { MD, type ModelId } from '../data/catalog'

export type AreaFit = 'ideal' | 'acceptable' | 'poor'

export interface SizeCandidate {
  mid: ModelId
  areaFit: AreaFit
  modelLm: number
  coverageRatio: number
  projectedRatio: number
  recommended: boolean
}

export function evaluateAreaFit(area: number, sqMin: number, sqMax: number): AreaFit {
  if (area >= sqMin && area <= sqMax) return 'ideal'
  if (area >= sqMin * 0.8 && area <= sqMax * 1.2) return 'acceptable'
  return 'poor'
}

/**
 * Числовой балл area fit: ideal=0, acceptable=1, poor=2.
 * Для сортировки — меньше = лучше.
 */
function areaFitScore(af: AreaFit): number {
  if (af === 'ideal') return 0
  if (af === 'acceptable') return 1
  return 2
}

/**
 * Главная оценка кандидата — баланс яркости + площади.
 * Меньший score = лучший вариант.
 *
 * Формула: areaWeight × areaFitScore + |projectedRatio − 1.0|
 *   + sizeBonus (маленький бонус за меньший размер, чтобы не завышать)
 */
function balanceScore(
  areaFit: AreaFit,
  projectedRatio: number,
  modelLm: number,
  maxModelLm: number,
): number {
  const aW = 0.5 // вес площадного fit-а
  const ratioDeviation = Math.abs(projectedRatio - 1.0)
  const sizePenalty = maxModelLm > 0 ? 0.05 * (modelLm / maxModelLm) : 0
  return aW * areaFitScore(areaFit) + ratioDeviation + sizePenalty
}

/* ──────────────── Автоподбор при добавлении ──────────────── */

export function pickBestSize(
  candidates: ModelId[],
  area: number,
  deficit: number,
): ModelId {
  if (candidates.length <= 1) return candidates[0]

  const scored = candidates.map((mid) => {
    const m = MD[mid]
    const areaFit = evaluateAreaFit(area, m.sqMin, m.sqMax)
    const modelLm = m.lmPer * m.lamps
    const coverageRatio = deficit > 0 ? modelLm / deficit : 0
    return { mid, areaFit, modelLm, coverageRatio }
  })

  const maxLm = Math.max(...scored.map(s => s.modelLm))

  // Есть дефицит — ищем оптимального покрывателя
  if (deficit > 0) {
    scored.sort((a, b) => {
      const sa = balanceScore(a.areaFit, a.coverageRatio, a.modelLm, maxLm)
      const sb = balanceScore(b.areaFit, b.coverageRatio, b.modelLm, maxLm)
      return sa - sb
    })
    return scored[0].mid
  }

  // Дефицита нет — предпочитаем наименьший с хорошим area fit
  const pool = scored.filter(s => s.areaFit !== 'poor')
  if (pool.length > 0) {
    pool.sort((a, b) => a.modelLm - b.modelLm)
    return pool[0].mid
  }

  // Все poor — берём наименьший
  scored.sort((a, b) => a.modelLm - b.modelLm)
  return scored[0].mid
}

/* ──────────────── Рекомендации для FxEditor ──────────────── */

export function buildSizeRecommendation(
  familyMembers: ModelId[],
  area: number,
  baseLm: number,
  currentLmWithoutThis: number,
  qty: number,
): SizeCandidate[] {
  const results = familyMembers.map((mid) => {
    const m = MD[mid]
    const areaFit = evaluateAreaFit(area, m.sqMin, m.sqMax)
    const modelLm = m.lmPer * m.lamps
    const projectedLm = currentLmWithoutThis + modelLm * qty
    const projectedRatio = baseLm > 0 ? projectedLm / baseLm : 0
    const deficit = baseLm - currentLmWithoutThis
    const coverageRatio = deficit > 0 ? (modelLm * qty) / deficit : 0

    return { mid, areaFit, modelLm, coverageRatio, projectedRatio, recommended: false }
  })

  // Определяем рекомендуемый — самый сбалансированный
  const maxLm = Math.max(...results.map(r => r.modelLm))
  const comfortable = results.filter(r => r.projectedRatio >= 0.8 && r.projectedRatio <= 2.0)

  if (comfortable.length > 0) {
    // Среди комфортных — лучший баланс (area fit + ratio ближе к 1.0 + меньший размер)
    comfortable.sort((a, b) => {
      const sa = balanceScore(a.areaFit, a.projectedRatio, a.modelLm, maxLm)
      const sb = balanceScore(b.areaFit, b.projectedRatio, b.modelLm, maxLm)
      return sa - sb
    })
    const bestMid = comfortable[0].mid
    const r = results.find(r => r.mid === bestMid)
    if (r) r.recommended = true
  } else {
    // Нет комфортных — рекомендуем ближайший к ratio 1.0
    const sorted = [...results].sort((a, b) =>
      Math.abs(a.projectedRatio - 1.0) - Math.abs(b.projectedRatio - 1.0),
    )
    if (sorted.length > 0) {
      const r = results.find(r => r.mid === sorted[0].mid)
      if (r) r.recommended = true
    }
  }

  return results
}
