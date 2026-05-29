<script setup>
import { ref, watch, onUnmounted } from 'vue'
import { C, IMG, LEAF_ICON, CUSTOMIZER_URL } from '../woodled-data.js'

const props = defineProps({
  active: { type: Boolean, required: true }
})
const emit = defineEmits(['start'])

const p = ref(-1)
const progress = ref(0)
const imageReady = ref(false)
const imageSrc = ref(null)

let timers = []
let aborted = false
let fakeProgressTimer = null

function clearTimers() {
  timers.forEach(clearTimeout)
  timers = []
  if (fakeProgressTimer) { clearInterval(fakeProgressTimer); fakeProgressTimer = null }
}

function revokeIfBlob() {
  if (imageSrc.value && imageSrc.value.startsWith('blob:')) {
    URL.revokeObjectURL(imageSrc.value)
  }
}

async function loadInteriorWithProgress() {
  aborted = false
  progress.value = 0
  imageReady.value = false
  revokeIfBlob()
  imageSrc.value = null

  // Try fetch + ReadableStream for real progress
  try {
    const response = await fetch(IMG.interior)
    if (aborted) return
    if (!response.ok) throw new Error('Image fetch failed: ' + response.status)

    const total = +(response.headers.get('Content-Length') || 0)
    const reader = response.body.getReader()
    const chunks = []
    let received = 0

    while (true) {
      if (aborted) { try { reader.cancel() } catch {} return }
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
      received += value.length
      if (total > 0) {
        // Hold at 95% until decoded
        progress.value = Math.min(received / total * 0.95, 0.95)
      } else {
        // No content-length — fake progress capped at 90%
        progress.value = Math.min(received / 200000 * 0.9, 0.9)
      }
    }
    if (aborted) return

    const blob = new Blob(chunks, {
      type: response.headers.get('Content-Type') || 'image/jpeg'
    })
    const url = URL.createObjectURL(blob)

    // Pre-decode via Image so it paints instantly when assigned
    const img = new Image()
    img.onload = () => {
      if (aborted) { URL.revokeObjectURL(url); return }
      imageSrc.value = url
      progress.value = 1
      // Brief pause so user sees fully-filled leaf, then reveal photo
      timers.push(setTimeout(() => {
        if (!aborted) imageReady.value = true
      }, 350))
    }
    img.onerror = () => {
      if (aborted) return
      URL.revokeObjectURL(url)
      // Fallback to direct URL
      fallbackDirectLoad()
    }
    img.src = url
  } catch (e) {
    console.warn('[ChRotor] streaming load failed, falling back:', e)
    if (!aborted) fallbackDirectLoad()
  }
}

function fallbackDirectLoad() {
  // No real progress available — animate fake fill while <img> loads
  imageSrc.value = null
  let fake = progress.value
  fakeProgressTimer = setInterval(() => {
    if (aborted) { clearInterval(fakeProgressTimer); fakeProgressTimer = null; return }
    fake = Math.min(fake + 0.04, 0.9)
    progress.value = fake
  }, 120)
  const img = new Image()
  img.onload = () => {
    if (aborted) return
    if (fakeProgressTimer) { clearInterval(fakeProgressTimer); fakeProgressTimer = null }
    imageSrc.value = IMG.interior
    progress.value = 1
    timers.push(setTimeout(() => {
      if (!aborted) imageReady.value = true
    }, 350))
  }
  img.onerror = () => {
    if (aborted) return
    if (fakeProgressTimer) { clearInterval(fakeProgressTimer); fakeProgressTimer = null }
    imageSrc.value = IMG.interior
    progress.value = 1
    imageReady.value = true
  }
  img.src = IMG.interior
}

watch(() => props.active, (active) => {
  clearTimers()
  if (!active) {
    aborted = true
    p.value = -1
    progress.value = 0
    imageReady.value = false
    revokeIfBlob()
    imageSrc.value = null
    return
  }
  p.value = -1

  // Kick off image load in parallel with phase progression
  loadInteriorWithProgress()

  const schedule = [[300, 0], [900, 1], [2400, 2]]
  schedule.forEach(([ms, val]) => {
    timers.push(setTimeout(() => { p.value = val }, ms))
  })
}, { immediate: true })

onUnmounted(() => {
  aborted = true
  clearTimers()
  revokeIfBlob()
})

const C_REF = C

function goCustomizer() {
  emit('start') // keep emit for backward compat
  if (typeof window !== 'undefined') {
    window.location.href = CUSTOMIZER_URL
  }
}
</script>

<template>
  <div class="ci ch-rt">
    <div class="ctl">
      <span :class="['cs', { v: p >= 0 }]">Глава четвёртая</span>
      <span :class="['cn', { v: p >= 0 }]">Дом с WOODLED Rotor</span>
    </div>

    <div class="rt-stage">
      <!-- Leaf preloader (shows until image fully loaded) -->
      <div :class="['rt-loader', { hide: imageReady }]">
        <div class="rt-loader-leaf">
          <div class="rt-leaf-inner">
            <div class="rt-leaf-bg" v-html="LEAF_ICON" />
            <div
              class="rt-leaf-fg"
              v-html="LEAF_ICON"
              :style="{ clipPath: `inset(${(1 - progress) * 100}% 0 0 0)` }"
            />
          </div>
        </div>
      </div>

      <!-- Interior image (revealed once both phase>=1 AND image ready) -->
      <div :class="['rt-interior', { v: p >= 1 && imageReady }]">
        <img v-if="imageSrc" :src="imageSrc" alt="Rotor в интерьере" class="rt-int-img">
        <div class="rt-int-fade" />
      </div>
    </div>

    <div :class="['txt', { v: p >= 2 }]">
      <div class="txth">Свет дерева</div>
      <div class="txtp">Мягкое тепло дуба и ореха оживляет пространство дома.</div>
    </div>

    <div v-if="p >= 2" class="d5cta">
      <button
        class="d5btn"
        :style="{ background: '#fff', color: C_REF.bg, boxShadow: '0 4px 24px rgba(255,255,255,.15)' }"
        @click="goCustomizer"
      >Оживить Мой Дом</button>
    </div>
  </div>
</template>
