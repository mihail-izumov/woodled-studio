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
  /** Сколько интерьеров есть в старой GallerySection ниже — для CTA-слайда.
   *  Передаётся как `galleryDisplayItems.length` из FxEditor. */
  interiorCount?: number
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

function nudge(delta: number) {
  const n = totalSlides.value
  if (n < 2) return
  idx.value = (idx.value + delta + n) % n
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
      }"
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

      <!-- CTA-слайд (последний экран, если фото мало) -->
      <div
        v-else
        :style="{
          width: '100%', height: '100%', background: T.card,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: '14px', padding: '24px', textAlign: 'center',
        }"
      >
        <div :style="{ fontSize: '18px', fontWeight: 700, color: T.text, lineHeight: 1.3 }">
          {{ ctaTitle }}
        </div>
        <div :style="{ fontSize: '13px', color: T.textSec, lineHeight: 1.5, maxWidth: '260px' }">
          {{ interiorCount }} {{ interiorCount === 1 ? 'фото' : (interiorCount < 5 ? 'фото' : 'фото') }} в реальных комнатах
        </div>
        <button
          @click="jumpToInteriors"
          :style="{
            padding: '12px 22px', borderRadius: '24px',
            background: accent, color: T.bg, border: 'none',
            fontSize: '14px', fontWeight: 700, cursor: 'pointer',
          }"
        >
          Посмотреть ↓
        </button>
      </div>

      <!-- Прев / след стрелки (если слайдов >1) -->
      <button
        v-if="totalSlides > 1"
        @click.stop="nudge(-1)"
        :style="{
          position: 'absolute', top: '50%', left: '10px', transform: 'translateY(-50%)',
          width: '36px', height: '36px', borderRadius: '50%',
          background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white',
          fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }"
        aria-label="Предыдущее"
      >‹</button>
      <button
        v-if="totalSlides > 1"
        @click.stop="nudge(1)"
        :style="{
          position: 'absolute', top: '50%', right: '10px', transform: 'translateY(-50%)',
          width: '36px', height: '36px', borderRadius: '50%',
          background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white',
          fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }"
        aria-label="Следующее"
      >›</button>

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

    <!-- Disclaimer -->
    <div
      :style="{
        padding: '10px 14px', fontSize: '11px', color: T.textDim,
        textAlign: 'center', lineHeight: '1.5',
      }"
    >
      {{ HERO_DISCLAIMER }}
    </div>
  </section>

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
