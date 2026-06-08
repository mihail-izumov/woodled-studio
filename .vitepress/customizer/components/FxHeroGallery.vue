<script setup lang="ts">
/**
 * FxHeroGallery.vue — реактивный «герой»-блок на странице светильника (FxEditor).
 *
 * Источник правды для алгоритма — engine/fx-gallery.ts (порт из tagger.html).
 * Этот компонент НЕ принимает решения «что показывать» — только рендерит.
 *
 * Поток:
 *   FxEditor.build (ref) → computed config → pickFxPhotos('hero') → активный слой → рендер.
 *
 * При пустом Hero рисуется CTA-плашка с якорной кнопкой #fx-interiors —
 * предполагается, что блок интерьеров (FxInteriorGallery, отдельный) лежит ниже.
 */
import { computed, ref, watch } from 'vue'
import type { ModelId } from '../data/catalog'
import type { Wood } from '../data/materials'
import { fxTitle } from '../data/catalog'
import {
  pickFxPhotos,
  fxToConfig,
  activeHeroLayer,
  activeHeroPhotos,
  MATCH_BADGE,
  HERO_DISCLAIMER,
  type FxPhotoMatch,
} from '../engine/fx-gallery'
import { T } from '../theme/tokens'

interface BuildSnapshot {
  m: ModelId
  wood: Wood
  mount?: string
  diffuser?: boolean
  baseColor?: string
}

const props = defineProps<{
  /** Реактивный снапшот выбора юзера. Передаётся как computed из FxEditor (build.value). */
  build: BuildSnapshot
  /** Цвет акцента — обычно цвет комнаты (для CTA-кнопки). */
  tint?: string
  /** Сколько интерьеров есть в нижней GallerySection — для CTA-слайда. */
  interiorCount?: number
  /** URLs первых 6 интерьеров — превью-сетка в CTA-слайде (3×2 квадратов без промежутков). */
  interiorThumbs?: readonly string[]
}>()

const config = computed(() => fxToConfig({
  m: props.build.m,
  wood: props.build.wood,
  opts: {
    mount: props.build.mount,
    diffuser: props.build.diffuser,
    baseColor: props.build.baseColor,
  },
}))

const result = computed(() => pickFxPhotos(config.value, 'hero'))
const layer = computed(() => activeHeroLayer(result.value))
const photos = computed(() => activeHeroPhotos(result.value))
const hasPhotos = computed(() => photos.value.length > 0)
const badge = computed(() => layer.value ? MATCH_BADGE[layer.value] : '')

/* ─── CTA-слайд в конце слайдера ───
 * Когда фото мало (≤2) И ниже есть интерьерная галерея — после фото
 * добавляем «доп-экран» с кнопкой ведущей к блоку #fx-interiors.
 *
 * interiorCount передаётся пропсом из FxEditor (= galleryDisplayItems.length)
 * — это РЕАЛЬНОЕ число фото в старой GallerySection под фикстурой. Не считаем
 * сами — pickFxPhotos.interiors сейчас не используется (наш _seed.js пайплайн
 * не активирован для нижнего блока, см. Phase 1 решение в фидбэке от продакта).
 *
 * Порог 2 — компромисс: при 1 фото юзер сразу видит «мало», при 3+
 * слайдер выглядит достаточно богатым чтобы не пушить вниз.
 */
const interiorCount = computed(() => props.interiorCount ?? 0)
const hasCtaSlide = computed(() =>
  hasPhotos.value && photos.value.length <= 2 && interiorCount.value > 0
)

/* Адаптивная mini-сетка превью под количество интерьеров.
 *   ≤3 → одна строка N столбцов (без пустых cells)
 *   4  → 2×2
 *   5  → 3 cols, второй ряд из 2 (последний угол пустой, transparent → не виден)
 *   6  → 3×2 */
const ctaThumbs = computed(() => (props.interiorThumbs || []).slice(0, 6))
const ctaCols = computed(() => {
  const n = ctaThumbs.value.length
  if (n <= 3) return n
  if (n === 4) return 2
  return 3
})
const ctaRows = computed(() => (ctaThumbs.value.length <= 3 ? 1 : 2))
const ctaCellsTotal = computed(() => ctaCols.value * ctaRows.value)
const totalSlides = computed(() =>
  photos.value.length + (hasCtaSlide.value ? 1 : 0)
)
const onCtaSlide = computed(() => hasCtaSlide.value && idx.value === photos.value.length)
const ctaTitle = computed(() => {
  const t = fxTitle(props.build.m)
  return t.charAt(0).toUpperCase() + t.slice(1) + ' в интерьере'
})

const idx = ref(0)
// Сброс индекса при смене подборки (юзер сменил дерево → фото поменялись).
watch(photos, () => { idx.value = 0 })

/* Клампим вместо wrap — на крайних слайдах стрелки скрыты, и попытка
   уехать в «никуда» (например, тапом по уже скрытой стрелке через keyboard
   или delayed touch) безопасно игнорируется. */
function nudge(delta: number) {
  const n = totalSlides.value
  if (n < 2) return
  const next = idx.value + delta
  if (next < 0 || next >= n) return
  idx.value = next
}
const canPrev = computed(() => totalSlides.value > 1 && idx.value > 0)
const canNext = computed(() => totalSlides.value > 1 && idx.value < totalSlides.value - 1)

/* Swipe-навигация по фото. Учитываем только горизонтальные жесты:
   если по Y движение больше чем по X — это скролл страницы, не свайп. */
let touchStartX = 0
let touchStartY = 0
function onTouchStart(e: TouchEvent) {
  const t = e.changedTouches[0]
  touchStartX = t.clientX
  touchStartY = t.clientY
}
function onTouchEnd(e: TouchEvent) {
  const t = e.changedTouches[0]
  const dx = t.clientX - touchStartX
  const dy = t.clientY - touchStartY
  if (Math.abs(dx) < 40 || Math.abs(dy) > Math.abs(dx)) return
  nudge(dx < 0 ? 1 : -1)
}

// Lightbox state — простой fullscreen overlay, без переиспользования Lightbox.vue
// (тот завязан на gallery-constants структуру). Минимальный, потом унифицируем.
const lbOpen = ref(false)
const lbIdx = ref(0)
function openLightbox(i: number) { lbIdx.value = i; lbOpen.value = true }
function closeLightbox() { lbOpen.value = false }
function lbNudge(delta: number) {
  const n = photos.value.length
  if (n < 1) return
  lbIdx.value = (lbIdx.value + delta + n) % n
}

// Анкер на блок интерьеров — должен быть `id="fx-interiors"` в FxInteriorGallery.
function jumpToInteriors() {
  const el = document.getElementById('fx-interiors')
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const accent = computed(() => props.tint || T.neutral)
</script>

<template>
  <section
    :style="{
      width: '100%',
      background: T.cardAlt,
      borderRadius: '14px',
      overflow: 'hidden',
      border: `1px solid ${T.border}`,
    }"
  >
    <!-- Hero photo card -->
    <div
      v-if="hasPhotos"
      :style="{
        position: 'relative',
        width: '100%',
        aspectRatio: '1',
        background: '#000',
        touchAction: 'pan-y',
      }"
      @touchstart.passive="onTouchStart"
      @touchend.passive="onTouchEnd"
    >
      <!-- Фото-слайд (обычные кадры) -->
      <img
        v-if="!onCtaSlide"
        :src="photos[idx].photo.src"
        loading="lazy"
        alt=""
        :style="{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', cursor: 'zoom-in' }"
        @click="openLightbox(idx)"
      />

      <!-- CTA-слайд: заголовок · компактная сетка миниатюр · кнопка. Весь блок кликабелен.
           Сетка адаптивная под количество фото (≤3 в строку, 4=2×2, 5-6=3×N). -->
      <div
        v-else
        @click="jumpToInteriors"
        :style="{
          width: '100%', height: '100%', background: T.card,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: '18px', padding: '24px',
          cursor: 'pointer',
        }"
      >
        <!-- Заголовок -->
        <div :style="{ fontSize: '17px', fontWeight: 700, color: T.text, textAlign: 'center', lineHeight: 1.3 }">
          {{ ctaTitle }}
        </div>

        <!-- Компактная сетка миниатюр без промежутков. Cells ~52px.
             Пустые cells (когда фото < ctaCols*ctaRows, типично n=5 в 3×2) закрашены
             цветом комнаты — пустота не «дыра», а часть композиции. -->
        <div :style="{
          display: 'grid',
          gridTemplateColumns: `repeat(${ctaCols}, 52px)`,
          gridAutoRows: '52px',
          gap: 0,
          borderRadius: '6px',
          overflow: 'hidden',
        }">
          <div
            v-for="i in ctaCellsTotal"
            :key="i"
            :style="{
              width: '100%', height: '100%',
              background: ctaThumbs[i-1] ? '#000' : accent,
            }"
          >
            <img
              v-if="ctaThumbs[i-1]"
              :src="ctaThumbs[i-1]"
              loading="lazy"
              alt=""
              :style="{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }"
            />
          </div>
        </div>

        <!-- Кнопка-индикатор -->
        <span :style="{
          padding: '10px 22px', borderRadius: '24px',
          background: accent, color: T.bg,
          fontSize: '14px', fontWeight: 700,
          display: 'inline-flex', alignItems: 'center', gap: '6px',
        }">
          Посмотреть <span>↓</span>
        </span>
      </div>

      <!-- Прев / след стрелки: вытянутые прямоугольники во весь ~2/3 высоты Hero.
           На мобайле удобнее тапать чем по 36×36 кругам. На крайних слайдах
           соответствующая стрелка скрыта (no-wrap навигация). -->
      <button
        v-if="canPrev"
        @click.stop="nudge(-1)"
        :style="{
          position: 'absolute', top: '16.7%', left: 0, height: '66.6%',
          width: '44px', borderRadius: '0 10px 10px 0', border: 'none',
          background: 'rgba(0,0,0,0.14)', color: 'white', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 0,
        }"
        aria-label="Предыдущее"
      >
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" :style="{filter:'drop-shadow(0 1px 4px rgba(0,0,0,.5))'}"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <button
        v-if="canNext"
        @click.stop="nudge(1)"
        :style="{
          position: 'absolute', top: '16.7%', right: 0, height: '66.6%',
          width: '44px', borderRadius: '10px 0 0 10px', border: 'none',
          background: 'rgba(0,0,0,0.14)', color: 'white', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 0,
        }"
        aria-label="Следующее"
      >
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" :style="{filter:'drop-shadow(0 1px 4px rgba(0,0,0,.5))'}"><polyline points="9 18 15 12 9 6"/></svg>
      </button>

      <!-- Бейдж слоя (partial / woodSubstitute) — только на фото-слайдах -->
      <div
        v-if="badge && !onCtaSlide"
        :style="{
          position: 'absolute', bottom: '12px', left: '12px', right: '12px',
          background: 'rgba(0,0,0,0.72)', color: 'white',
          fontSize: '12px', fontWeight: 500, padding: '7px 12px', borderRadius: '8px',
          textAlign: 'center', letterSpacing: '.2px', pointerEvents: 'none',
        }"
      >{{ badge }}</div>

      <!-- Пагинация-точки -->
      <div
        v-if="totalSlides > 1"
        :style="{
          position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: '6px',
        }"
      >
        <span
          v-for="i in totalSlides"
          :key="i"
          :style="{
            width: (i-1) === idx ? '20px' : '6px', height: '6px',
            borderRadius: '3px',
            background: (i-1) === idx ? 'white' : 'rgba(255,255,255,0.5)',
            transition: 'width .2s',
          }"
        />
      </div>
    </div>

    <!-- CTA-плашка при пустом Hero -->
    <div
      v-else
      :style="{
        width: '100%', aspectRatio: '1',
        background: T.card, display: 'flex',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: '14px', padding: '24px', textAlign: 'center',
      }"
    >
      <div :style="{ fontSize: '14px', color: T.textSec, lineHeight: '1.5', maxWidth: '280px' }">
        Этот светильник пока не сняли студийно. Посмотрите его в реальных комнатах.
      </div>
      <button
        @click="jumpToInteriors"
        :style="{
          padding: '12px 22px', borderRadius: '24px',
          background: accent, color: T.bg, border: 'none',
          fontSize: '14px', fontWeight: 700, cursor: 'pointer',
        }"
      >
        Посмотреть в интерьере ↓
      </button>
    </div>

  </section>

  <!-- Disclaimer как отдельная плашка под Hero: фон чуть светлее T.bg,
       текст крупнее и читается двумя строками на мобильной ширине. -->
  <aside
    :style="{
      marginTop: '10px',
      background: T.cardAlt,
      border: `1px solid ${T.border}`,
      borderRadius: '12px',
      padding: '12px 14px',
      display: 'flex', alignItems: 'flex-start', gap: '10px',
    }"
  >
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :style="{color: T.textSec, flexShrink: 0, marginTop: '1px'}"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
    <div :style="{fontSize: '13px', color: T.textSec, lineHeight: 1.5}">
      {{ HERO_DISCLAIMER }}
    </div>
  </aside>

  <!-- Минимальный fullscreen lightbox (свайпы — позже, сейчас базовая навигация) -->
  <div
    v-if="lbOpen"
    :style="{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }"
    @click="closeLightbox"
  >
    <img
      :src="photos[lbIdx].photo.src"
      loading="lazy"
      decoding="async"
      :style="{ maxWidth: '92vw', maxHeight: '92vh', objectFit: 'contain' }"
      @click.stop
    />
    <button
      @click.stop="lbNudge(-1)"
      :style="{
        position: 'absolute', top: '50%', left: '20px', transform: 'translateY(-50%)',
        width: '48px', height: '48px', borderRadius: '50%',
        background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white',
        fontSize: '24px', cursor: 'pointer',
      }"
    >‹</button>
    <button
      @click.stop="lbNudge(1)"
      :style="{
        position: 'absolute', top: '50%', right: '20px', transform: 'translateY(-50%)',
        width: '48px', height: '48px', borderRadius: '50%',
        background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white',
        fontSize: '24px', cursor: 'pointer',
      }"
    >›</button>
    <button
      @click.stop="closeLightbox"
      :style="{
        position: 'absolute', top: '20px', right: '20px',
        width: '44px', height: '44px', borderRadius: '50%',
        background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white',
        fontSize: '20px', cursor: 'pointer',
      }"
    >✕</button>
  </div>
</template>
