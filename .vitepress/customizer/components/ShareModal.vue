<script setup lang="ts">
/**
 * ShareModal.vue — Универсальная модалка для шаринга.
 *
 * Может использоваться в двух режимах (обратная совместимость):
 *
 * 1. Режим «дом» (parent передаёт name + rooms):
 *    <ShareModal :name="houseName" :rooms="rooms" @close="..." @feedback="..." />
 *    → подзаголовок «Поделитесь своим домом WOODLED»
 *    → longUrl = buildShareUrl(name, rooms)
 *
 * 2. Режим «светильник» (parent передаёт готовый longUrl + кастомный subtitle):
 *    <ShareModal :longUrl="..." subtitle="Поделитесь светильником WOODLED" ... />
 *
 * Архитектура шортнера:
 *   - При open модалки в фоне prefetch короткой ссылки (Apps Script)
 *   - Кнопки disabled пока short не готов → гарантия что в clipboard / share
 *     попадёт только короткая, без молчаливых fallback на длинную
 *   - prefetch не кэшируется если вернулась длинная (cold start таймаут) —
 *     следующий клик retry на уже прогретом Apps Script
 *
 * UI:
 *   - Затемнённый overlay поверх всей страницы, клик по overlay = close
 *   - Белая карточка, крупные кнопки (64×64) — комфортно тыкать пальцем
 *   - Иконки появляются только когда short готов; до этого кнопки серые
 *     без иконок (но с подписями «Скопировать» / «Поделиться»)
 *   - Скролл страницы заблокирован пока модалка открыта
 */

import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import type { Room } from '../data/rooms'
import { fxLamps } from '../engine/brightness'
import { buildShareUrl } from '../engine/share'
import { shortenLongUrl } from '../engine/shortener'

interface Props {
  /* Режим «дом»: parent передаёт name + rooms */
  name?: string
  rooms?: Room[]
  /* Режим «светильник» (или произвольный): parent передаёт готовый longUrl */
  longUrl?: string
  /* Подзаголовок (зависит от контекста) */
  subtitle?: string
  /* Для navigator.share — заголовок и текст */
  shareTitle?: string
  shareText?: string
}
const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  feedback: [msg: string]
  /** Третья кнопка — открывает LeadModal с source='consult'. */
  lead: []
}>()

/* Длинный URL: либо передан явно (FxEditor mode), либо собираем из name+rooms (дом). */
const longUrl = computed(() =>
  props.longUrl ?? buildShareUrl(props.name ?? '', props.rooms ?? [])
)

/* Подзаголовок по умолчанию — для режима «дом», т.к. он передаётся из старого parent. */
const subtitle = computed(() => props.subtitle ?? 'Поделитесь своим домом WOODLED')

/* shareTitle для navigator.share — по умолчанию название дома. */
const shareTitle = computed(() => props.shareTitle ?? props.name ?? 'WOODLED')

/* shareText по умолчанию — для дома. Светильник передаёт свой через props. */
const shareText = computed(() => {
  if (props.shareText) return props.shareText
  return `Посмотрите ${props.name ?? 'дом'} WOODLED`
})

/* ─────────── stage3-shortener: prefetch + cache ─────────── */
let prefetched: { longUrl: string; promise: Promise<string> } | null = null
const shortenedUrl = ref<string | null>(null)

function refreshShortPromise() {
  const url = longUrl.value
  if (prefetched && prefetched.longUrl === url) return
  shortenedUrl.value = null
  const promise = shortenLongUrl(url).catch(() => url)
  prefetched = { longUrl: url, promise }
  promise.then(result => {
    if (result !== url) {
      /* Шортнер вернул короткую — кэшируем + активируем кнопки. */
      if (prefetched && prefetched.longUrl === url) {
        shortenedUrl.value = result
      }
    } else {
      /* Вернулась длинная (cold start timeout) — стираем кэш, следующее
         открытие модалки попробует ещё раз. */
      if (prefetched && prefetched.longUrl === url) {
        prefetched = null
      }
    }
  })
}

/* Блокировка скролла страницы пока модалка открыта. */
let savedOverflow = ''
onMounted(() => {
  refreshShortPromise()
  savedOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
})
onBeforeUnmount(() => {
  document.body.style.overflow = savedOverflow
})

function copyLink() {
  /* Кнопка disabled пока shortenedUrl null — сюда попадаем только когда готова.
     Sync clipboard.writeText в gesture context → гарантия короткой. */
  const url = shortenedUrl.value
  if (!url) return
  navigator.clipboard.writeText(url)
    .then(() => {
      emit('feedback', 'Ссылка скопирована')
      emit('close')
    })
    .catch(() => {
      emit('feedback', url)
    })
}

function webShare() {
  /* Кнопка disabled пока shortenedUrl null. Sync navigator.share с готовым URL.
     Передаём И url отдельным полем (для iOS preview с иконкой через OG-теги
     приёмной страницы), И URL внутри text (для Telegram macOS Desktop,
     который игнорирует url field и берёт только text). Дубликация URL —
     меньшее зло чем потеря URL на macOS. */
  const url = shortenedUrl.value
  if (!url) return
  const text = `${shareText.value}\n${url}`
  if (navigator.share) {
    navigator.share({ title: shareTitle.value, text, url })
      .then(() => emit('close'))
      .catch(() => { /* отмена пользователем */ })
  } else {
    emit('feedback', 'Шаринг недоступен')
  }
}

function onOverlayClick() {
  emit('close')
}

function onSendManager() {
  /* «Отправить менеджеру» — закрываем эту модалку и пробрасываем emit('lead')
     наверх. App.vue откроет LeadModal с source='consult'. Заявка пойдёт
     как консультация, а не покупка — менеджер видит другой приоритет. */
  emit('lead')
  emit('close')
}
</script>

<template>
  <div class="share-overlay" @click="onOverlayClick">
    <div class="share-card" @click.stop>
      <button class="share-close" aria-label="Закрыть" @click="emit('close')">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      <h2 class="share-title">Создавайте вместе</h2>
      <p class="share-subtitle">{{ subtitle }}</p>

      <div class="share-buttons">
        <button
          class="share-action"
          :disabled="!shortenedUrl"
          @click="copyLink"
        >
          <div class="share-action-circle">
            <svg
              v-if="shortenedUrl"
              width="28" height="28" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round"
            >
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <svg
              v-else
              class="share-spinner"
              width="28" height="28" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2.5"
              stroke-linecap="round"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </div>
          <span class="share-action-label">Скопировать</span>
        </button>

        <button
          class="share-action"
          :disabled="!shortenedUrl"
          @click="webShare"
        >
          <div class="share-action-circle">
            <svg
              v-if="shortenedUrl"
              width="28" height="28" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round"
            >
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
            <svg
              v-else
              class="share-spinner"
              width="28" height="28" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2.5"
              stroke-linecap="round"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </div>
          <span class="share-action-label">Поделиться</span>
        </button>

        <!-- Третья кнопка — отправить менеджеру (консультация).
             Доступна всегда: для неё не нужна короткая ссылка, заявка летит
             через LeadModal на бэкенд, а ссылка сгенерируется там же.
             Квадратный пузырь сообщения с тремя точками — пересобран из
             простых примитивов (rect/path/circle), чтобы не зависеть от
             длинного lucide-path с компактным синтаксисом (потенциальный
             источник проблем у парсера/SSR). -->
        <button
          class="share-action"
          @click="onSendManager"
        >
          <div class="share-action-circle">
            <svg
              width="28" height="28" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round"
            >
              <rect x="3" y="4" width="18" height="13" rx="2" />
              <path d="M8 17v3l-4-3" />
              <circle cx="8" cy="11" r="1" fill="currentColor" stroke="none" />
              <circle cx="12" cy="11" r="1" fill="currentColor" stroke="none" />
              <circle cx="16" cy="11" r="1" fill="currentColor" stroke="none" />
            </svg>
          </div>
          <span class="share-action-label">Менеджеру</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.share-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: shareFadeIn 0.18s ease-out;
}
@keyframes shareFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.share-card {
  position: relative;
  width: 100%;
  max-width: 380px;
  background: #fff;
  border-radius: 20px;
  padding: 36px 28px 32px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.35);
  text-align: center;
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  color: #1a1a1a;
  animation: shareSlideUp 0.22s ease-out;
}
@keyframes shareSlideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.share-close {
  position: absolute;
  top: 14px;
  right: 14px;
  background: transparent;
  border: none;
  color: #999;
  cursor: pointer;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.15s;
}
.share-close:hover { background: #f0f0f0; }

.share-title {
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: -0.2px;
}

.share-subtitle {
  margin: 0 0 28px;
  font-size: 15px;
  color: #666;
  line-height: 1.45;
}

.share-buttons {
  display: flex;
  justify-content: center;
  gap: 22px;
}

.share-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: opacity 0.18s, transform 0.1s;
}
.share-action:disabled {
  cursor: wait;
  opacity: 0.55;
}
.share-action:not(:disabled):active {
  transform: scale(0.96);
}

.share-action-circle {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #f5f5f5;
  border: 1px solid #e8e8e8;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1a1a1a;
  transition: background 0.15s;
}
.share-action:not(:disabled):hover .share-action-circle {
  background: #ececec;
}

.share-action-label {
  font-size: 14px;
  font-weight: 500;
  color: #1a1a1a;
}

/* Spinner внутри кнопки пока short ссылка не готова — даёт визуальную
   обратную связь что что-то происходит (вместо просто пустого круга). */
.share-spinner {
  animation: shareSpinnerRotate 0.9s linear infinite;
  color: #1a1a1a;
  opacity: 0.55;
}
@keyframes shareSpinnerRotate {
  to { transform: rotate(360deg); }
}
</style>
