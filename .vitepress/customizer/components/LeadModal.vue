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

import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
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
  newLeadId, managerChatUrl, submitLead,
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

/* Онбординг «что дальше» — 3 коротких шага, чтобы клиент не путался:
   не было сразу понятно — менеджер получил данные, нужно ждать или писать
   самому. Третий шаг про прямую связь в TG. */
const DONE_STEPS: Array<{ title: string; body: string }> = [
  {
    title: 'Менеджер получил заявку',
    body: 'В групповой чат WOODLED Студии пришло сообщение с вашей комплектацией и контактом.',
  },
  {
    title: 'Свяжемся в течение часа',
    body: 'Менеджер позвонит по указанному телефону или напишет в Telegram.',
  },
  {
    title: 'Можно начать переписку сами',
    body: 'Откройте чат с менеджером в Telegram и просто скажите «Привет!» — он сразу подхватит вашу заявку.',
  },
]

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

/* Согласие с политикой конфиденциальности — обязательно по 152-ФЗ.
   Сабмит заблокирован пока не отмечено. */
const privacyConsent = ref<boolean>(false)

const step = ref<'form' | 'sending' | 'done'>('form')

/* ──────────── Маска телефона (портирована из BookMyLaunch.vue) ──────────── */
/* Алгоритм:
   • Если первая цифра '7' — режим маски +7(XXX)XXX-XX-XX, ровно 11 цифр.
   • Если другая (например 380, 1, 49) — free-режим +XXXXXXX до 15 цифр.
   • Backspace/Delete двигают курсор по цифрам, пропуская разделители.
   • Любая нецифровая клавиша заблокирована. */

const contactInput = ref<HTMLInputElement | null>(null)

/* Извлекаем цифры из сохранённого телефона; если пусто — стартуем с '7'
   (российский префикс по умолчанию). */
const phoneDigits = ref<string>(
  persisted.phone
    ? persisted.phone.replace(/\D/g, '').substring(0, 15) || '7'
    : '7',
)
const phoneMode = computed<'mask' | 'free'>(() =>
  phoneDigits.value.length > 0 && phoneDigits.value[0] === '7' ? 'mask' : 'free',
)
const maxDigits = computed(() => (phoneMode.value === 'mask' ? 11 : 15))

function formatMask(digits: string): string {
  if (digits.length === 0) return '+'
  let r = '+' + digits[0]
  if (digits.length > 1) r += '(' + digits.substring(1, 4)
  if (digits.length >= 4) r += ')'
  if (digits.length > 4) r += digits.substring(4, 7)
  if (digits.length > 7) r += '-' + digits.substring(7, 9)
  if (digits.length > 9) r += '-' + digits.substring(9, 11)
  return r
}
function formatFree(digits: string): string {
  return digits.length === 0 ? '+' : '+' + digits
}
function formatCurrent(): string {
  return phoneMode.value === 'mask'
    ? formatMask(phoneDigits.value)
    : formatFree(phoneDigits.value)
}

function cursorToDigitIndex(pos: number, formatted: string): number {
  let idx = 0
  for (let i = 0; i < pos && i < formatted.length; i++) {
    if (/\d/.test(formatted[i])) idx++
  }
  return idx
}
function digitIndexToCursor(digitIdx: number, formatted: string): number {
  let count = 0
  for (let i = 0; i < formatted.length; i++) {
    if (count === digitIdx) return i
    if (/\d/.test(formatted[i])) count++
  }
  return formatted.length
}

function syncFormContact() {
  form.value.phone = formatCurrent()
}
syncFormContact()

function onPhoneInput(e: Event) {
  const input = e.target as HTMLInputElement
  const allDigits = input.value.replace(/\D/g, '').substring(0, 15)
  phoneDigits.value = allDigits
  const formatted =
    allDigits.length > 0 && allDigits[0] === '7'
      ? formatMask(allDigits.substring(0, 11))
      : formatFree(allDigits)
  form.value.phone = formatted
  nextTick(() => {
    input.value = formatted
    input.setSelectionRange(formatted.length, formatted.length)
  })
}

function onPhoneKeydown(e: KeyboardEvent) {
  const input = e.target as HTMLInputElement
  const pos = input.selectionStart ?? 0
  const formatted = input.value
  const isMask = phoneMode.value === 'mask'

  if (e.key === 'Backspace') {
    e.preventDefault()
    if (isMask) {
      const digitIdx = cursorToDigitIndex(pos, formatted)
      if (digitIdx <= 0) return
      const d = phoneDigits.value
      phoneDigits.value = d.substring(0, digitIdx - 1) + d.substring(digitIdx)
      const newFormatted = formatCurrent()
      form.value.phone = newFormatted
      const newCursor = phoneMode.value === 'mask'
        ? digitIndexToCursor(digitIdx - 1, newFormatted)
        : Math.max(1, newFormatted.length)
      nextTick(() => { input.value = newFormatted; input.setSelectionRange(newCursor, newCursor) })
    } else {
      if (pos <= 1) return
      const idx = pos - 1
      const d = phoneDigits.value
      if (idx <= 0 || idx > d.length) return
      phoneDigits.value = d.substring(0, idx - 1) + d.substring(idx)
      const newFormatted = formatCurrent()
      form.value.phone = newFormatted
      const nc = Math.min(pos - 1, newFormatted.length)
      nextTick(() => { input.value = newFormatted; input.setSelectionRange(nc, nc) })
    }
    return
  }

  if (e.key === 'Delete') {
    e.preventDefault()
    if (isMask) {
      const digitIdx = cursorToDigitIndex(pos, formatted)
      const d = phoneDigits.value
      if (digitIdx >= d.length) return
      phoneDigits.value = d.substring(0, digitIdx) + d.substring(digitIdx + 1)
      const newFormatted = formatCurrent()
      form.value.phone = newFormatted
      const nc = digitIndexToCursor(digitIdx, newFormatted)
      nextTick(() => { input.value = newFormatted; input.setSelectionRange(nc, nc) })
    } else {
      const idx = pos - 1
      const d = phoneDigits.value
      if (idx < 0 || idx >= d.length) return
      phoneDigits.value = d.substring(0, idx) + d.substring(idx + 1)
      const newFormatted = formatCurrent()
      form.value.phone = newFormatted
      nextTick(() => { input.value = newFormatted; input.setSelectionRange(pos, pos) })
    }
    return
  }

  if (['Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return
  if (e.ctrlKey || e.metaKey) return

  if (!/^\d$/.test(e.key)) { e.preventDefault(); return }
  if (phoneDigits.value.length >= maxDigits.value) { e.preventDefault(); return }

  e.preventDefault()

  if (isMask) {
    const digitIdx = cursorToDigitIndex(pos, formatted)
    const d = phoneDigits.value
    phoneDigits.value = d.substring(0, digitIdx) + e.key + d.substring(digitIdx)
    const newFormatted = formatCurrent()
    form.value.phone = newFormatted
    const nc = phoneMode.value === 'mask'
      ? digitIndexToCursor(digitIdx + 1, newFormatted)
      : newFormatted.length
    nextTick(() => { input.value = newFormatted; input.setSelectionRange(nc, nc) })
  } else {
    const idx = pos - 1
    const d = phoneDigits.value
    const insertAt = Math.max(0, Math.min(idx, d.length))
    phoneDigits.value = d.substring(0, insertAt) + e.key + d.substring(insertAt)
    const newFormatted = formatCurrent()
    form.value.phone = newFormatted
    if (phoneMode.value === 'mask') {
      const nc = digitIndexToCursor(insertAt + 1, newFormatted)
      nextTick(() => { input.value = newFormatted; input.setSelectionRange(nc, nc) })
    } else {
      const nc = insertAt + 2
      nextTick(() => { input.value = newFormatted; input.setSelectionRange(nc, nc) })
    }
  }
}

const phoneComplete = computed<boolean>(() =>
  phoneMode.value === 'mask'
    ? phoneDigits.value.length === 11
    : phoneDigits.value.length >= 7,
)

const canSubmit = computed<boolean>(() =>
  form.value.name.trim().length > 0 && phoneComplete.value && privacyConsent.value,
)

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
  if (!phoneComplete.value) { emit('feedback', 'Введите телефон полностью'); return }
  if (!privacyConsent.value) { emit('feedback', 'Подтвердите согласие с политикой'); return }

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
     Telegram если установлено, иначе t.me в браузере. Открывает прямой
     чат с менеджером — все данные у него уже в групповом чате с заявкой. */
  window.open(managerChatUrl(), '_blank', 'noopener')
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
  <!-- ═══ step = done ═══
       Онбординг «что дальше» 1-2-3: убирает путаницу — менеджер уже всё
       видит, можно подождать звонка или сразу написать в TG.  -->
  <div
    v-if="step === 'done'"
    :style="{
      position: 'fixed', inset: 0, background: T.bg,
      zIndex: Z.leadModal, overflow: 'auto',
    }"
  >
    <NavHeader :title="title" :back="backLabel" @back="emit('close')" />
    <div :style="{ padding: '24px 20px 40px', maxWidth: '420px', margin: '0 auto', textAlign: 'center' }">
      <div :style="{
        width: '72px', height: '72px', borderRadius: '18px',
        background: T.green + '22', color: T.green,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '4px auto 20px', fontSize: '34px', lineHeight: 1,
      }">✓</div>
      <div :style="{ fontSize: '22px', fontWeight: 700, color: T.text, marginBottom: '8px' }">
        Заявка отправлена
      </div>
      <div :style="{ fontSize: '14px', color: T.textSec, lineHeight: 1.55, marginBottom: '24px' }">
        Менеджер уже видит вашу комплектацию.
      </div>

      <!-- Онбординг 1-2-3 -->
      <div :style="{ textAlign: 'left', marginBottom: '28px' }">
        <div v-for="(stepInfo, i) in DONE_STEPS" :key="i" :style="{
          display: 'flex', gap: '14px', marginBottom: '16px', alignItems: 'flex-start',
        }">
          <div :style="{
            flexShrink: 0, width: '28px', height: '28px', borderRadius: '50%',
            background: T.text, color: T.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', fontWeight: 700, lineHeight: 1,
          }">{{ i + 1 }}</div>
          <div :style="{ flex: 1, paddingTop: '2px' }">
            <div :style="{ fontSize: '14px', fontWeight: 600, color: T.text, marginBottom: '3px', lineHeight: 1.35 }">{{ stepInfo.title }}</div>
            <div :style="{ fontSize: '13px', color: T.textSec, lineHeight: 1.5 }">{{ stepInfo.body }}</div>
          </div>
        </div>
      </div>

      <button
        :style="{
          width: '100%', padding: '16px', border: 'none', borderRadius: '10px',
          background: '#FFFFFF', color: T.bg, fontSize: '16px', fontWeight: 700,
          cursor: 'pointer', fontFamily: 'inherit',
        }"
        @click="onOpenChat"
      >Написать менеджеру в Telegram</button>
      <div :style="{ fontSize: '12px', color: T.textDim, marginTop: '12px', lineHeight: 1.5 }">
        Если Telegram не открылся — найдите @run_scale вручную.
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
          ref="contactInput"
          :value="form.phone"
          type="tel"
          inputmode="tel"
          autocomplete="tel"
          placeholder="+7(___) ___-__-__"
          :style="inputStyle()"
          @input="onPhoneInput"
          @keydown="onPhoneKeydown"
        />
      </div>

      <div :style="{ marginBottom: '20px' }">
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

      <!-- Согласие 152-ФЗ. Без галки сабмит заблокирован. -->
      <label :style="{
        display: 'flex', alignItems: 'flex-start', gap: '10px',
        marginBottom: '20px', cursor: 'pointer', userSelect: 'none',
      }">
        <input
          v-model="privacyConsent"
          type="checkbox"
          :style="{
            width: '18px', height: '18px', flexShrink: 0, marginTop: '2px',
            accentColor: T.text, cursor: 'pointer',
          }"
        />
        <span :style="{ fontSize: '12px', color: T.textSec, lineHeight: 1.5 }">
          Согласен с
          <a
            href="/privacy"
            target="_blank"
            rel="noopener"
            :style="{ color: T.text, textDecoration: 'underline' }"
          >политикой обработки персональных данных</a>.
        </span>
      </label>

      <button
        :disabled="!canSubmit"
        :style="{
          width: '100%', padding: '16px', border: 'none', borderRadius: '10px',
          background: canSubmit ? '#FFFFFF' : T.card,
          color: canSubmit ? T.bg : T.textDim,
          fontSize: '16px', fontWeight: 700,
          cursor: canSubmit ? 'pointer' : 'not-allowed',
          fontFamily: 'inherit',
          transition: 'background .15s, color .15s',
        }"
        @click="onSubmit"
      >Отправить</button>

      <div :style="{ fontSize: '11px', color: T.textDim, marginTop: '12px', lineHeight: 1.55, textAlign: 'center' }">
        Менеджер свяжется с вами по указанным контактам.
      </div>
    </div>
  </div>
</template>

<style>
@keyframes leadSpin {
  to { transform: rotate(360deg); }
}
</style>
