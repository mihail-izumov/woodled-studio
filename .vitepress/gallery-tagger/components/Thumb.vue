<script setup lang="ts">
import { computed } from 'vue'
import { Check } from '../lib/icons'
import { T } from '../lib/theme'
import { countCritical, toDisplayUrl } from '../lib/gallery'
import type { GalleryEntry } from '../lib/types'
import ImageWithFallback from './ImageWithFallback.vue'

const props = defineProps<{ entry: GalleryEntry }>()
defineEmits<{ click: [] }>()

const filled = computed(() => countCritical(props.entry))
const dots = computed(() => {
  const arr = []
  for (let i = 0; i < 4; i++) {
    arr.push(i < filled.value)
  }
  return arr
})
const displayUrl = computed(() => toDisplayUrl(props.entry.url))

function onEnter(e: MouseEvent) {
  (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
}
function onLeave(e: MouseEvent) {
  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
}
</script>

<template>
  <button
    :style="{
      position: 'relative',
      background: T.card,
      border: '1px solid ' + (entry.tagged ? T.green + '55' : T.border),
      borderRadius: '10px',
      padding: 0,
      cursor: 'pointer',
      overflow: 'hidden',
      textAlign: 'left',
      transition: 'transform .15s ease, border-color .15s ease',
    }"
    @click="$emit('click')"
    @mouseenter="onEnter"
    @mouseleave="onLeave"
  >
    <div :style="{
      position: 'relative',
      aspectRatio: '4 / 3',
      background: T.cardAlt,
    }">
      <ImageWithFallback
        :src="displayUrl"
        :filename="entry.filename"
        :img-style="{
          width: '100%', height: '100%',
          objectFit: 'cover', display: 'block',
        }"
      />
      <div
        v-if="entry.tagged"
        :style="{
          position: 'absolute', top: '6px', right: '6px',
          width: '22px', height: '22px', borderRadius: '50%',
          background: T.green, color: T.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 6px rgba(0,0,0,.4)',
        }"
      >
        <Check :size="13" :stroke-width="3.5" />
      </div>
    </div>
    <div :style="{
      padding: '8px 10px',
      display: 'flex', flexDirection: 'column', gap: '4px',
    }">
      <div :style="{
        fontSize: '11.5px',
        color: T.text,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }">
        {{ entry.filename }}
      </div>
      <div :style="{ display: 'flex', gap: '4px', alignItems: 'center' }">
        <span
          v-for="(on, i) in dots"
          :key="i"
          :style="{
            width: '7px', height: '7px', borderRadius: '50%',
            background: on ? T.neutral : T.border,
          }"
        />
        <span :style="{
          marginLeft: 'auto',
          fontSize: '10px',
          color: entry.tagged ? T.green : T.textDim,
          fontWeight: 600,
        }">
          {{ entry.tagged ? 'готово' : (filled + '/4') }}
        </span>
      </div>
    </div>
  </button>
</template>
