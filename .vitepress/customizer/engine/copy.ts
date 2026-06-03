/**
 * copy.ts — Сборщик текстов конфигуратора (детерминированный, без LLM).
 *
 * Голос задаётся в WOODLED Tone of Voice. Движок НЕ сочиняет — он выбирает
 * и склеивает заранее одобренные кусочки из банков ниже. Любая комбинация
 * собирается грамматически верно по построению: фрагменты комнат — подлежащие
 * в именительном, связки с ними согласованы.
 *
 * Правка текстов = редактирование таблиц в этом файле, не логики.
 *
 * Анти-повтор: выбор варианта детерминирован от seed (обычно — число
 * светильников в комнате), поэтому при изменении сборки фраза меняется,
 * но не «дёргается» на каждый ре-рендер.
 */

import type { RoomTypeId } from '../data/rooms'

/* ──────────────── Состояние света ──────────────── */

export type LightState = 'dark' | 'dim' | 'ok' | 'plenty' | 'over'

export function lightState(ratio: number): LightState {
  if (ratio <= 0.5) return 'dark'
  if (ratio <= 0.8) return 'dim'
  if (ratio <= 1.5) return 'ok'
  if (ratio <= 2.5) return 'plenty'
  return 'over'
}

/* ──────────────── Банк: зачины по состоянию (C1) ──────────────── */
/* {pct} → процент от нормы. */

const OPENERS: Record<'dark' | 'dim', readonly string[]> = {
  dark: ['Пока темно', 'Света совсем мало', 'Темновато'],
  dim: ['Света на {pct}% от нормы', 'Света немного не хватает', 'Немного не дотягивает до нормы'],
}

/* Полные фразы для состояний, где докупать не нужно (ok/plenty/over).
   Это СОВЕТ, а не повтор бейджа: бейдж говорит состояние, подсказка — что делать.
   Без точки в конце (фраза живёт в пилюле). */
const FULL: Record<'ok' | 'plenty' | 'over', readonly string[]> = {
  ok: ['Менять ничего не нужно', 'Вот так хорошо', 'Можно оставить как есть'],
  plenty: ['При желании можно приглушить', 'Ярковато — можно убавить'],
  over: [
    'Глазам столько не нужно — можно приглушить или добавить диммер',
    'Стоит снять пару светильников или поставить диммер',
  ],
}

/* ──────────────── Банк: фрагмент по комнате (C2) ──────────────── */
/* Подлежащее в именительном — встаёт в рамку «{зачин} — {фрагмент} {связка}». */

const ROOM_FRAGMENT: Record<RoomTypeId, string> = {
  kitchen: 'пара спотов над столешницей',
  bedroom: 'бра у изголовья',
  living: 'торшер у дивана',
  office: 'лампа на рабочем столе',
  kids: 'лампа на столе',
  hallway: 'пара спотов вдоль прохода',
  bathroom: 'свет у зеркала',
  stairs: 'бра вдоль ступеней',
}

/* ──────────────── Банк: связки (C3) ──────────────── */

/* Связки универсальные — не подразумевают способ монтажа (бра вешают, торшер ставят,
   спот монтируют), поэтому подходят к любому фрагменту. */
const CLOSERS: readonly string[] = ['не помешает', 'пригодится', 'просится', 'напрашивается']

/* ──────────────── Выбор варианта (анти-повтор) ──────────────── */

function pick<T>(arr: readonly T[], seed: number): T {
  const i = ((Math.trunc(seed) % arr.length) + arr.length) % arr.length
  return arr[i]
}

/* ──────────────── Подсказка на дашборде ──────────────── */

/**
 * Собирает строку подсказки: комната × состояние × вариант.
 * @param roomType тип комнаты (для фрагмента)
 * @param ratio    баланс света
 * @param seed     стабильный сид (обычно число светильников)
 */
export function lightHint(roomType: RoomTypeId, ratio: number, seed: number): string {
  const s = lightState(ratio)
  if (s === 'dark' || s === 'dim') {
    const pct = Math.round(ratio * 100)
    const opener = pick(OPENERS[s], seed).replace('{pct}', String(pct))
    const fragment = ROOM_FRAGMENT[roomType] ?? 'немного света'
    const closer = pick(CLOSERS, seed + 1)
    return `${opener} — ${fragment} ${closer}`
  }
  return pick(FULL[s], seed)
}

/* ──────────────── Банк: реакция на последнее действие (C6) ──────────────── */
/* Короткая подпись на ~1 сек после изменения. Подключается отдельно. */

export type LightAction =
  | 'addFx' | 'removeFx' | 'morePatrons'
  | 'raiseCeiling' | 'lowerCeiling'
  | 'darkerWalls' | 'lighterWalls'
  | 'brighterModel' | 'softerModel'

const REACTIONS: Record<LightAction, readonly string[]> = {
  addFx: ['Стало светлее', 'Прибавили свет'],
  removeFx: ['Стало темнее', 'Света поубавилось'],
  morePatrons: ['Каждый патрон добавил света', 'Стало ярче'],
  raiseCeiling: ['Потолок выше — свету идти дальше', 'Высокому потолку нужно больше света'],
  lowerCeiling: ['Потолок ниже — света хватает легче'],
  darkerWalls: ['Тёмные стены забрали часть света'],
  lighterWalls: ['Светлые стены вернули часть света'],
  brighterModel: ['Света прибавилось'],
  softerModel: ['Стало мягче'],
}

export function actionReaction(action: LightAction, seed = 0): string {
  return pick(REACTIONS[action], seed)
}
