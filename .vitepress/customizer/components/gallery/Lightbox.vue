<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { T, objectPositionFor } from './gallery-constants.js';

const props = defineProps({
  photos:   { type: Array,  required: true },
  startIdx: { type: Number, required: true },
});

const emit = defineEmits(['close']);

const idx       = ref(props.startIdx);
const isMobile  = ref(typeof window !== 'undefined' && window.innerWidth < 640);
const screenAspect = ref(
  typeof window !== 'undefined' ? window.innerWidth / window.innerHeight : 0.46
);
const panX      = ref(50);
const holding   = ref(null); // null | 'left' | 'right'

const touchRef    = { x: 0, y: 0, t: 0 };
let holdStart     = 0;
let holdTimer     = null;
let prevBodyOverflow = '';

// --- lifecycle: lock body scroll, listen for keys & resize ------------------
function onResize() {
  isMobile.value = window.innerWidth < 640;
  screenAspect.value = window.innerWidth / window.innerHeight;
}

function onKey(e) {
  if (e.key === 'Escape')     emit('close');
  else if (e.key === 'ArrowLeft')  idx.value = (idx.value - 1 + props.photos.length) % props.photos.length;
  else if (e.key === 'ArrowRight') idx.value = (idx.value + 1) % props.photos.length;
}

onMounted(() => {
  window.addEventListener('resize', onResize);
  window.addEventListener('keydown', onKey);
  prevBodyOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  // Класс на body — позволяет странице (или global CSS) скрыть mute-кнопку
  // и sticky bottom-меню SuperApp пока lightbox открыт.
  document.body.classList.add('gallery-lightbox-open');
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize);
  window.removeEventListener('keydown', onKey);
  document.body.style.overflow = prevBodyOverflow;
  document.body.classList.remove('gallery-lightbox-open');
  if (holdTimer) clearInterval(holdTimer);
});

// --- reset pan when photo changes -------------------------------------------
watch(idx, () => { panX.value = 50; });

// --- hold-to-pan with acceleration ------------------------------------------
watch(holding, (dir) => {
  if (holdTimer) { clearInterval(holdTimer); holdTimer = null; }
  if (!dir) return;
  holdStart = Date.now();
  const tick = () => {
    const heldFor = Date.now() - holdStart;
    const speed = 1 + Math.min(heldFor / 1000, 1) * 4; // 1 → 5 over 1s
    const sign  = dir === 'left' ? -1 : 1;
    panX.value = Math.max(0, Math.min(100, panX.value + sign * speed));
  };
  tick();
  holdTimer = setInterval(tick, 50);
});

// --- swipe handlers ---------------------------------------------------------
function onTouchStart(e) {
  const t = e.touches[0];
  touchRef.x = t.clientX; touchRef.y = t.clientY; touchRef.t = Date.now();
}
function onTouchEnd(e) {
  const t  = e.changedTouches[0];
  const dx = t.clientX - touchRef.x;
  const dy = t.clientY - touchRef.y;
  const dt = Date.now() - touchRef.t;
  if (dt > 600) return;
  if (Math.abs(dy) > Math.abs(dx) && dy > 60) { emit('close'); return; }
  if (Math.abs(dx) > 60) {
    idx.value = (idx.value + (dx < 0 ? 1 : -1) + props.photos.length) % props.photos.length;
  }
}

// --- derived ----------------------------------------------------------------
const photo = computed(() => props.photos[idx.value]);
/* needsHorizontalPan: на mobile (objectFit: cover, fill 100vw/100vh) фото
   будет cropped по горизонтали когда его aspect больше aspect экрана.
   Это покрывает И горизонтальные (aspect 1.5), И вертикальные шире экрана
   (например aspect 0.7 на iPhone где screen aspect ~0.46). */
const needsHorizontalPan = computed(() =>
  isMobile.value && photo.value && photo.value.aspect > screenAspect.value
);
const objPos = computed(() => {
  if (!photo.value) return 'center';
  const zone = photo.value.zone;
  const yPos = zone === 'ceiling' ? '0%' : zone === 'floor' ? '100%' : '50%';
  return needsHorizontalPan.value
    ? (panX.value + '% ' + yPos)
    : (zone ? objectPositionFor(zone) : 'center');
});

// "дуб" → "Дуб"
const woodLabel = computed(() => {
  const w = photo.value && photo.value.wood && photo.value.wood.name;
  return w ? (w.charAt(0).toUpperCase() + w.slice(1)) : '';
});

// "rotor_m" → "Rotor M", "rotor_1000" → "Rotor 1000"
const modelLabel = computed(() => {
  const m = photo.value && photo.value.model;
  if (!m) return '';
  return m.split('_')
    .map(p => /^\d+$/.test(p) ? p : (p.charAt(0).toUpperCase() + p.slice(1)))
    .join(' ');
});

function stop(e)            { e.stopPropagation(); }
function close(e)           { if (e) e.stopPropagation(); emit('close'); }
</script>

<template>
  <Teleport to="body">
    <div
      v-if="photo"
      @click="close"
      @touchstart="onTouchStart"
      @touchend="onTouchEnd"
      :style="{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: 'rgba(8,7,5,0.94)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        touchAction: 'none',
        overscrollBehavior: 'contain',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
      }"
    >
      <!-- Close pill — top center -->
      <button
        @click="close"
        :style="{
          position: 'absolute', top: '16px', left: '50%',
          transform: 'translateX(-50%)', zIndex: 3,
          background: 'rgba(255,255,255,0.95)', color: T.bg,
          border: 'none', borderRadius: '22px',
          padding: '8px 16px 8px 14px',
          fontSize: '13px', fontWeight: 500,
          fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', gap: '6px',
          cursor: 'pointer',
          boxShadow: '0 2px 12px rgba(0,0,0,0.35)',
        }"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        Закрыть
      </button>

      <!-- Image -->
      <img
        :src="photo.src"
        :alt="photo.label"
        draggable="false"
        @click="stop"
        :style="{
          width:  isMobile ? '100vw' : 'auto',
          height: isMobile ? '100vh' : 'auto',
          maxWidth: '100vw', maxHeight: '100vh',
          objectFit:     isMobile ? 'cover' : 'contain',
          objectPosition: objPos,
          display: 'block',
          transition: holding ? 'none' : 'object-position .15s ease',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
        }"
      />

      <!-- Wood + model badge -->
      <div
        v-if="photo.wood"
        :style="{
          position: 'absolute',
          bottom: isMobile ? (needsHorizontalPan ? '58px' : '88px') : '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex', alignItems: 'center', gap: '10px',
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          padding: '9px 18px 9px 13px',
          borderRadius: '28px', zIndex: 5,
          boxShadow: '0 2px 14px rgba(0,0,0,0.35)',
        }"
      >
        <span :style="{
          width: '14px', height: '14px', borderRadius: '7px',
          background: photo.wood.color, flexShrink: 0,
        }" />
        <span :style="{
          fontSize: '15px', fontWeight: 600, color: '#fff',
          whiteSpace: 'nowrap', letterSpacing: '0.2px',
        }">{{ woodLabel }}<template v-if="modelLabel"> | {{ modelLabel }}</template></span>
      </div>

      <!-- Pan controls (horizontal photos only) — опущены ниже для thumb-reach -->
      <div
        v-if="needsHorizontalPan"
        @click="stop"
        :style="{
          position: 'absolute',
          bottom: isMobile ? '120px' : '90px',
          left: '50%',
          transform: 'translateX(-50%)', zIndex: 3,
          display: 'flex', gap: '12px',
          background: 'rgba(0,0,0,0.5)', padding: '4px', borderRadius: '30px',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }"
      >
        <button
          v-for="dir in ['left', 'right']"
          :key="dir"
          @mousedown.stop="holding = dir"
          @mouseup.stop="holding = null"
          @mouseleave="holding = null"
          @touchstart.stop.prevent="holding = dir"
          @touchend.stop.prevent="holding = null"
          @touchcancel.stop.prevent="holding = null"
          @click.stop
          @contextmenu.prevent
          :aria-label="dir === 'left' ? 'Двигать влево' : 'Двигать вправо'"
          :style="{
            width: '48px', height: '48px', borderRadius: '24px', border: 'none',
            background: holding === dir ? 'rgba(255,255,255,0.32)' : 'rgba(255,255,255,0.16)',
            color: T.text, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            touchAction: 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            WebkitTouchCallout: 'none',
            WebkitTapHighlightColor: 'transparent',
            transition: 'background .12s ease',
          }"
        >
          <svg v-if="dir === 'left'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events:none"><path d="m15 18-6-6 6-6"/></svg>
          <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events:none"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      </div>
    </div>
  </Teleport>
</template>

<style>
/* Скрытие siblings (mute button и sticky bottom-меню SuperApp) пока открыт lightbox.
   Селекторы безопасны — если в проекте таких классов нет, эти правила ничего не делают. */
body.gallery-lightbox-open .mute-toggle,
body.gallery-lightbox-open .audio-toggle,
body.gallery-lightbox-open [data-audio-toggle],
body.gallery-lightbox-open .sticky-bottom,
body.gallery-lightbox-open .app-bottom-nav,
body.gallery-lightbox-open [data-sticky-bottom],
body.gallery-lightbox-open [data-sticky-footer] {
  display: none !important;
}
</style>
