<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { Upload, X, FileJson } from '../lib/icons'
import { T } from '../lib/theme'
import IconBtn from './ui/IconBtn.vue'

const props = defineProps<{ entriesCount: number }>()
const emit = defineEmits<{ close: []; pickFile: [file: File] }>()

const fileEl = ref<HTMLInputElement | null>(null)

function handlePick(e: Event) {
  const input = e.target as HTMLInputElement
  const f = input.files && input.files[0]
  if (f) emit('pickFile', f)
  input.value = ''
  emit('close')
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

const codeStyle = {
  background: T.bg,
  color: T.text,
  padding: '1px 6px',
  borderRadius: '3px',
  fontSize: '12px',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
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
        width: '100%', maxWidth: '560px',
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
        <Upload :size="18" :color="T.neutral" />
        <div :style="{ flex: 1 }">
          <div :style="{ fontSize: '16px', fontWeight: 700, color: T.text }">
            Импорт разметки
          </div>
          <div :style="{ fontSize: '12px', color: T.textSec, marginTop: '2px' }">
            Сейчас в инструменте: {{ entriesCount }} {{ entriesCount === 1 ? 'запись' : 'записей' }}
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

        <div :style="{
          display: 'flex', alignItems: 'flex-start', gap: '10px',
          padding: '12px',
          background: T.neutral + '08',
          border: '1px solid ' + (T.neutral + '33'),
          borderRadius: '10px',
        }">
          <FileJson :size="16" :color="T.neutral" :style="{ flexShrink: 0, marginTop: '1px' }" />
          <div :style="{ fontSize: '13px', color: T.text, lineHeight: 1.5 }">
            Загрузи <b>JSON-файл</b>, который раньше скачал из этого инструмента
            (<code :style="codeStyle">gallery_entries.json</code>
            или
            <code :style="codeStyle">gallery_tagged.json</code>).
          </div>
        </div>

        <div :style="{ fontSize: '12px', color: T.textSec, lineHeight: 1.6 }">
          <div :style="{ fontWeight: 600, color: T.text, marginBottom: '6px' }">
            Что произойдёт:
          </div>
          <ul :style="{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }">
            <li>
              Для имён, которые <b>уже есть</b> в инструменте — теги
              <span :style="{ color: T.yellow }">перезапишутся</span> из файла.
            </li>
            <li>
              Имена, которых <b>нет</b> — добавятся как новые записи.
            </li>
            <li>
              Записи, которых <b>нет в файле</b>, но есть сейчас — останутся на месте.
            </li>
          </ul>
        </div>

        <div :style="{
          fontSize: '11px', color: T.textDim, lineHeight: 1.5,
          padding: '8px 12px',
          background: T.cardAlt,
          borderRadius: '6px',
        }">
          Импортировать можно только JSON, скачанный из этого же инструмента.
          Другие форматы (gallery.ts, csv, txt) не подходят — они только для отдачи в Vue.
        </div>

        <div :style="{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }">
          <IconBtn @click="$emit('close')">Отмена</IconBtn>
          <IconBtn primary @click="fileEl?.click()">
            <Upload :size="14" /> Выбрать файл…
          </IconBtn>
        </div>

        <input
          ref="fileEl"
          type="file"
          accept="application/json,.json"
          :style="{ display: 'none' }"
          @change="handlePick"
        />
      </div>
    </div>
  </div>
</template>
