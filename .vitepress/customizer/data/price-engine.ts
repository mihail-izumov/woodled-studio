/**
 * price-engine.ts — Расчёт цен
 *
 * Источник: WoodledSuperApp.jsx v8 (ClientSim price useMemo).
 * Синхронизировано: per-model bulbPrice, bulbOpts (Rotor X), hasDiffuser.
 *
 * Формула:
 *   base = p[wood]
 *   + (l − lamps) × sur            // доп. патроны
 *   + bowl.price                    // платные чаши: wood_8 / hook_10 / chrome_14 = 1200₽
 *   + diffuser (если hasDiffuser)   // 500₽
 *   + moisture                      // 1000₽
 *   + bulbOpts.price                // Rotor X: 0/3000/3600
 *   | bulbPrice × l/lamps           // остальные: 250₽ × патроны
 *   × qty
 *
 * Wire НЕ входит в цену в текущей версии (см. wireOpts.price если потребуется).
 */

import { MD, type Fixture } from '../data/catalog'
import { OPT_PRICE, BOWLS } from '../data/materials'

/**
 * Цена одного размещённого светильника с учётом всех опций.
 */
export function itemPrice(it: Fixture): number {
  const m = MD[it.m]
  if (!m) return 0

  const wood = it.wood ?? 'oak'
  const l = it.l ?? m.lamps
  let price = m.p[wood] ?? 0

  // Доп. патроны сверх нормы
  const extra = Math.max(0, l - m.lamps)
  price += extra * m.sur

  const opts = it.opts ?? {}

  // Чаша — платные опции (wood_8 / hook_10 / chrome_14 = +1200 ₽)
  if (opts.bowl) {
    const bowl = BOWLS.find((b) => b.id === opts.bowl)
    if (bowl) price += bowl.price
  }

  // Рассеиватель (только если модель поддерживает)
  if (opts.diffuser && m.hasDiffuser) {
    price += OPT_PRICE.diffuser
  }

  // Влагозащита
  if (opts.moisture) {
    price += OPT_PRICE.moisture
  }

  // Лампочки
  if (m.bulbOpts) {
    // Rotor X: выбор из типов (none/white/clear)
    const bo = m.bulbOpts.find(x => x.id === (opts.bulbOpt ?? 'none'))
    if (bo) price += bo.price
  } else if (!m.bulbsIn && opts.bulbs !== false && m.bulbPrice) {
    // Стандартные: per-model bulbPrice, масштабируется по патронам
    price += Math.round(m.bulbPrice * l / m.lamps)
  } else if (!m.bulbsIn && opts.bulbs !== false && !m.bulbPrice) {
    // Fallback для моделей без bulbPrice (если данные ещё не обновлены)
    price += OPT_PRICE.bulbsPerLamp * l
  }

  return price * (it.q ?? 1)
}

/**
 * Суммарная цена массива светильников.
 */
export function fxPrice(fixtures: Fixture[]): number {
  return fixtures.reduce((s, it) => s + itemPrice(it), 0)
}

/**
 * Доплата за дополнительный патрон (₽).
 */
export function lampSurcharge(modelId: Fixture['m']): number {
  return MD[modelId]?.sur ?? 0
}
