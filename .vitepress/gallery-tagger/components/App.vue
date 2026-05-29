<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import {
  Camera, Filter as FilterIcon, Download, Upload,
  X, RefreshCw, Search, Image as ImageIcon,
  LayoutGrid, List as ListIcon,
} from '../lib/icons'

import { T } from '../lib/theme'
import { SK, storageGet, storageSet, storageDel } from '../lib/storage'
import {
  joinUrl, parseFilenames, makeEntry, normalizeEntry, applyFilter,
} from '../lib/gallery'
import type { GalleryEntry, FilterMode, ViewMode } from '../lib/types'

import Section from './ui/Section.vue'
import IconBtn from './ui/IconBtn.vue'
import Chip from './ui/Chip.vue'
import ConfirmDialog from './ui/ConfirmDialog.vue'
import Thumb from './Thumb.vue'
import ListRow from './ListRow.vue'
import TagPanel from './TagPanel.vue'
import ExportPanel from './ExportPanel.vue'
import ImportPanel from './ImportPanel.vue'

// Локальный путь к папке public/gallery/ — VitePress сам обслужит.
// Не используем raw.githubusercontent.com потому что GitHub блокирует hotlinking
// (отдаёт картинки с Content-Disposition: attachment и X-Content-Type-Options: nosniff,
// браузер не показывает их в <img>).
const DEFAULT_BASE_URL = '/gallery/'

// Старый дефолт — для миграции, если у юзера он уже в localStorage.
const OLD_DEFAULT_BASE_URL = 'https://raw.githubusercontent.com/mihail-izumov/ModulRosta/main/public/gallery/'

// === STATE ===
const loaded = ref(false)
const baseUrl = ref(DEFAULT_BASE_URL)
const filenamesText = ref('')
const entries = ref<GalleryEntry[]>([])
const activeFilename = ref<string | null>(null)
const filter = ref<FilterMode>('all')
const search = ref('')
const exportOpen = ref(false)
const importOpen = ref(false)
const confirmReset = ref(false)
const viewMode = ref<ViewMode>('grid')
const toast = ref<string | null>(null)

let toastTimer: ReturnType<typeof setTimeout> | null = null
function showToast(msg: string) {
  toast.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value = null }, 2600)
}

// === LOAD on mount ===
onMounted(() => {
  const u = storageGet(SK.baseUrl)
  const f = storageGet(SK.filenames)
  const e = storageGet(SK.entries)

  // Миграция: если в localStorage сохранён старый дефолт (raw.githubusercontent...) —
  // молча заменяем на новый локальный путь и пересобираем URL у всех записей.
  const needsMigration = u === OLD_DEFAULT_BASE_URL
  if (needsMigration) {
    baseUrl.value = DEFAULT_BASE_URL
  } else if (u) {
    baseUrl.value = u
  }

  if (f) filenamesText.value = f
  if (e) {
    try {
      const parsed = JSON.parse(e)
      if (Array.isArray(parsed)) {
        entries.value = parsed.map(x => {
          const norm = normalizeEntry(x, baseUrl.value)
          // При миграции — пересчитать URL у каждой записи на новый base.
          if (needsMigration) norm.url = joinUrl(baseUrl.value, norm.filename)
          return norm
        })
      }
    } catch { /* ignore */ }
  }
  loaded.value = true
})

onBeforeUnmount(() => {
  if (toastTimer) clearTimeout(toastTimer)
})

// === SAVE on changes ===
watch(entries, (v) => {
  if (loaded.value) storageSet(SK.entries, JSON.stringify(v))
}, { deep: true })

watch(baseUrl, (v) => {
  if (!loaded.value) return
  storageSet(SK.baseUrl, v)
  // Регенерация URL у всех уже добавленных записей
  entries.value = entries.value.map(e => ({ ...e, url: joinUrl(v, e.filename) }))
})

watch(filenamesText, (v) => {
  if (loaded.value) storageSet(SK.filenames, v)
})

// === DERIVED ===
const filteredEntries = computed(() =>
  applyFilter(entries.value, filter.value, search.value),
)
const taggedCount = computed(() =>
  entries.value.filter(e => e.tagged).length,
)
const activeEntry = computed(() =>
  entries.value.find(e => e.filename === activeFilename.value) || null,
)
const parsedNames = computed(() => parseFilenames(filenamesText.value))
const untaggedCount = computed(() => entries.value.filter(e => !e.tagged).length)
const noModelCount  = computed(() => entries.value.filter(e => e.models.length === 0).length)

// === HANDLERS ===
function handleImport() {
  const names = parsedNames.value
  if (!names.length) { showToast('Список пуст'); return }
  const byName = new Map(entries.value.map(e => [e.filename, e]))
  let added = 0
  for (const n of names) {
    if (!byName.has(n)) {
      byName.set(n, makeEntry(n, baseUrl.value))
      added++
    } else {
      byName.set(n, { ...byName.get(n)!, url: joinUrl(baseUrl.value, n) })
    }
  }
  // Записи, которые уже были в entries, но не упомянуты в новых names — оставляем как есть
  const next: GalleryEntry[] = names.map(n => byName.get(n)!)
  for (const e of entries.value) {
    if (!names.includes(e.filename)) next.push(e)
  }
  entries.value = next
  showToast(`Импорт · добавлено ${added}, всего ${next.length}`)
}

function handleReset() {
  confirmReset.value = true
}
function doReset() {
  entries.value = []
  filenamesText.value = ''
  storageDel(SK.entries)
  storageDel(SK.filenames)
  confirmReset.value = false
  showToast('Все данные сброшены')
}

function handleUpdate(updated: GalleryEntry) {
  entries.value = entries.value.map(e =>
    e.filename === updated.filename ? updated : e,
  )
}

function handleDone(nextTagged: boolean) {
  if (!activeFilename.value) return
  const af = activeFilename.value
  const updated = entries.value.map(e =>
    e.filename === af ? { ...e, tagged: nextTagged } : e,
  )
  entries.value = updated
  if (nextTagged) {
    const filteredNow = applyFilter(updated, filter.value, search.value)
    const i = filteredNow.findIndex(e => e.filename === af)
    const next = filteredNow.slice(i + 1).find(e => !e.tagged)
      || filteredNow.find(e => !e.tagged)
    if (next) {
      activeFilename.value = next.filename
    } else {
      activeFilename.value = null
      showToast('Размечено всё в текущем фильтре 🎉')
    }
  }
}

function handleResetEntry() {
  if (!activeFilename.value) return
  const af = activeFilename.value
  entries.value = entries.value.map(e =>
    e.filename === af
      ? { ...e, rooms: [], models: [], woods: [], zones: [], sizes: [], note: '', tagged: false }
      : e,
  )
  showToast('Теги сброшены')
}

function handleImportJson(file: File) {
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    try {
      const text = String(ev.target?.result || '')
      const parsed = JSON.parse(text)
      if (!Array.isArray(parsed)) {
        showToast('Файл не похож на JSON-массив записей')
        return
      }
      const incoming = parsed
        .filter((x: any) => x && x.filename)
        .map((x: any) => normalizeEntry(x, baseUrl.value))
      const map = new Map(entries.value.map(e => [e.filename, e]))
      let updated = 0, added = 0
      for (const e of incoming) {
        if (map.has(e.filename)) updated++
        else added++
        map.set(e.filename, e)
      }
      entries.value = Array.from(map.values())
      showToast(`Импорт · добавлено ${added}, обновлено ${updated}`)
    } catch (err: any) {
      showToast('Ошибка чтения JSON: ' + (err?.message || 'неизвестная'))
    }
  }
  reader.onerror = () => showToast('Не удалось прочитать файл')
  reader.readAsText(file)
}

function focusBase(e: FocusEvent) {
  (e.target as HTMLInputElement).style.borderColor = T.neutral
}
function blurBase(e: FocusEvent) {
  (e.target as HTMLInputElement).style.borderColor = T.border
}
</script>

<template>
  <div :style="{
    background: T.bg,
    color: T.text,
    minHeight: '100vh',
    fontFamily: '-apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, system-ui, sans-serif',
    fontSize: '14px',
    lineHeight: 1.5,
  }">
    <!-- HEADER -->
    <div :style="{
      position: 'sticky', top: 0, zIndex: 50,
      background: T.bg + 'F2',
      backdropFilter: 'blur(8px)',
      borderBottom: '1px solid ' + T.border,
      padding: '14px 20px',
      display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap',
    }">
      <div :style="{ display: 'flex', alignItems: 'center', gap: '10px' }">
        <div :style="{
          width: '32px', height: '32px', borderRadius: '8px',
          background: T.neutral + '22',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }">
          <Camera :size="18" :color="T.neutral" />
        </div>
        <div>
          <div :style="{ fontSize: '15px', fontWeight: 700, color: T.text, lineHeight: 1.1 }">
            Gallery Tagger
          </div>
          <div :style="{ fontSize: '11px', color: T.textSec, marginTop: '2px' }">
            разметка интерьерных фото WOODLED
          </div>
        </div>
      </div>

      <div :style="{ flex: 1 }" />

      <div :style="{
        padding: '6px 12px',
        background: taggedCount > 0 ? T.green + '15' : T.cardAlt,
        border: '1px solid ' + (taggedCount > 0 ? T.green + '44' : T.border),
        borderRadius: '999px',
        fontSize: '12px', fontWeight: 600,
        color: taggedCount > 0 ? T.green : T.textSec,
        whiteSpace: 'nowrap',
      }">
        {{ taggedCount }} / {{ entries.length }} размечено
      </div>

      <IconBtn
        title="Загрузить ранее экспортированный JSON-бэкап"
        @click="importOpen = true"
      >
        <Upload :size="14" /> Импорт
      </IconBtn>
      <IconBtn
        primary
        title="Экспортировать gallery.ts или JSON-бэкап"
        @click="exportOpen = true"
      >
        <Download :size="14" /> Экспорт
      </IconBtn>
    </div>

    <!-- BODY -->
    <div :style="{ maxWidth: '1280px', margin: '0 auto', padding: '20px' }">

      <!-- IMPORTER -->
      <Section :title="entries.length > 0 ? `1. Источник · ${entries.length} файлов` : '1. Источник фото'">
        <div :style="{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.3fr)',
          gap: '10px',
          alignItems: 'start',
        }">
          <label :style="{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }">
            <span :style="{ fontSize: '11px', color: T.textSec, fontWeight: 600 }">
              Base URL
              <span :style="{ color: T.textDim, fontWeight: 400 }">· можно менять в любой момент</span>
            </span>
            <input
              type="text"
              :value="baseUrl"
              placeholder="https://raw.githubusercontent.com/.../"
              :style="{
                width: '100%',
                background: T.cardAlt,
                border: '1px solid ' + T.border,
                borderRadius: '8px',
                padding: '7px 10px',
                color: T.text,
                fontSize: '12.5px',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color .15s ease',
              }"
              @input="(e) => baseUrl = (e.target as HTMLInputElement).value"
              @focus="focusBase"
              @blur="blurBase"
            />
            <span :style="{ fontSize: '10px', color: T.textDim, marginTop: '2px' }">
              Кликни в поле и отредактируй. URL уже добавленных файлов обновится автоматически.
            </span>
          </label>

          <label :style="{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }">
            <span :style="{ fontSize: '11px', color: T.textSec, fontWeight: 600 }">
              Имена файлов
              <span :style="{ color: T.textDim, fontWeight: 400 }">· построчно или через запятую</span>
            </span>
            <textarea
              :value="filenamesText"
              placeholder="interior.jpg&#10;living_oak_01.jpg&#10;IMG_2034.jpg"
              rows="3"
              :style="{
                width: '100%',
                background: T.cardAlt,
                border: '1px solid ' + T.border,
                borderRadius: '8px',
                padding: '7px 10px',
                color: T.text,
                fontSize: '12.5px',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box',
              }"
              @input="(e) => filenamesText = (e.target as HTMLTextAreaElement).value"
            />
          </label>
        </div>

        <div :style="{
          display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap',
          marginTop: '10px',
        }">
          <IconBtn
            primary
            title="Безопасно: существующая разметка не теряется, дубли игнорируются"
            @click="handleImport"
          >
            <Upload :size="14" /> Загрузить ({{ parsedNames.length }})
          </IconBtn>
          <div :style="{ flex: 1 }" />
          <IconBtn danger title="Полностью обнулить (с подтверждением)" @click="handleReset">
            <RefreshCw :size="13" /> Сброс
          </IconBtn>
        </div>
      </Section>

      <!-- FILTERS + GRID/LIST -->
      <Section
        v-if="entries.length > 0"
        :title="`2. Разметка · ${filteredEntries.length} из ${entries.length}`"
      >
        <div :style="{
          display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap',
          marginBottom: '12px',
        }">
          <FilterIcon :size="14" :color="T.textSec" />
          <Chip :active="filter === 'all'" @click="filter = 'all'">
            Все ({{ entries.length }})
          </Chip>
          <Chip :active="filter === 'untagged'" @click="filter = 'untagged'">
            Не размечены ({{ untaggedCount }})
          </Chip>
          <Chip :active="filter === 'nomodel'" @click="filter = 'nomodel'">
            Без модели ({{ noModelCount }})
          </Chip>

          <div :style="{ flex: 1 }" />

          <!-- Переключатель сетка/список -->
          <div :style="{
            display: 'flex',
            background: T.cardAlt,
            border: '1px solid ' + T.border,
            borderRadius: '8px',
            padding: '2px',
          }">
            <button
              title="Сетка превью"
              :style="{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '30px', height: '26px',
                background: viewMode === 'grid' ? T.neutral + '22' : 'transparent',
                border: 'none', borderRadius: '6px',
                color: viewMode === 'grid' ? T.text : T.textSec,
                cursor: 'pointer',
              }"
              @click="viewMode = 'grid'"
            >
              <LayoutGrid :size="14" />
            </button>
            <button
              title="Список с тегами"
              :style="{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '30px', height: '26px',
                background: viewMode === 'list' ? T.neutral + '22' : 'transparent',
                border: 'none', borderRadius: '6px',
                color: viewMode === 'list' ? T.text : T.textSec,
                cursor: 'pointer',
              }"
              @click="viewMode = 'list'"
            >
              <ListIcon :size="14" />
            </button>
          </div>

          <!-- Поиск -->
          <div :style="{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: T.cardAlt,
            border: '1px solid ' + T.border,
            borderRadius: '999px',
            padding: '5px 11px',
            minWidth: '200px',
          }">
            <Search :size="13" :color="T.textSec" />
            <input
              type="text"
              :value="search"
              placeholder="имя файла…"
              :style="{
                background: 'transparent',
                border: 'none', outline: 'none',
                color: T.text, fontSize: '12px',
                width: '100%', minWidth: 0,
                fontFamily: 'inherit',
              }"
              @input="(e) => search = (e.target as HTMLInputElement).value"
            />
            <button
              v-if="search"
              :style="{
                background: 'transparent', border: 'none',
                color: T.textSec, cursor: 'pointer',
                padding: 0, display: 'flex',
              }"
              @click="search = ''"
            >
              <X :size="13" />
            </button>
          </div>
        </div>

        <!-- GRID или LIST -->
        <div
          v-if="filteredEntries.length === 0"
          :style="{
            padding: '30px', textAlign: 'center',
            color: T.textDim, fontSize: '13px',
          }"
        >
          Ничего не найдено по текущему фильтру.
        </div>
        <div
          v-else-if="viewMode === 'grid'"
          :style="{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
            gap: '10px',
          }"
        >
          <Thumb
            v-for="e in filteredEntries"
            :key="e.filename"
            :entry="e"
            @click="activeFilename = e.filename"
          />
        </div>
        <div
          v-else
          :style="{ display: 'flex', flexDirection: 'column', gap: '5px' }"
        >
          <ListRow
            v-for="e in filteredEntries"
            :key="e.filename"
            :entry="e"
            @click="activeFilename = e.filename"
          />
        </div>
      </Section>

      <!-- EMPTY STATE -->
      <div
        v-if="entries.length === 0"
        :style="{
          padding: '40px 20px', textAlign: 'center',
          color: T.textSec,
          border: '1px dashed ' + T.border,
          borderRadius: '12px',
          background: T.card,
          marginTop: '8px',
        }"
      >
        <div :style="{
          width: '56px', height: '56px', borderRadius: '50%',
          background: T.cardAlt,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 14px',
        }">
          <ImageIcon :size="26" :color="T.textSec" />
        </div>
        <div :style="{ fontSize: '14px', color: T.text, fontWeight: 600, marginBottom: '4px' }">
          Пока ничего не загружено
        </div>
        <div :style="{ fontSize: '12px', color: T.textSec }">
          Укажите base URL и вставьте список имён файлов выше — затем «Загрузить».
        </div>
      </div>

      <!-- FOOTER NOTE -->
      <div :style="{
        marginTop: '20px', padding: '10px 14px',
        fontSize: '11px', color: T.textDim,
        textAlign: 'center',
      }">
        Разметка живёт в
        <code :style="{ color: T.textSec }">localStorage</code> —
        между сессиями сохраняется автоматически. Файлы НЕ переименовываются.
        Ручная разметка только.
      </div>
    </div>

    <!-- MODALS -->
    <TagPanel
      v-if="activeEntry"
      :entry="activeEntry"
      @change="handleUpdate"
      @close="activeFilename = null"
      @done="handleDone"
      @reset="handleResetEntry"
    />
    <ExportPanel
      v-if="exportOpen"
      :entries="entries"
      @close="exportOpen = false"
      @toast="showToast"
    />
    <ImportPanel
      v-if="importOpen"
      :entries-count="entries.length"
      @close="importOpen = false"
      @pick-file="handleImportJson"
    />
    <ConfirmDialog
      v-if="confirmReset"
      title="Сбросить всё?"
      :body="`Удалит все записи (${entries.length}) и список файлов. Это необратимо.`"
      confirm-label="Да, сбросить"
      cancel-label="Отмена"
      danger
      @confirm="doReset"
      @cancel="confirmReset = false"
    />

    <!-- TOAST -->
    <div
      v-if="toast"
      :style="{
        position: 'fixed',
        bottom: '24px', left: '50%',
        transform: 'translateX(-50%)',
        padding: '10px 16px',
        background: T.card,
        border: '1px solid ' + T.border,
        borderRadius: '999px',
        color: T.text, fontSize: '13px',
        boxShadow: '0 8px 30px rgba(0,0,0,.5)',
        zIndex: 200,
        maxWidth: '90vw',
      }"
    >
      {{ toast }}
    </div>
  </div>
</template>
