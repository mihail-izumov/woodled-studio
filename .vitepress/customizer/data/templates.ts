/**
 * templates.ts — Шаблоны домов
 *
 * 3 готовых конфигурации на основе аналитики рынка жилья Москвы 2025
 * и реальной статистики кастомизации заказов 2020-2026.
 * Каждый шаблон = массив комнат с fixtures и мебелью.
 *
 * Используется при первом запуске для preheat-старта.
 *
 * Дефолты опций (см. docs/TEMPLATE_DEFAULTS.md):
 *   - Деревянная чаша (wood_8) для всех моделей где avBowls включает её —
 *     14% юзеров выбирают её добровольно, +1200₽ к стандарту, усиливает
 *     древесный нарратив бренда.
 *   - Доп. патроны для крупных потолочных в больших комнатах (Rotor M в
 *     гостиной 25 м² → 5 патронов; Rotor L в 35 м² → 6 патронов).
 *   - Чек-лист 100% done через allStepsForModel — для 77% не-кастомизирующих
 *     юзеров «6/6 готово» = доверие к подбору, для 23% галочки снимаются
 *     при изменении и работают как навигатор.
 */

import type { RoomTypeId, FurnId } from './rooms'
import { MD, FAMILIES, type ModelId, type ZoneId } from './catalog'
import type { FxOpts, Wood } from './materials'

/* ──────────────── Типы ──────────────── */

export interface TemplateFixture {
  m: ModelId
  q: number
  wood: Wood
  zone: ZoneId
  /** Override стандарта lamps. Используется для крупных моделей в больших комнатах. */
  l?: number
  /** Опции кастомизации. Применяются как partial — остальное из DEF_OPT. */
  opts?: Partial<FxOpts>
  /**
   * Список ID шагов чек-листа, отмеченных как «готово».
   * Если undefined — loadTemplate автоматически проставит все применимые шаги
   * через allStepsForModel(m). Пустой массив [] — явное «нет галочек».
   */
  done?: string[]
}

export interface TemplateRoom {
  typeId: RoomTypeId
  sizeIndex: 0 | 1 | 2
  ceilingH: number
  fixtures: TemplateFixture[]
  furniture: FurnId[]
}

export interface HomeTemplate {
  id: string
  /** Площадь для отображения в плашке: '~45 м²' */
  areaLabel: string
  rooms: TemplateRoom[]
}

/* ──────────────── Helper: список применимых шагов чек-листа ──────────────── */

/**
 * Возвращает список ID шагов чек-листа, применимых для конкретной модели.
 * Логика идентична getSteps() в FxEditor.vue (строка ~103) — синхронизировать
 * при любых изменениях схемы шагов.
 *
 * Используется в loadTemplate как дефолтное значение поля `done`, чтобы
 * шаблоны автоматически получали 100% заполненный чек-лист без необходимости
 * вручную перечислять шаги для каждого fixture.
 */
export function allStepsForModel(modelId: ModelId): string[] {
  const m = MD[modelId]
  if (!m) return []
  const steps: string[] = []
  const fam = m.family ? FAMILIES[m.family] : null
  if (fam && fam.length > 1) steps.push('size')
  steps.push('wood')
  if (m.hasMount) steps.push('mount')
  if (m.avBowls.length > 0) steps.push('bowl')
  steps.push('temp')
  if (m.minL !== m.maxL) steps.push('patrons')
  if (m.hasDiffuser) steps.push('diffuser')
  if (m.wireOpts) steps.push('wire')
  if (m.baseColors) steps.push('base')
  if (!m.bulbsIn && (m.bulbPrice || m.bulbOpts)) steps.push('bulbs')
  return steps
}

/* ──────────────── Стандартные опции для шаблонов ──────────────── */

/**
 * Базовые опции для большинства светильников в шаблонах.
 * Деревянная чаша wood_8 — для моделей где avBowls включает её.
 * Прочее наследуется из DEF_OPT (mount=pendant, btemp=4000, bulbs=true).
 */
const TPL_OPTS_WOOD_BOWL: Partial<FxOpts> = {
  bowl: 'wood_8',
}

/* ──────────────── Шаблоны ──────────────── */

export const TEMPLATES: readonly HomeTemplate[] = [
  /* ───────── Шаблон ~45 м² ───────── */
  {
    id: 'home_45',
    areaLabel: '~45 м²',
    rooms: [
      {
        typeId: 'kitchen',
        sizeIndex: 0,
        ceilingH: 2.7,
        fixtures: [
          { m: 'rotor_s', q: 1, wood: 'oak', zone: 'ceiling', opts: TPL_OPTS_WOOD_BOWL },
        ],
        furniture: ['dtable', 'fridge', 'kitchen_set', 'stove'],
      },
      {
        typeId: 'bedroom',
        sizeIndex: 0,
        ceilingH: 2.7,
        fixtures: [
          { m: 'bra_h', q: 1, wood: 'walnut', zone: 'wall' },
          { m: 'table_lamp', q: 1, wood: 'oak', zone: 'table' },
        ],
        furniture: ['bed', 'wardrobe', 'dresser', 'nightstand'],
      },
      {
        typeId: 'hallway',
        sizeIndex: 0,
        ceilingH: 2.7,
        fixtures: [
          { m: 'spot_s', q: 1, wood: 'oak', zone: 'ceiling', opts: TPL_OPTS_WOOD_BOWL },
          { m: 'spot_s', q: 1, wood: 'oak', zone: 'ceiling', opts: TPL_OPTS_WOOD_BOWL },
        ],
        furniture: ['wardrobe', 'dresser', 'shoe_rack', 'coat_rack', 'mirror'],
      },
    ],
  },

  /* ───────── Шаблон ~65 м² ───────── */
  {
    id: 'home_65',
    areaLabel: '~65 м²',
    rooms: [
      {
        typeId: 'living',
        sizeIndex: 1,
        ceilingH: 2.7,
        fixtures: [
          /* Rotor M в гостиной 25 м² + мебель +17%: с 4 патронами «Рассвет»,
             с 5 «Ясный день». Апгрейд решает задачу яркости и +2450₽ к чеку. */
          { m: 'rotor_m', q: 1, wood: 'oak', zone: 'ceiling', l: 5, opts: TPL_OPTS_WOOD_BOWL },
          { m: 'bra_h', q: 2, wood: 'oak', zone: 'wall' },
          { m: 'floor_lamp_s', q: 1, wood: 'oak', zone: 'floor' },
        ],
        furniture: ['sofa', 'bookshelf', 'jtable', 'tv_stand'],
      },
      {
        typeId: 'bedroom',
        sizeIndex: 1,
        ceilingH: 2.7,
        fixtures: [
          { m: 'rotor_s', q: 1, wood: 'walnut', zone: 'ceiling', opts: TPL_OPTS_WOOD_BOWL },
          { m: 'table_lamp', q: 1, wood: 'walnut', zone: 'table' },
        ],
        furniture: ['bed', 'wardrobe', 'dresser', 'nightstand'],
      },
      {
        typeId: 'kitchen',
        sizeIndex: 1,
        ceilingH: 2.7,
        fixtures: [
          { m: 'elliptical_s', q: 1, wood: 'black', zone: 'ceiling', opts: TPL_OPTS_WOOD_BOWL },
        ],
        furniture: ['dtable', 'fridge', 'kitchen_set', 'stove'],
      },
      {
        typeId: 'hallway',
        sizeIndex: 0,
        ceilingH: 2.7,
        fixtures: [
          { m: 'spot_s', q: 1, wood: 'black', zone: 'ceiling', opts: TPL_OPTS_WOOD_BOWL },
        ],
        furniture: ['wardrobe', 'dresser', 'shoe_rack', 'coat_rack', 'mirror'],
      },
    ],
  },

  /* ───────── Шаблон ~85 м² ───────── */
  {
    id: 'home_85',
    areaLabel: '~85 м²',
    rooms: [
      {
        typeId: 'living',
        sizeIndex: 2,
        ceilingH: 3.0,
        fixtures: [
          /* Rotor L в гостиной 35 м² + мебель +22% + потолок 3.0 м (+11%):
             6 патронов вместо 4 решают задачу яркости и +4500₽ к чеку. */
          { m: 'rotor_l', q: 1, wood: 'walnut', zone: 'ceiling', l: 6, opts: TPL_OPTS_WOOD_BOWL },
          { m: 'bra_v_l', q: 2, wood: 'walnut', zone: 'wall' },
          { m: 'floor_lamp', q: 1, wood: 'oak', zone: 'floor' },
        ],
        furniture: ['sofa', 'bookshelf', 'dtable', 'jtable', 'tv_stand'],
      },
      {
        typeId: 'bedroom',
        sizeIndex: 1,
        ceilingH: 3.0,
        fixtures: [
          { m: 'rotor_s', q: 1, wood: 'oak', zone: 'ceiling', opts: TPL_OPTS_WOOD_BOWL },
          { m: 'table_lamp', q: 2, wood: 'oak', zone: 'table' },
        ],
        furniture: ['bed', 'wardrobe', 'dresser', 'nightstand', 'armchair'],
      },
      {
        typeId: 'kids',
        sizeIndex: 1,
        ceilingH: 3.0,
        fixtures: [
          /* Детская самая «голодная» по свету (+25% мебель). Rotor M с 5 патронами
             даёт 7500 лм → «Поляна» с запасом для уроков. */
          { m: 'rotor_m', q: 1, wood: 'oak', zone: 'ceiling', l: 5, opts: TPL_OPTS_WOOD_BOWL },
          { m: 'unit', q: 1, wood: 'oak', zone: 'wall', opts: TPL_OPTS_WOOD_BOWL },
        ],
        furniture: ['bed', 'desk', 'wardrobe', 'bookshelf'],
      },
      {
        typeId: 'kitchen',
        sizeIndex: 1,
        ceilingH: 3.0,
        fixtures: [
          { m: 'elliptical_s', q: 1, wood: 'black', zone: 'ceiling', opts: TPL_OPTS_WOOD_BOWL },
        ],
        furniture: ['dtable', 'fridge', 'kitchen_set', 'stove'],
      },
      {
        typeId: 'hallway',
        sizeIndex: 1,
        ceilingH: 3.0,
        fixtures: [
          { m: 'spot_s', q: 2, wood: 'black', zone: 'ceiling', opts: TPL_OPTS_WOOD_BOWL },
        ],
        furniture: ['wardrobe', 'dresser', 'shoe_rack', 'coat_rack', 'mirror'],
      },
    ],
  },
] as const
