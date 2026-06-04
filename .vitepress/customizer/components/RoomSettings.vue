<script setup lang="ts">
/**
 * RoomSettings.vue — Полноэкранный экран настроек комнаты.
 *
 * batch11 #9 v4:
 *   КРИТИЧНО: emit('patch', ...) → emit('save', updated) с ОДНИМ полным
 *   room-объектом. Раньше per-key emit'ы внутри одного tick race condition'или —
 *   props.room в RoomDetail.handleSettingsPatch не успевал обновляться между
 *   эмитами, и каждый следующий patch затирал предыдущий. Из-за этого данные
 *   (площадь, потолок, лимиты) терялись на пути в HouseStats и движок яркости.
 *
 * Также:
 *   + onMounted: scroll lock + cfg.showRoomSettings = true (для скрытия StickyBar)
 *   + onUnmounted: восстановление + cfg.showRoomSettings = false
 *   + draft state, dirty detection, sticky-banner — без изменений
 */

import { computed, ref, nextTick, watch, onMounted, onUnmounted } from 'vue'
import { T, Z } from '../theme/tokens'
import { SZ, type Room, type RoomType, type ZoneLimits, type WallFinish } from '../data/rooms'
import type { ZoneId } from '../data/catalog'
import { roomZones } from '../engine/zone-engine'
import { wallFinishFromHex } from '../engine/wall-color'
import { useConfigurator } from '../store/configurator'
import NavHeader from './ui/NavHeader.vue'
import LeaveConfirmModal from './ui/LeaveConfirmModal.vue'
import ColorPickerModal from './ColorPickerModal.vue'

interface Props {
  rt: RoomType
  room: Room
}
const props = defineProps<Props>()
const emit = defineEmits<{
  /** Один полный room с ВСЕМИ изменениями за раз. RoomDetail прокидывает наверх. */
  save: [updated: Room, toast?: string]
  close: []
}>()

const cfg = useConfigurator()
const zones = computed(() => roomZones(props.rt))
const tint = computed(() => props.room.cardColor ?? T.neutral)

/* ──────────── Lifecycle ──────────── */

let prevBodyOverflow = ''
let prevHtmlOverflow = ''

onMounted(() => {
  prevBodyOverflow = document.body.style.overflow
  prevHtmlOverflow = document.documentElement.style.overflow
  document.body.style.overflow = 'hidden'
  document.documentElement.style.overflow = 'hidden'
  cfg.showRoomSettings.value = true
})

onUnmounted(() => {
  document.body.style.overflow = prevBodyOverflow
  document.documentElement.style.overflow = prevHtmlOverflow
  cfg.showRoomSettings.value = false
  if (highlightTimer) clearTimeout(highlightTimer)
})

/* ──────────── Draft state ──────────── */

const draftName = ref<string>(props.room.customName ?? '')
const draftSizeIdx = ref<0 | 1 | 2 | 3>(props.room.sizeIndex)
const draftCustomArea = ref<number>(
  props.room.customArea ?? props.rt.sizes[2],
)
const draftCeilingH = ref<number>(props.room.ceilingH)
/* Единый цвет комнаты (он же цвет стен в физике через wallFinishOf).
   Изменяется через ColorPickerModal — одну и ту же модалку открываем
   и с главной (RoomCard), и отсюда. undefined = «не задан», физика
   работает на дефолтной категории medium через fallback wallFinish. */
const draftCardColor = ref<string | undefined>(props.room.cardColor)
const draftLimits = ref<ZoneLimits>({
  ...(props.room.limits ?? props.rt.limits),
})

watch(() => props.room.id, () => {
  draftName.value = props.room.customName ?? ''
  draftSizeIdx.value = props.room.sizeIndex
  draftCustomArea.value = props.room.customArea ?? props.rt.sizes[2]
  draftCeilingH.value = props.room.ceilingH
  draftCardColor.value = props.room.cardColor
  draftLimits.value = { ...(props.room.limits ?? props.rt.limits) }
})

/* ──────────── Свой цвет: открываем общую модалку ──────────── */

/** Локальный флаг показа ColorPickerModal — таким же, как в App.vue, но
 *  применяется к draft, а не к props.room (чтобы isDirty работал). */
const showColorPicker = ref(false)

/** Категория, в которую попадает выбранный HEX (для подписи под кнопкой). */
const draftCardFinish = computed<WallFinish | null>(() =>
  draftCardColor.value ? wallFinishFromHex(draftCardColor.value) : null,
)
const WALL_FINISH_LABEL: Record<WallFinish, string> = {
  light: 'светлый тон',
  medium: 'нейтральный тон',
  dark: 'тёмный тон',
}

function onPickColor(color: string | undefined) {
  draftCardColor.value = color
  showColorPicker.value = false
}

/* ──────────── Своя площадь: stepper / input ──────────── */

const areaEditMode = ref(false)
const areaInputStr = ref<string>(String(draftCustomArea.value))
const areaInputEl = ref<HTMLInputElement | null>(null)

function enterAreaEdit() {
  areaInputStr.value = String(draftCustomArea.value)
  areaEditMode.value = true
  nextTick(() => {
    areaInputEl.value?.focus()
    areaInputEl.value?.select()
  })
}

function commitAreaInput() {
  const num = parseInt(areaInputStr.value)
  const clamped = isNaN(num) ? draftCustomArea.value : Math.max(2, Math.min(200, num))
  draftCustomArea.value = clamped
  areaInputStr.value = String(clamped)
  areaEditMode.value = false
}

function bumpArea(delta: 1 | -1) {
  draftCustomArea.value = Math.max(2, Math.min(200, draftCustomArea.value + delta))
  areaEditMode.value = false
}

/* ──────────── Limits ──────────── */

function bumpLimit(zid: ZoneId, delta: 1 | -1) {
  const cur = draftLimits.value[zid] ?? 0
  draftLimits.value = { ...draftLimits.value, [zid]: Math.max(0, cur + delta) }
}

/* ──────────── Dirty detection ──────────── */

const isDirty = computed<boolean>(() => {
  if (draftName.value !== (props.room.customName ?? '')) return true
  if (draftSizeIdx.value !== props.room.sizeIndex) return true
  if (draftSizeIdx.value === 3) {
    const original = props.room.customArea ?? props.rt.sizes[2]
    if (draftCustomArea.value !== original) return true
  }
  if (draftCeilingH.value !== props.room.ceilingH) return true
  /* Цвет комнаты: dirty если поменялся. Сравниваем как строки —
     ColorPickerModal эмитит уже нормализованный HEX или undefined. */
  if ((draftCardColor.value ?? '') !== (props.room.cardColor ?? '')) return true
  const origLimits = props.room.limits ?? props.rt.limits
  if (JSON.stringify(draftLimits.value) !== JSON.stringify(origLimits)) return true
  return false
})

/* ──────────── Save: один emit с полным room ──────────── */

const saveBtnEl = ref<HTMLButtonElement | null>(null)

/* Спотлайт: при тапе по плашке затемняем экран и подсвечиваем нижнюю кнопку ~2с. */
const highlightSave = ref(false)
let highlightTimer: ReturnType<typeof setTimeout> | null = null
function scrollToSave() {
  /* behavior:'auto' — иначе smooth двигает кнопку под пальцем (movable target). */
  saveBtnEl.value?.scrollIntoView({ behavior: 'auto', block: 'center' })
  highlightSave.value = true
  if (highlightTimer) clearTimeout(highlightTimer)
  highlightTimer = setTimeout(() => { highlightSave.value = false }, 2000)
}

/* Подтверждение выхода при несохранённых изменениях (единая логика с FxEditor). */
const showLeaveConfirm = ref(false)
function requestClose() { if (isDirty.value) { showLeaveConfirm.value = true } else { emit('close') } }
function confirmLeave() { showLeaveConfirm.value = false; emit('close') }

function onSave() {
  /* Если юзер был в edit-mode площади — коммитим input перед save */
  if (areaEditMode.value) commitAreaInput()

  /* Собираем единый snapshot. Это критично:
     - per-key эмиты были race-condition prone (props.room не обновлялся
       между ними в одном tick'е → последующие patches затирали предыдущие).
     - Один emit с полным объектом гарантирует атомарность. */
  const updated: Room = {
    ...props.room,
    customName: draftName.value,
    sizeIndex: draftSizeIdx.value,
    customArea: draftSizeIdx.value === 3 ? draftCustomArea.value : props.room.customArea,
    ceilingH: draftCeilingH.value,
    /* wallFinish больше не редактируется в UI — сохраняем как было. Поле
       осталось как fallback в wallFinishOf для старых сохранений и для
       случая, когда cardColor не задан. */
    wallFinish: props.room.wallFinish,
    cardColor: draftCardColor.value,
    limits: { ...draftLimits.value },
  }

  emit('save', updated, isDirty.value ? 'Сохранено' : undefined)
  emit('close')
}

/* ──────────── Helpers ──────────── */

function hexToRgba(hex: string, a: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${a})`
}

</script>

<template>
  <div
    class="rs-root"
    :style="{
      position: 'fixed',
      inset: 0,
      background: T.bg,
      zIndex: Z.fullscreenModal,
      overflow: showLeaveConfirm ? 'hidden' : 'auto',
    }"
  >
    <NavHeader title="Параметры комнаты" back="Назад" @back="requestClose" />

    <div
      v-if="isDirty"
      class="dirty-banner"
      :style="{
        position: 'sticky',
        top: '44px',
        zIndex: 9,
        background: tint,
        color: T.bg,
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
      }"
    >
      <div :style="{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" :style="{ flexShrink: 0 }">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span :style="{ fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }">
          Есть несохранённые изменения
        </span>
      </div>
      <span :style="{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0, background: T.text, color: T.bg, padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }" @click="scrollToSave">
        Сохранить
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <polyline points="19 12 12 19 5 12" />
        </svg>
      </span>
    </div>

    <div :style="{ padding: '20px 16px', maxWidth: '480px', margin: '0 auto' }">

      <!-- Название -->
      <div
        :style="{
          background: hexToRgba(tint, 0.10),
          border: `1px solid ${hexToRgba(tint, 0.20)}`,
          borderRadius: '14px',
          padding: '18px 16px 20px',
          marginBottom: '14px',
        }"
      >
        <div :style="{ fontSize: '20px', fontWeight: 700, color: T.text, marginBottom: '14px', textAlign: 'center', letterSpacing: '0.3px' }">
          Название
        </div>
        <input
          v-model="draftName"
          type="text"
          class="name-input"
          :placeholder="props.rt.name"
          :maxlength="20"
          :style="{
            width: '100%',
            padding: '14px',
            background: T.bg,
            border: `1px solid ${hexToRgba(tint, 0.30)}`,
            borderRadius: '8px',
            color: T.text,
            fontSize: '16px',
            fontFamily: 'inherit',
            textAlign: 'center',
            outline: 'none',
            boxSizing: 'border-box',
          }"
        />
      </div>

      <!-- Размер -->
      <div
        :style="{
          background: hexToRgba(tint, 0.10),
          border: `1px solid ${hexToRgba(tint, 0.20)}`,
          borderRadius: '14px',
          padding: '18px 16px 20px',
          marginBottom: '14px',
        }"
      >
        <div :style="{ fontSize: '20px', fontWeight: 700, color: T.text, marginBottom: '14px', textAlign: 'center', letterSpacing: '0.3px' }">
          Размер
        </div>
        <div :style="{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }">
          <div
            v-for="(label, i) in SZ.slice(0, 3)"
            :key="i"
            :style="{
              aspectRatio: '1 / 1',
              borderRadius: '12px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              border: draftSizeIdx === i ? `2px solid ${tint}` : `1px solid ${T.border}`,
              background: draftSizeIdx === i ? hexToRgba(tint, 0.20) : T.bg,
              color: draftSizeIdx === i ? T.text : T.textSec,
              padding: '12px',
              transition: 'all .2s',
              boxSizing: 'border-box',
            }"
            @click="draftSizeIdx = (i as 0 | 1 | 2)"
          >
            <div :style="{ fontSize: '17px', fontWeight: 700, textAlign: 'center' }">
              {{ label }}
            </div>
            <div :style="{ fontSize: '14px', opacity: 0.75, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }">
              {{ props.rt.ranges[i] }} м²
            </div>
          </div>
        </div>

        <button
          v-if="draftSizeIdx !== 3"
          :style="{
            marginTop: '8px',
            width: '100%',
            padding: '14px 0',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '15px',
            fontFamily: 'inherit',
            border: `1px solid ${T.border}`,
            background: T.bg,
            color: T.textSec,
            fontWeight: 600,
            textAlign: 'center',
          }"
          @click="draftSizeIdx = 3"
        >
          Своя площадь
        </button>
        <div
          v-else
          :style="{
            marginTop: '8px',
            padding: '14px 12px',
            borderRadius: '12px',
            border: `2px solid ${tint}`,
            background: hexToRgba(tint, 0.18),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '14px',
          }"
        >
          <button
            :style="{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: hexToRgba(tint, 0.25),
              border: 'none',
              color: T.text,
              cursor: 'pointer',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              flexShrink: 0,
              touchAction: 'manipulation',
            }"
            aria-label="меньше"
            @click="bumpArea(-1)"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>

          <div
            v-if="areaEditMode"
            :style="{ display: 'flex', alignItems: 'baseline', gap: '6px', minWidth: '120px', justifyContent: 'center' }"
          >
            <input
              ref="areaInputEl"
              v-model="areaInputStr"
              type="number"
              inputmode="numeric"
              pattern="[0-9]*"
              class="area-input"
              :style="{
                fontSize: '32px',
                fontWeight: 700,
                color: T.text,
                background: 'transparent',
                border: 'none',
                borderBottom: `2px solid ${tint}`,
                outline: 'none',
                fontFamily: 'inherit',
                textAlign: 'center',
                width: '90px',
                padding: 0,
                lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
              }"
              @blur="commitAreaInput"
              @keydown.enter="($event.target as HTMLInputElement).blur()"
            />
            <span :style="{ fontSize: '15px', color: T.textSec, fontWeight: 500 }">м²</span>
          </div>
          <button
            v-else
            :style="{
              display: 'flex',
              alignItems: 'baseline',
              gap: '6px',
              minWidth: '120px',
              justifyContent: 'center',
              background: 'none',
              border: 'none',
              padding: '4px 8px',
              cursor: 'pointer',
              borderRadius: '6px',
              fontFamily: 'inherit',
            }"
            aria-label="ввести площадь вручную"
            @click="enterAreaEdit"
          >
            <span :style="{ fontSize: '32px', fontWeight: 700, color: T.text, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }">
              {{ draftCustomArea }}
            </span>
            <span :style="{ fontSize: '15px', color: T.textSec, fontWeight: 500 }">м²</span>
          </button>

          <button
            :style="{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: hexToRgba(tint, 0.25),
              border: 'none',
              color: T.text,
              cursor: 'pointer',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              flexShrink: 0,
              touchAction: 'manipulation',
            }"
            aria-label="больше"
            @click="bumpArea(1)"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Потолок -->
      <div
        :style="{
          background: hexToRgba(tint, 0.10),
          border: `1px solid ${hexToRgba(tint, 0.20)}`,
          borderRadius: '14px',
          padding: '18px 16px 20px',
          marginBottom: '14px',
        }"
      >
        <div :style="{ fontSize: '20px', fontWeight: 700, color: T.text, marginBottom: '14px', textAlign: 'center', letterSpacing: '0.3px' }">
          Потолок: {{ draftCeilingH.toFixed(1) }} м
        </div>
        <input
          v-model.number="draftCeilingH"
          type="range"
          min="2.2"
          max="4.5"
          step="0.1"
          class="ceiling-range"
          :style="{ width: '100%', '--tint': tint }"
        />
      </div>

      <!-- Отделка стён -->
      <div
        :style="{
          background: hexToRgba(tint, 0.10),
          border: `1px solid ${hexToRgba(tint, 0.20)}`,
          borderRadius: '14px',
          padding: '18px 16px 20px',
          marginBottom: '14px',
        }"
      >
        <div :style="{ fontSize: '20px', fontWeight: 700, color: T.text, marginBottom: '6px', textAlign: 'center', letterSpacing: '0.3px' }">
          Цвет стен
        </div>
        <div :style="{ fontSize: '13px', color: T.textSec, marginBottom: '14px', textAlign: 'center', lineHeight: 1.4 }">
          Светлые стены возвращают свет, тёмные — глушат. Цвет комнаты определит категорию.
        </div>
        <!-- Единая плашка выбора цвета. Открывает ту же ColorPickerModal,
             что и с главной (RoomCard). Категория light/medium/dark
             классифицируется автоматически по HEX. -->
        <button
          type="button"
          :style="{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 14px',
            background: T.bg,
            border: `1px solid ${T.border}`,
            borderRadius: '10px',
            cursor: 'pointer',
            fontFamily: 'inherit',
            color: T.text,
            textAlign: 'left',
          }"
          @click="showColorPicker = true"
        >
          <span
            :style="{
              width: '40px', height: '40px', borderRadius: '8px', flexShrink: 0,
              background: draftCardColor || 'transparent',
              border: draftCardColor ? `1px solid ${T.border}` : `1px dashed ${T.border}`,
            }"
            aria-hidden="true"
          />
          <span :style="{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' }">
            <span :style="{ fontSize: '15px', fontWeight: 600 }">
              {{ draftCardColor ? draftCardColor.toUpperCase() : 'Выбрать цвет' }}
            </span>
            <span :style="{ fontSize: '12px', color: T.textSec, lineHeight: 1.3 }">
              <template v-if="draftCardFinish">
                Распознан как <span :style="{ color: T.text, fontWeight: 600 }">{{ WALL_FINISH_LABEL[draftCardFinish] }}</span>
              </template>
              <template v-else>
                Без выбора стены считаются нейтральными — норма без поправок.
              </template>
            </span>
          </span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" :stroke="T.textSec" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :style="{ flexShrink: 0 }">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      <!-- Точки света -->
      <div
        :style="{
          background: hexToRgba(tint, 0.10),
          border: `1px solid ${hexToRgba(tint, 0.20)}`,
          borderRadius: '14px',
          padding: '18px 16px 20px',
          marginBottom: '14px',
        }"
      >
        <div :style="{ fontSize: '20px', fontWeight: 700, color: T.text, marginBottom: '14px', textAlign: 'center', letterSpacing: '0.3px' }">
          Точки для света
        </div>
        <div :style="{ display: 'flex', flexDirection: 'column', gap: '8px' }">
          <div
            v-for="z in zones"
            :key="z.id"
            :style="{
              background: hexToRgba(tint, 0.12),
              borderRadius: '10px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
            }"
          >
            <span :style="{ fontSize: '16px', fontWeight: 500, color: T.text }">
              {{ z.name }}
            </span>
            <div :style="{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }">
              <button
                :style="{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  background: hexToRgba(tint, 0.25),
                  border: 'none',
                  color: T.text,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  flexShrink: 0,
                  touchAction: 'manipulation',
                }"
                aria-label="меньше"
                @click="bumpLimit(z.id, -1)"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
              <span :style="{ fontSize: '18px', fontWeight: 700, color: T.text, minWidth: '28px', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }">
                {{ draftLimits[z.id] ?? 0 }}
              </span>
              <button
                :style="{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  background: hexToRgba(tint, 0.25),
                  border: 'none',
                  color: T.text,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  flexShrink: 0,
                  touchAction: 'manipulation',
                }"
                aria-label="больше"
                @click="bumpLimit(z.id, 1)"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <button
        ref="saveBtnEl"
        :class="{ 'save-glow': highlightSave }"
        :style="{
          position: 'relative',
          zIndex: highlightSave ? 49 : 'auto',
          width: '100%',
          padding: '20px 0',
          background: '#FFFFFF',
          color: T.bg,
          border: 'none',
          borderRadius: '12px',
          fontWeight: 700,
          fontSize: '17px',
          cursor: 'pointer',
          fontFamily: 'inherit',
          marginTop: '8px',
          marginBottom: '40px',
        }"
        @click="onSave"
      >
        Сохранить
      </button>
    </div>

    <!-- Спотлайт-затемнение при тапе по плашке «Сохранить» (кнопка всплывает выше) -->
    <div :style="{ position: 'fixed', inset: 0, zIndex: 48, background: 'rgba(0,0,0,0.55)', pointerEvents: 'none', opacity: highlightSave ? 1 : 0, transition: 'opacity .45s ease' }" />

    <LeaveConfirmModal v-if="showLeaveConfirm" @save="onSave" @discard="confirmLeave" @cancel="showLeaveConfirm = false" />

    <!-- Та же модалка, что и с главной (RoomCard «Цвет комнаты»).
         Применяем выбор только к draftCardColor — реальный props.room не
         трогаем, чтобы isDirty/Save работал через общий путь. -->
    <ColorPickerModal
      v-if="showColorPicker"
      :current="draftCardColor"
      :room-name="draftName || props.rt.name"
      @pick="onPickColor"
      @close="showColorPicker = false"
    />
  </div>
</template>

<style scoped>
.rs-root {
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

/* Спотлайт-подсветка нижней кнопки «Сохранить» (пульс поверх затемнения) */
.save-glow { animation: rsSavePulse 0.9s ease-in-out infinite; }
@keyframes rsSavePulse {
  0%, 100% { box-shadow: 0 0 0 3px rgba(255,255,255,0.18), 0 0 22px rgba(255,255,255,0.25); }
  50%      { box-shadow: 0 0 0 5px rgba(255,255,255,0.30), 0 0 34px rgba(255,255,255,0.45); }
}

.ceiling-range {
  appearance: none;
  -webkit-appearance: none;
  height: 6px;
  background: #5C544A;
  border-radius: 3px;
  border: none;
  outline: none;
  margin: 0;
  padding: 0;
}
.ceiling-range::-webkit-slider-runnable-track {
  height: 6px;
  background: #5C544A;
  border-radius: 3px;
  border: none;
}
.ceiling-range::-moz-range-track {
  height: 6px;
  background: #5C544A;
  border-radius: 3px;
  border: none;
}
.ceiling-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--tint, #A89878);
  border: 3px solid #FFFFFF;
  cursor: pointer;
  margin-top: -9px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.5);
}
.ceiling-range::-moz-range-thumb {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--tint, #A89878);
  border: 3px solid #FFFFFF;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.5);
}

.dirty-banner {
  animation: slideDownDirty 0.25s ease-out;
}
@keyframes slideDownDirty {
  from { transform: translateY(-100%); opacity: 0; }
  to   { transform: translateY(0);     opacity: 1; }
}

.area-input::-webkit-outer-spin-button,
.area-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.area-input {
  -moz-appearance: textfield;
}
.name-input::placeholder {
  color: #E2DACE !important;
  opacity: 1 !important;
}
</style>
