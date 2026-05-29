/**
 * useModelLink.ts — Deeplink ?model=rotor_m
 *
 * Читает ?model={id} из URL при загрузке.
 * Создаёт комнату (гостиную), добавляет модель, открывает FxEditor.
 * Очищает URL после обработки.
 */

import { MD, ALL_ZONES, type ModelId, type ZoneId } from '../data/catalog'

interface ModelLinkResult {
  modelId: ModelId
  zone: ZoneId
}

/**
 * Читает ?model=... из URL.
 * Возвращает modelId + подходящую зону, или null.
 */
export function readModelLink(): ModelLinkResult | null {
  if (typeof window === 'undefined') return null

  const params = new URLSearchParams(window.location.search)
  const modelParam = params.get('model')
  if (!modelParam) return null

  const mid = modelParam as ModelId
  const m = MD[mid]
  if (!m) return null

  const zone = ALL_ZONES.find(z => z.models.includes(mid))
  if (!zone) return null

  return { modelId: mid, zone: zone.id }
}

/**
 * Убирает ?model=... из URL без перезагрузки.
 */
export function clearModelLink(): void {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  url.searchParams.delete('model')
  const clean = url.pathname + (url.searchParams.toString() ? '?' + url.searchParams.toString() : '') + url.hash
  window.history.replaceState({}, '', clean)
}
