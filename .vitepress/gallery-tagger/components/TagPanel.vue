<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount } from 'vue'
import {
  Tag, ExternalLink, X, Check, RefreshCw, Trash2, AlertCircle,
} from '../lib/icons'
import { T } from '../lib/theme'
import { countCritical, toggleIn, toDisplayUrl } from '../lib/gallery'
import type { GalleryEntry } from '../lib/types'
import { RTS } from '../../customizer/data/rooms'
import { MD, FAMILIES, ALL_ZONES, type ModelId, type FamilyId } from '../../customizer/data/catalog'
import { MATS } from '../../customizer/data/materials'
import { WOOD_COLORS } from '../lib/wood-colors'
import ImageWithFallback from './ImageWithFallback.vue'
import Section from './ui/Section.vue'
import Chip from './ui/Chip.vue'
import IconBtn from './ui/IconBtn.vue'
import HelpHint from './ui/HelpHint.vue'

const props = defineProps<{ entry: GalleryEntry }>()
const emit = defineEmits<{
  change: [entry: GalleryEntry]
  close: []
  done: [tagged: boolean]
  reset: []
}>()

const filled = computed(() => countCritical(props.entry))
const displayUrl = computed(() => toDisplayUrl(props.entry.url))

// FAMILIES в реальном catalog — это Record<FamilyId, readonly ModelId[]>:
//   { rotor: ['rotor_s', 'rotor_m', ...], rotor_x: [...], ... }
// MD — это Record<ModelId, Model>:
//   { rotor_s: { name: 'Rotor S', letter: 'S', family: 'rotor', ... }, ... }
// Поэтому никаких .map / .filter — индексируем как объекты.

const FAMILY_DISPLAY: Record<FamilyId, string> = {
  rotor:      'Rotor',
  rotor_x:    'Rotor X',
  elliptical: 'Elliptical',
  spot:       'Spot',
  bra_v:      'Бра Vertical',
}

interface FamilyGroupView {
  familyId: FamilyId
  familyName: string
  models: { id: ModelId; letter: string; name: string }[]
}

interface SingletonView {
  id: ModelId
  name: string
}

// Модели сгруппированные по семействам (для чипов с буквой S / M / L / 1000)
const familyModels = computed<FamilyGroupView[]>(() =>
  (Object.entries(FAMILIES) as [FamilyId, readonly ModelId[]][])
    .map(([famId, modelIds]) => ({
      familyId: famId,
      familyName: FAMILY_DISPLAY[famId] || famId,
      models: modelIds
        .filter(mid => MD[mid])
        .map(mid => ({
          id: mid,
          letter: MD[mid].letter,
          name: MD[mid].name,
        })),
    }))
    .filter(g => g.models.length > 0),
)

// Одиночные модели (без family) — показываем полным именем
const singletonModels = computed<SingletonView[]>(() =>
  (Object.entries(MD) as [ModelId, typeof MD[ModelId]][])
    .filter(([, m]) => !m.family)
    .map(([id, m]) => ({ id, name: m.name })),
)

function update(patch: Partial<GalleryEntry>) {
  emit('change', { ...props.entry, ...patch })
}

function toggleRoom(id: string) {
  update({ rooms: toggleIn(props.entry.rooms, id as any) })
}
function toggleModel(id: string) {
  update({ models: toggleIn(props.entry.models, id as any) })
}
function toggleWood(id: string) {
  update({ woods: toggleIn(props.entry.woods, id as any) })
}
function toggleZone(id: string) {
  update({ zones: toggleIn(props.entry.zones, id as any) })
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div
    :style="{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,.72)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px', zIndex: 100,
    }"
    @click="$emit('close')"
  >
    <div
      :style="{
        background: T.bg,
        border: '1px solid ' + T.border,
        borderRadius: '16px',
        width: '100%', maxWidth: '880px',
        maxHeight: '92vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,.6)',
      }"
      @click.stop
    >
      <!-- HEADER -->
      <div :style="{
        padding: '14px 18px',
        borderBottom: '1px solid ' + T.border,
        display: 'flex', alignItems: 'center', gap: '12px',
      }">
        <Tag :size="16" :color="T.neutral" />
        <div :style="{
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: '14px', color: T.text, fontWeight: 600,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          flex: 1,
        }">{{ entry.filename }}</div>
        <a
          :href="entry.url"
          target="_blank"
          rel="noopener noreferrer"
          title="Открыть оригинал в новой вкладке"
          :style="{
            color: T.textSec, display: 'inline-flex', alignItems: 'center',
            gap: '4px', fontSize: '12px', textDecoration: 'none',
          }"
        >
          <ExternalLink :size="13" />
        </a>
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

      <!-- CONTENT -->
      <div :style="{
        padding: '18px',
        overflowY: 'auto',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.3fr)',
        gap: '16px',
      }">
        <!-- Preview -->
        <div :style="{
          position: 'relative',
          background: T.cardAlt,
          border: '1px solid ' + T.border,
          borderRadius: '12px',
          overflow: 'hidden',
          aspectRatio: '4 / 3',
          alignSelf: 'start',
        }">
          <ImageWithFallback
            :src="displayUrl"
            :filename="entry.filename"
            big
            :img-style="{
              width: '100%', height: '100%',
              objectFit: 'cover', display: 'block',
            }"
          />
        </div>

        <!-- Tags -->
        <div :style="{ display: 'flex', flexDirection: 'column', gap: '12px' }">

          <!-- 1. Комнаты -->
          <Section
            :title="`Комнаты · ${entry.rooms.length}`"
            :accent="entry.rooms.length ? T.neutral : T.textSec"
          >
            <div :style="{ display: 'flex', flexWrap: 'wrap', gap: '6px' }">
              <Chip
                v-for="r in RTS"
                :key="r.id"
                :active="entry.rooms.includes(r.id)"
                @click="toggleRoom(r.id)"
              >
                {{ r.name }}
              </Chip>
            </div>
          </Section>

          <!-- 2. Модели -->
          <Section
            :title="`Модели · ${entry.models.length}`"
            :accent="entry.models.length ? T.neutral : T.textSec"
          >
            <div :style="{ display: 'flex', flexDirection: 'column', gap: '8px' }">
              <div
                v-for="g in familyModels"
                :key="g.familyId"
                :style="{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }"
              >
                <div :style="{
                  fontSize: '10px', color: T.textDim,
                  textTransform: 'uppercase', letterSpacing: '0.5px',
                  minWidth: '78px', fontWeight: 600,
                }">
                  {{ g.familyName }}
                </div>
                <Chip
                  v-for="m in g.models"
                  :key="m.id"
                  size="sm"
                  :active="entry.models.includes(m.id)"
                  :title="m.name"
                  @click="toggleModel(m.id)"
                >
                  {{ m.letter }}
                </Chip>
              </div>

              <div :style="{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }">
                <div :style="{
                  fontSize: '10px', color: T.textDim,
                  textTransform: 'uppercase', letterSpacing: '0.5px',
                  minWidth: '78px', fontWeight: 600,
                }">Одиночные</div>
                <Chip
                  v-for="m in singletonModels"
                  :key="m.id"
                  size="sm"
                  :active="entry.models.includes(m.id)"
                  :title="m.id"
                  @click="toggleModel(m.id)"
                >
                  {{ m.name }}
                </Chip>
              </div>
            </div>
          </Section>

          <!-- 3. Дерево -->
          <Section
            :title="`Дерево · ${entry.woods.length}`"
            :accent="entry.woods.length ? T.neutral : T.textSec"
          >
            <div :style="{ display: 'flex', flexWrap: 'wrap', gap: '6px' }">
              <Chip
                v-for="w in MATS"
                :key="w.id"
                :color="WOOD_COLORS[w.id]"
                :active="entry.woods.includes(w.id)"
                @click="toggleWood(w.id)"
              >
                <span :style="{
                  width: '10px', height: '10px', borderRadius: '50%',
                  background: WOOD_COLORS[w.id],
                  border: w.id === 'black' ? '1px solid ' + T.textDim : 'none',
                  display: 'inline-block', marginRight: '2px',
                }" />
                {{ w.name }}
              </Chip>
            </div>
          </Section>

          <!-- 4. Зоны -->
          <Section
            :title="`Зоны · ${entry.zones.length}`"
            :accent="entry.zones.length ? T.neutral : T.textSec"
          >
            <div :style="{ display: 'flex', flexWrap: 'wrap', gap: '6px' }">
              <Chip
                v-for="z in ALL_ZONES"
                :key="z.id"
                :active="entry.zones.includes(z.id)"
                @click="toggleZone(z.id)"
              >
                {{ z.name }}
              </Chip>
            </div>
          </Section>

          <!-- 5. Заметка -->
          <Section title="Заметка">
            <textarea
              :value="entry.note"
              placeholder="например: «фото для зимнего mood'а», «здесь подвес длиннее обычного»…"
              rows="2"
              :style="{
                width: '100%',
                background: T.cardAlt,
                border: '1px solid ' + T.border,
                borderRadius: '8px',
                padding: '8px 10px',
                color: T.text,
                fontSize: '13px',
                fontFamily: 'inherit',
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box',
              }"
              @input="(e) => update({ note: (e.target as HTMLTextAreaElement).value })"
            />
            <div :style="{
              fontSize: '11.5px', color: T.textSec,
              marginTop: '8px', lineHeight: 1.5,
              display: 'flex', alignItems: 'flex-start', gap: '6px',
              padding: '8px 10px',
              background: T.cardAlt,
              border: '1px solid ' + T.border,
              borderRadius: '6px',
            }">
              <AlertCircle :size="13" :color="T.neutral" :style="{ flexShrink: 0, marginTop: '2px' }" />
              <span>
                Попадёт в
                <code :style="{ color: T.text, background: T.bg, padding: '1px 5px', borderRadius: '3px' }">gallery.ts</code>
                как поле
                <code :style="{ color: T.text, background: T.bg, padding: '1px 5px', borderRadius: '3px' }">note</code>.
                Vue-приложение её не использует — это памятка для тебя.
              </span>
            </div>
          </Section>
        </div>
      </div>

      <!-- FOOTER -->
      <div :style="{
        padding: '12px 18px',
        borderTop: '1px solid ' + T.border,
        display: 'flex', alignItems: 'center', gap: '10px',
      }">
        <div :style="{ fontSize: '12px', color: T.textSec, display: 'flex', alignItems: 'center' }">
          <span>
            Главные теги: <span :style="{
              color: filled === 4 ? T.green : filled > 0 ? T.yellow : T.textDim,
              fontWeight: 600,
            }">{{ filled }}/4</span>
          </span>
          <HelpHint>
            Сколько из четырёх главных категорий заполнено: <b>комната · модель · дерево · зона</b>.
            Размер и заметка сюда не считаются — они опциональные.
            Когда 4/4 — фото готово к отметке «Готово».
          </HelpHint>
          <span
            v-if="entry.tagged"
            :style="{ marginLeft: '10px', color: T.green, fontWeight: 600 }"
          >
            <Check :size="12" :style="{ verticalAlign: 'middle' }" /> размечено
          </span>
        </div>
        <div :style="{ flex: 1 }" />
        <IconBtn danger title="Очистить все теги этого фото" @click="$emit('reset')">
          <Trash2 :size="14" /> Сбросить
        </IconBtn>
        <IconBtn
          :primary="!entry.tagged"
          :title="entry.tagged ? 'Снять отметку «готово»' : 'Отметить как размечено'"
          @click="$emit('done', !entry.tagged)"
        >
          <template v-if="entry.tagged">
            <RefreshCw :size="14" /> Вернуть в черновик
          </template>
          <template v-else>
            <Check :size="14" /> Готово
          </template>
        </IconBtn>
      </div>
    </div>
  </div>
</template>
