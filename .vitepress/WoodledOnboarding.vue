<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { cssVars, BTN_LABELS, AUDIO_SRC, NAV_ICONS, SOUND_ICONS, CUSTOMIZER_URL, LEAF_ICON } from './woodled-data.js'
import ChForest from './chapters/ChForest.vue'
import ChLight from './chapters/ChLight.vue'
import ChHome from './chapters/ChHome.vue'
import ChRotor from './chapters/ChRotor.vue'

const emit = defineEmits(['finish'])

const step = ref(0)
const fading = ref(false)
const lightReady = ref(false)
const muted = ref(true)
const showSoundHint = ref(true)
const audioRef = ref(null)
const splash = ref(true)

let goToTimeout = null
let hintTimer = null

function goTo(target) {
  if (target === step.value || target < 0 || target > 3) return
  fading.value = true
  if (goToTimeout) clearTimeout(goToTimeout)
  goToTimeout = setTimeout(() => {
    step.value = target
    fading.value = false
    lightReady.value = false
  }, 350)
}

function toggleSound() {
  // eslint-disable-next-line no-console
  console.log('Sound toggle clicked, current muted:', muted.value)
  showSoundHint.value = false
  const newMuted = !muted.value
  muted.value = newMuted
  const a = audioRef.value
  if (!a) return
  a.muted = newMuted
  if (!newMuted) {
    a.volume = 0.6
    const p = a.play()
    if (p && p.catch) p.catch(e => console.warn('Audio play failed:', e))
  } else {
    a.pause()
  }
}

function onCtaStart() {
  emit('finish')
}

function skipToCustomizer() {
  if (typeof window !== 'undefined') {
    window.location.href = CUSTOMIZER_URL
  }
}

// Auto-hide hint after 8s
watch(showSoundHint, (v) => {
  if (hintTimer) { clearTimeout(hintTimer); hintTimer = null }
  if (v) hintTimer = setTimeout(() => { showSoundHint.value = false }, 8000)
}, { immediate: true })

onMounted(() => {
  // Inject Google Fonts once (idempotent)
  if (typeof document !== 'undefined' && !document.getElementById('woodled-fonts')) {
    const l = document.createElement('link')
    l.id = 'woodled-fonts'
    l.rel = 'stylesheet'
    l.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap'
    document.head.appendChild(l)
  }
  // Lock page scroll
  if (typeof document !== 'undefined') {
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    document.body.style.overscrollBehavior = 'none'
  }
  // Dismiss splash after layout settles (VitePress nav is already hidden by z-index)
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      setTimeout(() => { splash.value = false }, 400)
    })
  })
})

onUnmounted(() => {
  if (goToTimeout) clearTimeout(goToTimeout)
  if (hintTimer) clearTimeout(hintTimer)
  // Restore page scroll
  if (typeof document !== 'undefined') {
    document.documentElement.style.overflow = ''
    document.body.style.overflow = ''
    document.body.style.overscrollBehavior = ''
  }
})
</script>

<template>
  <div class="ob" :style="cssVars">
    <!-- Splash: covers everything (incl VitePress nav) until component settles -->
    <Transition name="splash-fade">
      <div v-if="splash" class="ob-splash">
        <div class="ob-splash-leaf" v-html="LEAF_ICON" />
      </div>
    </Transition>

    <audio ref="audioRef" :src="AUDIO_SRC" loop preload="auto" />

    <nav class="nav">
      <button
        v-for="(icon, navIdx) in NAV_ICONS"
        :key="`nav-${navIdx}`"
        :class="['ni', { ac: navIdx === step, dn: navIdx < step }]"
        @click="goTo(navIdx)"
      >
        <div class="nib">
          <span class="nic" v-html="icon" />
        </div>
      </button>

      <div class="nav-sep" />

      <button
        class="ni snd-ni"
        @click="toggleSound"
        :aria-label="muted ? 'Включить звук' : 'Выключить звук'"
      >
        <div class="nib">
          <span class="nic" v-html="muted ? SOUND_ICONS.muted : SOUND_ICONS.unmuted" />
        </div>
      </button>

      <div v-if="step === 0 && showSoundHint && muted" class="snd-hint">
        <svg class="snd-hint-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 19V5"/>
          <path d="m5 12 7-7 7 7"/>
        </svg>
        Включить звук
      </div>
    </nav>

    <div :class="['cw', { fd: fading }]">
      <ChForest v-if="step === 0" :active="!fading" />
      <ChLight  v-else-if="step === 1" :active="!fading" @ready="lightReady = $event" />
      <ChHome   v-else-if="step === 2" :active="!fading" />
      <ChRotor  v-else-if="step === 3" :active="!fading" @start="onCtaStart" />
    </div>

    <div v-if="step < 3" class="bb">
      <button class="bn" @click="goTo(step + 1)">{{ BTN_LABELS[step] || 'Далее' }}</button>
      <button class="sk" @click="skipToCustomizer">Пропустить</button>
    </div>
  </div>
</template>

<style>
/* ═══════════════════════════════════════════════════════════════════════════
   WOODLED Onboarding — global styles (intentionally non-scoped so child
   chapter components inherit them).  All colour vars come from cssVars on .ob
   ═══════════════════════════════════════════════════════════════════════════ */

.ob {
  position: fixed; inset: 0;
  z-index: 9999;
  background: var(--bg);
  font-family: 'Inter', sans-serif;
  color: var(--text);
  display: flex; flex-direction: column;
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
  /* Prevent horizontal swipe from triggering browser back/forward and
     prevent the whole page from rubber-banding on iOS. */
  overscroll-behavior: none;
  touch-action: pan-y;
  -webkit-tap-highlight-color: transparent;
}

/* ─── Nav ─── */
.nav {
  display: flex; gap: 6px;
  padding: 14px 12px 0;
  z-index: 20;
  justify-content: center;
  align-items: center;
  position: relative;
}
.nav-sep {
  width: 1px; height: 22px;
  background: color-mix(in srgb, var(--dim) 33%, transparent);
  margin: 0 4px;
}
.snd-ni { position: relative; z-index: 21; }
.snd-ni .nib { background: transparent; }
.snd-ni * { pointer-events: none; }
.snd-hint {
  position: fixed; top: 60px; right: 18px;
  display: flex; align-items: center; gap: 6px;
  background: color-mix(in srgb, var(--gold) 85%, transparent);
  color: var(--bg);
  font-size: 12px; font-weight: 600;
  padding: 7px 12px 7px 9px;
  border-radius: 8px;
  white-space: nowrap;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, .4);
  z-index: 100;
  pointer-events: none;
  animation: hintBounce 1.4s ease-in-out infinite;
}
.snd-hint-arrow { flex-shrink: 0; }
@keyframes hintBounce {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-4px); }
}
.ni { background: none; border: none; cursor: pointer; padding: 0; }
.nib {
  width: 46px; height: 34px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  border: 1px solid color-mix(in srgb, var(--dim) 20%, transparent);
  background: transparent;
  transition: all .4s;
}
.ni.ac .nib { border-color: color-mix(in srgb, var(--gold) 40%, transparent); background: color-mix(in srgb, var(--gold) 8%, transparent); }
.ni.dn .nib { border-color: color-mix(in srgb, var(--gold) 20%, transparent); background: transparent; }
.nic { color: var(--dim); transition: color .4s; display: flex; }
.ni.ac .nic { color: var(--gold); }
.ni.dn .nic { color: var(--text2); }

/* ─── Container ─── */
.cw { flex: 1; display: flex; transition: opacity .4s; overflow: hidden; }
.cw.fd { opacity: 0; }
.ci  {
  flex: 1;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 0 24px;
  position: relative;
  overflow-y: auto;
  overflow-x: hidden;
  /* Keep scroll/bounce inside the chapter — never propagate to body. */
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.bb { padding: 0 24px 20px; z-index: 10; text-align: center; }
.bn {
  display: block; width: 100%;
  padding: 16px 0;
  background: #fff; border: none; border-radius: 12px;
  color: var(--bg);
  font-size: 15px; font-weight: 600;
  cursor: pointer;
  transition: all .4s;
  box-shadow: 0 4px 24px rgba(255, 255, 255, .12);
}
.bn:active { transform: translateY(1px); box-shadow: 0 2px 12px rgba(255, 255, 255, .08); }
.sk { display: block; margin: 10px auto 0; background: none; border: none; color: var(--dim); font-size: 12px; cursor: pointer; }

/* ─── Chapter title ─── */
.ctl { position: absolute; top: 10px; left: 0; right: 0; text-align: center; z-index: 5; }
.cs  { display: block; font-size: 9px; letter-spacing: 2.5px; text-transform: uppercase; color: var(--text2); opacity: 0; transform: translateY(8px); transition: all .8s; font-weight: 500; }
.cs.v { opacity: 1; transform: translateY(0); }
.cn  { display: block; font-family: 'Cormorant Garamond', serif; font-weight: 500; font-size: 20px; color: var(--text); margin-top: 2px; opacity: 0; transform: translateY(8px); transition: all .8s .2s; }
.cn.v { opacity: 1; transform: translateY(0); }

.txt { text-align: center; margin-top: 20px; width: 100%; max-width: 380px; opacity: 0; transform: translateY(14px); transition: all 1s; }
.txt-stack { position: relative; width: 100%; min-height: 110px; }
.txt-layer { position: absolute; left: 0; right: 0; top: 0; opacity: 0; transition: opacity 1.2s ease; pointer-events: none; text-align: center; }
.txt-layer.v { opacity: 1; }
.txt.v { opacity: 1; transform: translateY(0); }
.txth { font-size: 22px; font-weight: 700; color: var(--text); line-height: 1.35; margin-bottom: 8px; }
.txtp { font-size: 13px; line-height: 1.8; color: var(--text2); max-width: 300px; margin: 0 auto; }

/* ═══ CH1: Forest storytelling ═══ */
.ch1 { justify-content: center; align-items: center; position: relative; min-height: 0; }
.ch1-bg { position: absolute; inset: 0; display: flex; align-items: flex-end; justify-content: center; pointer-events: none; z-index: 2; }
.ch1-tree { width: auto; height: 85%; max-width: 100%; object-fit: contain; opacity: .95; filter: brightness(0); animation: treeHeart 2.2s ease-in-out infinite; }
.ch1-lightbeam {
  position: absolute; top: 5%; left: 50%; transform: translateX(-50%);
  width: 90%; max-width: 520px; height: 85%;
  background: radial-gradient(
    ellipse at 50% 45%,
    color-mix(in srgb, var(--warm) 33%, transparent),
    color-mix(in srgb, var(--goldB) 20%, transparent) 25%,
    color-mix(in srgb, var(--gold) 10%, transparent) 45%,
    transparent 65%
  );
  filter: blur(40px);
  pointer-events: none;
  z-index: 0;
}
.ch1-leaves { position: absolute; left: 50%; top: 40%; width: 0; height: 0; pointer-events: none; z-index: 2; }
.ch1-center { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; width: 100%; max-width: 340px; position: relative; z-index: 3; margin: auto 0; }
.story { position: relative; height: 90px; width: 100%; display: flex; align-items: center; justify-content: center; transition: opacity 1s ease, height .8s ease, margin .8s ease; }
.story.hide { opacity: 0; height: 0; margin: 0; pointer-events: none; }
.sl { position: absolute; left: 0; right: 0; font-size: 16px; text-align: center; line-height: 1.7; font-weight: 500; opacity: 0; color: #fff; transition: opacity 2.5s ease; pointer-events: none; }
.sl.v { opacity: 1; }
.sl.dim { opacity: 0; }

.ember { position: absolute; left: 50%; top: 50%; margin-left: -16px; margin-top: -16px; opacity: 0; pointer-events: none; z-index: 4; }

/* Lamel (Ch1 final reveal) */
.l2-stage { position: relative; width: 280px; height: 320px; display: flex; align-items: center; justify-content: center; margin-bottom: -30px; }
.ch1 .l2-stage { opacity: 0; transform: scale(.9); transition: all 1.2s ease; height: 0; margin-bottom: 0; }
.ch1 .l2-stage.vis { opacity: 1; transform: scale(1); height: 240px; margin-bottom: 0; }
.ch1 .txt-ch1 { margin-top: 16px; }
.l2-lamel { position: absolute; z-index: 2; opacity: 0; transform: scale(2); transition: all 1.5s ease; }
.l2-lamel.vis { opacity: 1; transform: scale(1); }
.l2-body {
  width: 160px; height: 270px; position: relative; overflow: hidden;
  background: linear-gradient(175deg,
    color-mix(in srgb, var(--oakL) 60%, transparent),
    color-mix(in srgb, var(--oak) 47%, transparent),
    color-mix(in srgb, var(--oakD) 53%, transparent));
  border: 1px solid color-mix(in srgb, var(--oakL) 40%, transparent);
  box-shadow: 0 0 120px color-mix(in srgb, var(--oak) 33%, transparent),
              inset 0 0 40px color-mix(in srgb, var(--oak) 13%, transparent);
}
.l2-grain { position: absolute; inset: 0; background-position: center; background-size: cover; opacity: .7; }
.l2-hb { position: absolute; inset: 0; background: radial-gradient(circle, color-mix(in srgb, var(--oakL) 13%, transparent), transparent 60%); opacity: 0; }
.l2-hb.on { animation: hb 1.8s ease-in-out infinite; }
.l2-shimmer {
  position: absolute; inset: -2px; pointer-events: none;
  border: 1px solid color-mix(in srgb, var(--oakL) 33%, transparent);
  box-shadow: inset 0 0 30px color-mix(in srgb, var(--oakL) 16%, transparent),
              0 0 35px color-mix(in srgb, var(--oak) 16%, transparent);
  animation: shimmerPulse 2.5s ease-in-out infinite;
}
.l2-back {
  position: absolute; inset: -100px;
  background: radial-gradient(ellipse at 50% 50%,
    color-mix(in srgb, var(--warm) 33%, transparent),
    color-mix(in srgb, var(--gold) 20%, transparent),
    color-mix(in srgb, var(--oak) 9%, transparent),
    transparent 80%);
  z-index: -1; filter: blur(30px);
}

/* ═══ CH4 (step 3): Interior + CTA ═══ */
.ch-rt { padding-top: 50px; justify-content: flex-start; }
.rt-stage { position: relative; width: 100%; max-width: 340px; height: 340px; display: flex; align-items: center; justify-content: center; margin-top: 30px; }

/* Leaf preloader — shows until interior image is fully loaded */
.rt-loader {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  z-index: 5;
  opacity: 1;
  transition: opacity .8s ease;
  pointer-events: none;
}
.rt-loader.hide { opacity: 0; }
.rt-loader-leaf {
  position: relative;
  width: 64px; height: 64px;
  color: var(--gold);
  animation: leafSway 3.6s ease-in-out infinite;
  transform-origin: 50% 50%;
}
/* Inner wrapper never rotates — clip-path stays aligned with the SVG */
.rt-leaf-inner {
  position: absolute; inset: 0;
}
.rt-leaf-bg, .rt-leaf-fg {
  position: absolute; inset: 0;
}
.rt-leaf-bg svg, .rt-leaf-fg svg {
  width: 100%; height: 100%; display: block; overflow: visible;
}
.rt-leaf-bg svg path {
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  opacity: .45;
}
.rt-leaf-fg {
  transition: clip-path .35s ease-out;
}
.rt-leaf-fg svg path {
  fill: currentColor;
  stroke: currentColor;
  stroke-width: 1.6;
}
@keyframes leafSway {
  0%, 100% { transform: rotate(-4deg); }
  50%      { transform: rotate(4deg); }
}

/* ─── Page splash (covers VitePress nav flash) ─── */
.ob-splash {
  position: fixed; inset: 0;
  z-index: 10000;
  background: var(--bg);
  display: flex; align-items: center; justify-content: center;
}
.ob-splash-leaf {
  width: 56px; height: 56px;
  color: var(--gold);
  opacity: .6;
  animation: leafSway 3.6s ease-in-out infinite;
}
.ob-splash-leaf svg {
  width: 100%; height: 100%; display: block; overflow: visible;
}
.ob-splash-leaf svg path {
  fill: currentColor;
  stroke: currentColor;
  stroke-width: 1.6;
}
.splash-fade-leave-active { transition: opacity .6s ease; }
.splash-fade-leave-to { opacity: 0; }

.rt-interior { position: absolute; inset: 0; opacity: 0; transition: opacity 1.2s ease; overflow: hidden; border-radius: 16px; }
.rt-interior.v { opacity: 1; }
.rt-int-img { width: 100%; height: 100%; object-fit: cover; border-radius: 16px; }
.rt-int-fade { position: absolute; inset: 0; border-radius: 16px; box-shadow: inset 0 0 80px 50px var(--bg), inset 0 0 30px 10px var(--bg); pointer-events: none; }
.rt-glow {
  position: absolute; top: 40%; left: 50%; transform: translate(-50%, -50%);
  width: 220px; height: 220px; border-radius: 50%;
  background: radial-gradient(circle,
    color-mix(in srgb, var(--warm) 19%, transparent),
    color-mix(in srgb, var(--warm) 6%, transparent),
    transparent);
  filter: blur(30px);
}
.rt-img {
  position: relative; z-index: 2;
  max-width: 100%; max-height: 300px; object-fit: contain;
  filter: drop-shadow(0 10px 40px color-mix(in srgb, var(--warm) 13%, transparent)) brightness(1.05);
  -webkit-mask-image: radial-gradient(ellipse 55% 50% at 50% 50%, #000 40%, rgba(0, 0, 0, .7) 65%, transparent 90%);
  mask-image: radial-gradient(ellipse 55% 50% at 50% 50%, #000 40%, rgba(0, 0, 0, .7) 65%, transparent 90%);
}
.rt-fade-top { position: absolute; top: 0; left: 0; right: 0; height: 40%; background: linear-gradient(to bottom, var(--bg), transparent); z-index: 3; pointer-events: none; }

/* ═══ CH2: Rotor reveal ═══ */
.ch-l4 { padding-top: 50px; justify-content: flex-start; }
.l4-stage { position: relative; width: 100%; max-width: 340px; height: 300px; display: flex; align-items: center; justify-content: center; margin-bottom: -20px; }
.l4-photo { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; opacity: 0; transform: translateY(-80px); transition: all 1.5s ease; }
.l4-photo.v { opacity: 1; transform: translateY(0); }
.l4-photo.fade { opacity: 0; transform: translateY(-30px) scale(.92); transition: all 1.5s ease; }
.r-stage { position: absolute; width: 200px; height: 200px; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 1.2s ease; }
.r-stage.v { opacity: 1; }
.r-asm { width: 200px; height: 200px; position: relative; }
.r-asm.spin { animation: spin 48s linear infinite; }
.rs {
  position: absolute; top: 50%; left: 50%;
  width: 6px; height: 60px; border-radius: 2px;
  margin-top: -30px; margin-left: -3px;
  transform-origin: center center;
  opacity: 0; transition: transform 1s, opacity .8s;
  background: linear-gradient(to bottom, var(--oakL), var(--oak), var(--oakD));
}
.rs.in { opacity: .85; }
.rsg {
  position: absolute; top: 50%; left: 50%;
  width: 4px; height: 24px; margin-top: -12px; margin-left: -2px;
  transform-origin: center center;
  background: color-mix(in srgb, var(--warm) 7%, transparent);
  border-radius: 2px; filter: blur(4px);
  animation: glp 2.5s ease-in-out infinite;
}
.sww { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 30; opacity: 0; transition: opacity 1.5s; }
.sww.vis { opacity: 1; }
.swb {
  width: 72px; height: 72px; border-radius: 50%;
  border: 2px solid color-mix(in srgb, var(--gold) 33%, transparent);
  background: color-mix(in srgb, var(--bg) 80%, transparent);
  cursor: pointer;
  color: var(--goldB);
  display: flex; align-items: center; justify-content: center;
  animation: breathe 2.5s ease-in-out infinite;
  box-shadow: 0 0 30px color-mix(in srgb, var(--gold) 13%, transparent);
}
.swb-icon { display: flex; align-items: center; justify-content: center; }
.swb-icon svg { display: block; }

/* Shadow stage with animals (Ch2 after switch) */
.sh-stage {
  width: 100%; max-width: 400px;
  height: 40vh; min-height: 280px; max-height: 380px;
  position: relative; overflow: hidden;
  background: transparent;
  display: flex; align-items: flex-end; justify-content: center;
  margin-top: 10px;
  /* Soft radial mask = no visible rectangle edges, light beam fades naturally */
  -webkit-mask-image: radial-gradient(ellipse 85% 85% at 50% 55%, #000 45%, transparent 95%);
          mask-image: radial-gradient(ellipse 85% 85% at 50% 55%, #000 45%, transparent 95%);
}
.sh-light {
  position: absolute; inset: 0;
  background: radial-gradient(ellipse 60% 50% at 50% 40%,
    color-mix(in srgb, var(--warm) 21%, transparent),
    color-mix(in srgb, var(--warm) 7%, transparent),
    transparent 75%);
  transition: all 1.5s;
}
.sh-stage.on .sh-light {
  background: radial-gradient(ellipse 60% 50% at 50% 40%,
    color-mix(in srgb, var(--warm) 38%, transparent),
    color-mix(in srgb, var(--warm) 15%, transparent),
    transparent 75%);
}
.sh-fig {
  position: absolute;
  left: 50%; bottom: 0;
  transform: translateX(-50%);
  width: 240px; height: 240px;
  z-index: 2;
  opacity: 0; transition: opacity 2s ease;
  display: flex; align-items: flex-end; justify-content: center;
  pointer-events: none;
}
.sh-stage.on .sh-fig { opacity: 1; }
.sh-fig svg, .sh-fig img {
  width: 100%; height: 100%;
  object-fit: contain;
  object-position: bottom center;
  display: block;
  filter: drop-shadow(0 -8px 20px color-mix(in srgb, var(--warm) 13%, transparent));
}
.sh-fig img[alt="Белка"] { height: 70%; align-self: flex-end; }
.sh-figr { margin-top: 14px; animation: fu .6s .4s both; }
.sh-title { font-size: 20px; font-weight: 700; color: var(--text); text-align: center; margin-top: 28px; animation: fu .6s .2s both; }
.sh-bars {
  position: absolute; inset: -10% 0;
  z-index: 3; opacity: .4; pointer-events: none;
  background: repeating-linear-gradient(90deg,
    rgba(0, 0, 0, .8) 0,
    rgba(0, 0, 0, .8) 8px,
    transparent 8px,
    transparent 38px);
  animation: zoe 4s linear infinite;
}
.sh-bar { display: none; }

.figr { display: flex; gap: 8px; margin-top: 14px; animation: fu .5s both; }
.fb {
  padding: 7px 18px; border-radius: 20px;
  border: 1px solid color-mix(in srgb, var(--dim) 33%, transparent);
  background: transparent;
  color: var(--text2);
  font-size: 12px; font-weight: 500;
  cursor: pointer; transition: all .3s;
}
.fb.ac {
  border-color: color-mix(in srgb, var(--gold) 53%, transparent);
  color: var(--gold);
  background: color-mix(in srgb, var(--gold) 7%, transparent);
}

/* ═══ CH3: Home (Живой дом) ═══ */
.ch4 { padding-top: 48px; justify-content: flex-start; padding-bottom: 120px; }
.d5 { width: 100%; max-width: 380px; margin-top: 36px; opacity: 0; transition: opacity .8s; }
.d5.v { opacity: 1; }
.rmb { display: flex; gap: 6px; justify-content: center; margin-bottom: 32px; }
.rb { padding: 4px 14px; border-radius: 12px; border: 1px solid; font-size: 12px; font-weight: 600; transition: all .8s; }
.d5-c { transition: all .8s ease; }
/* Room crossfade — guarantees old+new are never in DOM simultaneously */
.room-fade-enter-active,
.room-fade-leave-active { transition: opacity 1s ease; }
.room-fade-enter-from,
.room-fade-leave-to { opacity: 0; }
.d5m { text-align: center; font-size: 24px; font-weight: 700; margin-bottom: 8px; transition: all .8s; }
.d5g { position: relative; display: flex; flex-direction: column; align-items: center; margin-bottom: 4px; }
.d5gv { position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%); display: flex; align-items: baseline; line-height: 1; }
.d5gn { font-size: 44px; font-weight: 500; color: var(--text); transition: all 2s ease-out; }
.d5gp { font-size: 18px; color: var(--text2); margin-left: 2px; }
.d5desc { text-align: center; font-size: 13px; color: var(--text2); line-height: 1.6; margin-bottom: 12px; max-width: 300px; margin-left: auto; margin-right: auto; transition: all .8s; }
.d5z { margin-bottom: 12px; }
.d5zg { position: relative; border-radius: 14px; border: 1px solid; padding: 6px; transition: all .8s; }
.d5gw { position: absolute; inset: 0; border-radius: 14px; pointer-events: none; z-index: 1; transition: all 1.5s; }
.d5zgr { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; position: relative; z-index: 2; }
.d5zc { background: color-mix(in srgb, var(--card) 80%, transparent); border-radius: 8px; padding: 10px; transition: all .8s; }
.d5zh { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.d5zn { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--text); }
.d5zp { font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 6px; transition: all .8s; }
.d5zm { font-size: 11px; color: var(--text2); }

.d5sum { text-align: center; animation: fu 1.6s ease both; }
.sgrid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 0 0 16px; }
.scard { border-radius: 14px; padding: 14px; text-align: center; border: 1px solid; transition: all .3s; }
.acard { border-style: dashed; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; background: var(--card); line-height: 1.2; }
.scb { display: inline-block; padding: 2px 10px; border-radius: 10px; font-size: 10px; font-weight: 600; color: var(--text); margin-bottom: 4px; }
.scm { font-size: 15px; font-weight: 700; margin-bottom: 10px; }
.scfx { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
.scf { text-align: center; width: 38px; }
.scfc { width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto; }
.scfw { font-size: 8px; color: var(--dim); margin-top: 3px; line-height: 1.2; }
.rpl {
  display: flex; align-items: center; gap: 6px;
  margin: 0 auto 24px;
  padding: 8px 20px; border-radius: 20px;
  border: 1px solid color-mix(in srgb, var(--dim) 27%, transparent);
  background: transparent;
  color: var(--text2);
  font-size: 12px; cursor: pointer;
}
.d5cta {
  position: fixed; bottom: 0; left: 0; right: 0;
  padding: 0 24px 28px;
  background: linear-gradient(to top, var(--bg) 70%, transparent);
  z-index: 10;
  animation: fu .6s both;
}
.d5btn { display: block; width: 100%; padding: 18px 0; background: var(--gold); border: none; border-radius: 12px; color: var(--bg); font-size: 16px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 24px color-mix(in srgb, var(--gold) 20%, transparent); }

/* ─── Animations ─── */
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes breathe {
  0%, 100% { transform: scale(1);    border-color: color-mix(in srgb, var(--gold) 33%, transparent); }
  50%      { transform: scale(1.08); border-color: color-mix(in srgb, var(--gold) 60%, transparent); }
}
@keyframes fu  { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
@keyframes zoe { from { background-position-x: 0; } to { background-position-x: 38px; } }
@keyframes hb  { 0%, 100% { opacity: .06; } 50% { opacity: .35; } }
@keyframes glp { 0%, 100% { opacity: .5; } 50% { opacity: 1; } }
@keyframes shimmerPulse {
  0%, 100% {
    box-shadow: inset 0 0 24px color-mix(in srgb, var(--oakL) 8%, transparent),
                0 0 20px color-mix(in srgb, var(--oak) 8%, transparent);
    border-color: color-mix(in srgb, var(--oakL) 13%, transparent);
  }
  50% {
    box-shadow: inset 0 0 36px color-mix(in srgb, var(--oakL) 19%, transparent),
                0 0 36px color-mix(in srgb, var(--oak) 19%, transparent);
    border-color: color-mix(in srgb, var(--oakL) 27%, transparent);
  }
}
@keyframes treeHeart { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.03); } }
@keyframes ember {
  0%   { opacity: .9; transform: translate(0, 0) rotate(0deg) scale(1); }
  30%  { opacity: .8; }
  100% { opacity: 0;  transform: translate(var(--ex), var(--ey)) rotate(var(--er)) scale(.9); }
}

@media (max-height: 700px) {
  .sl    { font-size: 14px; }
  .d5gn  { font-size: 38px; }
  .d5m   { font-size: 20px; }
  .l2-body  { width: 130px; height: 220px; }
  .l2-stage { width: 240px; height: 280px; }
  .ch1 .l2-stage.vis { height: 200px; }
}
</style>
