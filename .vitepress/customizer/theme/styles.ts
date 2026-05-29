/**
 * styles.ts — Shared style-функции
 *
 * pillStyle и treeStyle вынесены из WelcomeScreen.vue,
 * чтобы переиспользоваться в StoryModal.vue.
 *
 * ТЗ-3: Создан как новый файл. WelcomeScreen импортирует отсюда.
 */

import { WCOL, type Wood } from './tokens'

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return { r, g, b }
}

/**
 * Pill комнаты — стеклянная капсула с tint-фоном.
 * Все стили в одном объекте, без spread.
 */
export function pillStyle(hex: string) {
  const { r, g, b } = hexToRgb(hex)
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '11px',
    padding: '8px 14px 8px 12px',
    borderRadius: '999px',
    lineHeight: '1',
    background: `
      radial-gradient(ellipse 100% 80% at 25% 0%, rgba(${r},${g},${b},0.42), transparent 70%),
      radial-gradient(ellipse 80% 60% at 100% 100%, rgba(${r},${g},${b},0.18), transparent 70%),
      rgba(${r},${g},${b},0.10)
    `,
    border: `1px solid rgba(${r},${g},${b},0.32)`,
    boxShadow: `
      inset 0 1px 0 rgba(255,255,255,0.15),
      0 1px 4px rgba(0,0,0,0.18)
    `,
  }
}

/**
 * Tree — 18px 3D-сфера с radial highlight и micro-glow.
 */
export function treeStyle(wood: Wood, idx: number): Record<string, string | number> {
  const color = WCOL[wood]
  const { r, g, b } = hexToRgb(color)
  return {
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    background: `
      radial-gradient(circle at 32% 28%, rgba(255,255,255,0.45), transparent 50%),
      radial-gradient(circle at 65% 70%, rgba(0,0,0,0.15), transparent 55%),
      ${color}
    `,
    flexShrink: '0',
    display: 'inline-block',
    border: wood === 'black' ? '1px solid rgba(19,17,14,0.5)' : 'none',
    boxShadow: `
      inset 0 -1px 1.5px rgba(0,0,0,0.18),
      inset 0 1px 1px rgba(255,255,255,0.15),
      0 0 8px rgba(${r},${g},${b},0.35),
      0 1px 3px rgba(0,0,0,0.35)
    `,
    marginLeft: idx === 0 ? '0' : '-5px',
    zIndex: 100 - idx,
    position: 'relative',
  }
}
