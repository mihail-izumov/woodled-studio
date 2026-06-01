<script setup lang="ts">
/**
 * Footer.vue — Дабл-бренд блок внизу кастомайзера.
 *
 * Один-в-один порт футера лендинга (lp/Footer.vue):
 *   - «пилюля» с двумя лого WOODLED × МОДУЛЬ РОСТА
 *   - круглая кнопка с анимацией трёх точек (волна ↔ качели)
 *   - выпадающий блок-манифест «Растём вместе»
 * …но цвета адаптированы под тёмную тему кастомайзера (токены T):
 *   - белая пилюля → T.card на T.bg + тёмная тень
 *   - чёрные лого (brightness(0)) → тонировка в T.neutral одним фильтром
 *   - rose/pink акценты → T.neutral / T.text / T.border
 *
 * Лого тонируем через filter (не mask): МОДУЛЬ РОСТА лежит на runscale.ru
 * (кросс-домен) → mask-image режется CORS, а filter на <img> работает без
 * CORS и красит оба лого в один цвет. Цепочка точно переводит чёрный
 * силуэт (brightness(0)) в #A89878 = T.neutral.
 */

import { ref, nextTick } from 'vue'
import { T } from '../theme/tokens'

const WOODLED_LOGO_URL = '/woodled-studio/customizer/woodled-logo.svg'
const RUNSCALE_LOGO_URL = 'https://runscale.ru/runscale_logo_2026_2.svg'

// brightness(0) → чёрный силуэт, далее точная тонировка в T.neutral (#A89878)
const TINT =
  'brightness(0) invert(60%) sepia(5%) saturate(1506%) hue-rotate(2deg) brightness(100%) contrast(97%)'

const expanded = ref(false)
const expandedRef = ref<HTMLElement | null>(null)

function toggleExpand() {
  const wasOpen = expanded.value
  expanded.value = !expanded.value
  // Только что открыли — доводим раскрытый блок до центра вьюпорта.
  // 720ms чуть опережает 700ms max-height transition → скроллим к финальному размеру.
  if (!wasOpen) {
    nextTick(() => {
      setTimeout(() => {
        expandedRef.value?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      }, 720)
    })
  }
}
</script>

<template>
  <footer
    :style="{
      padding: 0,
      margin: '48px 0 0',
      width: '100%',
      boxSizing: 'border-box',
    }"
  >
    <!-- Пилюля -->
    <div
      :style="{
        width: '100%',
        padding: '12px clamp(14px, 3vw, 18px)',
        /* кредиты, не продукт: лёгкая тёплая плашка в тон логотипов
           (T.neutral ~10%) — чуть светлее фона, без рамки и тени →
           не спорит с баннерами (T.card) и со стики-CTA (белая кнопка) */
        background: T.neutral + '1A',
        borderRadius: '999px',
        border: 'none',
        boxShadow: 'none',
        display: 'grid',
        gridTemplateColumns: 'clamp(36px, 8vw, 40px) 1fr clamp(36px, 8vw, 40px)',
        alignItems: 'center',
        boxSizing: 'border-box',
      }"
    >
      <!-- LEFT: спейсер для центровки -->
      <div />

      <!-- CENTER: лого + тонкий × -->
      <div
        :style="{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'clamp(12px, 3vw, 18px)',
        }"
      >
        <a
          href="https://woodled.ru"
          target="_blank"
          rel="noopener noreferrer"
          :style="{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }"
          aria-label="WOODLED"
        >
          <img
            :src="WOODLED_LOGO_URL"
            alt="WOODLED"
            :style="{
              height: 'clamp(20px, 4.2vw, 28px)',
              width: 'auto',
              display: 'block',
              filter: TINT,
            }"
          />
        </a>

        <!-- Тонкий × в приглушённом T.neutral -->
        <span
          aria-hidden="true"
          :style="{
            color: T.neutral,
            opacity: 0.55,
            display: 'inline-flex',
            alignItems: 'center',
            flexShrink: 0,
          }"
        >
          <svg
            viewBox="0 0 32 32"
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            stroke-width="0.9"
            stroke-linecap="square"
            :style="{ display: 'block' }"
          >
            <line x1="5" y1="5" x2="27" y2="27" />
            <line x1="27" y1="5" x2="5" y2="27" />
          </svg>
        </span>

        <a
          href="https://runscale.ru"
          target="_blank"
          rel="noopener noreferrer"
          :style="{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }"
          aria-label="Модуль Роста"
        >
          <img
            :src="RUNSCALE_LOGO_URL"
            alt="Модуль Роста"
            :style="{
              height: 'clamp(20px, 4.2vw, 28px)',
              width: 'auto',
              display: 'block',
              filter: TINT,
            }"
          />
        </a>
      </div>

      <!-- RIGHT: кнопка с тремя точками -->
      <button
        type="button"
        @click="toggleExpand"
        :aria-expanded="expanded"
        aria-label="Показать подробнее"
        :class="{ 'is-expanded': expanded }"
        class="footer-toggle"
        :style="{
          justifySelf: 'end',
          width: 'clamp(32px, 7vw, 38px)',
          height: 'clamp(32px, 7vw, 38px)',
          borderRadius: '50%',
          background: T.neutral + '14',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: T.neutral,
          transition: 'background 220ms ease',
        }"
      >
        <span class="footer-dots">
          <span class="footer-dot" />
          <span class="footer-dot" />
          <span class="footer-dot" />
        </span>
      </button>
    </div>

    <!-- Выпадающий манифест — доводится до центра при открытии -->
    <div
      ref="expandedRef"
      :style="{
        maxHeight: expanded ? '1500px' : '0px',
        opacity: expanded ? 1 : 0,
        marginTop: expanded ? '20px' : '0px',
        overflow: 'hidden',
        transition:
          'max-height 700ms cubic-bezier(0.4, 0, 0.2, 1), opacity 400ms ease, margin-top 400ms ease',
      }"
    >
      <div
        :style="{
          padding: 'clamp(22px, 5vw, 28px) clamp(20px, 5vw, 26px)',
          borderRadius: '22px',
          background: 'rgba(26, 23, 20, 0.72)',
          backdropFilter: 'blur(24px) saturate(140%)',
          WebkitBackdropFilter: 'blur(24px) saturate(140%)',
          border: 'none',
          boxShadow: `0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.04)`,
          textAlign: 'center',
        }"
      >
        <h3
          :style="{
            fontSize: 'clamp(22px, 5vw, 30px)',
            fontWeight: 700,
            color: T.text,
            margin: '0 0 18px',
            letterSpacing: '-0.025em',
            lineHeight: 1.12,
          }"
        >
          Растём вместе
        </h3>

        <p
          :style="{
            margin: '0 0 10px',
            fontSize: 'clamp(15px, 3.5vw, 18px)',
            lineHeight: 1.5,
            letterSpacing: '-0.005em',
            fontWeight: 600,
            color: T.text,
          }"
        >
          Сколько света нужно вашему дому?<br />Как создать в&nbsp;нём<br />неповторимое настроение?
        </p>
        <p
          :style="{
            margin: '0 0 14px',
            fontSize: 'clamp(15px, 3.5vw, 18px)',
            lineHeight: 1.5,
            letterSpacing: '-0.005em',
            fontWeight: 600,
            color: T.text,
          }"
        >
          Настоящий свет&nbsp;— это не люксы и&nbsp;люмены.<br />Это тёплые сумерки, утро в&nbsp;лесу<br />и&nbsp;ясный полдень. Это мягкое тепло<br />дуба и&nbsp;ореха в&nbsp;каждой комнате.<br />Описать это словами трудно.<br />Именно поэтому мы за это и&nbsp;берёмся.
        </p>

        <p
          :style="{
            margin: '0 0 14px',
            fontSize: 'clamp(15px, 3.5vw, 18px)',
            lineHeight: 1.5,
            letterSpacing: '-0.005em',
            fontWeight: 500,
            color: T.textSec,
          }"
        >
          WOODLED и&nbsp;МОДУЛЬ&nbsp;РОСТА объединили<br />дизайн и&nbsp;технологии, чтобы сделать<br />простые вещи ещё лучше и&nbsp;удобнее.<br />Вместе мы создали новое<br />пространство для света.
        </p>

        <p
          :style="{
            margin: 0,
            fontSize: 'clamp(15px, 3.5vw, 18px)',
            lineHeight: 1.5,
            letterSpacing: '-0.005em',
            fontWeight: 500,
            color: T.textSec,
          }"
        >
          Больше живых домов.<br />Для себя, семьи и&nbsp;близких&nbsp;— для&nbsp;жизни.
        </p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
/* —— кнопка с тремя точками ——
   У каждой точки свой keyframe на 5.5s:
     0-9%   пауза
     9-36%  волна (точки со сдвигом фазы)
     36-45% пауза
     45-82% качели — точка1/точка3 синхронно, точка2 в противофазе
     82-100% финальная пауза
   При раскрытии .is-expanded замораживает анимацию и поворачивает
   контейнер на 90° → точки вертикально (= «закрой меня»). */
.footer-toggle:hover {
  background: rgba(168, 152, 120, 0.18) !important;
}
.footer-dots {
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 3px;
  transition: transform 400ms cubic-bezier(0.4, 0, 0.2, 1);
}
.footer-toggle.is-expanded .footer-dots {
  transform: rotate(90deg);
}

.footer-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: currentColor;
  display: inline-block;
}
.footer-dot:nth-child(1) {
  animation: dot1Cycle 5.5s ease-in-out infinite;
}
.footer-dot:nth-child(2) {
  animation: dot2Cycle 5.5s ease-in-out infinite;
}
.footer-dot:nth-child(3) {
  animation: dot3Cycle 5.5s ease-in-out infinite;
}

/* Заморозка точек в раскрытом состоянии — стоят вертикально */
.footer-toggle.is-expanded .footer-dot {
  animation: none;
  transform: translateY(0);
}

@keyframes dot1Cycle {
  0%, 9% { transform: translateY(0); }
  14% { transform: translateY(-3px); }
  24% { transform: translateY(3px); }
  31% { transform: translateY(0); }
  36% { transform: translateY(0); }
  45% { transform: translateY(0); }
  55% { transform: translateY(-3px); }
  65% { transform: translateY(3px); }
  75% { transform: translateY(-3px); }
  82% { transform: translateY(0); }
  100% { transform: translateY(0); }
}

@keyframes dot2Cycle {
  0%, 9% { transform: translateY(0); }
  19% { transform: translateY(-3px); }
  29% { transform: translateY(3px); }
  35% { transform: translateY(0); }
  45% { transform: translateY(0); }
  55% { transform: translateY(3px); }
  65% { transform: translateY(-3px); }
  75% { transform: translateY(3px); }
  82% { transform: translateY(0); }
  100% { transform: translateY(0); }
}

@keyframes dot3Cycle {
  0%, 9% { transform: translateY(0); }
  24% { transform: translateY(-3px); }
  33% { transform: translateY(3px); }
  40% { transform: translateY(0); }
  45% { transform: translateY(0); }
  55% { transform: translateY(-3px); }
  65% { transform: translateY(3px); }
  75% { transform: translateY(-3px); }
  82% { transform: translateY(0); }
  100% { transform: translateY(0); }
}
</style>
