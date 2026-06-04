<script setup lang="ts">
/**
 * AppPage — лендинг-инструкция «Как пользоваться WOODLED на айфоне».
 *
 * Структура (по образцу avito.ru/apps):
 *   1. Hero — «Как пользоваться WOODLED Студией». Краткое объяснение что
 *      сайт работает как приложение (PWA), и две кнопки-якоря: «Добавить
 *      на iPhone» / «Открыть на Android» (на Android — оригинальная ссылка).
 *   2. Секция «Добавьте WOODLED на домашний экран айфона» — 3 шага +
 *      картинка-плейсхолдер (будет заменена пользователем).
 *   3. Секция «Разрешите присылать уведомления» — 3 шага + плейсхолдер.
 *
 * Все картинки — простые placeholder div'ы с надписью «скрин» — пользователь
 * подставит реальные позже.
 */
import { onMounted, ref } from 'vue'
import { PAGE } from './tokens'
import { getPushState, enablePush, disablePush, type PushState } from './pwa-push'

const ICON_URL = '/woodled-studio/apple-touch-icon.png'

// Состояние push-подписки: пересчитывается на mount и после действий
// пользователя. Хранится как объект PushState — рендеримся по `.kind`.
const pushState = ref<PushState | null>(null)
const pushBusy = ref(false)

async function refreshPush() {
  pushState.value = await getPushState()
}

async function onEnablePush() {
  if (pushBusy.value) return
  pushBusy.value = true
  try {
    pushState.value = await enablePush()
  } catch (e) {
    console.warn('[woodled push] enable failed:', e)
  } finally {
    pushBusy.value = false
  }
}

async function onDisablePush() {
  if (pushBusy.value) return
  pushBusy.value = true
  try {
    await disablePush()
    await refreshPush()
  } finally {
    pushBusy.value = false
  }
}

// При заходе с Safari на iOS — баннер на главной уже не нужен будет показывать
// (пользователь сам кликнул в /app). При желании здесь можно поставить флаг
// dismiss в localStorage, чтобы не отвлекать его при возвращении.
onMounted(() => {
  if (typeof window === 'undefined') return
  // Anchor-навигация: если пришли с #install / #notify — плавный скролл
  const hash = window.location.hash
  if (hash) {
    requestAnimationFrame(() => {
      const el = document.querySelector(hash)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }
  // Подтянуть состояние push (поддержка/разрешение/подписка)
  refreshPush()
})

// Inter — лендинг живёт на той же шрифтовой системе
let fontLink: HTMLLinkElement | null = null
onMounted(() => {
  const href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap'
  if (!document.querySelector(`link[href="${href}"]`)) {
    fontLink = document.createElement('link')
    fontLink.rel = 'stylesheet'
    fontLink.href = href
    document.head.appendChild(fontLink)
  }
})

const installSteps = [
  'Откройте сайт в <strong>Safari</strong> на айфоне.',
  'Нажмите кнопку <strong>«Поделиться»</strong> внизу экрана — квадрат со стрелкой вверх.',
  'Пролистайте меню и выберите <strong>«На экран „Домой“»</strong>.',
  'Нажмите <strong>«Добавить»</strong> — иконка WOODLED появится рядом с другими приложениями.',
]

const notifySteps = [
  'Запустите WOODLED Студию с домашнего экрана — иконкой, не из Safari.',
  'Нажмите кнопку <strong>«Разрешить уведомления»</strong> ниже.',
  'В системном окне нажмите <strong>«Разрешить»</strong>. Если оно не появилось — обновите iOS до 16.4 или новее.',
]
</script>

<template>
  <div
    class="app-page-root"
    :style="{
      minHeight: '100vh',
      background: `linear-gradient(180deg, ${PAGE.bgTop} 0%, ${PAGE.bgMid} 50%, ${PAGE.bgBottom} 100%)`,
      color: PAGE.text,
      fontFamily: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif`,
      fontWeight: 500,
      paddingBottom: '64px',
      position: 'relative',
      overflow: 'hidden',
    }"
  >
    <!-- Фирменный точечный фон, один в один как на лендинге (lp/App.vue) -->
    <div
      :style="{
        position: 'fixed',
        inset: 0,
        backgroundImage:
          'radial-gradient(circle at center, rgba(122, 88, 60, 0.12) 1.0px, transparent 1.5px)',
        backgroundSize: '16px 16px',
        opacity: 1,
        pointerEvents: 'none',
        zIndex: 0,
      }"
    />
    <!-- Хедер: лого + ссылка на главную -->
    <header
      :style="{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 24px',
        maxWidth: '1280px',
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
      }"
    >
      <a
        href="/woodled-studio/"
        :style="{
          fontFamily: `'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Inter', system-ui, sans-serif`,
          fontSize: 'clamp(20px, 4vw, 28px)',
          fontWeight: 600,
          letterSpacing: '-0.02em',
          color: PAGE.text,
          textDecoration: 'none',
        }"
      >
        WOODLED&nbsp;Студия
      </a>
      <a
        href="/woodled-studio/"
        :style="{
          fontSize: '14px',
          color: PAGE.textSec,
          textDecoration: 'none',
        }"
      >
        ← На главную
      </a>
    </header>

    <!-- Hero -->
    <section
      :style="{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '24px',
      }"
    >
      <div
        :style="{
          background: 'linear-gradient(160deg, #1A1410 0%, #2A1F18 100%)',
          borderRadius: '24px',
          padding: 'clamp(24px, 5vw, 56px)',
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '24px',
          alignItems: 'center',
          color: '#F5EBE0',
          overflow: 'hidden',
          position: 'relative',
        }"
        class="hero-grid"
      >
        <div :style="{ position: 'relative', zIndex: 1 }">
          <h1
            :style="{
              fontFamily: `'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Inter', system-ui, sans-serif`,
              fontSize: 'clamp(28px, 6vw, 44px)',
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: '-0.025em',
              margin: '0 0 24px',
              color: '#F5EBE0',
            }"
          >
            <span :style="{ display: 'block' }">Как пользоваться</span>
            <span :style="{ display: 'block' }">WOODLED&nbsp;Студия</span>
            <span :style="{ display: 'block' }">на iPhone</span>
          </h1>
          <p
            :style="{
              fontSize: '17px',
              lineHeight: 1.5,
              color: 'rgba(245, 235, 224, 0.78)',
              margin: '0 0 28px',
              maxWidth: '520px',
            }"
          >
            Это веб-приложение — устанавливать из App&nbsp;Store ничего не нужно.
            Добавьте ярлык на домашний экран и пользуйтесь как обычным приложением.
          </p>

          <div
            :style="{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
            }"
          >
            <!-- Кнопка «Добавить на iPhone» — стиль primary CTA лендинга:
                 медный градиент, белый текст, без border. Иконка
                 layout-grid (домашний экран). -->
            <a
              href="#install"
              :style="{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '14px 22px',
                background: `linear-gradient(135deg, ${PAGE.rose} 0%, ${PAGE.roseLight} 50%, ${PAGE.rose} 100%)`,
                color: '#FFFFFF',
                borderRadius: '14px',
                textDecoration: 'none',
                fontSize: '15px',
                fontWeight: 700,
                border: 'none',
                boxShadow: '0 10px 24px rgba(154, 100, 64, 0.32), inset 0 1px 0 rgba(255, 255, 255, 0.35)',
              }"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="7" height="7" x="3" y="3" rx="1"/>
                <rect width="7" height="7" x="14" y="3" rx="1"/>
                <rect width="7" height="7" x="14" y="14" rx="1"/>
                <rect width="7" height="7" x="3" y="14" rx="1"/>
              </svg>
              Добавить на iPhone
            </a>
            <!-- Кнопка «Уведомления» — тот же стиль, иконка bell-plus -->
            <a
              href="#notify"
              :style="{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '14px 22px',
                background: `linear-gradient(135deg, ${PAGE.rose} 0%, ${PAGE.roseLight} 50%, ${PAGE.rose} 100%)`,
                color: '#FFFFFF',
                borderRadius: '14px',
                textDecoration: 'none',
                fontSize: '15px',
                fontWeight: 700,
                border: 'none',
                boxShadow: '0 10px 24px rgba(154, 100, 64, 0.32), inset 0 1px 0 rgba(255, 255, 255, 0.35)',
              }"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.268 21a2 2 0 0 0 3.464 0"/>
                <path d="M15 8h6"/>
                <path d="M18 5v6"/>
                <path d="M20.002 14.464a9 9 0 0 0 .738.863A1 1 0 0 1 20 17H4a1 1 0 0 1-.74-1.673C4.59 13.956 6 12.499 6 8a6 6 0 0 1 8.75-5.332"/>
              </svg>
              Уведомления
            </a>
          </div>
        </div>

        <!-- Картинка-плейсхолдер (айкона + телефон). Замените на реальный скрин -->
        <div
          :style="{
            position: 'relative',
            aspectRatio: '4 / 3',
            background: 'rgba(245, 235, 224, 0.06)',
            border: '1px dashed rgba(245, 235, 224, 0.20)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(245, 235, 224, 0.45)',
            fontSize: '14px',
            fontWeight: 500,
          }"
        >
          <img
            :src="ICON_URL"
            alt="WOODLED"
            :style="{
              width: '120px',
              height: '120px',
              borderRadius: '24px',
              boxShadow: '0 18px 48px rgba(0, 0, 0, 0.35)',
            }"
          />
          <div
            :style="{
              position: 'absolute',
              bottom: '12px',
              right: '14px',
              fontSize: '11px',
              color: 'rgba(245, 235, 224, 0.35)',
            }"
          >
            замените картинку
          </div>
        </div>
      </div>
    </section>

    <!-- Секция 1: Добавить на домашний экран -->
    <section
      id="install"
      :style="{
        maxWidth: '1100px',
        margin: '40px auto 0',
        padding: '0 24px',
        scrollMarginTop: '24px',
      }"
    >
      <h2
        :style="{
          fontFamily: `'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Inter', system-ui, sans-serif`,
          fontSize: 'clamp(24px, 5vw, 36px)',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          lineHeight: 1.15,
          margin: '0 0 28px',
          color: PAGE.text,
        }"
      >
        Добавьте WOODLED&nbsp;Студию на домашний экран
      </h2>

      <div
        class="step-grid"
        :style="{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '24px',
          alignItems: 'center',
        }"
      >
        <!-- Картинка-плейсхолдер -->
        <div
          :style="{
            aspectRatio: '3 / 4',
            background: 'rgba(255, 255, 255, 0.55)',
            border: `1px dashed ${PAGE.border}`,
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: PAGE.textDim,
            fontSize: '14px',
            fontWeight: 500,
            position: 'relative',
          }"
        >
          скрин Safari — кнопка «Поделиться»
          <div
            :style="{
              position: 'absolute',
              bottom: '12px',
              right: '14px',
              fontSize: '11px',
              color: PAGE.textDim,
              opacity: 0.7,
            }"
          >
            замените картинку
          </div>
        </div>

        <ol
          :style="{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }"
        >
          <li
            v-for="(step, i) in installSteps"
            :key="i"
            :style="{
              display: 'flex',
              gap: '16px',
              alignItems: 'flex-start',
            }"
          >
            <div
              :style="{
                flexShrink: 0,
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: PAGE.rose,
                color: '#FFF',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                fontWeight: 700,
              }"
            >{{ i + 1 }}</div>
            <div
              :style="{
                fontSize: '17px',
                lineHeight: 1.45,
                color: PAGE.text,
                paddingTop: '5px',
              }"
              v-html="step"
            />
          </li>
        </ol>
      </div>
    </section>

    <!-- Секция 2: Уведомления -->
    <section
      id="notify"
      :style="{
        maxWidth: '1100px',
        margin: '56px auto 0',
        padding: '0 24px',
        scrollMarginTop: '24px',
      }"
    >
      <h2
        :style="{
          fontFamily: `'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Inter', system-ui, sans-serif`,
          fontSize: 'clamp(24px, 5vw, 36px)',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          lineHeight: 1.15,
          margin: '0 0 12px',
          color: PAGE.text,
        }"
      >
        Разрешите присылать уведомления
      </h2>
      <p
        :style="{
          fontSize: '15px',
          lineHeight: 1.55,
          color: PAGE.textSec,
          margin: '0 0 28px',
          maxWidth: '720px',
        }"
      >
        Так вы будете узнавать о новинках коллекций, статусах заказов
        и сохранённых сборках. Уведомления работают только если приложение
        добавлено на домашний экран (iOS&nbsp;16.4 и новее).
      </p>

      <div
        class="step-grid"
        :style="{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '24px',
          alignItems: 'center',
        }"
      >
        <div
          :style="{
            aspectRatio: '3 / 4',
            background: 'rgba(255, 255, 255, 0.55)',
            border: `1px dashed ${PAGE.border}`,
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: PAGE.textDim,
            fontSize: '14px',
            fontWeight: 500,
            position: 'relative',
          }"
        >
          скрин — запрос разрешения
          <div
            :style="{
              position: 'absolute',
              bottom: '12px',
              right: '14px',
              fontSize: '11px',
              color: PAGE.textDim,
              opacity: 0.7,
            }"
          >
            замените картинку
          </div>
        </div>

        <ol
          :style="{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }"
        >
          <li
            v-for="(step, i) in notifySteps"
            :key="i"
            :style="{
              display: 'flex',
              gap: '16px',
              alignItems: 'flex-start',
            }"
          >
            <div
              :style="{
                flexShrink: 0,
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: PAGE.rose,
                color: '#FFF',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                fontWeight: 700,
              }"
            >{{ i + 1 }}</div>
            <div
              :style="{
                fontSize: '17px',
                lineHeight: 1.45,
                color: PAGE.text,
                paddingTop: '5px',
              }"
              v-html="step"
            />
          </li>

          <!--
            Реальная кнопка включения push. Рендерится по состоянию:
              • subscribed              — «Уведомления включены» + «Отключить»
              • permission-default      — кнопка «Разрешить уведомления»
              • permission-denied       — мягкая подсказка зайти в Настройки → WOODLED
              • needs-install           — «Сначала добавьте на домашний экран»
              • no-vapid-key            — серверный ключ не настроен (видно только разработчику)
              • unsupported / null      — кнопка скрыта, ничего не пугаем
          -->
          <li
            v-if="pushState && pushState.kind !== 'unsupported' && pushState.kind !== 'no-vapid-key'"
            :style="{
              marginTop: '4px',
              paddingLeft: '52px',
            }"
          >
            <template v-if="pushState.kind === 'subscribed'">
              <div
                :style="{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 16px',
                  borderRadius: '12px',
                  background: 'rgba(34, 139, 80, 0.12)',
                  color: '#1F6B3A',
                  fontSize: '15px',
                  fontWeight: 600,
                }"
              >
                <span>✓ Уведомления включены</span>
              </div>
              <button
                type="button"
                @click="onDisablePush"
                :disabled="pushBusy"
                :style="{
                  marginLeft: '12px',
                  padding: '10px 16px',
                  background: 'transparent',
                  border: `1px solid ${PAGE.border}`,
                  color: PAGE.textSec,
                  borderRadius: '12px',
                  fontSize: '14px',
                  cursor: pushBusy ? 'wait' : 'pointer',
                }"
              >Отключить</button>
            </template>

            <button
              v-else-if="pushState.kind === 'permission-default'"
              type="button"
              @click="onEnablePush"
              :disabled="pushBusy"
              :style="{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '14px 22px',
                background: PAGE.rose,
                color: '#FFF',
                border: 'none',
                borderRadius: '14px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: pushBusy ? 'wait' : 'pointer',
                boxShadow: '0 8px 20px rgba(181, 128, 96, 0.32)',
              }"
            >
              <span>🔔</span>
              {{ pushBusy ? 'Подключаем…' : 'Разрешить уведомления' }}
            </button>

            <div
              v-else-if="pushState.kind === 'permission-denied'"
              :style="{
                fontSize: '14px',
                lineHeight: 1.5,
                color: PAGE.textSec,
                maxWidth: '440px',
              }"
            >
              Уведомления заблокированы в настройках iOS. Откройте
              <strong>Настройки → Уведомления → WOODLED</strong> и включите
              «Разрешить уведомления».
            </div>

            <div
              v-else-if="pushState.kind === 'needs-install'"
              :style="{
                fontSize: '14px',
                lineHeight: 1.5,
                color: PAGE.textSec,
                maxWidth: '440px',
              }"
            >
              Сначала <a href="#install" :style="{ color: PAGE.roseDeep, fontWeight: 600 }">добавьте WOODLED на домашний экран</a>
              и запустите приложение оттуда — только в этом режиме iOS пускает
              запрос разрешения.
            </div>

          </li>
        </ol>
      </div>
    </section>

    <!-- Подвал-FAQ -->
    <section
      :style="{
        maxWidth: '900px',
        margin: '56px auto 0',
        padding: '0 24px',
      }"
    >
      <div
        :style="{
          background: 'rgba(255, 255, 255, 0.45)',
          borderRadius: '20px',
          padding: '24px',
          border: `1px solid ${PAGE.borderSoft}`,
          fontSize: '14px',
          lineHeight: 1.55,
          color: PAGE.textSec,
        }"
      >
        <strong :style="{ color: PAGE.text, fontWeight: 600 }">Если не получилось.</strong>
        Обновите iOS до 16.4 или новее (Настройки → Основные → Обновление ПО).
        Откройте сайт в Safari (не в Chrome/Firefox — они не умеют добавлять на
        домашний экран). После добавления — запустите приложение с домашнего
        экрана и войдите в профиль.
      </div>
    </section>
  </div>
</template>

<style scoped>
.app-page-root :deep(strong) {
  font-weight: 600;
}

@media (min-width: 720px) {
  .hero-grid {
    grid-template-columns: 1.2fr 1fr !important;
  }
  .step-grid {
    grid-template-columns: 1fr 1.4fr !important;
  }
}
</style>
