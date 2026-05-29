<script setup lang="ts">
/**
 * StoryModal.vue — 8 слайдов сториз Spotify-Wrapped-style.
 *
 * ТЗ-3: Переработка из 9 слайдов в 8 с нарративной аркой.
 * Новые блоки: moodIntro (слайд 3), обогащённый moodMap с pills (слайд 4),
 * zoneSubtitle и zoneLabel в зонах (слайд 6).
 *
 * Кнопка «Дальше» — сплошная заливка цветом активного слайда.
 */

import { computed, ref } from 'vue'
import { T, Z, RGBA } from '../theme/tokens'
import {
  buildStorySlides, buildStoryContext,
  type StorySlide,
} from '../engine/story-engine'
import { MOODS } from '../data/moods'
import { pillStyle, treeStyle } from '../theme/styles'
import { opacityToHex } from '../engine/zone-engine'
import type { Room } from '../data/rooms'
import Icon, { type IconName } from './ui/Icons.vue'

interface Props {
  rooms: Room[]
  name: string
}
const props = defineProps<Props>()
const emit = defineEmits<{ close: [] }>()

const slides = computed<StorySlide[]>(() => buildStorySlides(props.rooms, props.name))
const ctx = computed(() => buildStoryContext(props.rooms, props.name))

const slide = ref(0)

/* Защита от пересчёта количества слайдов после ре-рендера. */
const s = computed<StorySlide>(() => {
  const arr = slides.value
  if (slide.value >= arr.length) slide.value = arr.length - 1
  return arr[slide.value]
})

function next() {
  if (slide.value < slides.value.length - 1) slide.value++
}

/* ──────────────── moodIntro: маппинг id → иконка ──────────────── */

const MOOD_ICON: Record<string, string> = {
  dusk: 'arrowDownRight',
  morning: 'arrowRight',
  zenith: 'arrowUpRight',
}

/* ──────────────── zoneMap: glow-слои ──────────────── */

const glowZones: [string, string, string][] = [
  ['ceiling', 'Потолок', '30% 25%'],
  ['wall', 'Стены', '70% 25%'],
  ['floor', 'Пол', '30% 75%'],
  ['table', 'Стол', '70% 75%'],
]

function zoneGlowAlpha(zoneId: string): string {
  const share = ctx.value.zoneShare(zoneId as 'ceiling' | 'wall' | 'floor' | 'table') / 100
  return opacityToHex(Math.min(share * 0.7 + 0.05, 0.5))
}

/* ──────────────── zoneMap: тексты зон ──────────────── */

const ZONE_LABELS: Record<string, { active: string; empty: string }> = {
  ceiling: { active: 'основа освещения', empty: 'не задействован' },
  wall:    { active: 'объём и акценты', empty: 'не задействован' },
  floor:   { active: 'мягкий нижний свет', empty: 'не задействован' },
  table:   { active: 'точечный рабочий свет', empty: 'не задействован' },
}

function zoneLabel(zid: string): string {
  const labels = ZONE_LABELS[zid]
  if (!labels) return ''
  const share = ctx.value.zoneShare(zid as 'ceiling' | 'wall' | 'floor' | 'table')
  return share > 0 ? labels.active : labels.empty
}
</script>

<template>
  <div
    :style="{
      position: 'fixed',
      inset: 0,
      background: T.bg,
      zIndex: Z.fullscreenModal,
      display: 'flex',
      flexDirection: 'column',
    }"
  >
    <!-- Прогресс-бар -->
    <div
      :style="{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '16px 20px 0',
      }"
    >
      <div :style="{ display: 'flex', gap: '3px', flex: 1 }">
        <div
          v-for="(_, i) in slides"
          :key="i"
          :style="{
            height: '3px',
            borderRadius: '2px',
            flex: i === slide ? 2 : 1,
            background: i === slide ? (s.color ?? T.neutral) : T.border,
            transition: 'all .3s',
          }"
        />
      </div>
    </div>

    <!-- Контент -->
    <div
      :style="{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 28px',
        textAlign: 'center',
        overflow: 'auto',
      }"
    >
      <div
        v-if="s.iconKey"
        :style="{
          width: '90px',
          height: '90px',
          borderRadius: '20px',
          background: (s.color ?? T.neutral) + '22',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
          boxShadow: `0 0 40px ${s.color ?? T.neutral}33`,
          animation: 'float 3s ease-in-out infinite',
          flexShrink: 0,
        }"
      >
        <Icon :name="s.iconKey as IconName" :color="s.color ?? T.neutral" :size="44" />
      </div>

      <div
        :style="{
          fontSize: s.bigSub ? '16px' : '24px',
          fontWeight: 700,
          color: s.bigSub ? T.textSec : (s.color ?? T.neutral),
          marginBottom: '8px',
          flexShrink: 0,
        }"
      >
        {{ s.title }}
      </div>

      <div
        v-if="s.bigSub && s.sub"
        :style="{ fontSize: '32px', fontWeight: 800, color: s.color, flexShrink: 0 }"
      >
        {{ s.sub }}
      </div>

      <div
        v-if="s.sub && !s.bigSub"
        :style="{ fontSize: '14px', color: T.textSec, lineHeight: 1.7, maxWidth: '340px', flexShrink: 0 }"
      >
        {{ s.sub }}
      </div>

      <!-- Блоки данных -->
      <div
        v-if="s.blocks"
        :style="{
          display: 'flex',
          gap: '10px',
          marginTop: '20px',
          width: '100%',
          maxWidth: '340px',
          flexShrink: 0,
        }"
      >
        <div
          v-for="(b, bi) in s.blocks"
          :key="bi"
          :style="{
            flex: 1,
            background: T.card,
            borderRadius: '12px',
            padding: '18px 14px',
            textAlign: 'center',
          }"
        >
          <div :style="{ fontSize: '11px', color: T.textSec, marginBottom: '8px' }">
            {{ b[0] }}
          </div>
          <div
            :style="{
              fontSize: '28px',
              fontWeight: 800,
              color: T.text,
              lineHeight: 1,
            }"
          >
            {{ b[1] }}
          </div>
          <div
            v-if="b[2]"
            :style="{ fontSize: '12px', color: T.textSec, marginTop: '4px' }"
          >
            {{ b[2] }}
          </div>
        </div>
      </div>

      <!-- ═══ moodIntro (слайд 3) — три строки настроений ═══ -->
      <div
        v-if="s.moodIntro"
        :style="{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          marginTop: '20px',
          width: '100%',
          maxWidth: '340px',
          flexShrink: 0,
        }"
      >
        <div
          v-for="m in MOODS"
          :key="m.id"
          :style="{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: m.color + '15',
            borderRadius: '8px',
            padding: '10px 14px',
          }"
        >
          <Icon
            :name="(MOOD_ICON[m.id] ?? 'sun') as IconName"
            :color="m.color"
            :size="18"
          />
          <div :style="{ flex: 1 }">
            <div :style="{ fontSize: '13px', fontWeight: 700, color: T.text }">
              {{ m.name }}
            </div>
            <div :style="{ fontSize: '11px', color: T.textSec, marginTop: '2px' }">
              {{ m.quote }}
            </div>
          </div>
        </div>
      </div>

      <!-- ═══ moodMap (слайд 4) — pills с деревьями и mood-бейджем ═══ -->
      <div
        v-if="s.moodMap"
        :style="{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          marginTop: '20px',
          width: '100%',
          maxWidth: '340px',
          flexShrink: 0,
        }"
      >
        <div v-for="(m, i) in ctx.moodMap" :key="i">
          <!-- Pill -->
          <div
            :style="[pillStyle(m.tint), {
              width: '100%',
              boxSizing: 'border-box',
              justifyContent: 'flex-start',
            }]"
          >
            <span
              :style="{
                fontSize: '11px',
                fontWeight: 700,
                color: T.text,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: '1',
                maxWidth: '120px',
              }"
            >
              {{ m.name }}
            </span>
            <div
              :style="{
                display: 'flex',
                alignItems: 'center',
                lineHeight: '1',
                paddingLeft: '3px',
              }"
            >
              <span
                v-for="(w, ti) in m.woods"
                :key="ti"
                :style="treeStyle(w, ti)"
              />
            </div>
            <span
              :style="{
                fontSize: '12px',
                fontWeight: 700,
                color: m.mood.color,
                marginLeft: 'auto',
                whiteSpace: 'nowrap',
                lineHeight: '1',
              }"
            >
              {{ m.mood.name }}
            </span>
          </div>
          <!-- Quote под pill -->
          <div
            :style="{
              fontSize: '11px',
              color: T.textSec,
              marginTop: '4px',
              paddingLeft: '12px',
              lineHeight: 1.4,
            }"
          >
            {{ m.mood.quote }}
          </div>
        </div>
      </div>

      <!-- ═══ zoneMap (слайд 6) — 2×2 glow с подзаголовком и текстами ═══ -->
      <div
        v-if="s.zoneMap"
        :style="{
          marginTop: '20px',
          width: '100%',
          maxWidth: '340px',
          flexShrink: 0,
        }"
      >
        <!-- Подзаголовок по распределению -->
        <div
          v-if="s.zoneSubtitle"
          :style="{
            fontSize: '12px',
            color: T.textSec,
            textAlign: 'center',
            marginBottom: '12px',
            lineHeight: 1.5,
          }"
        >
          {{ s.zoneSubtitle }}
        </div>

        <!-- Glow wrapper -->
        <div
          :style="{
            background: (s.color ?? T.neutral) + '08',
            borderRadius: '16px',
            border: `1px solid ${s.color ?? T.neutral}18`,
            padding: '8px',
            position: 'relative',
          }"
        >
          <div
            v-for="[zid, , pos] in glowZones"
            :key="zid"
            :style="{
              position: 'absolute',
              inset: 0,
              borderRadius: '16px',
              pointerEvents: 'none',
              background: `radial-gradient(ellipse 55% 55% at ${pos}, ${s.color ?? T.neutral}${zoneGlowAlpha(zid)}, transparent 65%)`,
            }"
          />
          <div
            :style="{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              position: 'relative',
              zIndex: 2,
            }"
          >
            <div
              v-for="[zid, zname] in glowZones"
              :key="zid"
              :style="{
                background: T.card + '88',
                borderRadius: '10px',
                padding: '14px 10px',
                textAlign: 'left',
              }"
            >
              <div
                :style="{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: T.text,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }"
              >
                {{ zname }}
                <span
                  :style="{
                    marginLeft: '4px',
                    padding: '1px 5px',
                    borderRadius: '4px',
                    background: (s.color ?? T.neutral) + '20',
                    fontSize: '9px',
                    fontWeight: 600,
                    color: s.color ?? T.neutral,
                  }"
                >
                  {{ ctx.zoneShare(zid as 'ceiling' | 'wall' | 'floor' | 'table') }}%
                </span>
              </div>
              <!-- Текст-описание зоны -->
              <div
                :style="{
                  fontSize: '9px',
                  color: T.textSec,
                  marginTop: '4px',
                }"
              >
                {{ zoneLabel(zid) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Кнопка + ссылка «пропустить» -->
    <div :style="{ padding: '0 28px 28px', textAlign: 'center', flexShrink: 0 }">
      <!-- «Дальше» — заливка цветом слайда -->
      <button
        v-if="slide < slides.length - 1"
        :style="{
          padding: '12px 40px',
          background: s.color ?? T.neutral,
          border: 'none',
          borderRadius: '8px',
          color: T.bg,
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 700,
          transition: 'background .3s',
        }"
        @click="next"
      >
        Дальше
      </button>
      <!-- «Домой» -->
      <button
        v-else
        :style="{
          padding: '12px 40px',
          background: T.text,
          border: 'none',
          borderRadius: '8px',
          color: T.bg,
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 700,
        }"
        @click="emit('close')"
      >
        Домой
      </button>

      <div v-if="slide < slides.length - 1" :style="{ marginTop: '14px' }">
        <button
          :style="{
            background: 'none',
            border: 'none',
            color: T.textSec,
            fontSize: '13px',
            cursor: 'pointer',
            padding: '4px 8px',
            textDecoration: 'underline',
            textUnderlineOffset: '3px',
          }"
          @click="emit('close')"
        >
          Пропустить
        </button>
      </div>
    </div>
  </div>
</template>

<style>
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
</style>
