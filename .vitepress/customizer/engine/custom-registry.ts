/**
 * custom-registry.ts — Регистрация кастомных светильников (другие бренды) в MD.
 *
 * Архитектура (см. обсуждение в чате с продуктом):
 *   - Источник правды — Fixture.custom: CustomSpec (хранится в localStorage и
 *     едет в URL-хеш через share.ts).
 *   - При загрузке состояния (init store, restorePersisted, loadFromHash) и
 *     при добавлении нового кастома мы дописываем временную запись в MD и
 *     FX_FACTORS под стабильным id вида `custom_<hash>`.
 *   - После регистрации все 48 lookup'ов `MD[fx.m]` / `FX_FACTORS[fx.m]`
 *     работают без правок живого движка. «Лес» отдельно фильтруется по
 *     `!fx.custom` в forest.ts/forest-cards.ts/RoomCard.vue/story-engine.ts.
 *
 * Никаких файлов: MD — это обычный объект в памяти. Регистрация = одно
 * присваивание. На перезагрузке state восстанавливается из localStorage,
 * registerCustom вызывается снова — MD заново заполняется.
 */

import { MD, FX_FACTORS, type Model, type ModelId, type CustomSpec, type Fixture } from '../data/catalog'

/**
 * Стабильный id из спецификации: одинаковые спеки → один id (не плодим
 * дубликаты при повторной регистрации). Простой DJB2-хеш по
 * сериализованным ключевым полям.
 */
export function customIdFor(spec: CustomSpec): ModelId {
  const key = [
    spec.name, spec.brand, spec.type, spec.chip,
    spec.lamps, spec.lmPer, spec.body, spec.ambient,
    spec.btemp, spec.tint?.id, spec.url ?? '',
    spec.source, spec.socket ?? '',
  ].join('|')
  let h = 5381
  for (let i = 0; i < key.length; i++) {
    h = ((h << 5) + h) ^ key.charCodeAt(i)
  }
  // Беззнаковый base36, обрезаем — id остаётся коротким и стабильным.
  return 'custom_' + (h >>> 0).toString(36)
}

/**
 * Записать кастомную модель в `MD` и `FX_FACTORS`. Возвращает id, под которым
 * запись зарегистрирована (его кладут в Fixture.m).
 *
 * Идемпотентно: повторный вызов с тем же spec — no-op (id одинаковый).
 */
export function registerCustom(spec: CustomSpec): ModelId {
  const id = customIdFor(spec)

  // Цена нулевая — кастом не продаётся через WOODLED.
  const zeroPrice = { oak: 0, walnut: 0, black: 0 }

  // letter — для совместимости с SIZE_WORD у люстр. Только для kind=люстра
  // и при наличии chip. Для остальных — пусто (никак не отображается).
  const sizeLetter: Record<string, string> = {
    'малая': 'S', 'средняя': 'M', 'большая': 'L', 'огромная': '1000',
  }
  const letter = spec.type === 'люстра' ? (sizeLetter[spec.chip] ?? '') : ''

  const model: Model = {
    name: spec.name || spec.brand || 'Свой',
    letter,
    type: spec.type,
    collection: spec.brand || 'Свой',
    chip: spec.chip || '',
    titleFull: spec.chip || '',
    lamps: spec.lamps,
    minL: spec.lamps,
    maxL: spec.lamps,
    lmPer: spec.lmPer,
    sur: 0,
    sqMin: spec.sqMin ?? 4,
    sqMax: spec.sqMax ?? 20,
    p: zeroPrice,
    avBowls: [],
    hasMount: false,
    bulbsIn: true,
    diffLoss: 0,
    dimD: '',
    dimH: '',
    ltName: spec.socket ? `${spec.socket}` : (spec.source === 'tape' ? 'LED-лента' : 'LED'),
    ltWatt: 0,
  }

  ;(MD as Record<string, Model>)[id] = model
  ;(FX_FACTORS as Record<string, { body: number; ambient: number }>)[id] = {
    body: spec.body,
    ambient: spec.ambient,
  }

  return id
}

/**
 * Пробежать все Fixture в комнатах и зарегистрировать те, у кого есть
 * .custom. Вызывается из store при init/restore/unpack.
 *
 * Также синхронизирует fx.m с актуальным id — если spec изменился,
 * `customIdFor` вернёт новый id и старая запись MD просто протухнет (что
 * нормально — её больше никто не ищет).
 */
export function registerAllCustoms(rooms: Array<{ fixtures: Fixture[] }>): void {
  for (const room of rooms) {
    for (const fx of room.fixtures) {
      if (fx.custom) {
        const id = registerCustom(fx.custom)
        // На случай если spec изменился (или это первый раз) — обновим m.
        if (fx.m !== id) fx.m = id
      }
    }
  }
}
