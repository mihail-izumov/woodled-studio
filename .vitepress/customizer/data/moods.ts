/**
 * moods.ts — Настроения и шкала яркости
 *
 * Источник: woodled-v42.jsx (MOODS, BRIGHT, autoMood, getBright).
 *
 * === ТЗ-1: новые id, name, color, iconKey ===
 * === ТЗ-2: финальные тексты + buildMoodSlides (слайды 4, 5) ===
 * === v7: порядок на MoodArc слева направо — Утро → Полдень → Сумерки (дуга дня) ===
 * === batch9 #7: динамический moodDesc(ratio) — 9 фаз внутри 3 mood ===
 *
 * autoMood() переназначает mood по ratio:
 *   ≤ 0           → empty
 *   < 0.8         → morning  (Утро в лесу — мало источников, утренний минимализм)
 *   0.8 ≤ r < 1.4 → zenith   (Ясный полдень — норма, день в разгаре)
 *   ≥ 1.4         → dusk     (Тёплые сумерки — обилие нижних источников, вечер)
 *
 * Mood — атмосферная категория, не индикатор яркости.
 * Для яркости — отдельный слой BRIGHT в LumenDashboard.
 */

import { T } from '../theme/tokens'
import type { MoodId } from './rooms'

export type { MoodId } from './rooms'

/* ──────────────── Настроения ──────────────── */

export interface Mood {
  id: MoodId
  name: string
  color: string
  /** Lucide iconKey для MoodDetailModal. */
  iconKey?: string
  quote: string
  desc: string
  /** Полное описание (full slide). */
  full: string
  mult: string
  temp: string
  shadows: string
  feel: string
  visual: string
  when: string
}

export const MOODS: readonly Mood[] = [
  {
    id: 'dusk',
    name: 'Тёплые сумерки',
    color: T.dawn,
    iconKey: 'arrowDownRight',

    quote: 'Час, когда не нужно ничего решать.',

    desc: 'Свет ушёл вниз — в торшеры и бра. Вечер, можно выдохнуть.',

    full: 'Свет собрался внизу — в торшерах, настольных лампах и бра у изголовья. Его ровно столько, чтобы дочитать страницу и не больше. Вечер, когда ничего не надо решать.',

    mult: '×0.5',

    temp: '2700K · тёплый',

    shadows: 'Длинные и мягкие. Углы комнаты тёмные, но по-доброму.',

    feel: 'Покой и замедление. Рабочий день закончился.',

    visual: 'Между ламелями — тёплое золотистое свечение, приглушённое.',

    when: 'Поздний вечер. Спальня после ужина, кабинет с книгой, гостиная после кино.',
  },
  {
    id: 'morning',
    name: 'Утро в лесу',
    color: T.noon,
    iconKey: 'arrowRight',

    quote: 'Света достаточно, и ничего не торопит.',

    desc: 'Видно лица, страницы, чашку. День идёт спокойно.',

    full: 'Света уже хватает на всё нужное — лица, страницы, узор на дереве. Один-два источника, ровный мягкий свет. По комнате легко двигаться, ничего не торопит.',

    mult: '×1.0',

    temp: '3000–4000K · тёплый-нейтральный',

    shadows: 'Чёткие, но без резких краёв. Тёплые и спокойные.',

    feel: 'Спокойствие и ровность. День идёт своим ходом.',

    visual: 'Дерево ламелей хорошо читается, текстура раскрыта.',

    when: 'Дневные часы. Гостиная с гостями, кухня за готовкой, спальня, когда в ней живут.',
  },
  {
    id: 'zenith',
    name: 'Ясный полдень',
    color: T.clearing,
    iconKey: 'arrowUpRight',

    quote: 'Полный дневной свет — всё на местах.',

    desc: 'Видно каждую мелочь. Рабочий свет, ничего не теряется.',

    full: 'Дневной рабочий свет в полную силу. Видно нитку на свитере и крошку на столе. Лучшее, когда нужно всё разглядеть: уроки за столом, готовку, лицо в зеркале.',

    mult: '×1.5',

    temp: '4000K · нейтральный',

    shadows: 'Чёткие и контрастные. У каждого предмета ясный край.',

    feel: 'Бодрость и собранность. Тело понимает: сейчас дела.',

    visual: 'Сильный контраст между тёмным деревом и яркими просветами.',

    when: 'Активные часы. Кухня с ножом, кабинет за отчётом, детская за уроками.',
  },
] as const

/** Пустое состояние — не настроение, а отсутствие света. */
export const MOOD_EMPTY: Mood = {
  id: 'empty',
  name: '—',
  color: T.textDim,
  quote: '',
  desc: 'Добавьте свет, чтобы увидеть настроение.',
  full: '',
  mult: '',
  temp: '',
  shadows: '',
  feel: '',
  visual: '',
  when: '',
}

/**
 * Автоматическое определение настроения по ratio.
 * Порядок на MoodArc слева направо: Утро → Полдень → Сумерки (дуга дня).
 */
export function autoMood(ratio: number): Mood {
  if (ratio <= 0)    return MOOD_EMPTY
  if (ratio < 0.8)   return MOODS[1]   // morning  — Утро в лесу    (low ratio)
  if (ratio < 1.4)   return MOODS[2]   // zenith   — Ясный полдень  (middle ratio)
  return MOODS[0]                       // dusk     — Тёплые сумерки (high ratio)
}

/**
 * batch9 #7 — Динамический desc по ratio (9 фаз внутри 3 mood).
 *
 * Используется в MoodBlock.vue вместо статического mood.desc.
 * Empty-state (ratio <= 0) защищается на стороне компонента — здесь не обрабатывается.
 *
 * Каждый текст: первое предложение — картина света (ламели, щели, тени, источники),
 * второе — что наступает в человеке (по разделу 6–8 moods.md «Что чувствуется»).
 *
 * Тексты говорят про КОМПОЗИЦИЮ и ХАРАКТЕР света, не про яркость
 * (для яркости — отдельный слой BRIGHT). См. Р13 в moods.md.
 *
 * Фазы:
 *   Утро в лесу    (ratio 0   – 0.8):
 *     - раннее   (0    – 0.27): рассветный минимум
 *     - разгар   (0.27 – 0.53): спокойное утро
 *     - позднее  (0.53 – 0.8 ): утро у границы полудня
 *   Ясный полдень  (ratio 0.8 – 1.4):
 *     - вступление (0.8  – 0.95): начало рабочего режима
 *     - зенит      (0.95 – 1.2 ): пик ясности
 *     - поздний    (1.2  – 1.4 ): графичный полдень
 *   Тёплые сумерки (ratio ≥ 1.4):
 *     - ранние   (1.4 – 2.0): свет уходит вниз
 *     - глубокие (2.0 – 3.0): обилие тёплых источников
 *     - поздние  (3.0+     ): полный вечер, можно ничего не решать
 */
export function moodDesc(ratio: number): string {
  // ── Утро в лесу (ratio 0 – 0.8) ──
  if (ratio < 0.27) {
    return 'Света совсем мало — едва видны очертания. Хорошо, когда хочется тишины и покоя.'
  }
  if (ratio < 0.53) {
    return 'Света уже хватает на лица и страницы. Спокойное начало дня, ничего не торопит.'
  }
  if (ratio < 0.8) {
    return 'Света всё больше, комната проясняется. Можно браться за дела.'
  }

  // ── Ясный полдень (ratio 0.8 – 1.4) ──
  if (ratio < 0.95) {
    return 'Свет набирает силу, тени становятся чётче. Включается рабочий настрой.'
  }
  if (ratio < 1.2) {
    return 'Полный дневной свет. Видно каждую мелочь — лучшее время для точных дел и разговоров.'
  }
  if (ratio < 1.4) {
    return 'Света вдоволь, но он мягчеет. Дела идут к завершению, темп спадает.'
  }

  // ── Тёплые сумерки (ratio ≥ 1.4) ──
  if (ratio < 2.0) {
    return 'Свет собрался внизу — в торшерах и бра. Ровно столько, чтобы расслабиться и не спешить.'
  }
  if (ratio < 3.0) {
    return 'Тёплого света много, со всех сторон. Хорошо для долгих разговоров и отдыха.'
  }
  return 'Света даже с лихвой для вечера — глазам столько не нужно. Можно приглушить и наслаждаться тишиной.'
}

/**
 * Короткая подпись фазы (9 градаций внутри 3 настроений) — для «живого» ярлыка
 * под дугой. Раскрывает 9 фаз из moodDesc именами, не меняя 3 названия настроений.
 */
export function moodPhase(ratio: number): string {
  if (ratio <= 0) return ''
  if (ratio < 0.27) return 'рассвет'
  if (ratio < 0.53) return 'раннее утро'
  if (ratio < 0.8) return 'утро к полудню'
  if (ratio < 0.95) return 'день входит'
  if (ratio < 1.2) return 'разгар дня'
  if (ratio < 1.4) return 'день к вечеру'
  if (ratio < 2.0) return 'ранний вечер'
  if (ratio < 3.0) return 'глубокий вечер'
  return 'поздний вечер'
}

/**
 * Находит mood по id (или MOOD_EMPTY).
 */
export function moodById(id: MoodId): Mood {
  if (id === 'empty') return MOOD_EMPTY
  return MOODS.find((m) => m.id === id) ?? MOOD_EMPTY
}

/* ──────────────── Шкала яркости (BRIGHT) ──────────────── */

export interface Bright {
  max: number
  name: string
  color: string
}

export const BRIGHT: readonly Bright[] = [
  { max: 0.5, name: 'Мало света', color: T.red },
  { max: 0.8, name: 'Почти хватает', color: T.yellow },
  { max: 2, name: 'В самый раз', color: T.green },
  { max: 4, name: 'С запасом', color: T.neutral },
  { max: 999, name: 'Больше, чем надо', color: T.textSec },
] as const

export function getBright(ratio: number): Bright {
  return BRIGHT.find((b) => ratio <= b.max) ?? BRIGHT[4]
}

/* ──────────────── Слайды MoodDetailModal (5 штук) ──────────────── */

export interface MoodSlide {
  title: string
  iconKey: string
  text: string | null
  blocks: [string, string][] | null
}

/**
 * Собирает 5 слайдов онбординга для конкретного настроения.
 *
 * ТЗ-2 изменения:
 *   - Слайд 4 («Когда»): убран суффикс «Идеально для создания нужной атмосферы»
 *   - Слайд 5 («Управление»): текст про MoodArc вместо общей фразы про диммер
 */
export function buildMoodSlides(mood: Mood): MoodSlide[] {
  return [
    {
      title: mood.name,
      iconKey: mood.iconKey ?? 'sun',
      text: mood.full,
      blocks: null,
    },
    {
      title: 'Параметры',
      iconKey: 'fileSliders',
      text: null,
      blocks: [
        ['Температура', mood.temp],
        ['Яркость', mood.mult],
      ],
    },
    {
      title: 'Атмосфера',
      iconKey: 'fan',
      text: null,
      blocks: [
        ['Тени', mood.shadows],
        ['Ощущение', mood.feel],
      ],
    },
    {
      title: 'Когда',
      iconKey: 'clockFading',
      text: mood.when,
      blocks: null,
    },
    {
      title: 'Управление',
      iconKey: 'gitCompare',
      text: 'Каждое действие двигает точку на дуге настроения. Добавляйте свет — точка идёт по дуге дня. Убирайте — возвращается. Так же работают высота потолка и площадь комнаты.',
      blocks: null,
    },
  ]
}
