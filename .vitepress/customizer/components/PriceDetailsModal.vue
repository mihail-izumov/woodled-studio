<script setup lang="ts">
/**
 * PriceDetailsModal.vue — Модалка «Детали сборки» на странице светильника.
 *
 * Открывается тапом по плашке цены в sticky-низе FxEditor.
 * Tesla-паттерн: большая итоговая цена сверху → breakdown → «Мой выбор».
 *
 * Поведение:
 *   - Teleport to body, z 99999 (выше sticky-низа и галереи).
 *   - Бэкдроп ~75% чёрного; тап по нему → close.
 *   - Sheet снизу, T.bg, верхние углы 18px, maxHeight 92vh, скроллим внутри.
 *   - При открытии — lock body scroll; на размонтировании — вернуть.
 *   - Закрытие по close-X и по фону.
 *
 * Hooks: cfg.showPriceDetails не используем (модалка локальна для
 * FxEditor — он сам управляет v-if). App.vue читает `showPriceDetails`
 * чтобы прятать SoundButton (см. anyModalOpen).
 */

import { onMounted, onUnmounted } from 'vue'
import { T } from '../theme/tokens'

interface PriceRow { label: string; amount: number }

const props = defineProps<{
  price: number
  breakdown: PriceRow[]
  lampsChip: string
  lmChip: string
  btempChip: string
  choices: [string, string][]
  tint?: string
  title?: string
}>()

defineEmits<{ close: [] }>()

const fmt = (n: number) => n.toLocaleString('ru-RU')

/* Lock body scroll пока модалка открыта (паттерн RoomSettings/SmartHelpModal). */
let prevBodyOverflow = ''
let prevHtmlOverflow = ''
onMounted(() => {
  if (typeof document === 'undefined') return
  prevBodyOverflow = document.body.style.overflow
  prevHtmlOverflow = document.documentElement.style.overflow
  document.body.style.overflow = 'hidden'
  document.documentElement.style.overflow = 'hidden'
})
onUnmounted(() => {
  if (typeof document === 'undefined') return
  document.body.style.overflow = prevBodyOverflow
  document.documentElement.style.overflow = prevHtmlOverflow
})
</script>

<template>
  <Teleport to="body">
    <div
      :style="{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(0,0,0,.78)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        touchAction: 'none',
        overscrollBehavior: 'contain',
      }"
      @click.self="$emit('close')"
    >
      <div
        :style="{
          width: '100%',
          maxWidth: '480px',
          maxHeight: '92vh',
          overflow: 'auto',
          background: T.bg,
          borderTopLeftRadius: '18px',
          borderTopRightRadius: '18px',
          borderTop: `1px solid ${T.border}`,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }"
      >
        <!-- Хедер: drag-handle + title + close X -->
        <div :style="{ position: 'sticky', top: 0, background: T.bg, padding: '10px 20px 14px', zIndex: 2 }">
          <div :style="{ width: '36px', height: '4px', borderRadius: '2px', background: T.border, margin: '0 auto 14px' }" />
          <div :style="{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }">
            <div :style="{ fontSize: '20px', fontWeight: 700, color: T.text, letterSpacing: '-.01em' }">{{ props.title || 'Детали сборки' }}</div>
            <button
              :aria-label="'Закрыть'"
              :style="{
                width: '32px', height: '32px', borderRadius: '50%',
                background: T.card, border: `1px solid ${T.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: T.text, flexShrink: 0,
              }"
              @click="$emit('close')"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        <div :style="{ padding: '4px 20px 28px' }">
          <!-- Большая цена-якорь -->
          <div :style="{ marginTop: '8px', marginBottom: '20px' }">
            <div :style="{ fontSize: '11px', fontWeight: 700, color: T.textSec, textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '6px' }">Итого</div>
            <div :style="{ display: 'flex', alignItems: 'baseline', gap: '6px' }">
              <span :style="{ fontSize: '36px', fontWeight: 700, color: T.text, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }">{{ fmt(props.price) }}</span>
              <span :style="{ fontSize: '17px', fontWeight: 500, color: T.textSec }">₽</span>
            </div>
          </div>

          <!-- Что внутри: разбиение базы + дельты опций -->
          <div :style="{ marginBottom: '20px' }">
            <div :style="{ fontSize: '11px', fontWeight: 700, color: T.textSec, textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '10px' }">Что внутри</div>
            <div :style="{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '12px', overflow: 'hidden' }">
              <div
                v-for="(row, i) in props.breakdown"
                :key="i"
                :style="{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  padding: '12px 14px',
                  borderBottom: i < props.breakdown.length - 1 ? `1px solid ${T.border}` : 'none',
                }"
              >
                <span :style="{ fontSize: '13px', color: T.text }">{{ row.label }}</span>
                <span :style="{ fontSize: '13px', fontWeight: 600, color: i === 0 ? T.text : T.yellow, fontVariantNumeric: 'tabular-nums', flexShrink: 0, marginLeft: '12px' }">
                  {{ i === 0 ? '' : '+' }}{{ fmt(row.amount) }} ₽
                </span>
              </div>
            </div>
          </div>

          <!-- Мой выбор -->
          <div v-if="props.choices.length > 0 || props.lampsChip">
            <div :style="{ fontSize: '11px', fontWeight: 700, color: T.textSec, textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '10px' }">Мой выбор</div>

            <!-- Чипы света -->
            <div :style="{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }">
              <span :style="{ padding: '6px 11px', borderRadius: '8px', background: (props.tint || T.neutral) + '22', fontSize: '12px', fontWeight: 600, color: T.text }">{{ props.lampsChip }}</span>
              <span :style="{ padding: '6px 11px', borderRadius: '8px', background: T.neutral + '18', fontSize: '12px', fontWeight: 600, color: T.text, fontVariantNumeric: 'tabular-nums' }">{{ props.lmChip }}</span>
              <span :style="{ padding: '6px 11px', borderRadius: '8px', background: T.neutral + '18', fontSize: '12px', fontWeight: 600, color: T.text, fontVariantNumeric: 'tabular-nums' }">{{ props.btempChip }}</span>
            </div>

            <!-- Сетка опций -->
            <div :style="{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '12px', overflow: 'hidden' }">
              <div
                v-for="([k, v], i) in props.choices"
                :key="k"
                :style="{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  gap: '12px',
                  padding: '11px 14px',
                  borderBottom: i < props.choices.length - 1 ? `1px solid ${T.border}` : 'none',
                }"
              >
                <span :style="{ fontSize: '13px', color: T.textSec }">{{ k }}</span>
                <span :style="{ fontSize: '13px', fontWeight: 600, color: T.text, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }">{{ v }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
