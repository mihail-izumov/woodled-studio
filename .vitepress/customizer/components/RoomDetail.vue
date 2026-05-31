<script setup lang="ts">
/**
 * RoomDetail.vue — Полноэкранный редактор комнаты.
 *
 * Fix 2: Хедер заменён на NavHeader (единый стиль).
 *
 * batch7 #2: «Смарт-подбор» → «WOODLED Smart» (в кнопке + заголовке модалки).
 * batch7 #10: текст параметров комнаты 11px → 13px, fontWeight 600.
 *
 * batch11 #9 v4: handleSettingsPatch → handleSettingsSave.
 *   Теперь RoomSettings шлёт ОДИН emit('save', updated) с полным объектом
 *   комнаты вместо нескольких per-key emit('patch') — это устраняет race
 *   condition, из-за которого изменения площади/потолка/лимитов терялись
 *   на пути в HouseStats и движок яркости.
 */

import { computed, ref, watch } from 'vue'
import { T, Z } from '../theme/tokens'
import { ALL_ZONES, type Fixture, type ZoneId } from '../data/catalog'
import { autoMood, type Mood } from '../data/moods'
import { getRT, ROOM_PREP, type Room, type ZoneLimits } from '../data/rooms'
import {
  baseLm, fxLm, fxLamps, getArea, furnPct as furnPctFn,
} from '../engine/brightness'
import {
  zoneFxCount, zoneLm,
  roomWood, roomZones, glowOpacity, opacityToHex, GLOW_POS,
} from '../engine/zone-engine'
import { pw, woodNames } from '../engine/i18n'
import { MD } from '../data/catalog'
import { getBright } from '../data/moods'
import { useConfigurator } from '../store/configurator'

import Icon from './ui/Icons.vue'
import Modal from './ui/Modal.vue'
import NavHeader from './ui/NavHeader.vue'
import SmartHelpModal from './ui/SmartHelpModal.vue'
import MoodBlock from './MoodBlock.vue'
import ZoneCard from './ZoneCard.vue'
import FurnitureBlock from './FurnitureBlock.vue'
import Footer from './Footer.vue'
import RoomSettings from './RoomSettings.vue'
import AddFxModal from './AddFxModal.vue'
import ZoneFixturesModal from './ZoneFixturesModal.vue'

/* Фотогалерея «Ваш свет в интерьере» / «С похожим набором» */
import GallerySection from './gallery/GallerySection.vue'
import { byCombined, toDisplayItem, preloadAspects } from '../engine/gallery-engine'

interface Props {
  room: Room
}
const props = defineProps<Props>()
const emit = defineEmits<{
  update: [room: Room]
  delete: []
  close: []
  feedback: [msg: string]
  openFx: [roomId: string, fxIdx: number]
}>()

const cfg = useConfigurator()

const rt = computed(() => getRT(props.room.typeId))
const base = computed(() => baseLm(rt.value, props.room))
const actual = computed(() => fxLm(props.room.fixtures))
const lamps = computed(() => fxLamps(props.room.fixtures))
const ratio = computed(() => (base.value > 0 ? actual.value / base.value : 0))
const mood = computed<Mood>(() => autoMood(ratio.value))
const tint = computed(() => props.room.cardColor ?? T.neutral)
const tintedMood = computed<Mood>(() => ({ ...mood.value, color: tint.value }))
const bright = computed(() => getBright(ratio.value))
const rW = computed(() => roomWood(props.room.fixtures))
const furnPct = computed(() => furnPctFn(props.room.furniture))
const zones = computed(() => roomZones(rt.value))
const area = computed(() => getArea(rt.value, props.room))

const roomPrepName = computed(() =>
  props.room.customName
    ? `в ${props.room.customName}`
    : ROOM_PREP[props.room.typeId] ?? `в ${rt.value.name}`
)

interface GlowLayer { pos: string; opacity: number }
const glowLayers = computed<GlowLayer[]>(() =>
  zones.value.map((z) => ({
    pos: GLOW_POS[z.id] ?? GLOW_POS.center,
    opacity: glowOpacity(
      actual.value > 0 ? zoneLm(props.room.fixtures, z.id) / actual.value : 0,
    ),
  })),
)

function glowHex(op: number): string {
  return opacityToHex(op)
}

function patchRoom<K extends keyof Room>(key: K, value: Room[K]) {
  emit('update', { ...props.room, [key]: value })
}

function setFx(nf: Fixture[], toast?: string) {
  emit('update', { ...props.room, fixtures: nf })
  if (toast) emit('feedback', toast)
}

function addFx(fx: Fixture) {
  const limit = (props.room.limits ?? rt.value.limits)?.[fx.zone] ?? 99
  const cur = zoneFxCount(props.room.fixtures, fx.zone)
  if (cur >= limit) {
    const zName = ALL_ZONES.find((z) => z.id === fx.zone)?.name ?? fx.zone
    emit('feedback', `Максимум ${limit} точек для ${zName}`)
    return
  }
  const newFixtures = [...props.room.fixtures, fx]
  const newIdx = newFixtures.length - 1
  emit('update', { ...props.room, fixtures: newFixtures })
  emit('feedback', `${MD[fx.m]?.name} добавлен`)
  emit('openFx', props.room.id, newIdx)
}

/**
 * batch11 #9 v4: ОДИН emit с полным room вместо нескольких per-key patch.
 * RoomSettings собирает все изменения в локальный draft и шлёт сюда
 * атомарно, чтобы исключить race condition при последовательных мутациях.
 */
function handleSettingsSave(updated: Room, toast?: string) {
  emit('update', updated)
  if (toast) emit('feedback', toast)
}

const addZone = ref<ZoneId | null>(null)
const openZoneId = ref<ZoneId | null>(null)
const showSettings = ref(false)
const confirmDel = ref(false)
const showSmartHelp = ref(false)

/* Зона, открытая в ZoneFixturesModal (объект для модалки). */
const openZone = computed(() => zones.value.find((z) => z.id === openZoneId.value) ?? null)
function zoneLimit(zId: ZoneId): number {
  return (props.room.limits ?? rt.value.limits)?.[zId] ?? 99
}

/* Счётчик точек по комнате: подключено / всего. */
const ptsUsed = computed(() =>
  zones.value.reduce((s, z) => s + zoneFxCount(props.room.fixtures, z.id), 0),
)
const ptsLimit = computed(() =>
  zones.value.reduce((s, z) => s + zoneLimit(z.id), 0),
)

const smartLine = computed(() => {
  const r = ratio.value
  const rx = r.toFixed(2).replace(/\.?0+$/, '')
  if (r <= 0.5) return `${rx} — добавьте светильники`
  if (r <= 0.8) return `${rx} — добавьте бра или торшер`
  if (r <= 2.0) return `${rx} — ничего менять не нужно`
  if (r <= 4.0) return `${rx} — поставьте диммер`
  return `${rx} — уберите лишнее или диммер`
})

/* Подсказка о лимите точек — по центру экрана (а не нижним тостом). */
const limitTip = ref<string | null>(null)
let limitTimer: ReturnType<typeof setTimeout> | undefined
function onLimitHit(zId: ZoneId) {
  const limit = (props.room.limits ?? rt.value.limits)?.[zId] ?? 99
  const zName = ALL_ZONES.find((z) => z.id === zId)?.name ?? zId
  limitTip.value = `${zName}: все ${limit} ${pw(limit)} заняты. Удалите светильник или увеличьте лимит в параметрах комнаты.`
  if (limitTimer) clearTimeout(limitTimer)
  limitTimer = setTimeout(() => { limitTip.value = null }, 3500)
}

function onFurnToggle(next: string[], toast: string) {
  patchRoom('furniture', next as Room['furniture'])
  emit('feedback', toast)
}

function confirmDelete() {
  confirmDel.value = false
  emit('delete')
  emit('close')
}

function onShowMoodDetail() {
  cfg.showMoodDetail.value = tintedMood.value
}

/* ──────────── Фотогалерея ──────────── */
// Если в комнате уже есть свет — фильтр по комнате + моделям.
// Если пусто — только по типу комнаты. Лимит 12.
const galleryModelIds = computed(() => props.room.fixtures.map(f => f.m))
const galleryItems = computed(() => {
  const filter = galleryModelIds.value.length > 0
    ? { room: props.room.typeId, models: galleryModelIds.value }
    : { room: props.room.typeId }
  return byCombined(filter).slice(0, 12)
})
const displayItems = computed(() => galleryItems.value.map(toDisplayItem))

watch(galleryItems, items => { if (items.length) preloadAspects(items) }, { immediate: true })
</script>

<template>
  <div
    :style="{
      position: 'fixed',
      inset: 0,
      background: T.bg,
      zIndex: Z.roomDetail,
      overflow: 'auto',
    }"
  >
    <NavHeader
      :title="props.room.customName || rt.name"
      back="Домой"
      @back="emit('close')"
    />

    <div :style="{ padding: '16px', maxWidth: '480px', margin: '0 auto' }">
      <!-- Параметры комнаты -->
      <div
        :style="{
          background: `linear-gradient(135deg, ${tint}28, ${tint}10)`,
          border: `1px solid ${tint}33`,
          borderRadius: '12px',
          padding: '14px 16px',
          marginBottom: '16px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }"
        @click="showSettings = true"
      >
        <div
          :style="{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: tint + '22',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }"
        >
          <Icon name="slidersH" :color="tint" :size="20" />
        </div>
        <div :style="{ flex: 1 }">
          <div :style="{ fontSize: '13px', fontWeight: 600, color: T.text }">
            Параметры комнаты
          </div>
          <div :style="{ fontSize: '13px', fontWeight: 600, color: tint, marginTop: '3px' }">
            {{ props.room.sizeIndex === 3 ? (props.room.customArea ?? '') + ' м²' : rt.ranges[props.room.sizeIndex] + ' м²' }}
            · потолок {{ props.room.ceilingH }} м
          </div>
        </div>
        <svg
          width="20" height="20" viewBox="0 0 24 24" fill="none"
          :stroke="tint" stroke-width="1.5"
          stroke-linecap="round" stroke-linejoin="round"
          :style="{ flexShrink: 0, opacity: 0.6 }"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>

      <!-- Дашборд + Смарт-подбор -->
      <div
        :style="{
          background: T.card,
          border: `1px solid ${tintedMood.color}33`,
          borderRadius: '14px',
          padding: '12px 14px',
          marginBottom: '8px',
        }"
      >
        <div :style="{ display: 'flex', alignItems: 'center', gap: '12px' }">
          <div
            :style="{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: tintedMood.color + '18',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              flexShrink: 0,
            }"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" :stroke="tintedMood.color" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/>
              <path d="M9 18h6"/><path d="M10 22h4"/>
            </svg>
            <span :style="{ fontSize: '14px', fontWeight: 700, color: tintedMood.color }">{{ lamps }}</span>
          </div>

          <div :style="{ flex: 1, minWidth: 0 }">
            <div :style="{ fontSize: '15px', fontWeight: 700, color: T.text, marginBottom: '4px' }">
              {{ actual.toLocaleString('ru-RU') }}<span :style="{ fontWeight: 400, color: T.textSec }"> из {{ base.toLocaleString('ru-RU') }} лм</span>
            </div>
            <div :style="{ height: '5px', background: T.border, borderRadius: '3px', overflow: 'hidden' }">
              <div
                :style="{
                  height: '100%',
                  width: Math.min((actual / base) * 100, 100) + '%',
                  background: tintedMood.color,
                  borderRadius: '3px',
                  transition: 'width .3s',
                }"
              />
            </div>
          </div>

          <div
            :style="{
              padding: '6px 12px',
              borderRadius: '8px',
              background: tintedMood.color + '22',
              fontSize: '12px',
              fontWeight: 700,
              color: tintedMood.color,
              flexShrink: 0,
            }"
          >
            {{ bright.name }}
          </div>
        </div>

        <div
          v-if="actual > 0"
          :style="{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginTop: '10px',
            padding: '5px 6px 5px 5px',
            borderRadius: '999px',
            background: tintedMood.color + '10',
          }"
        >
          <button
            :style="{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              padding: '6px 14px 6px 9px',
              borderRadius: '999px',
              background: tintedMood.color + '22',
              border: 'none',
              color: tintedMood.color,
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 700,
              fontFamily: 'inherit',
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }"
            @click="showSmartHelp = true"
          >
            <div class="rotor-dash" :style="{ '--rc': tintedMood.color }" aria-hidden="true">
              <div v-for="i in 10" :key="i" class="rotor-dash-l" :style="{ '--rot': ((i - 1) / 10 * 360) + 'deg', animationDelay: ((i - 1) * 30) + 'ms' }" />
            </div>
            WOODLED Smart
          </button>
          <div :style="{ fontSize: '12px', color: tintedMood.color + 'cc', flex: 1, fontWeight: 500, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }">
            {{ smartLine }}
          </div>
        </div>
      </div>

      <!-- Заголовок «Светильники» + счётчик точек комнаты -->
      <div :style="{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 4px 12px' }">
        <span :style="{ fontSize: '17px', fontWeight: 700, color: T.text }">Светильники</span>
        <span :style="{ padding: '6px 12px', borderRadius: '999px', background: 'rgba(255,255,255,0.06)', fontSize: '15px' }">
          <span :style="{ fontWeight: 700, color: T.text }">{{ ptsUsed }}</span>
          <span :style="{ fontWeight: 400, color: T.textSec }"> из {{ ptsLimit }}</span>
        </span>
      </div>

      <!-- Glow wrapper + 2×2 зоны -->
      <div
        :style="{
          position: 'relative',
          marginBottom: '16px',
          background: tintedMood.color + '06',
          borderRadius: '16px',
          border: `1px solid ${tintedMood.color}33`,
          padding: '8px',
        }"
      >
        <div
          v-for="(gl, i) in glowLayers"
          :key="i"
          :style="{
            position: 'absolute',
            inset: 0,
            borderRadius: '16px',
            pointerEvents: 'none',
            zIndex: 1,
            background: `radial-gradient(ellipse 55% 55% at ${gl.pos}, ${tintedMood.color}${glowHex(gl.opacity)}, transparent 65%)`,
            transition: 'background 1s ease',
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
          <ZoneCard
            v-for="zone in zones"
            :key="zone.id"
            :zone="zone"
            :fixtures="props.room.fixtures"
            :mood="tintedMood"
            :total-lm="actual"
            :limit="(props.room.limits ?? rt.limits)?.[zone.id] ?? 99"
            @add="addZone = zone.id"
            @edit="(idx) => emit('openFx', props.room.id, idx)"
            @limit-hit="onLimitHit(zone.id)"
            @open="openZoneId = zone.id"
          />
        </div>
      </div>

      <FurnitureBlock
        v-if="rt.furn.length > 0"
        :rt="rt"
        :room="props.room"
        :furn-pct="furnPct"
        :tint="tint"
        @toggle="onFurnToggle"
      />

      <MoodBlock
        v-if="props.room.fixtures.length > 0"
        :mood="tintedMood"
        :ratio="ratio"
        :room-prep-name="roomPrepName"
        @show-detail="onShowMoodDetail"
      />

      <!--
        Фотогалерея «{Ваш свет в интерьере} | {С похожим набором}».
        Размещение: после MoodBlock, перед блоком удаления — чтобы вдохновляющий
        контент не оказался после destructive action (HANDOFF говорит «перед
        Footer», но это деградирует UX, потому что блок «Удалить комнату»
        сидит прямо перед Footer).
      -->
      <GallerySection
        v-if="displayItems.length > 0"
        :items="displayItems"
        title="Ваш свет в интерьере"
        context="room"
        :accent="tint"
        @gift-click="cfg.showBuy.value = true"
      />

      <div
        :style="{
          marginTop: '32px',
          padding: '14px',
          background: T.red + '14',
          border: `1px solid ${T.red}33`,
          borderRadius: '10px',
        }"
      >
        <div
          :style="{
            fontSize: '12px',
            color: T.textSec,
            marginBottom: '10px',
            lineHeight: '1.5',
          }"
        >
          Комната будет удалена со всеми светильниками и настройками.<template v-if="props.room.fixtures.length > 0"> Потеряете {{ actual.toLocaleString('ru-RU') }} лм и {{ woodNames(props.room.fixtures) }}.</template>
        </div>
        <button
          :style="{
            width: '100%',
            padding: '10px',
            background: 'none',
            border: `1px solid ${T.red}44`,
            borderRadius: '8px',
            color: T.red,
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 600,
          }"
          @click="confirmDel = true"
        >
          Удалить комнату
        </button>
      </div>

      <Footer />
      <div :style="{ height: '80px' }" />
    </div>

    <RoomSettings
      v-if="showSettings"
      :rt="rt"
      :room="props.room"
      @save="handleSettingsSave"
      @close="showSettings = false"
    />

    <AddFxModal
      v-if="addZone"
      :zone="addZone"
      :def-wood="rW"
      :room-area="area"
      :room-base-lm="base"
      :room-current-lm="actual"
      :room-fixtures="props.room.fixtures"
      :room-name="props.room.customName || rt.name"
      @add="(fx) => { addFx(fx); addZone = null }"
      @close="addZone = null"
    />

    <ZoneFixturesModal
      v-if="openZone"
      :zone="openZone"
      :fixtures="props.room.fixtures"
      :limit="zoneLimit(openZone.id)"
      :total-lm="actual"
      @edit="(idx) => { openZoneId = null; emit('openFx', props.room.id, idx) }"
      @add="() => { const zid = openZoneId; openZoneId = null; addZone = zid }"
      @open-params="() => { openZoneId = null; showSettings = true }"
      @close="openZoneId = null"
    />

    <!-- Подсказка о лимите точек — по центру экрана -->
    <div
      v-if="limitTip"
      :style="{ position: 'fixed', inset: 0, zIndex: Z.toast, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', padding: '24px' }"
    >
      <div
        :style="{ pointerEvents: 'auto', maxWidth: '300px', background: '#231E17', border: `1px solid ${tintedMood.color}44`, borderRadius: '14px', padding: '16px 18px', boxShadow: '0 12px 40px rgba(0,0,0,0.6)', cursor: 'pointer', display: 'flex', gap: '10px', alignItems: 'flex-start' }"
        @click="limitTip = null"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" :stroke="tintedMood.color" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :style="{ flexShrink: 0, marginTop: '1px' }"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
        <span :style="{ fontSize: '13px', color: T.text, lineHeight: 1.45 }">{{ limitTip }}</span>
      </div>
    </div>

    <Modal v-if="confirmDel" @close="confirmDel = false">
      <div :style="{ padding: '20px', textAlign: 'center' }">
        <div :style="{ color: T.text, fontSize: '14px', marginBottom: '16px' }">
          Удалить {{ props.room.customName || rt.name }}?
        </div>
        <div :style="{ display: 'flex', gap: '8px' }">
          <button
            :style="{
              flex: 1,
              padding: '10px',
              background: 'none',
              border: `1px solid ${T.border}`,
              color: T.textSec,
              borderRadius: '6px',
              cursor: 'pointer',
            }"
            @click="confirmDel = false"
          >
            Нет
          </button>
          <button
            :style="{
              flex: 1,
              padding: '10px',
              background: T.red,
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
            }"
            @click="confirmDelete"
          >
            Удалить
          </button>
        </div>
      </div>
    </Modal>

    <span v-show="false">{{ Icon }}</span>

    <SmartHelpModal v-if="showSmartHelp" @close="showSmartHelp = false" />
  </div>
</template>

<style scoped>
/* FIX-2026-05-09-deploy — если этой строки нет в репо после загрузки, значит залился старый файл */
.rotor-dash { width: 20px; height: 20px; position: relative; flex-shrink: 0; }
.rotor-dash-l {
  position: absolute; top: 50%; left: 50%;
  width: 1.5px; height: 5px; margin: -2.5px 0 0 -.75px;
  border-radius: 1px;
  background: var(--rc, #b4915a);
  transform-origin: 50% 50%;
  animation: rotorDashCycle 5000ms ease-in-out infinite;
  opacity: 0;
}
@keyframes rotorDashCycle {
  0%   { transform: rotate(var(--rot)) translateY(-14px) scale(0.3); opacity: 0; }
  5%   { transform: rotate(var(--rot)) translateY(-7px) scale(1);   opacity: 0.7; }
  80%  { transform: rotate(var(--rot)) translateY(-7px) scale(1);   opacity: 0.7; }
  90%  { transform: rotate(var(--rot)) translateY(-14px) scale(0.3); opacity: 0; }
  100% { transform: rotate(var(--rot)) translateY(-14px) scale(0.3); opacity: 0; }
}
</style>
