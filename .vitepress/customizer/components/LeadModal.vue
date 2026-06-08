<script setup lang="ts">
/**
 * LeadModal.vue — Единая форма заявки/консультации менеджеру.
 *
 * Три источника:
 *   • source='fixture' — клик «Купить» на странице светильника
 *                        (заголовок «Заявка на светильник»).
 *   • source='forest'  — клик «Отправить план леса» в BuyModal
 *                        (заголовок «Новый Лес WOODLED»).
 *   • source='consult' — третья кнопка «Отправить менеджеру» в ShareModal
 *                        (заголовок «WOODLED Студия — Консультация»).
 *
 * Поток:
 *   1. step='form'    — имя + телефон + TG (опц). Автозаполнение из localStorage.
 *   2. submit         — отправляем GAS-эндпоинт (engine/lead-api.ts), параллельно
 *                       шорт-URL через shortener; при успехе → step='done'.
 *   3. step='done'    — подтверждение + кнопка «Открыть чат с менеджером»,
 *                       которая открывает t.me/woodled_studio_bot?start=<leadId>.
 *                       Бот пришлёт юзеру первое сообщение со ссылкой.
 *
 * Lock scroll + флаг cfg.showLead — App.vue прячет StickyBar и SoundButton.
 */

import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import type { Room } from '../data/rooms'
import { T, Z } from '../theme/tokens'
import { useConfigurator } from '../store/configurator'
import NavHeader from './ui/NavHeader.vue'
import {
  buildFixtureLead, buildForestLead, buildConsultLead, leadCounts,
} from '../engine/lead-text'
import { buildFixtureShareUrl, buildShareUrl } from '../engine/share'
import { shortenLongUrl } from '../engine/shortener'
import {
  newLeadId, botStartUrl, submitLead,
  loadPersistedContact, savePersistedContact,
  type LeadSource,
} from '../engine/lead-api'

interface Props {
  source: LeadSource
  /** fixture-режим: комната, в которой стоит светильник. */
  room?: Room
  /** fixture-режим: индекс светильника в room.fixtures. */
  fxIdx?: number
  /** forest/consult-режим: весь массив комнат. */
  rooms?: Room[]
  /** Имя дома (для buildShareUrl). */
  houseName?: string
  /** backLabel в NavHeader (откуда пришли). */
  backLabel?: string
}
const props = withDefaults(defineProps<Props>(), { backLabel: 'Назад' })
const emit = defineEmits<{ close: []; feedback: [msg: string] }>()

const cfg = useConfigurator()

const TITLE: Record<LeadSource, string> = {
  fixture: 'Заявка на светильник',
  forest:  'Новый Лес WOODLED',
  consult: 'WOODLED Студия — Консультация',
}
const title = TITLE[props.source]

/* leadId генерируем один раз на mount — повторный сабмит с того же ID
   попадёт в дедуп на стороне GAS (не задвоит уведомление менеджеру). */
const leadId = newLeadId()

/* ──────────── Форма ──────────── */

const persisted = loadPersistedContact()
const form = ref({
  name: persisted.name,
  phone: persisted.phone,
  tg: persisted.tgUsername,
})

const step = ref<'form' | 'sending' | 'done'>('form')

/* ──────────── Контекст (summary + ссылка) ──────────── */

const summary = computed<string>(() => {
  if (props.source === 'fixture' && props.room && props.fxIdx != null) {
    return buildFixtureLead(props.room, props.fxIdx)
  }
  const rs = props.rooms ?? []
  if (props.source === 'forest') return buildForestLead(rs)
  return buildConsultLead(rs)
})

const longShareUrl = computed<string>(() => {
  if (props.source === 'fixture' && props.room && props.fxIdx != null) {
    const fx = props.room.fixtures[props.fxIdx]
    return fx ? buildFixtureShareUrl(fx) : ''
  }
  return buildShareUrl(props.houseName ?? '', props.rooms ?? [])
})

const counts = computed<{ roomCount: number; fixtureCount: number }>(() => {
  if (props.source === 'fixture') return { roomCount: 1, fixtureCount: 1 }
  return leadCounts(props.rooms ?? [])
})

/* Prefetch короткой ссылки — пока юзер заполняет форму, шортнер прогревается.
   Если до сабмита не успеет — submit подождёт ещё немного, потом fallback. */
const shortShareUrl = ref<string | null>(null)
shortenLongUrl(longShareUrl.value)
  .then((s) => { shortShareUrl.value = s })
  .catch(() => { shortShareUrl.value = longShareUrl.value })

/* ──────────── Lock scroll ──────────── */

let savedOverflow = ''
onMounted(() => {
  cfg.showLead.value = true
  savedOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
})
onBeforeUnmount(() => {
  cfg.showLead.value = false
  document.body.style.overflow = savedOverflow
})

/* ──────────── Submit ──────────── */

async function onSubmit() {
  const name = form.value.name.trim()
  const phone = form.value.phone.trim()
  const tg = form.value.tg.trim().replace(/^@+/, '')

  if (!name) { emit('feedback', 'Укажите имя'); return }
  if (!phone) { emit('feedback', 'Укажите телефон'); return }

  step.value = 'sending'

  /* Подождём короткую ссылку, но не дольше 6 секунд — иначе уйдёт длинная.
     На стороне менеджера длинная тоже работает, просто менее аккуратно. */
  const shareUrl: string = await (async () => {
    if (shortShareUrl.value) return shortShareUrl.value
    const long = longShareUrl.value
    return await Promise.race<string>([
      shortenLongUrl(long),
      new Promise<string>((res) => setTimeout(() => res(long), 6000)),
    ])
  })()

  await submitLead({
    leadId,
    source: props.source,
    name,
    phone,
    tgUsername: tg,
    summary: summary.value,
    shareUrl,
    roomCount: counts.value.roomCount,
    fixtureCount: counts.value.fixtureCount,
  })

  savePersistedContact({ name, phone, tgUsername: tg })
  step.value = 'done'
}

function onOpenChat() {
  /* window.open с _blank — на iOS Safari/PWA это открывает приложение
     Telegram если установлено, иначе t.me в браузере. */
  window.open(botStartUrl(leadId), '_blank', 'noopener')
  emit('close')
}

/* ──────────── Стили ──────────── */

function inputStyle() {
  return {
    width: '100%',
    padding: '12px 14px',
    background: T.card,
    border: `1px solid ${T.border}`,
    borderRadius: '8px',
    color: T.text,
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box' as const,
    fontFamily: 'inherit',
  }
}
function labelStyle() {
  return {
    fontSize: '11px',
    color: T.text,
    marginBottom: '6px',
    fontWeight: 600,
    letterSpacing: '.2px',
  }
}
</script>

<template>
  <!-- ═══ step = done ═══ -->
  <div
    v-if="step === 'done'"
    :style="{
      position: 'fixed', inset: 0, background: T.bg,
      zIndex: Z.leadModal, overflow: 'auto',
    }"
  >
    <NavHeader :title="title" :back="backLabel" @back="emit('close')" />
    <div :style="{ padding: '32px 20px 40px', maxWidth: '400px', margin: '0 auto', textAlign: 'center' }">
      <div :style="{
        width: '88px', height: '88px', borderRadius: '20px',
        background: T.green + '22', color: T.green,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '8px auto 24px', fontSize: '40px', lineHeight: 1,
      }">✓</div>
      <div :style="{ fontSize: '22px', fontWeight: 700, color: T.text, marginBottom: '10px' }">
        Заявка отправлена
      </div>
      <div :style="{ fontSize: '14px', color: T.textSec, lineHeight: 1.55, marginBottom: '28px' }">
        Менеджер уже видит вашу заявку. Откройте чат с ним — бот пришлёт первое сообщение со ссылкой, и можно начинать разговор.
      </div>
      <button
        :style="{
          width: '100%', padding: '16px', border: 'none', borderRadius: '10px',
          background: '#FFFFFF', color: T.bg, fontSize: '16px', fontWeight: 700,
          cursor: 'pointer', fontFamily: 'inherit',
        }"
        @click="onOpenChat"
      >Открыть чат с менеджером</button>
      <div :style="{ fontSize: '12px', color: T.textDim, marginTop: '14px', lineHeight: 1.5 }">
        Если чат не открылся — найдите в Telegram бота @woodled_studio_bot и нажмите «Запустить».
      </div>
    </div>
  </div>

  <!-- ═══ step = sending ═══ -->
  <div
    v-else-if="step === 'sending'"
    :style="{
      position: 'fixed', inset: 0, background: T.bg,
      zIndex: Z.leadModal,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: '14px',
    }"
  >
    <div :style="{
      width: '40px', height: '40px',
      border: `3px solid ${T.border}`,
      borderTopColor: T.text,
      borderRadius: '50%',
      animation: 'leadSpin .9s linear infinite',
    }" />
    <div :style="{ fontSize: '14px', color: T.textSec }">Отправляем заявку…</div>
  </div>

  <!-- ═══ step = form ═══ -->
  <div
    v-else
    :style="{
      position: 'fixed', inset: 0, background: T.bg,
      zIndex: Z.leadModal, overflow: 'auto',
    }"
  >
    <NavHeader :title="title" :back="backLabel" @back="emit('close')" />
    <div :style="{ padding: '16px 20px 32px', maxWidth: '420px', margin: '0 auto' }">
      <div :style="{ fontSize: '14px', color: T.textSec, lineHeight: 1.55, marginBottom: '20px' }">
        Оставьте контакты — менеджер свяжется с вами и поможет с подбором и заказом.
      </div>

      <div :style="{ marginBottom: '14px' }">
        <div :style="labelStyle()">Имя</div>
        <input
          v-model="form.name"
          placeholder="Как к вам обращаться"
          autocomplete="name"
          :style="inputStyle()"
        />
      </div>

      <div :style="{ marginBottom: '14px' }">
        <div :style="labelStyle()">Телефон</div>
        <input
          v-model="form.phone"
          type="tel"
          placeholder="+7"
          autocomplete="tel"
          :style="inputStyle()"
        />
      </div>

      <div :style="{ marginBottom: '24px' }">
        <div :style="labelStyle()">Telegram <span :style="{ color: T.textDim, fontWeight: 400 }">— необязательно</span></div>
        <input
          v-model="form.tg"
          placeholder="@username"
          autocapitalize="off"
          autocomplete="off"
          :style="inputStyle()"
        />
        <div :style="{ fontSize: '11px', color: T.textDim, marginTop: '6px', lineHeight: 1.4 }">
          Если ваш username в Telegram скрыт — укажите, чтобы менеджер мог написать.
        </div>
      </div>

      <button
        :style="{
          width: '100%', padding: '16px', border: 'none', borderRadius: '10px',
          background: '#FFFFFF', color: T.bg, fontSize: '16px', fontWeight: 700,
          cursor: 'pointer', fontFamily: 'inherit',
        }"
        @click="onSubmit"
      >Отправить</button>

      <div :style="{ fontSize: '11px', color: T.textDim, marginTop: '12px', lineHeight: 1.55, textAlign: 'center' }">
        Нажимая «Отправить», вы соглашаетесь, что менеджер WOODLED свяжется с вами по указанным контактам.
      </div>
    </div>
  </div>
</template>

<style>
@keyframes leadSpin {
  to { transform: rotate(360deg); }
}
</style>
