<script setup lang="ts">
/**
 * Preloader.vue — Брендовая интро-анимация перед WelcomeScreen.
 *
 * Источник: WoodledOnboarding/ChLight.vue (Глава 2). Урезанная версия:
 *   - Без названия главы и заголовка
 *   - Без свитча и теней с животными
 *   - Только 2 фазы: фото Rotor → ламели в круг
 *
 * Тайминг (~9 сек):
 *   200ms  → p=0 (фото проявляется)
 *   1200ms → p=1 (текст 1 проявляется)
 *   5500ms → p=2 (фото исчезает, ламели разлетаются на свои места,
 *                 текст меняется на "Ламели встают в круг")
 *   7500ms → p=3 (ламели начинают вращение)
 *   9000ms → emit('done')
 *
 * После 'done' App.vue показывает WelcomeScreen.
 */

import { ref, onMounted, onUnmounted } from 'vue'

const emit = defineEmits<{ done: [] }>()

const ROTOR_URL = '/woodled-studio/onboarding/rotor.png'

const p = ref(-1)
const rotorLoaded = ref(false)
let timers: ReturnType<typeof setTimeout>[] = []

function clearTimers() {
  timers.forEach(clearTimeout)
  timers = []
}

function preloadImg(src: string) {
  return new Promise<void>((resolve) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => resolve() // fallback — продолжаем даже при ошибке
    img.src = src
  })
}

function startTimeline() {
  clearTimers()
  p.value = -1
  const schedule: [number, number][] = [
    [50, 0],     // фото проявляется почти сразу
    [1000, 1],   // текст проявляется
    [5500, 2],   // фото уходит, ламели разлетаются, текст 2
    [7500, 3],   // ламели начинают spin
  ]
  schedule.forEach(([ms, val]) => {
    timers.push(setTimeout(() => { p.value = val }, ms))
  })
  /* Финал: пауза +1s после spin чтобы текст успел прочитаться,
   * затем эмитим done — App.vue запускает crossfade в WelcomeScreen. */
  timers.push(setTimeout(() => emit('done'), 11000))
}

onMounted(() => {
  /* Таймлайн стартует сразу — фото проявится через v-if когда загрузится.
   * Ждать preloadImg синхронно нельзя: это создаёт visible задержку перед
   * запуском анимации. */
  preloadImg(ROTOR_URL).then(() => { rotorLoaded.value = true })
  startTimeline()
})

onUnmounted(clearTimers)

const N = 20  // ламелей в круге
const R = 80  // радиус
</script>

<template>
  <div class="pl">
    <!-- Stage: фото rotor + ламели вращающиеся -->
    <div class="pl-stage">
      <!-- Фото rotor — видимо на p=0..1, исчезает на p>=2 -->
      <div :class="['pl-photo', { v: p >= 0 && rotorLoaded, fade: p >= 2 }]">
        <div class="pl-glow" />
        <img v-if="rotorLoaded" :src="ROTOR_URL" alt="WOODLED Rotor" class="pl-img" />
        <div class="pl-fade-top" />
      </div>

      <!-- Ламели — появляются на p>=2, спин на p>=3 -->
      <div :class="['pl-rotor', { v: p >= 2 }]">
        <div :class="['pl-asm', { spin: p >= 3 }]">
          <div
            v-for="i in N"
            :key="`pl-rs-${i}`"
            class="pl-rs"
            :class="{ in: p >= 2 }"
            :style="{
              transform: p >= 2
                ? `rotate(${((i-1)/N)*360}deg) translateY(-${R}px)`
                : `rotate(${((i-1)/N)*360}deg) translateY(-${R+90}px)`,
              transitionDelay: `${(i-1)*50}ms`,
            }"
          />
          <template v-if="p >= 3">
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

    <!-- Тексты — двойной layer с crossfade -->
    <div :class="['pl-txt', { v: p >= 1 }]">
      <div class="pl-stack">
        <div :class="['pl-layer', { v: p < 2 }]">
          <div class="pl-h">Дом с WOODLED Rotor</div>
          <div class="pl-p">Настоящее дерево становится<br />живым светом в доме.</div>
        </div>
        <div :class="['pl-layer', { v: p >= 2 }]">
          <div class="pl-h">Ламели встают в круг</div>
          <div class="pl-p">
            Простота. Природа. Ничего лишнего.<br />
            Только дерево, свет и воздух между ними.
          </div>
        </div>
      </div>
    </div>
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
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 24px;
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
}

/* Stage с rotor/ламелями */
.pl-stage {
  position: relative;
  width: 100%;
  max-width: 340px;
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 30px;
}

/* Rotor фото */
.pl-photo {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transform: translateY(-80px);
  transition: all 1.5s ease;
}
.pl-photo.v {
  opacity: 1;
  transform: translateY(0);
}
.pl-photo.fade {
  opacity: 0;
  transform: translateY(-30px) scale(.92);
  transition: all 1.5s ease;
}

.pl-glow {
  position: absolute;
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 220px;
  height: 220px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    color-mix(in srgb, var(--pl-warm) 19%, transparent),
    color-mix(in srgb, var(--pl-warm) 6%, transparent),
    transparent
  );
  filter: blur(30px);
}
.pl-img {
  position: relative;
  z-index: 2;
  max-width: 100%;
  max-height: 300px;
  object-fit: contain;
  filter: drop-shadow(0 10px 40px color-mix(in srgb, var(--pl-warm) 13%, transparent)) brightness(1.05);
  -webkit-mask-image: radial-gradient(ellipse 55% 50% at 50% 50%, #000 40%, rgba(0, 0, 0, .7) 65%, transparent 90%);
  mask-image: radial-gradient(ellipse 55% 50% at 50% 50%, #000 40%, rgba(0, 0, 0, .7) 65%, transparent 90%);
}
.pl-fade-top {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 40%;
  background: linear-gradient(to bottom, var(--pl-bg), transparent);
  z-index: 3;
  pointer-events: none;
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

/* Текст */
.pl-txt {
  text-align: center;
  margin-top: 0;
  width: 100%;
  max-width: 380px;
  opacity: 0;
  transform: translateY(14px);
  transition: all 1s;
}
.pl-txt.v {
  opacity: 1;
  transform: translateY(0);
}
.pl-stack {
  position: relative;
  width: 100%;
  min-height: 110px;
}
.pl-layer {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  opacity: 0;
  transition: opacity 1.2s ease;
  pointer-events: none;
  text-align: center;
}
.pl-layer.v { opacity: 1; }
.pl-h {
  font-size: 22px;
  font-weight: 700;
  color: var(--pl-text);
  line-height: 1.35;
  margin-bottom: 8px;
}
.pl-p {
  font-size: 13px;
  line-height: 1.8;
  color: var(--pl-text2);
  max-width: 320px;
  margin: 0 auto;
}

@keyframes plSpin { to { transform: rotate(360deg); } }
@keyframes plGlow {
  0%, 100% { opacity: .5; }
  50% { opacity: 1; }
}
</style>
