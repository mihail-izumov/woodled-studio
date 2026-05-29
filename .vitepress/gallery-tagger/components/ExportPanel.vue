<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount } from 'vue'
import {
  Download, X, ClipboardCopy, FileText, FileJson,
} from '../lib/icons'
import { T } from '../lib/theme'
import { downloadFile, copyText, buildGalleryTs } from '../lib/gallery'
import type { GalleryEntry } from '../lib/types'
import IconBtn from './ui/IconBtn.vue'

const props = defineProps<{ entries: GalleryEntry[] }>()
const emit = defineEmits<{ close: []; toast: [msg: string] }>()

const taggedCount = computed(() => props.entries.filter(e => e.tagged).length)

function doJsonAll() {
  const ok = downloadFile(
    'gallery_entries.json',
    JSON.stringify(props.entries, null, 2),
    'application/json',
  )
  emit('toast', ok ? `Скачан JSON · ${props.entries.length} записей` : 'Не удалось скачать')
}
function doJsonTagged() {
  const tagged = props.entries.filter(e => e.tagged)
  const ok = downloadFile(
    'gallery_tagged.json',
    JSON.stringify(tagged, null, 2),
    'application/json',
  )
  emit('toast', ok ? `Скачан JSON · ${tagged.length} записей` : 'Не удалось скачать')
}
function doTsDownload() {
  const ok = downloadFile('gallery.ts', buildGalleryTs(props.entries), 'text/typescript;charset=utf-8')
  emit('toast', ok ? `Скачан gallery.ts · ${taggedCount.value} записей` : 'Не удалось скачать')
}
async function doTsCopy() {
  const ok = await copyText(buildGalleryTs(props.entries))
  emit('toast', ok ? `Скопировано · gallery.ts (${taggedCount.value} записей)` : 'Не удалось скопировать')
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

const kbdStyle = {
  background: T.cardAlt,
  border: '1px solid ' + T.border,
  borderRadius: '4px',
  padding: '0 5px',
  fontSize: '10px',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  color: T.textSec,
}
</script>

<template>
  <div
    :style="{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,.72)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: '24px', zIndex: 100,
      overflowY: 'auto',
    }"
    @click="$emit('close')"
  >
    <div
      :style="{
        background: T.bg,
        border: '1px solid ' + T.border,
        borderRadius: '16px',
        width: '100%', maxWidth: '720px',
        boxShadow: '0 20px 60px rgba(0,0,0,.6)',
      }"
      @click.stop
    >
      <!-- Header -->
      <div :style="{
        padding: '16px 20px',
        borderBottom: '1px solid ' + T.border,
        display: 'flex', alignItems: 'center', gap: '12px',
      }">
        <Download :size="18" :color="T.neutral" />
        <div :style="{ flex: 1 }">
          <div :style="{ fontSize: '16px', fontWeight: 700, color: T.text }">
            Экспорт разметки
          </div>
          <div :style="{ fontSize: '12px', color: T.textSec, marginTop: '2px' }">
            Всего: {{ entries.length }} · размечено: {{ taggedCount }}
          </div>
        </div>
        <button
          :style="{
            background: 'transparent', border: 'none', color: T.textSec,
            cursor: 'pointer', padding: '4px', display: 'flex',
          }"
          @click="$emit('close')"
        >
          <X :size="18" />
        </button>
      </div>

      <!-- Body -->
      <div :style="{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }">

        <!-- TS — главное -->
        <div :style="{
          border: '1px solid ' + (T.neutral + '55'),
          background: T.neutral + '08',
          borderRadius: '12px', padding: '14px',
        }">
          <div :style="{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }">
            <span :style="{
              fontSize: '10px', fontWeight: 700, color: T.neutral,
              background: T.neutral + '22', padding: '2px 8px',
              borderRadius: '999px', letterSpacing: '0.5px',
            }">ОСНОВНОЕ</span>
            <span :style="{ fontSize: '14px', color: T.text, fontWeight: 600 }">
              gallery.ts
            </span>
          </div>
          <div :style="{ fontSize: '12px', color: T.textSec, marginBottom: '12px', lineHeight: 1.5 }">
            Готовый TypeScript-файл для Vue-проекта. Кладёшь в
            <code :style="{ color: T.text }">data/gallery.ts</code> —
            кастомайзер начинает фильтровать фото по тегам. Включает только размеченные фото
            ({{ taggedCount }} из {{ entries.length }}). <b>Это то, что ты в итоге отдаёшь Vue.</b>
          </div>
          <div :style="{ display: 'flex', gap: '8px', flexWrap: 'wrap' }">
            <IconBtn primary :disabled="!taggedCount" @click="doTsCopy">
              <ClipboardCopy :size="14" /> Скопировать в буфер
            </IconBtn>
            <IconBtn :disabled="!taggedCount" @click="doTsDownload">
              <FileText :size="14" /> Скачать файл
            </IconBtn>
          </div>
          <div :style="{ fontSize: '11px', color: T.textDim, marginTop: '10px' }">
            «В буфер» удобнее — сразу
            <kbd :style="kbdStyle">Cmd</kbd>+<kbd :style="kbdStyle">V</kbd>
            в редактор. «Скачать файл» — если хочешь сначала глазами проверить.
          </div>
        </div>

        <!-- JSON — для бэкапа -->
        <div :style="{
          border: '1px solid ' + T.border,
          background: T.card,
          borderRadius: '12px', padding: '14px',
        }">
          <div :style="{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }">
            <span :style="{
              fontSize: '10px', fontWeight: 700, color: T.textSec,
              background: T.cardAlt, padding: '2px 8px',
              borderRadius: '999px', letterSpacing: '0.5px',
            }">БЭКАП</span>
            <span :style="{ fontSize: '14px', color: T.text, fontWeight: 600 }">JSON</span>
          </div>
          <div :style="{ fontSize: '12px', color: T.textSec, marginBottom: '12px', lineHeight: 1.5 }">
            Полная разметка со всеми полями (в том числе черновики, заметки, прогресс).
            Нужен только для импорта обратно — если хочешь продолжить работу в другом
            браузере или после сброса. <b>В Vue это не идёт.</b>
          </div>
          <div :style="{ display: 'flex', gap: '8px', flexWrap: 'wrap' }">
            <IconBtn :disabled="!entries.length" @click="doJsonAll">
              <FileJson :size="14" /> Все ({{ entries.length }})
            </IconBtn>
            <IconBtn :disabled="!taggedCount" @click="doJsonTagged">
              <FileJson :size="14" /> Только размеченные ({{ taggedCount }})
            </IconBtn>
          </div>
          <div :style="{ fontSize: '11px', color: T.textDim, marginTop: '10px' }">
            «Все» — для продолжения работы. «Только размеченные» — если хочешь поделиться
            готовой частью с коллегой, не таща черновики.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
