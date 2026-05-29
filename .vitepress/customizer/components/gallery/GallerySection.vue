<script setup>
/**
 * GallerySection.vue — production wrapper for the gallery system.
 *
 * Replaces WoodledGallery.vue (the dev sandbox). Reuses the grid layout,
 * sequence builder, and pagination logic but drops:
 *   - context tabs (context comes via prop)
 *   - count / target sliders (count is determined by the filter; target = 4)
 *   - debug panel / plan stats
 *   - WOODLED v8 header and testing notes
 *
 * Expected items shape (see engine/gallery-engine.ts → toDisplayItem):
 *   { n, natural, aspect, zone, wood, model, src, rooms, label }
 *
 * Inline SVG is used for ChevronDown / ChevronUp — the project already
 * has its own custom <Icon> component (ui/Icons.vue) instead of lucide,
 * so we don't pull in a new dependency for two arrows.
 */
import { ref, computed, watch } from 'vue'

import {
  T,
  cellKind,
  displayAspectFor,
  planAll,
} from './gallery-constants.js'

import PhotoCard     from './PhotoCard.vue'
import TapLeafWidget from './TapLeafWidget.vue'
import Lightbox      from './Lightbox.vue'

// ---------------------------------------------------------------------------
// PROPS
// ---------------------------------------------------------------------------
const props = defineProps({
  items: { type: Array, required: true },            // DisplayItem[] from gallery-engine
  title: { type: String, required: true },
  context: {                                          // 'home' | 'room' | 'fx'
    type: String,
    default: 'home',
    validator: (v) => ['home', 'room', 'fx'].includes(v),
  },
  /** Optional accent for TapLeafWidget. Default: T.clearing. RoomDetail passes
   *  the room tint (cardColor || T.neutral) to keep the widget on-palette. */
  accent: { type: String, default: null },
})

// Прокидываем gift-click от TapLeafWidget наружу — страница сама решает что делать
// (открыть «Мой Лес», модалку, и т.д.). Используется in-code routing проекта.
const emit = defineEmits(['gift-click'])

// ---------------------------------------------------------------------------
// STATE
// ---------------------------------------------------------------------------
// Per integration brief: target is fixed at 4 in production (no slider).
const target = 4

const revealedPages = ref(1)
const lightboxIdx   = ref(null)

// Reset pagination ТОЛЬКО когда длина набора реально меняется (другой фильтр /
// другая комната / другая модель). Не сбрасывать при aspect-load — иначе при
// каждом догруженном фото галерея схлопывалась бы обратно в одну страницу.
watch(() => props.items.length, () => { revealedPages.value = 1 })

// ---------------------------------------------------------------------------
// PLAN (grid pagination)
// ---------------------------------------------------------------------------
const plan = computed(() => planAll(props.items, revealedPages.value, target))

const canExpand     = computed(() => plan.value.hasMore)
const canCollapse   = computed(() => !plan.value.hasMore && revealedPages.value > 1)
/* Бейдж показывает ВСЕГО скрытых (общее минус показанные). С каждым кликом
   уменьшается — пользователь видит сколько ещё осталось в галерее. */
const remainingCount = computed(() =>
  Math.max(0, props.items.length - plan.value.totalShown)
)

const widgetAccent = computed(() => props.accent || T.clearing)

// ---------------------------------------------------------------------------
// SEQUENCE BUILDER (mirrors WoodledGallery.sequenceFor)
//
// Дополнительно: считаем нечётность итоговой раскладки и добавляем виджет(ы)
// в конец чтобы grid (2 колонки, dense flow) не оставлял пустых ячеек, когда
// wide-фото попадает в нечётную позицию.
// ---------------------------------------------------------------------------
function sequenceFor(page) {
  const cells = page.cells
  if (cells.length === 0 && page.hasWidget) {
    return { layout: 'widget-only' }
  }
  if (cells.length === 1 && page.hasWidget) {
    return { layout: 'pair', items: [{ kind: 'photo', cell: cells[0] }] }
  }
  const insertAt = page.hasWidget ? (cells.length === 2 ? 1 : 2) : -1
  const seq = insertAt === -1
    ? cells.map(c => ({ kind: 'photo', cell: c }))
    : [
        ...cells.slice(0, insertAt).map(c => ({ kind: 'photo', cell: c })),
        { kind: 'tapleaf' },
        ...cells.slice(insertAt).map(c => ({ kind: 'photo', cell: c })),
      ]

  // Считаем units в раскладке: square = 1, wide = 2, widget = 1.
  // Если нечётно — grid с 2-колонками оставит дыру. Добавляем widget(ы)-затычки.
  const units = seq.reduce((sum, it) => {
    if (it.kind === 'tapleaf') return sum + 1
    return sum + (cellKind(it.cell.natural) === 'wide' ? 2 : 1)
  }, 0)
  if (units % 2 !== 0) {
    seq.push({ kind: 'tapleaf' })
  }

  return { layout: 'grid', items: seq }
}

// ---------------------------------------------------------------------------
// LIGHTBOX
// ---------------------------------------------------------------------------
function openLightbox(item) {
  const idx = props.items.indexOf(item)
  lightboxIdx.value = idx >= 0 ? idx : 0
}
function closeLightbox() { lightboxIdx.value = null }
</script>

<template>
  <!-- Section -->
  <section
    v-if="items.length > 0"
    :style="{
      margin: '32px 0',
      color: T.text,
      fontFamily: 'inherit',
    }"
  >
    <!-- Title -->
    <h3 :style="{
      margin: '0 0 16px',
      fontSize: '17px', fontWeight: 600,
      color: T.text, textAlign: 'center',
      lineHeight: 1.3,
    }">{{ title }}</h3>

    <!-- Pages -->
    <div :style="{ display: 'flex', flexDirection: 'column', gap: '8px' }">
      <template v-for="(page, pageIdx) in plan.pages" :key="pageIdx">
        <!-- (a) widget-only page -->
        <div
          v-if="sequenceFor(page).layout === 'widget-only'"
          :style="{ display: 'flex', justifyContent: 'center' }"
        >
          <div :style="{ width: 'calc(50% - 4px)' }">
            <TapLeafWidget :accent="widgetAccent" @gift-click="emit('gift-click')" />
          </div>
        </div>

        <!-- (b) one photo + widget pair -->
        <div
          v-else-if="sequenceFor(page).layout === 'pair'"
          :style="{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }"
        >
          <PhotoCard
            :item="sequenceFor(page).items[0].cell"
            :display-aspect="1.0"
            :accent="widgetAccent"
            :on-tap="() => openLightbox(sequenceFor(page).items[0].cell)"
          />
          <TapLeafWidget :accent="widgetAccent" @gift-click="emit('gift-click')" />
        </div>

        <!-- (c) full grid (squares + wides + maybe inline widget) -->
        <div
          v-else
          :style="{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px',
            gridAutoFlow: 'dense',
          }"
        >
          <template v-for="(it, i) in sequenceFor(page).items" :key="i">
            <TapLeafWidget
              v-if="it.kind === 'tapleaf'"
              :accent="widgetAccent"
              @gift-click="emit('gift-click')"
            />
            <div
              v-else
              :style="{
                gridColumn: cellKind(it.cell.natural) === 'wide' ? 'span 2' : 'auto',
                minWidth: 0,
              }"
            >
              <PhotoCard
                :item="it.cell"
                :display-aspect="displayAspectFor(it.cell)"
                :accent="widgetAccent"
                :on-tap="() => openLightbox(it.cell)"
              />
            </div>
          </template>
        </div>
      </template>
    </div>

    <!-- Expand -->
    <button
      v-if="canExpand"
      @click="revealedPages++"
      :style="{
        width: '100%', padding: '12px', marginTop: '8px',
        background: T.cardAlt, color: T.text,
        border: `1px solid ${T.border}`, borderRadius: '12px',
        fontSize: '13px', fontWeight: 500, cursor: 'pointer',
        fontFamily: 'inherit',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
      }"
    >
      <span>Показать ещё</span>
      <span :style="{
        display: 'inline-flex',
        alignItems: 'center', justifyContent: 'center',
        minWidth: '22px', height: '22px', padding: '0 6px', borderRadius: '11px',
        background: '#FFFFFF', color: T.bg,
        fontSize: '11px', fontWeight: 700,
        fontFamily: 'ui-monospace, monospace',
      }">{{ remainingCount }}</span>
      <!-- ChevronDown (inline SVG, lucide-equivalent) -->
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round">
        <path d="m6 9 6 6 6-6"/>
      </svg>
    </button>

    <!-- Collapse -->
    <button
      v-if="canCollapse"
      @click="revealedPages = 1"
      :style="{
        width: '100%', padding: '12px', marginTop: '8px',
        background: 'transparent', color: T.textSec,
        border: `1px solid ${T.border}`, borderRadius: '12px',
        fontSize: '13px', fontWeight: 500, cursor: 'pointer',
        fontFamily: 'inherit',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
      }"
    >
      <span>Свернуть</span>
      <!-- ChevronUp (inline SVG, lucide-equivalent) -->
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round">
        <path d="m18 15-6-6-6 6"/>
      </svg>
    </button>

    <!-- Lightbox -->
    <Lightbox
      v-if="lightboxIdx !== null"
      :photos="items"
      :start-idx="lightboxIdx"
      @close="closeLightbox"
    />
  </section>
</template>
