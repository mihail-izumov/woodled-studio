/**
 * zone-engine.ts — Агрегация по зонам
 *
 * Источник: woodled-v42.jsx (zoneLm, zoneFxCount, roomWood).
 */

import { MD, ALL_ZONES, type Fixture, type ZoneId, type Zone } from '../data/catalog'
import type { RoomType } from '../data/rooms'
import type { Wood } from '../data/materials'

/** Фактические люмены от светильников конкретной зоны. */
export function zoneLm(fixtures: Fixture[], zoneId: ZoneId): number {
  return fixtures
    .filter((f) => (f.zone ?? 'ceiling') === zoneId)
    .reduce((s, f) => {
      const m = MD[f.m]
      if (!m) return s
      return s + m.lmPer * (f.l ?? m.lamps) * (f.q ?? 1)
    }, 0)
}

/** Количество светильников в зоне (с учётом q). */
export function zoneFxCount(fixtures: Fixture[], zoneId: ZoneId): number {
  return fixtures
    .filter((f) => (f.zone ?? 'ceiling') === zoneId)
    .reduce((s, f) => s + (f.q ?? 1), 0)
}

/** Доля света конкретной зоны от общей fxLm (0..1). */
export function zoneShare(fixtures: Fixture[], zoneId: ZoneId, totalLm: number): number {
  if (totalLm <= 0) return 0
  return zoneLm(fixtures, zoneId) / totalLm
}

/**
 * Зоны комнаты — подмножество ALL_ZONES по rt.zones.
 */
export function roomZones(rt: RoomType): Zone[] {
  return rt.zones.map((zid) => ALL_ZONES.find((z) => z.id === zid)!).filter(Boolean)
}

/**
 * Дефолтное дерево для новой модели в комнате.
 * Берём дерево первого уже добавленного светильника, иначе oak.
 */
export function roomWood(fixtures: Fixture[]): Wood {
  return fixtures[0]?.wood ?? 'oak'
}

/** Позиции glow-слоёв по зонам (radial gradient). */
export const GLOW_POS: Record<ZoneId | 'center', string> = {
  ceiling: '30% 25%',
  wall: '70% 25%',
  floor: '30% 75%',
  table: '70% 75%',
  center: '50% 50%',
}

/** Интенсивность glow-слоя по доле зоны (0..1). */
export function glowOpacity(share: number): number {
  return Math.min(share * 0.7 + 0.05, 0.5)
}

/** Конвертирует 0..1 opacity в hex-суффикс для CSS-цвета. */
export function opacityToHex(opacity: number): string {
  return Math.round(opacity * 255)
    .toString(16)
    .padStart(2, '0')
}
