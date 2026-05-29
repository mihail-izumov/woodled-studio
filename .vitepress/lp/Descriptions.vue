<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { PAGE } from './tokens'

/**
 * Section structure (rev. May 2026):
 *   1. H2  «WOODLED Smart»  + lead paragraph (Apple Intelligence cadence)
 *      «Шаг за шагом» punchline forced onto its own line via <br />.
 *   2. Card  3 типа дома
 *   3. Card  Доверьтесь зелёной галочке
 *   4. Card  Живые рекомендации
 *   5. Card  «Дизайнер — это Я» — interactive trigger card
 *
 * Modal mobile fix:
 *   .designer-modal previously used position: fixed + inset: 0, which on
 *   iOS Safari leaves a strip of LP visible at the bottom when the URL bar
 *   collapses (visible viewport > 100vh). Adding `height: 100dvh` makes the
 *   modal track the dynamic viewport; `100vh` stays as fallback for browsers
 *   that don't know dvh (pre-Safari 15.4, pre-Chrome 108).
 */

const modalOpen = ref(false)
const revealing = ref(false)
const dragY = ref(0)
const isDragging = ref(false)

let touchStartY = 0
let escListener: ((e: KeyboardEvent) => void) | null = null
let revealTimer: ReturnType<typeof setTimeout> | null = null

function openModal() {
  if (revealTimer !== null) {
    clearTimeout(revealTimer)
    revealTimer = null
  }
  revealing.value = false
  modalOpen.value = true
  if (typeof document !== 'undefined') {
    document.body.style.overflow = 'hidden'
  }
}

function closeModal() {
  modalOpen.value = false
  if (revealTimer !== null) {
    clearTimeout(revealTimer)
    revealTimer = null
  }
  setTimeout(() => {
    dragY.value = 0
    revealing.value = false
  }, 400)
  if (typeof document !== 'undefined') {
    document.body.style.overflow = ''
  }
}

function reveal() {
  if (revealing.value) return
  revealing.value = true
  revealTimer = setTimeout(() => {
    modalOpen.value = false
    if (typeof document !== 'undefined') {
      document.body.style.overflow = ''
    }
    setTimeout(() => {
      dragY.value = 0
      revealing.value = false
    }, 400)
    revealTimer = null
  }, 1900)
}

function onTouchStart(e: TouchEvent) {
  if (revealing.value) return
  if (!e.touches[0]) return
  touchStartY = e.touches[0].clientY
  isDragging.value = true
}
function onTouchMove(e: TouchEvent) {
  if (revealing.value || !isDragging.value || !e.touches[0]) return
  dragY.value = Math.max(0, e.touches[0].clientY - touchStartY)
}
function onTouchEnd() {
  if (revealing.value) return
  isDragging.value = false
  if (dragY.value > 110) {
    closeModal()
  } else {
    dragY.value = 0
  }
}

onMounted(() => {
  escListener = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && modalOpen.value && !revealing.value) closeModal()
  }
  window.addEventListener('keydown', escListener)
})

onBeforeUnmount(() => {
  if (escListener) {
    window.removeEventListener('keydown', escListener)
    escListener = null
  }
  if (revealTimer !== null) {
    clearTimeout(revealTimer)
    revealTimer = null
  }
  if (typeof document !== 'undefined') {
    document.body.style.overflow = ''
  }
})
</script>

<template>
  <!--
    Top padding bumped from 20px → clamp(56px, 11vw, 96px). On mobile that's
    ~56–60px of breathing room above «WOODLED Smart» (was 20). On desktop
    it lands at 96px, which gives the section a clearer break from the
    slider above.
  -->
  <section :style="{ padding: 'clamp(56px, 11vw, 96px) 24px 56px', maxWidth: '720px', margin: '0 auto' }">
    <h2
      :style="{
        fontSize: 'clamp(32px, 7vw, 48px)',
        fontWeight: 700,
        color: PAGE.text,
        textAlign: 'center',
        margin: '0 0 16px',
        letterSpacing: '-0.025em',
        lineHeight: 1.08,
      }"
    >
      WOODLED&nbsp;Smart
    </h2>

    <p
      :style="{
        fontSize: 'clamp(16px, 3.8vw, 19px)',
        fontWeight: 500,
        lineHeight: 1.5,
        color: PAGE.textSec,
        textAlign: 'center',
        maxWidth: '560px',
        margin: '0 auto 36px',
        letterSpacing: '-0.005em',
      }"
    >
      Работает в каждой комнате, кухне и&nbsp;коридоре, чтобы помочь вам управлять дизайном, настраивать атмосферу и&nbsp;находить правильный баланс света.
      <br />
      Шаг за шагом.
    </p>

    <div :style="{ display: 'flex', flexDirection: 'column', gap: '14px' }">
      <!-- Card 1 -->
      <div
        :style="{
          padding: '28px 26px',
          borderRadius: '28px',
          background: 'rgba(255, 250, 244, 0.55)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: `1px solid ${PAGE.glassBorder}`,
          boxShadow: `0 8px 32px rgba(184, 125, 82, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.65)`,
        }"
      >
        <p
          :style="{
            margin: 0,
            fontSize: 'clamp(18px, 4.2vw, 22px)',
            lineHeight: 1.35,
            letterSpacing: '-0.015em',
            textAlign: 'center',
            fontWeight: 500,
            color: PAGE.text,
          }"
        >
          <span :style="{ color: PAGE.roseDeep, fontWeight: 600 }">3 типа дома</span>, от студии до семейного гнезда. Можно начать с чистого листа – добавить новые комнаты и светильники. Перекрасить стены тоже можно.
        </p>
      </div>

      <!-- Card 2 -->
      <div
        :style="{
          padding: '28px 26px',
          borderRadius: '28px',
          background: 'rgba(255, 250, 244, 0.55)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: `1px solid ${PAGE.glassBorder}`,
          boxShadow: `0 8px 32px rgba(184, 125, 82, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.65)`,
        }"
      >
        <p
          :style="{
            margin: 0,
            fontSize: 'clamp(18px, 4.2vw, 22px)',
            lineHeight: 1.35,
            letterSpacing: '-0.015em',
            textAlign: 'center',
            fontWeight: 500,
            color: PAGE.text,
          }"
        >
          <span :style="{ color: PAGE.roseDeep, fontWeight: 600 }">Доверьтесь зелёной галочке.</span> От размера люстры и цвета крепления, до количества ламп и яркости. WOODLED SMART подскажет лучший выбор.
        </p>
      </div>

      <!-- Card 3 -->
      <div
        :style="{
          padding: '28px 26px',
          borderRadius: '28px',
          background: 'rgba(255, 250, 244, 0.55)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: `1px solid ${PAGE.glassBorder}`,
          boxShadow: `0 8px 32px rgba(184, 125, 82, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.65)`,
        }"
      >
        <p
          :style="{
            margin: 0,
            fontSize: 'clamp(18px, 4.2vw, 22px)',
            lineHeight: 1.35,
            letterSpacing: '-0.015em',
            textAlign: 'center',
            fontWeight: 500,
            color: PAGE.text,
          }"
        >
          <span :style="{ color: PAGE.roseDeep, fontWeight: 600 }">Живые рекомендации.</span> Люстру поменьше – бра поярче. Вы меняете параметры и расстановку светильников – видите как изменилось настроение.
        </p>
      </div>

      <!-- Card 4 — relocated «Дизайнер — это Я» trigger -->
      <div
        :style="{
          padding: '28px 26px',
          borderRadius: '28px',
          background: `linear-gradient(135deg, rgba(248, 218, 210, 0.65) 0%, rgba(251, 227, 212, 0.55) 100%)`,
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: `1px solid rgba(255, 255, 255, 0.55)`,
          boxShadow: `0 10px 36px rgba(184, 125, 82, 0.20), inset 0 1px 0 rgba(255, 255, 255, 0.75), 0 0 40px rgba(232, 181, 160, 0.18)`,
          marginTop: '6px',
        }"
      >
        <h3
          :style="{
            margin: 0,
            fontSize: 'clamp(24px, 5.6vw, 32px)',
            fontWeight: 700,
            color: PAGE.text,
            textAlign: 'center',
            letterSpacing: '-0.022em',
            lineHeight: 1.15,
          }"
        >
          Дизайнер&nbsp;— это <button
            type="button"
            class="ya-inline"
            @click="openModal"
            aria-label="Привет, дизайнер"
          >Я</button>
        </h3>
      </div>
    </div>
  </section>

  <!-- "Mirror" modal — teleported to body so it escapes the LP wrapper -->
  <Teleport to="body">
    <Transition name="dm">
      <div
        v-if="modalOpen"
        class="designer-modal"
        :class="{ 'is-revealing': revealing }"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dm-title"
        @touchstart="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
        :style="{
          transform: `translateY(${dragY}px)`,
          transition: isDragging || revealing
            ? 'background-color 1800ms cubic-bezier(0.4, 0, 0.2, 1)'
            : 'transform 320ms cubic-bezier(0.4, 0, 0.2, 1), background-color 1800ms cubic-bezier(0.4, 0, 0.2, 1)',
          opacity: 1 - Math.min(dragY / 400, 0.35),
        }"
      >
        <div class="designer-modal__handle" aria-hidden="true" />

        <div class="designer-modal__top">
          <div id="dm-title" class="designer-modal__title">
            Привет, дизайнер!
          </div>
        </div>

        <div class="designer-modal__bottom">
          <button
            type="button"
            class="designer-modal__cta"
            @click="reveal"
            :disabled="revealing"
          >
            Включить свет
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.ya-inline {
  display: inline-block;
  width: 1.15em;
  height: 1.15em;
  line-height: 1.15em;
  text-align: center;
  vertical-align: baseline;
  margin-left: 0.18em;

  border: 0.11em solid currentColor;
  border-radius: 50%;

  font: inherit;
  color: inherit;
  letter-spacing: 0;
  background: none;
  padding: 0;
  cursor: pointer;
  box-sizing: content-box;

  transition: opacity 180ms ease, transform 120ms ease;
}
.ya-inline:hover { opacity: 0.65; }
.ya-inline:active { transform: scale(0.94); }
.ya-inline:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 4px;
}
</style>

<style>
.designer-modal {
  position: fixed;
  inset: 0;
  /*
    Mobile fix — without these, iOS Safari leaves a strip of LP visible
    below the modal when the URL bar collapses (the visible viewport then
    exceeds 100vh, but `inset: 0` was sized against the smaller layout
    viewport). 100dvh tracks the dynamic viewport so the modal always fills
    whatever the user actually sees. 100vh stays as the pre-dvh fallback.
  */
  height: 100vh;
  height: 100dvh;
  min-height: 100vh;
  min-height: 100dvh;
  z-index: 1000;
  background: #000;

  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 56px 24px 56px;
  box-sizing: border-box;

  touch-action: none;
  will-change: transform, opacity, background-color;
}

.designer-modal.is-revealing {
  background-color: rgba(0, 0, 0, 0);
  pointer-events: none;
}
.designer-modal.is-revealing .designer-modal__title,
.designer-modal.is-revealing .designer-modal__cta,
.designer-modal.is-revealing .designer-modal__handle {
  opacity: 0;
  transition: opacity 400ms ease;
}

.designer-modal__handle {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  width: 44px;
  height: 5px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.22);
  transition: opacity 400ms ease;
}

.designer-modal__top {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
  padding-top: 6vh;
}

.designer-modal__title {
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Inter', system-ui, sans-serif;
  font-size: clamp(26px, 6.5vw, 38px);
  font-weight: 600;
  color: #FFFFFF;
  letter-spacing: -0.02em;
  text-align: center;
  line-height: 1.15;
  transition: opacity 400ms ease;
}

.designer-modal__bottom {
  margin-top: auto;
  margin-bottom: max(env(safe-area-inset-bottom, 0px), 4vh);
  display: flex;
  justify-content: center;
  transition: opacity 400ms ease;
}

.designer-modal__cta {
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Inter', system-ui, sans-serif;
  padding: 18px 38px;
  font-size: 17px;
  font-weight: 600;
  color: #1D1D1F;
  background: #FFFFFF;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    0 12px 32px rgba(255, 255, 255, 0.16);
  transition: transform 180ms ease, box-shadow 180ms ease, opacity 400ms ease;
  white-space: nowrap;
}
.designer-modal__cta:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    0 16px 36px rgba(255, 255, 255, 0.22);
}
.designer-modal__cta:active:not(:disabled) { transform: translateY(0); }
.designer-modal__cta:disabled { cursor: default; }

.dm-enter-active,
.dm-leave-active {
  transition: opacity 280ms ease, transform 380ms cubic-bezier(0.4, 0, 0.2, 1);
}
.dm-enter-from {
  opacity: 0;
  transform: translateY(100%) !important;
}
.dm-leave-to {
  opacity: 0;
  transform: translateY(100%) !important;
}
</style>
