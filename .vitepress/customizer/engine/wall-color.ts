/**
 * wall-color.ts — Свободный HEX-цвет стен и его автоклассификация
 *                 в light / medium / dark.
 *
 * Зачем: пресета три (light/medium/dark), но пользователю важно ввести
 * свой цвет (Pinterest-референс, краска по артикулу). Чтобы физика
 * освещения работала, HEX переводится в категорию по relative luminance
 * (BT.709 sRGB→linear) — это стандартное приближение коэффициента
 * отражения матовой краски.
 *
 * Пороги категорий выбраны так, чтобы соответствовать рекомендациям IES
 * для UF: light ≥ 70% reflectance, medium ~50%, dark ≤ 30%. В пересчёте
 * на luminance это ≈ 0.55 и 0.20 (luminance ≠ reflectance, но для матовых
 * поверхностей коррелирует достаточно близко).
 */

import type { WallFinish, Room } from '../data/rooms'

/* ──────────────── Нормализация ввода ──────────────── */

/**
 * Приводит пользовательский ввод к каноническому `#RRGGBB`:
 *   • снимает пробелы;
 *   • добавляет ведущий `#` если нет;
 *   • принимает короткий `#RGB` → `#RRGGBB` (`#abc` → `#aabbcc`);
 *   • принимает 8 символов с alpha — alpha отбрасывается;
 *   • UPPER/lowercase — нормализует в нижний регистр.
 * Возвращает `null` если HEX невалиден.
 */
export function normalizeHex(input: string | null | undefined): string | null {
  if (!input) return null
  let s = String(input).trim().toLowerCase()
  if (s.startsWith('#')) s = s.slice(1)
  if (!/^[0-9a-f]+$/.test(s)) return null
  if (s.length === 3) {
    s = s.split('').map((c) => c + c).join('') // #abc → aabbcc
  } else if (s.length === 8) {
    s = s.slice(0, 6) // отбрасываем alpha
  } else if (s.length !== 6) {
    return null
  }
  return '#' + s
}

/* ──────────────── Relative luminance ──────────────── */

/**
 * Relative luminance per BT.709 (sRGB → linear). Возвращает 0..1.
 * Чёрный = 0, белый = 1. Для матовой стены коррелирует с коэффициентом
 * отражения (reflectance) — это и есть то, что нужно для UF в brightness.
 */
export function relativeLuminance(hex: string): number {
  const norm = normalizeHex(hex)
  if (!norm) return 0.5 // fallback на середину
  const r = parseInt(norm.slice(1, 3), 16) / 255
  const g = parseInt(norm.slice(3, 5), 16) / 255
  const b = parseInt(norm.slice(5, 7), 16) / 255
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

/* ──────────────── Классификация ──────────────── */

/** Пороги (выровнены с IES reflectance-классами для UF). */
export const WALL_FINISH_THRESHOLDS = { light: 0.55, dark: 0.20 } as const

/** HEX → WallFinish (light / medium / dark) по relative luminance. */
export function wallFinishFromHex(hex: string): WallFinish {
  const L = relativeLuminance(hex)
  if (L >= WALL_FINISH_THRESHOLDS.light) return 'light'
  if (L <= WALL_FINISH_THRESHOLDS.dark) return 'dark'
  return 'medium'
}

/* ──────────────── Дефолтные HEX-ы пресетов ──────────────── */

/**
 * Когда показываем квадратик-превью у комнаты без своего HEX-а — берём
 * репрезентативный цвет пресета. Это же значение можно прокидывать в
 * picker при первой смене из пресета на «свой».
 *   light  — тёплый кремовый (тон бумаги, ~75% reflectance)
 *   medium — средний серо-бежевый (~50% reflectance)
 *   dark   — глубокий тёмно-коричневый (~15% reflectance)
 */
export const WALL_PRESET_HEX: Record<WallFinish, string> = {
  light:  '#E8E0D4',
  medium: '#8A8276',
  dark:   '#2E2921',
}

/* ──────────────── Эффективный финиш и цвет ──────────────── */

/**
 * Эффективная категория отделки. Источник истины — единый цвет комнаты
 * `room.cardColor` (выбирается в `ColorPickerModal`). Если HEX задан и
 * валиден — категория определяется автоклассификацией по relative
 * luminance. Иначе fallback на пресет `wallFinish` (явный выбор в
 * RoomSettings — Светлая / Средняя / Тёмная), либо `medium` по умолчанию.
 *
 * Раньше под «свой HEX стен» было отдельное поле `wallColor`, но
 * пользователю это путало два разных пикера. Теперь один цвет
 * комнаты — он же цвет стен.
 */
export function wallFinishOf(
  room: Pick<Room, 'wallFinish' | 'cardColor'>,
): WallFinish {
  if (room.cardColor) {
    const norm = normalizeHex(room.cardColor)
    if (norm) return wallFinishFromHex(norm)
  }
  return room.wallFinish ?? 'medium'
}

/**
 * Эффективный HEX для UI-превью (квадратик в карточке настроения).
 * Если пользователь выбрал цвет комнаты — отдаём его. Иначе
 * репрезентативный HEX пресета.
 */
export function wallColorOf(
  room: Pick<Room, 'wallFinish' | 'cardColor'>,
): string {
  if (room.cardColor) {
    const norm = normalizeHex(room.cardColor)
    if (norm) return norm
  }
  return WALL_PRESET_HEX[room.wallFinish ?? 'medium']
}
