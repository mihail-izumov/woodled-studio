<script setup lang="ts">
/**
 * LeaveConfirmModal.vue — Общий диалог «Изменения не сохранятся».
 *
 * Единый для страницы светильника (FxEditor) и параметров комнаты (RoomSettings).
 * Затемняет фон почти в ноль, блокирует скролл/жесты (touch-action:none +
 * overscroll-behavior:contain). Заголовок в 2 строки, крупнее текста кнопок.
 *
 * Две развязки (пользователь уже уходит — нажал «назад»):
 *   - «Сохранить» (белая плашка, primary) → сохранить правки и уйти.
 *   - «Выйти» (с обводкой) → уйти без сохранения.
 *   - Тап по затемнённому фону → остаться (cancel).
 */
import { T } from '../../theme/tokens'

withDefaults(defineProps<{
  /** Заголовок (перенос строки через \n). */
  title?: string
  /** Подпись primary-кнопки. */
  saveLabel?: string
}>(), {
  title: 'Изменения\nне сохранятся',
  saveLabel: 'Сохранить',
})
defineEmits<{ save: []; discard: []; cancel: [] }>()
</script>

<template>
  <div
    :style="{
      position: 'fixed', inset: 0, zIndex: 70,
      background: 'rgba(0,0,0,0.82)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
      touchAction: 'none', overscrollBehavior: 'contain',
    }"
    @click.self="$emit('cancel')"
  >
    <div :style="{ width: '100%', maxWidth: '320px', background: T.card, borderRadius: '18px', padding: '28px 22px' }">
      <div :style="{ fontSize: '24px', fontWeight: 600, color: T.text, textAlign: 'center', lineHeight: 1.25, marginBottom: '24px', whiteSpace: 'pre-line' }">{{ title }}</div>
      <button
        :style="{ width: '100%', padding: '15px', background: '#FFFFFF', color: T.bg, border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '17px', fontWeight: 600, marginBottom: '10px', fontFamily: 'inherit' }"
        @click="$emit('save')"
      >{{ saveLabel }}</button>
      <button
        :style="{ width: '100%', padding: '15px', background: 'none', border: `1.5px solid ${T.textSec}`, borderRadius: '12px', color: T.text, cursor: 'pointer', fontSize: '17px', fontWeight: 600, fontFamily: 'inherit' }"
        @click="$emit('discard')"
      >Выйти</button>
    </div>
  </div>
</template>
