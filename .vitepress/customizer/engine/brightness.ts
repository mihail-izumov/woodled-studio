/**
 * brightness.ts — Расчёт яркости
 *
 * Источник: woodled-v42.jsx (baseLm, fxLm, fxLamps, getArea).
 *
 * ТЗ-1: Добавлена функция ratioToAngle() для MoodArc.
 *
 * === КПД-калибровка (метод коэффициента использования, СП 52.13330 / IES lumen method) ===
 * Норма — это поток, который реально нужен с учётом потерь доставки света:
 *   baseLm = lux × area × (1 + Σfurniture.ab) / (UF × MF)
 *   UF (коэф. использования) = f(индекс помещения) × поправка на отделку стен
 *   MF (коэф. эксплуатации)  = 0.8 (деградация ламп + запыление)
 * Высота потолка входит ЧЕРЕЗ индекс помещения (высота подвеса), отдельный
 * множитель (ceilingH/2.7) убран — иначе двойной счёт высоты.
 *
 * fxLm = Σ lmPer × l × q × (1 − diffLoss, если включён рассеиватель)
 */

import { MD, FX_FACTORS, type Fixture } from '../data/catalog'
import { FURN } from '../data/furniture'
import type { Room, RoomType, WallFinish } from '../data/rooms'
import { wallFinishOf } from './wall-color'

/* ──────────────── КПД помещения ──────────────── */

/** Высота рабочей плоскости от пола, м (стол/диван ~0.75). */
const WORK_PLANE = 0.75
/** Коэффициент эксплуатации: деградация LED + запыление (≈0.8 по СП). */
const MAINT_FACTOR = 0.8
/** Свес подвеса, м — опускает потолочный источник ближе к плоскости (даёт больше света). */
const SUSPENSION_DROP = 0.4

/** Есть ли в комнате подвесной потолочный светильник (для поправки высоты). */
function hasCeilingPendant(r: Room): boolean {
  return r.fixtures.some((f) => {
    const m = MD[f.m]
    return !!m && (f.zone ?? 'ceiling') === 'ceiling' && m.hasMount
      && (f.opts?.mount ?? 'pendant') === 'pendant'
  })
}
/** Поправка к UF по отделке стен (отражение): светлые стены возвращают больше света. */
const WALL_UF_MULT: Record<WallFinish, number> = { light: 1.1, medium: 1.0, dark: 0.85 }

/**
 * Индекс помещения RI = √area / (2 · Hm),
 * Hm — высота подвеса светильника над рабочей плоскостью.
 * Чем больше/ниже комната — тем выше RI и тем эффективнее доставка света.
 */
function roomIndex(area: number, ceilingH: number): number {
  const hm = Math.max(0.5, ceilingH - WORK_PLANE)
  return Math.sqrt(area) / (2 * hm)
}

/**
 * Опорная кривая UF по индексу помещения для светлых-средних поверхностей
 * и типовых потолочных/подвесных светильников (значения из CU-таблиц).
 * Между точками — линейная интерполяция, за краями — кламп.
 */
const UF_CURVE: readonly (readonly [number, number])[] = [
  [0.6, 0.40], [0.8, 0.46], [1.0, 0.51], [1.25, 0.55],
  [1.5, 0.58], [2.0, 0.62], [2.5, 0.65], [3.0, 0.68],
]

/** Коэффициент использования (0..1) по индексу помещения и отделке стен. */
function utilizationFactor(ri: number, finish: WallFinish): number {
  const first = UF_CURVE[0]
  const last = UF_CURVE[UF_CURVE.length - 1]
  let uf: number
  if (ri <= first[0]) uf = first[1]
  else if (ri >= last[0]) uf = last[1]
  else {
    uf = first[1]
    for (let i = 1; i < UF_CURVE.length; i++) {
      const [x0, y0] = UF_CURVE[i - 1]
      const [x1, y1] = UF_CURVE[i]
      if (ri <= x1) {
        uf = y0 + ((y1 - y0) * (ri - x0)) / (x1 - x0)
        break
      }
    }
  }
  return uf * WALL_UF_MULT[finish]
}

/**
 * Площадь комнаты (м²).
 * При sizeIndex === 3 — кастомная площадь, фолбэк на Большую.
 */
export function getArea(rt: RoomType, r: Room): number {
  if (r.sizeIndex === 3) return r.customArea ?? rt.sizes[2]
  return rt.sizes[r.sizeIndex]
}

/**
 * Целевое количество люмен для комнаты (метод коэф. использования).
 * Учитывает норму, площадь, мебель, геометрию (через индекс помещения)
 * и отделку стен, плюс потери эксплуатации.
 */
export function baseLm(rt: RoomType, r: Room): number {
  const furnFactor = r.furniture.reduce((s, f) => s + (FURN[f]?.ab ?? 0), 0)
  const area = getArea(rt, r)
  // Подвес опускает источник → меньше эффективная высота → выше КПД → ниже норма.
  const drop = hasCeilingPendant(r) ? SUSPENSION_DROP : 0
  const effCeilingH = Math.max(2.0, r.ceilingH - drop)
  const ri = roomIndex(area, effCeilingH)
  // wallFinishOf учитывает r.cardColor: если задан валидный HEX, категория
  // вычисляется автоматически по relative luminance. Иначе — пресет wallFinish.
  const uf = utilizationFactor(ri, wallFinishOf(r))
  return Math.round((rt.lux * area * (1 + furnFactor)) / (uf * MAINT_FACTOR))
}

/**
 * Фактическое количество люмен от набора светильников.
 * Рассеиватель (только Rotor X) теряет diffLoss света — учитываем,
 * чтобы сумма комнаты совпадала с честной цифрой на странице светильника.
 */
export function fxLm(fixtures: Fixture[]): number {
  return fixtures.reduce((sum, it) => {
    const m = MD[it.m]
    if (!m) return sum
    const l = it.l ?? m.lamps
    const q = it.q ?? 1
    const diff = it.opts?.diffuser && m.diffLoss ? 1 - m.diffLoss : 1
    const f = FX_FACTORS[it.m] ?? { body: 1, ambient: 1 }
    return sum + Math.round(m.lmPer * l * q * f.body * diff * f.ambient)
  }, 0)
}

/**
 * Общее количество ламп во всех светильниках (с учётом q).
 */
export function fxLamps(fixtures: Fixture[]): number {
  return fixtures.reduce((sum, it) => {
    const m = MD[it.m]
    if (!m) return sum
    const l = it.l ?? m.lamps
    const q = it.q ?? 1
    return sum + l * q
  }, 0)
}

/**
 * Отношение факта к плану.
 * Возвращает 0 если base === 0.
 */
export function ratioOf(base: number, actual: number): number {
  return base > 0 ? actual / base : 0
}

/**
 * Суммарный процент потерь от мебели (округлён до целого).
 */
export function furnPct(furniture: Room['furniture']): number {
  return Math.round(furniture.reduce((s, f) => s + (FURN[f]?.ab ?? 0) * 100, 0))
}

/**
 * Конвертирует ratio в угол (0—180°) для MoodArc.
 *
 * ТЗ-1: Каждый mood занимает 60° на полукруге (дуга дня, слева направо):
 *   - 0—60°  : Утро в лесу     (ratio 0—0.8)   — восход слева
 *   - 60—120°: Ясный полдень   (ratio 0.8—1.4) — зенит сверху
 *   - 120—180°: Тёплые сумерки (ratio 1.4—3.0+) — закат справа
 *
 * Cap на 180° для очень яркого света (ratio > 3.0).
 */
export function ratioToAngle(ratio: number): number {
  if (ratio <= 0)   return 0
  if (ratio <= 0.8) return (ratio / 0.8) * 60
  if (ratio < 1.4)  return 60 + ((ratio - 0.8) / 0.6) * 60
  if (ratio < 3.0)  return 120 + ((ratio - 1.4) / 1.6) * 60
  return 180
}
