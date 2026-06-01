<script setup lang="ts">
/**
 * Preloader.vue — Брендовая интро-анимация перед WelcomeScreen.
 *
 * Один экран: фирменная анимация ламелей (Rotor) + заголовок «WOODLED Студия»
 * и подзаголовок. Типографика повторяет share-страницу (public/share/index.html):
 * крупный логотип единым шрифтом.
 *
 * Тайминг (~5.5 сек):
 *   50ms   → p=1 (заголовок/подзаголовок проявляются, ламели влетают в круг)
 *   2500ms → p=2 (ламели начинают вращение + внутреннее свечение)
 *   5500ms → emit('done')
 *
 * После 'done' App.vue показывает WelcomeScreen.
 */

import { ref, onMounted, onUnmounted } from 'vue'

const emit = defineEmits<{ done: [] }>()

/* Версия сборки. Бампать здесь — единственный источник.
 * Схема 0.x: продукт ещё не запущен публично (нет публичной 1.0),
 * 0.3 = третья крупная итерация. Третий разряд не ведём —
 * мелкие правки не считаем. */
const VERSION = 'v0.3'

const p = ref(0)
let timers: ReturnType<typeof setTimeout>[] = []

function clearTimers() {
  timers.forEach(clearTimeout)
  timers = []
}

function startTimeline() {
  clearTimers()
  p.value = 0
  const schedule: [number, number][] = [
    [50, 1],     // тексты проявляются, ламели влетают в круг
    [2500, 2],   // ламели начинают spin + свечение
  ]
  schedule.forEach(([ms, val]) => {
    timers.push(setTimeout(() => { p.value = val }, ms))
  })
  /* Финал: пауза после spin чтобы анимация прочиталась, затем done —
   * App.vue запускает crossfade в WelcomeScreen. */
  timers.push(setTimeout(() => emit('done'), 5500))
}

onMounted(startTimeline)
onUnmounted(clearTimers)

const N = 20  // ламелей в круге
const R = 80  // радиус
</script>

<template>
  <div class="pl">
    <!-- Заголовок — крупно, как логотип на share-странице -->
    <div :class="['pl-logo', { v: p >= 1 }]">WOODLED&nbsp;Студия</div>

    <!-- Stage: ламели вращающиеся -->
    <div class="pl-stage">
      <div :class="['pl-rotor', { v: p >= 1 }]">
        <div :class="['pl-asm', { spin: p >= 2 }]">
          <div
            v-for="i in N"
            :key="`pl-rs-${i}`"
            class="pl-rs"
            :class="{ in: p >= 1 }"
            :style="{
              transform: p >= 1
                ? `rotate(${((i-1)/N)*360}deg) translateY(-${R}px)`
                : `rotate(${((i-1)/N)*360}deg) translateY(-${R+90}px)`,
              transitionDelay: `${(i-1)*50}ms`,
            }"
          />
          <template v-if="p >= 2">
            <div
              v-for="i in N"
              :key="`pl-rsg-${i}`"
              class="pl-rsg"
              :style="{
                transform: `rotate(${((i-1)/N)*360}deg) translateY(-${R*0.55}px)`,
                animationDelay: `${(i-1)*0.15}s`,
              }"
            />
          </template>
        </div>
      </div>
    </div>

    <!-- Подзаголовок — крупно, как тэглайн на share-странице -->
    <div :class="['pl-sub', { v: p >= 1 }]">
      Настоящее дерево становится<br />живым светом в&nbsp;доме
    </div>

    <!-- Версия сборки — полупрозрачно, внизу (как в мобильных приложениях) -->
    <div class="pl-ver">{{ VERSION }}</div>
  </div>
</template>

<style scoped>
/* CSS-variables для тёплых тонов дерева. Источник — woodled-data.js (C). */
.pl {
  --pl-bg: #0A0908;
  --pl-text: #F0EAE0;
  --pl-text2: #C0B8AE;
  --pl-warm: #f5e6c8;
  --pl-gold: #c8a872;
  --pl-oak: #b4915a;
  --pl-oakL: #d4b87a;
  --pl-oakD: #8a6e3e;

  position: fixed;
  inset: 0;
  z-index: 9000;
  background: var(--pl-bg);
  color: var(--pl-text);
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', system-ui, sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 24px;
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
}

/* Заголовок — единым шрифтом, как логотип на share-странице */
.pl-logo {
  font-size: clamp(26px, 6vw, 40px);
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1;
  color: var(--pl-text);
  text-align: center;
  margin-bottom: 44px;
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 1s ease, transform 1s ease;
}
.pl-logo.v {
  opacity: 1;
  transform: translateY(0);
}

/* Stage с ламелями */
.pl-stage {
  position: relative;
  width: 100%;
  max-width: 340px;
  height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 44px;
}

/* Rotor ламели в круге */
.pl-rotor {
  position: absolute;
  width: 200px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 1.2s ease;
}
.pl-rotor.v { opacity: 1; }
.pl-asm {
  width: 200px;
  height: 200px;
  position: relative;
}
.pl-asm.spin { animation: plSpin 48s linear infinite; }
.pl-rs {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 6px;
  height: 60px;
  border-radius: 2px;
  margin-top: -30px;
  margin-left: -3px;
  transform-origin: center center;
  opacity: 0;
  transition: transform 1s, opacity .8s;
  background: linear-gradient(to bottom, var(--pl-oakL), var(--pl-oak), var(--pl-oakD));
}
.pl-rs.in { opacity: .85; }
.pl-rsg {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 4px;
  height: 24px;
  margin-top: -12px;
  margin-left: -2px;
  transform-origin: center center;
  background: color-mix(in srgb, var(--pl-warm) 7%, transparent);
  border-radius: 2px;
  filter: blur(4px);
  animation: plGlow 2.5s ease-in-out infinite;
}

/* Подзаголовок — крупно, как тэглайн на share-странице */
.pl-sub {
  text-align: center;
  max-width: 360px;
  font-size: clamp(15px, 4vw, 18px);
  font-weight: 600;
  line-height: 1.45;
  letter-spacing: 0.1px;
  color: var(--pl-text);
  opacity: 0;
  transform: translateY(14px);
  transition: all 1s;
}
.pl-sub.v {
  opacity: 1;
  transform: translateY(0);
}

/* Версия сборки — полупрозрачно, прижата к низу */
.pl-ver {
  position: absolute;
  left: 0;
  right: 0;
  bottom: calc(env(safe-area-inset-bottom, 0px) + 22px);
  text-align: center;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.06em;
  color: var(--pl-text2);
  opacity: 0.35;
}

@keyframes plSpin { to { transform: rotate(360deg); } }
@keyframes plGlow {
  0%, 100% { opacity: .5; }
  50% { opacity: 1; }
}

@media (max-width: 420px) {
  .pl-logo { margin-bottom: 32px; }
  .pl-stage { height: 200px; margin-bottom: 32px; }
}
</style>
