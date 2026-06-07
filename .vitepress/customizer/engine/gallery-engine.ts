// engine/gallery-engine.ts
// Bridge between data/gallery.ts (Gallery Tagger format) and the gallery
// components (PhotoCard / Lightbox / TapLeafWidget — see gallery-constants.js).
//
// Responsibilities:
//   1. Filters: byModel / byRoom / byCombined / random
//   2. Quality sort: `a_*` filenames first, `b_*` after
//   3. Reactive aspect-ratio preloader (the grid planner needs real ratios)
//   4. toDisplayItem(): GalleryItem → object shape consumed by PhotoCard/Lightbox

import { ref } from 'vue'
import { GALLERY } from '../data/gallery'

export type GalleryItem = (typeof GALLERY)[number]

// ---------------------------------------------------------------------------
// QUALITY — derived from filename prefix
// ---------------------------------------------------------------------------
function qualityOf(item: GalleryItem): 'a' | 'b' {
  const filename = item.url.split('/').pop() ?? ''
  return filename.startsWith('a_') ? 'a' : 'b'
}

function sortByQuality(items: GalleryItem[]): GalleryItem[] {
  return [...items].sort((x, y) => {
    const qa = qualityOf(x)
    const qb = qualityOf(y)
    if (qa === qb) return 0
    return qa === 'a' ? -1 : 1
  })
}

// ---------------------------------------------------------------------------
// ASPECT RATIO CACHE (reactive)
//
// The grid planner (`cellKind`, `displayAspectFor` in gallery-constants.js)
// needs the natural aspect ratio of each photo. Browsers only know it after
// `Image` is loaded.
//
// We cache values in a regular Map (cheap reads), but expose reactivity via
// `aspectVersion` — a ref that bumps when new aspects are loaded. `aspectOf`
// reads it on each call, so any Vue computed that calls `aspectOf` (e.g. via
// `toDisplayItem`) automatically re-runs when preloading completes.
//
// Without this: displayItems would compute once with all 1.0 fallback values,
// and NEVER re-run when the cache fills — every cell would stay square.
// ---------------------------------------------------------------------------
const aspectCache = new Map<string, number>()
const aspectVersion = ref(0)

export function preloadAspects(items: readonly GalleryItem[]): Promise<void> {
  const promises = items.map(item => {
    if (aspectCache.has(item.url)) return Promise.resolve()
    return new Promise<void>(resolve => {
      const img = new Image()
      img.onload = () => {
        aspectCache.set(item.url, img.naturalWidth / img.naturalHeight)
        // Bump version after EACH load — grid grows progressively (Pinterest-style),
        // not in one big jump after all images are ready.
        aspectVersion.value++
        resolve()
      }
      img.onerror = () => {
        // Failed to load — assume square so the planner still works.
        aspectCache.set(item.url, 1.0)
        aspectVersion.value++
        resolve()
      }
      img.src = item.url
    })
  })
  return Promise.all(promises).then(() => {
    // No-op tail — version was already bumped per-image.
  })
}

export function aspectOf(item: GalleryItem): number {
  // Touch the ref to subscribe reactive consumers.
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  aspectVersion.value
  return aspectCache.get(item.url) ?? 1.0
}

// ---------------------------------------------------------------------------
// DISPLAY-ITEM CONVERTER
// Output shape matches what PhotoCard / Lightbox / planAll expect.
// ---------------------------------------------------------------------------
const WOOD_DISPLAY: Record<string, { name: string; color: string }> = {
  oak:    { name: 'дуб',    color: '#C4A46C' },
  walnut: { name: 'орех',   color: '#8B6242' },
  black:  { name: 'чёрный', color: '#5A4E42' },
}

export interface DisplayItem {
  n: number
  natural: number
  aspect: number  // alias of `natural` — Lightbox.vue reads `photo.aspect`
  zone: string
  wood: { name: string; color: string }
  model: string
  src: string
  rooms: readonly string[]
  label: string
}

export function toDisplayItem(item: GalleryItem, index: number): DisplayItem {
  const wood = WOOD_DISPLAY[item.woods?.[0] ?? 'oak'] ?? WOOD_DISPLAY.oak
  const natural = aspectOf(item)
  return {
    n: index + 1,
    natural,
    aspect: natural,
    zone: item.zones?.[0] ?? 'ceiling',
    wood,
    model: item.models?.[0] ?? '',
    src: item.url,
    rooms: item.rooms,
    label: `${item.models?.[0] ?? ''} · ${item.rooms?.[0] ?? ''}`,
  }
}

// ---------------------------------------------------------------------------
// FILTERS
// All return GalleryItem[] sorted by quality (a_ first, then b_).
// ---------------------------------------------------------------------------
export function byModel(modelId: string): GalleryItem[] {
  return sortByQuality(
    GALLERY.filter(g => (g.models as readonly string[]).includes(modelId))
  )
}

/**
 * byFixture — STRICT фильтр под текущий выбор юзера: model + wood.
 *
 * Используется в FxEditor вместо byModel (тот фильтрует только по модели и
 * игнорирует выбор дерева — отсюда жалоба «фото не соответствуют дереву»).
 *
 * Что НЕ матчит: bowl/mount/diffuser/bodyColor — в gallery.ts этих тегов
 * физически нет (только rooms/models/woods/zones). Расширить — отдельная
 * задача с дотегированием.
 *
 * Возвращает пустой массив, если такой комбинации нет. Пустоту нужно
 * обработать на стороне FxEditor (relaxed-wood fallback или seed-подкачка).
 */
export function byFixture(build: { m: string; wood?: string }): GalleryItem[] {
  return sortByQuality(
    GALLERY.filter(g => {
      if (!(g.models as readonly string[]).includes(build.m)) return false
      if (build.wood && !(g.woods as readonly string[]).includes(build.wood)) return false
      return true
    })
  )
}

export function byRoom(roomTypeId: string): GalleryItem[] {
  return sortByQuality(
    GALLERY.filter(g => (g.rooms as readonly string[]).includes(roomTypeId))
  )
}

export function random(n: number): GalleryItem[] {
  // Two-tier shuffle: all `a_` shuffled first, then all `b_` shuffled.
  // Guarantees the head of the result is high-quality even when n is small.
  const aItems = GALLERY.filter(g => qualityOf(g) === 'a')
  const bItems = GALLERY.filter(g => qualityOf(g) === 'b')
  const shuffledA = [...aItems].sort(() => Math.random() - 0.5)
  const shuffledB = [...bItems].sort(() => Math.random() - 0.5)
  return [...shuffledA, ...shuffledB].slice(0, n)
}

export function byCombined(opts: {
  room?: string
  models?: string[]
  woods?: string[]
}): GalleryItem[] {
  return sortByQuality(
    GALLERY.filter(g => {
      if (opts.room && !(g.rooms as readonly string[]).includes(opts.room)) return false
      if (opts.models?.length && !opts.models.some(m => (g.models as readonly string[]).includes(m))) return false
      if (opts.woods?.length && !opts.woods.some(w => (g.woods as readonly string[]).includes(w))) return false
      return true
    })
  )
}

// ---------------------------------------------------------------------------
// SEED INTERIORS — добивка из _seed.js (179-фото датасет теггера)
//
// Курированная gallery.ts (172 фото) идёт первой. После неё — точно
// отфильтрованные интерьеры из _seed.js через pickFxPhotos('gallery').
// Дубликатов нет: gallery.ts → public/gallery/, _seed.js → public/photo-tagging/.
//
// Используется только когда у юзера есть конкретный build (FxEditor).
// На room-level (RoomDetail) только курированная — там нет «текущего fixture».
// ---------------------------------------------------------------------------
import { pickFxPhotos, fxToConfig } from './fx-gallery'
import type { ModelId } from '../data/catalog'
import type { Wood } from '../data/materials'

interface SeedBuildSnapshot {
  m: ModelId
  wood: Wood
  mount?: string
  diffuser?: boolean
  baseColor?: string
}

/** Добивка-интерьеры из _seed.js под текущий fixture. DisplayItem[] готовые для GallerySection.
 *
 *  opts.relaxWood — если true, дропаем wood из фильтра. Используется как
 *  последний fallback когда курация + strict-seed пусты (типичный случай:
 *  floor_lamp_s/black — нет ни в gallery.ts, ни в seed для black).
 *
 *  opts.maxPerWood — кап числа seed-фото на (model, wood). По умолчанию 2.
 *  Это защита от ситуации, когда в seed несколько похожих ракурсов одного
 *  fixture в одной комнате (как у unit/oak) и юзер видит «дубликаты».
 */
export function seedInteriorsForBuild(
  build: SeedBuildSnapshot,
  indexOffset: number,
  opts?: { relaxWood?: boolean; maxPerWood?: number },
): DisplayItem[] {
  const buildWood = opts?.relaxWood ? '' as Wood : build.wood
  const config = fxToConfig({
    m: build.m,
    wood: buildWood,
    opts: {
      mount: build.mount,
      diffuser: build.diffuser,
      baseColor: build.baseColor,
    },
  })
  const result = pickFxPhotos(config, 'gallery')
  const photos = [...result.interiors.strict, ...result.interiors.partial]

  // Кап числа фото на (model, wood) — иначе при нескольких похожих ракурсах
  // юзер видит «дубль». Дефолт — 2, чтобы оставить выбор, но не флудить.
  const cap = opts?.maxPerWood ?? 2
  const seenCounts = new Map<string, number>()
  const capped = photos.filter(p => {
    const w = Array.isArray(p.photo.wood) ? p.photo.wood[0] : p.photo.wood
    const key = `${p.photo.model}|${w}`
    const n = seenCounts.get(key) ?? 0
    if (n >= cap) return false
    seenCounts.set(key, n + 1)
    return true
  })

  return capped.map((p, i) => {
    const woodKey = Array.isArray(p.photo.wood) ? p.photo.wood[0] : p.photo.wood
    const wood = WOOD_DISPLAY[woodKey] ?? WOOD_DISPLAY.oak
    const aspect = aspectCache.get(p.photo.src) ?? 1.0
    // Подписка на aspectVersion для реактивного пересчёта после preload
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    aspectVersion.value
    return {
      n: indexOffset + i + 1,
      natural: aspect,
      aspect,
      zone: 'ceiling', // _seed.js не размечает zone — дефолт
      wood,
      model: p.photo.model,
      src: p.photo.src,
      rooms: [],
      label: `${p.photo.model} · интерьер`,
    }
  })
}

/** Preload aspect-ratio для seed-фото (тот же aspectCache что у gallery.ts). */
export function preloadSeedAspects(urls: readonly string[]): Promise<void> {
  const promises = urls.map(url => {
    if (aspectCache.has(url)) return Promise.resolve()
    return new Promise<void>(resolve => {
      const img = new Image()
      img.onload = () => {
        aspectCache.set(url, img.naturalWidth / img.naturalHeight)
        aspectVersion.value++
        resolve()
      }
      img.onerror = () => {
        aspectCache.set(url, 1.0)
        aspectVersion.value++
        resolve()
      }
      img.src = url
    })
  })
  return Promise.all(promises).then(() => undefined)
}
