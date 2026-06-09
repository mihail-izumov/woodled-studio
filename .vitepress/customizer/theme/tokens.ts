/**
 * tokens.ts — Дизайн-токены WOODLED ROTOR
 *
 * Источник: woodled-v42.jsx (объект T, WCOL).
 * Тёмная тема в тёплых тонах.
 *
 * ТЗ-3: пастельная палитра настроений —
 *   dawn:     #D4956B → #D4A88A  (мягкий персик)
 *   noon:     #EDD84A → #C9BE8E  (тёплый мёд)
 *   clearing: #A4D65E → #A8C49A  (приглушённый шалфей)
 */

export const T = {
  // Фоны
  bg: '#13110E',
  card: '#1E1B16',
  cardAlt: '#1A1714',
  border: '#2E2921',

  // Текст
  text: '#E8E0D4',
  textSec: '#8B8075',
  textDim: '#5C544A',

  // Состояния
  green: '#7BA05B',
  yellow: '#C9A84C',
  red: '#B85C4C',
  neutral: '#A89878',

  // Зарезервирован (не используется в v42)
  blue: '#5B8BA0',

  // Дерево
  oak: '#C4A46C',
  walnut: '#8B6242',
  black: '#5A4E42',

  // Настроения — пастельная гамма
  dawn: '#D4A88A',
  noon: '#C9BE8E',
  clearing: '#A8C49A',
} as const

export type TokenKey = keyof typeof T

/**
 * WCOL — карта дерева на токены.
 * Используется как: WCOL[wood] + "22" для фонов плашек иконок.
 */
export const WCOL = {
  oak: T.oak,
  walnut: T.walnut,
  black: T.black,
} as const

export type Wood = keyof typeof WCOL

/**
 * Стандартные hex-суффиксы прозрачности.
 * Пример: T.neutral + OPACITY.md → '#A8987822'
 */
export const OPACITY = {
  xxxs: '06', // ~2%  glow обёртка
  xxs: '08', // ~3%  выбранная карточка BuyModal
  xs: '11', // ~7%  фон секций
  sm: '15', // ~8%  плашка иконки в зоне
  md: '22', // ~13% плашка иконки, чипы активные
  lg: '33', // ~20% рамка BuyModal
  xl: '44', // ~27% рамка mood
  xxl: '55', // ~33% рамка удаления
  fog: '88', // ~53% полупрозрачные карточки
} as const

/**
 * Готовые rgba-литералы для полупрозрачного белого/чёрного.
 */
export const RGBA = {
  white03: 'rgba(255,255,255,.03)',
  white04: 'rgba(255,255,255,.04)',
  white06: 'rgba(255,255,255,.06)',
  white08: 'rgba(255,255,255,.08)',
  white10: 'rgba(255,255,255,.1)',
  white12: 'rgba(255,255,255,.12)',
  white18: 'rgba(255,255,255,.18)',
  white20: 'rgba(255,255,255,.2)',
  black40: 'rgba(0,0,0,.4)',
  black65: 'rgba(0,0,0,.65)',
} as const

/**
 * Z-index шкала.
 */
export const Z = {
  stickyHeader: 10,
  stickyBar: 41,         // выше roomDetail чтобы виден на странице комнаты
  roomDetail: 40,
  modalOverlay: 50,
  fullscreenModal: 55,
  fxPage: 60,            // выше всего — отдельная страница светильника
  storyOverlay: 65,      // ещё выше — story поверх buy
  leadModal: 70,         // заявка менеджеру — над FxEditor и BuyModal
  privacyModal: 75,      // политика 152-ФЗ — поверх LeadModal (открывается из её чекбокса)
  toast: 100,
} as const

/**
 * ROOM_TINTS — пастельные цвета карточек комнат для шаблонов.
 *
 * Применяются ТОЛЬКО при загрузке шаблона через loadTemplate().
 * Свой дом (через «Начать с пустого» или ручное добавление комнат)
 * стартует без cardColor — юзер раскрашивает сам через ColorPickerModal.
 *
 * Палитра построена на интерьерных трендах 2026 для женской ЦА 25–40:
 *   - Sage green, dusty mauve — главные feminine-тренды (F&B, Sherwin-Williams)
 *   - Lavender, buttery yellow — возвращение пастелей в sophisticated виде
 *   - Все приглушённые/«muted» — на тёмном фоне T.bg ощущаются взрослыми
 *
 * Подробнее: docs/ROOM_PALETTE.md
 */
export const ROOM_TINTS = {
  living:   '#A8C09A', // Sage green — biophilic, центр жизни
  bedroom:  '#D4A5B0', // Dusty mauve — главный feminine-тренд 2026
  kitchen:  '#E8D5A0', // Buttery yellow — тёплый аппетитный
  kids:     '#F0C9B0', // Soft peach — игривый без инфантильности
  office:   '#C8B5D6', // Lavender — concentration, sophistication
  hallway:  '#E8DCC4', // Warm cream — нейтральный приём
  bathroom: '#B5C8D4', // Powder blue — свежесть
  stairs:   '#C4A88A', // Mocha (Pantone 2025) — тёплый акцент
} as const
