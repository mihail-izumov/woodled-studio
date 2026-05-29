// Hex цвета дерева — нужны только для swatch-кружочков в UI тегера.
// Локально в пакете, чтобы не зависеть от того, как поле color
// называется в customizer/data/materials.ts (там может быть hex,
// может быть colorName, может вообще отсутствовать).
//
// Значения — те же, что используются в customizer (см. colors-distribution.md).

import type { Wood } from './types'

export const WOOD_COLORS: Record<Wood, string> = {
  oak:    '#C4A46C',
  walnut: '#8B6242',
  black:  '#5A4E42',
}
