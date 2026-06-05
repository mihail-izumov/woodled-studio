<script setup>
/* FIX-2026-05-12-icons-bubble-v7 — preload masks + smooth fade-in on first mount.
   Маркер: если этого комментария нет в задеплоенном файле — залит старый. */
import { ref, computed, watch, onBeforeUnmount, onMounted } from 'vue';
import { T, LEAF_REVEALS, makeScatterPieces } from './gallery-constants.js';

const props = defineProps({
  /** Accent colour for leaf/heart/circle/dots. Falls back to T.clearing. */
  accent: { type: String, default: null },
});

const emit = defineEmits(['gift-click']);

const taps = ref(0);
/** phase: 'idle' | 'leaving' | 'empty' | 'scatter' | 'heart' */
const phase = ref('idle');
const scatterPieces = ref([]);

const c = computed(() => props.accent || T.clearing);
const isGift = computed(() => taps.value >= 4);
const reveal = computed(() => LEAF_REVEALS[Math.min(taps.value, LEAF_REVEALS.length - 1)]);

// User-provided SVG icons.
// Изначально маска ссылается на файл — браузер скачает её при первом рендере.
// На mount-е скачиваем содержимое в data: URL — после этого ВСЕ
// последующие применения маски мгновенные (нет сетевого роундтрипа).
// Это критично для сердечек: они показываются только после 4 тапов,
// и без префетча первый кадр scatter/heart-фазы виден с задержкой.
const LEAF_URL  = '/customizer/leaf-icon.svg';
const HEART_URL = '/customizer/heart-icon.svg';

const leafMaskUrl  = ref(`url("${LEAF_URL}")`);
const heartMaskUrl = ref(`url("${HEART_URL}")`);

// Флаг готовности масок: пока false — листик прозрачный, плавно проявится через
// CSS-transition когда маски загрузятся. Иначе при первом рендере виден
// резкий "поп": пустота → внезапно листик. Сбрасывается на каждом mount-е,
// поэтому fade срабатывает и при повторном заходе на страницу.
const masksLoaded = ref(false);

onMounted(async () => {
  try {
    const [leafText, heartText] = await Promise.all([
      fetch(LEAF_URL).then(r => r.text()),
      fetch(HEART_URL).then(r => r.text()),
    ]);
    leafMaskUrl.value  = `url("data:image/svg+xml;utf8,${encodeURIComponent(leafText)}")`;
    heartMaskUrl.value = `url("data:image/svg+xml;utf8,${encodeURIComponent(heartText)}")`;
  } catch {
    // Сеть не дала ответа — оставляем файловые URL, маска всё равно работает.
  }
  masksLoaded.value = true;
});

// Размер главной иконки. В круге 100×100, остаётся ~18px зазора со всех сторон.
const ICON = 64;

function iconStyle(size, color, maskUrl) {
  return {
    width: `${size}px`, height: `${size}px`,
    backgroundColor: color,
    WebkitMaskImage: maskUrl, maskImage: maskUrl,
    WebkitMaskSize: 'contain', maskSize: 'contain',
    WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center', maskPosition: 'center',
    transition: 'background-color .3s ease',
  };
}

function onTap() {
  taps.value = taps.value >= 4 ? 0 : taps.value + 1;
}

function onGiftClick(e) {
  e.stopPropagation();
  emit('gift-click');
}

// --- phase state machine ----------------------------------------------------
let timers = [];
function clearTimers() {
  timers.forEach(clearTimeout);
  timers = [];
}
onBeforeUnmount(clearTimers);

watch(taps, (n) => {
  clearTimers();
  if (n === 4) {
    phase.value = 'leaving';
    timers.push(setTimeout(() => { phase.value = 'empty'; }, 400));
    timers.push(setTimeout(() => {
      scatterPieces.value = makeScatterPieces(12);
      phase.value = 'scatter';
    }, 700));
    timers.push(setTimeout(() => { phase.value = 'heart'; }, 1100));
  } else {
    phase.value = 'idle';
  }
});

const leafAnimation = computed(() => {
  if (phase.value === 'leaving') return 'wdLeafFade .4s ease-in forwards';
  if (taps.value > 0)            return 'wdLeafShake .6s ease-out';
  return 'none';
});

const containerStyle = computed(() => ({
  width: '100%',
  height: '100%',
  background: 'linear-gradient(165deg, ' + c.value + '28 0%, ' + c.value + '0A 100%)',
  border: 'none',
  borderRadius: '14px',
  padding: '14px',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  overflow: 'hidden',
  backdropFilter: 'blur(20px) saturate(160%)',
  WebkitBackdropFilter: 'blur(20px) saturate(160%)',
  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.32), inset 1px 0 0 rgba(255, 255, 255, 0.18), inset 0 -1px 0 rgba(255, 255, 255, 0.05), inset -1px 0 0 rgba(255, 255, 255, 0.04), inset 0 0 30px rgba(255, 255, 255, 0.025), 0 2px 14px rgba(0, 0, 0, 0.22)',
  transition: 'background .5s ease',
}));
</script>

<template>
  <div :style="containerStyle">
    <div
      role="button"
      tabindex="0"
      @click="onTap"
      @keydown="(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTap(); } }"
      :style="{
        flex: 1,
        display: 'flex', flexDirection: 'column',
        cursor: 'pointer', outline: 'none', userSelect: 'none',
        minHeight: 0,
      }"
    >
      <!-- Icon zone — fixed height so the circle never shifts -->
      <div :style="{
        flex: '0 0 116px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }">
        <div :style="{
          position: 'relative',
          width: '100px', height: '100px', borderRadius: '50px',
          background: c + '1F',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'visible',
          transition: 'background-color .4s ease',
        }">
          <!-- Leaf (idle + leaving) -->
          <div
            v-if="phase === 'idle' || phase === 'leaving'"
            :key="'leaf-' + taps + '-' + phase"
            :style="{
              display: 'flex',
              animation: leafAnimation,
              transformOrigin: 'center',
              opacity: masksLoaded ? 1 : 0,
              transition: 'opacity .55s ease-out',
            }"
          >
            <div :style="iconStyle(ICON, c, leafMaskUrl)" />
          </div>

          <!-- Heart (phase 'heart') -->
          <div
            v-if="phase === 'heart'"
            key="heart"
            :style="{
              display: 'flex',
              animation: 'wdHeartShow 2.8s ease-out forwards',
              transformOrigin: 'center',
            }"
          >
            <div :style="iconStyle(ICON, c, heartMaskUrl)" />
          </div>

          <!-- Scatter hearts -->
          <template v-if="phase === 'scatter' || phase === 'heart'">
            <div
              v-for="(l, i) in scatterPieces"
              :key="'s-' + i"
              :style="{
                position: 'absolute',
                left: '50%', top: '50%',
                marginLeft: (-l.sz / 2) + 'px', marginTop: (-l.sz / 2) + 'px',
                width: l.sz + 'px', height: l.sz + 'px',
                pointerEvents: 'none',
                opacity: 0,
                '--ex': l.x + 'px',
                '--ey': l.y + 'px',
                '--er': l.rot + 'deg',
                animation: 'wdScatter ' + l.dur + 's ease-out ' + l.del + 's forwards',
                zIndex: 5,
              }"
            >
              <div :style="iconStyle(l.sz, c, heartMaskUrl)" />
            </div>
          </template>
        </div>
      </div>

      <!-- Text / button zone -->
      <div :style="{
        flex: 1, minHeight: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 4px',
      }">
        <div
          v-if="!isGift"
          :style="{
            fontSize: '14px', fontWeight: 600, color: T.text,
            lineHeight: 1.25, whiteSpace: 'pre-line', textAlign: 'center',
          }"
        >{{ reveal.text }}</div>

        <!-- Pill-shaped bubble: borderRadius 999, slightly taller -->
        <button
          v-if="phase === 'heart'"
          @click="onGiftClick"
          :style="{
            background: '#FFFFFF', color: T.bg,
            border: 'none',
            borderRadius: '999px',
            padding: '6px 16px',
            fontSize: '13px',
            fontWeight: 600,
            lineHeight: 1.2,
            fontFamily: 'inherit', cursor: 'pointer',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            animation: 'wdLeafFade .4s ease-out reverse',
            opacity: 1,
          }"
        >+3000₽ на свет</button>
      </div>
    </div>

    <!-- Progress dots -->
    <div :style="{ display: 'flex', gap: '6px', justifyContent: 'center', marginTop: '4px' }">
      <span
        v-for="m in [1, 2, 3, 4]"
        :key="m"
        :style="{
          width: '7px', height: '7px', borderRadius: '4px',
          background: taps >= m ? c : 'rgba(255, 255, 255, 0.2)',
          transition: 'background-color .25s ease',
        }"
      />
    </div>
  </div>
</template>

<style>
@keyframes wdLeafShake {
  0%, 100% { transform: rotate(0deg); }
  18% { transform: rotate(-11deg); }
  38% { transform: rotate(9deg); }
  58% { transform: rotate(-6deg); }
  80% { transform: rotate(3deg); }
}
@keyframes wdLeafFade {
  0%   { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(0.5); }
}
@keyframes wdScatter {
  0%   { opacity: 0.95; transform: translate(0, 0) rotate(0deg) scale(1); }
  30%  { opacity: 0.9; }
  100% { opacity: 0; transform: translate(var(--ex), var(--ey)) rotate(var(--er)) scale(0.5); }
}
@keyframes wdHeartShow {
  0%   { transform: scale(0.4); opacity: 0; }
  10%  { transform: scale(1.10); opacity: 1; }
  15%  { transform: scale(1); }
  26%  { transform: scale(1.15); }
  30%  { transform: scale(1); }
  34%  { transform: scale(1.24); }
  40%  { transform: scale(1); }
  54%  { transform: scale(1.15); }
  58%  { transform: scale(1); }
  62%  { transform: scale(1.24); }
  68%  { transform: scale(1); }
  82%  { transform: scale(1.15); }
  86%  { transform: scale(1); }
  90%  { transform: scale(1.24); }
  96%  { transform: scale(1); }
  100% { transform: scale(1); }
}
</style>
