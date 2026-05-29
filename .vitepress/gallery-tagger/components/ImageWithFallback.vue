<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'
import { AlertCircle, Image as ImageIcon } from '../lib/icons'
import { T } from '../lib/theme'

const props = withDefaults(defineProps<{
  src: string
  filename: string
  big?: boolean
  imgStyle?: Record<string, string | number>
}>(), {
  big: false,
})

const errored = ref(false)
const loaded = ref(false)
const imgEl = ref<HTMLImageElement | null>(null)

function checkCached() {
  const img = imgEl.value
  if (!img) return
  if (img.complete) {
    if (img.naturalWidth > 0) loaded.value = true
    else errored.value = true
  }
}

onMounted(() => { nextTick(checkCached) })

// При смене src — сбрасываем флаги и перепроверяем кеш.
watch(() => props.src, () => {
  errored.value = false
  loaded.value = false
  nextTick(checkCached)
})
</script>

<template>
  <!-- Плейсхолдер при ошибке загрузки -->
  <div
    v-if="errored || !src"
    :style="{
      ...(imgStyle || {}),
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: big ? '10px' : '4px',
      background: T.cardAlt,
      color: T.textDim,
      textAlign: 'center', padding: '8px',
      boxSizing: 'border-box',
    }"
  >
    <AlertCircle :size="big ? 28 : 18" />
    <div :style="{
      fontSize: big ? '12px' : '10px',
      color: T.textSec,
      wordBreak: 'break-all',
      lineHeight: 1.3,
    }">
      {{ filename || '—' }}
    </div>
    <div v-if="big" :style="{ fontSize: '10px', color: T.textDim }">
      фото не загрузилось
    </div>
  </div>

  <!-- Нормальная картинка с лоадером поверх -->
  <div v-else :style="{ position: 'relative', width: '100%', height: '100%' }">
    <div
      v-if="!loaded"
      :style="{
        position: 'absolute', inset: 0,
        background: T.cardAlt,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: T.textDim,
      }"
    >
      <ImageIcon :size="big ? 28 : 18" />
    </div>
    <img
      ref="imgEl"
      :src="src"
      :alt="filename"
      :style="{
        ...(imgStyle || {}),
        opacity: loaded ? 1 : 0,
        transition: 'opacity .2s ease',
      }"
      @load="loaded = true"
      @error="errored = true"
    />
  </div>
</template>
