<script setup lang="ts">
/**
 * App.vue — Корневой роутер.
 *
 * batch11 #9 v3: stickyVisible использует cfg.showRoomSettings вместо
 *   cfg.active — StickyBar остаётся виден на RoomDetail и скрывается
 *   только в RoomSettings. RoomSettings.vue сам поднимает/опускает флаг
 *   в onMounted/onUnmounted.
 */

import { computed, onMounted, onUnmounted, ref, watch, nextTick } from 'vue'
import { T } from '../theme/tokens'
import { useConfigurator } from '../store/configurator'
import type { Room } from '../data/rooms'
import { getRT } from '../data/rooms'
import { MD, fxTitle } from '../data/catalog'
import { baseLm, fxLm, getArea } from '../engine/brightness'
import { rw } from '../engine/i18n'
import type { Fixture } from '../data/catalog'
import Icon from './ui/Icons.vue'
import Toast from './ui/Toast.vue'

import OnboardingLink from './OnboardingLink.vue'
import PromoBlock from './PromoBlock.vue'
import PWAInstallBanner from './PWAInstallBanner.vue'
import RoomCard from './RoomCard.vue'
import SoundButton from './SoundButton.vue'
import ReloadButton from './ReloadButton.vue'
import StickyBar from './StickyBar.vue'
import Footer from './Footer.vue'
import TypePicker from './TypePicker.vue'
import NameModal from './NameModal.vue'
import FirstModal from './FirstModal.vue'
import StoryModal from './StoryModal.vue'
import BuyModal from './BuyModal.vue'
import ShareModal from './ShareModal.vue'
import LeadModal from './LeadModal.vue'
import type { LeadSource } from '../engine/lead-api'
import ColorPickerModal from './ColorPickerModal.vue'
import RoomDetail from './RoomDetail.vue'
import FxEditor from './FxEditor.vue'
import CustomFxEditor from './CustomFxEditor.vue'
import MoodDetailModal from './MoodDetailModal.vue'
import WelcomeScreen from './WelcomeScreen.vue'
import Preloader from './Preloader.vue'
import HouseStats from './HouseStats.vue'
import Modal from './ui/Modal.vue'
import { readModelLink, clearModelLink } from '../engine/useModelLink'
import { decodeFixture, readHashFixture } from '../engine/share'
import { warmupShortener } from '../engine/shortener'

/* Фотогалерея «Лес шепчет» — на главной «Живой Дом» */
import GallerySection from './gallery/GallerySection.vue'
import { random, toDisplayItem, preloadAspects } from '../engine/gallery-engine'

const cfg = useConfigurator()

function lockViewport() {
  let meta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement | null
  if (!meta) {
    meta = document.createElement('meta')
    meta.name = 'viewport'
    document.head.appendChild(meta)
  }
  meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
}

onMounted(() => {
  // Boot-loader: показывает анимацию пока грузится бандл.
  // Если он был в branded-режиме (копия Preloader.vue) — он сам себя
  // финализирует с оригинальным тэглайном «Настоящее дерево…»;
  // Vue-Preloader.vue в этом случае не показывается, иначе будет
  // двойная интро-анимация. Если был simple (после reload) — стандартный
  // быстрый fade-out.
  ;(window as unknown as { __wlBoot?: { clear: () => void } }).__wlBoot?.clear()
  // Если пришли через hard-reload от ReloadButton, в URL остался _t и
  // _reload. Стираем оба без перезагрузки — чтобы адрес остался чистым
  // и не мешал deeplinks/share.
  try {
    const u = new URL(window.location.href)
    let dirty = false
    if (u.searchParams.has('_t')) { u.searchParams.delete('_t'); dirty = true }
    if (u.searchParams.has('_reload')) { u.searchParams.delete('_reload'); dirty = true }
    if (dirty) {
      const clean = u.pathname + (u.search ? u.search : '') + u.hash
      window.history.replaceState({}, '', clean)
    }
  } catch { /* noop */ }
  warmupShortener()
  lockViewport()
  window.addEventListener('beforeunload', cfg.persistState)
  if (cfg.loadFromHash()) { cfg.dismissWelcome(); return }
  const fxEncoded = readHashFixture()
  if (fxEncoded) {
    const fx = decodeFixture(fxEncoded)
    if (fx) {
      let targetRoom = cfg.rooms.find((r: Room) => r.typeId === 'living') ?? null
      if (!targetRoom) { const roomId = cfg.add('living'); targetRoom = cfg.rooms.find((r: Room) => r.id === roomId) ?? null }
      if (targetRoom) { cfg.addFixture(targetRoom.id, fx); const fxIdx = targetRoom.fixtures.length - 1; cfg.showBuy.value = true; cfg.openFx(targetRoom.id, fxIdx) }
      cfg.dismissWelcome()
    }
    window.history.replaceState({}, '', window.location.pathname); return
  }
  const link = readModelLink()
  if (link) {
    let targetRoom = cfg.rooms.find((r: Room) => r.typeId === 'living') ?? null
    if (!targetRoom) { const roomId = cfg.add('living'); targetRoom = cfg.rooms.find((r: Room) => r.id === roomId) ?? null }
    if (targetRoom) { const fx = { m: link.modelId, q: 1, wood: 'oak' as const, zone: link.zone }; cfg.addFixture(targetRoom.id, fx); const fxIdx = targetRoom.fixtures.length - 1; cfg.showBuy.value = true; cfg.openFx(targetRoom.id, fxIdx); cfg.dismissWelcome() }
    clearModelLink(); return
  }
  if (cfg.welcomeSeen.value) { if (!cfg.restorePersistedState()) { cfg.ensureStarterRooms() } }
})

onUnmounted(() => { window.removeEventListener('beforeunload', cfg.persistState) })

const rooms = computed<Room[]>(() => cfg.rooms as Room[])
const sortedRooms = computed<Room[]>(() => [...rooms.value].sort((a, b) => (a.fixtures.length > 0 ? 0 : 1) - (b.fixtures.length > 0 ? 0 : 1)))
const activeRoom = computed(() => cfg.activeRoom.value)
const subtitle = computed(() => { const n = rooms.value.length; return n === 0 ? 'Добавьте комнату' : `${n} ${rw(n)}` })

const activeFxData = computed(() => {
  const af = cfg.activeFx.value; if (!af) return null
  const room = cfg.rooms.find((r: Room) => r.id === af.roomId); if (!room) return null
  const fx = room.fixtures[af.fxIdx]; if (!fx) return null
  return { room, fx, roomId: af.roomId, fxIdx: af.fxIdx }
})

const fxEditorRoomContext = computed(() => {
  if (!activeFxData.value) return null
  const { room, fx } = activeFxData.value; const rt = getRT(room.typeId)
  const roomArea = getArea(rt, room as Room); const roomBaseLm = baseLm(rt, room as Room)
  const roomCurrentLm = fxLm(room.fixtures); const m = MD[fx.m]
  const thisFxLm = m ? m.lmPer * (fx.l ?? m.lamps) * (fx.q ?? 1) : 0
  return { roomArea, roomBaseLm, roomCurrentLmWithoutThis: roomCurrentLm - thisFxLm, roomName: (room as Room).customName || rt.name, roomTint: (room as Room).cardColor ?? T.neutral }
})

/* Точка возврата из FxEditor:
   • из BuyModal («Мой Лес») → «Мой Лес»
   • из RoomDetail → имя комнаты (customName или дефолт по типу)
   • иначе → «Назад» (deeplink, share-ссылка)
   Префикс «← » не добавляем — NavHeader сам рисует шеврон. */
const fxBackLabel = computed(() => {
  if (cfg.showBuy.value) return 'Мой Лес'
  if (cfg.active.value) {
    const r = cfg.rooms.find((rm: Room) => rm.id === cfg.active.value)
    if (r) return r.customName || getRT(r.typeId).name
  }
  return 'Назад'
})

/**
 * batch11 #9 v3: StickyBar скрывается ТОЛЬКО когда открыты параметры
 * комнаты (cfg.showRoomSettings). На самом RoomDetail остаётся видимым.
 */
const stickyVisible = computed(() =>
  cfg.hasFixtures.value
  && !cfg.showBuy.value
  && !cfg.activeFx.value
  && !cfg.showMoodDetail.value
  && !cfg.showRoomSettings.value
  && !cfg.showZoneModal.value
  && !cfg.showLead.value,
)

function onPromoClick() { cfg.showBuy.value = true }
function onEditRoom(room: Room) { cfg.updateRoom(room) }
function onDeleteRoom() { if (activeRoom.value) cfg.removeRoom(activeRoom.value.id) }
function onCloseRoom() { cfg.active.value = null }
function onBuyEditFx(roomId: string, fxIdx: number, next: Fixture | null) { if (next === null) cfg.removeFixture(roomId, fxIdx); else cfg.updateFixture(roomId, fxIdx, next) }
function onBuyClose() { cfg.showBuy.value = false; cfg.active.value = null }
/* Провизорный светильник: свежедобавленный через быстрое добавление. Пока
   не нажата «Сохранить» — он условный. Стрелка назад (close) удаляет его. */
const fxIsProvisional = ref(false)
function onOpenFx(roomId: string, fxIdx: number, isNew = false) { fxIsProvisional.value = !!isNew; cfg.openFx(roomId, fxIdx) }
/* Предложный падеж названия комнаты: «Гостиная» → «в Гостиной». */
function roomPrepName(name: string): string {
  if (!name) return ''
  if (name.endsWith('ая')) return name.slice(0, -2) + 'ой'
  if (name.endsWith('яя')) return name.slice(0, -2) + 'ей'
  if (name.endsWith('ня')) return name.slice(0, -2) + 'не'
  if (name.endsWith('я')) return name.slice(0, -1) + 'е'
  if (name.endsWith('а')) return name.slice(0, -1) + 'е'
  return name + 'е'
}
function onFxSave(next: Fixture) {
  const af = cfg.activeFx.value; if (!af) return
  const wasProvisional = fxIsProvisional.value
  cfg.updateFixture(af.roomId, af.fxIdx, next)
  fxIsProvisional.value = false
  const room = cfg.rooms.find((r: Room) => r.id === af.roomId) as Room | undefined
  const model = fxTitle(next.m) || 'Светильник'
  const where = room ? roomPrepName(room.customName || getRT(room.typeId).name) : ''
  /* Новый светильник → «{Модель} в {Комнате}» (добавлен). Правки существующего
     → «Изменения сохранены» (ничего не добавляли). */
  cfg.showFB(wasProvisional
    ? `${model}${where ? ` в ${where}` : ''}`
    : 'Изменения сохранены', 'check')
  cfg.closeFx()
}
function onFxDelete() { const af = cfg.activeFx.value; if (!af) return; cfg.removeFixture(af.roomId, af.fxIdx); fxIsProvisional.value = false; cfg.closeFx(); cfg.showFB('Светильник удалён') }
function onFxClose() { const af = cfg.activeFx.value; if (fxIsProvisional.value && af) cfg.removeFixture(af.roomId, af.fxIdx); fxIsProvisional.value = false; cfg.closeFx() }

const colorPickRoom = ref<Room | null>(null)
function onPickColor(room: Room) { colorPickRoom.value = room }
function onColorPicked(color: string | undefined) { if (colorPickRoom.value) { cfg.updateRoom({ ...colorPickRoom.value, cardColor: color }); colorPickRoom.value = { ...colorPickRoom.value, cardColor: color } } }

const showResetConfirm = ref(false)
function onResetClick() { showResetConfirm.value = true }
function onResetConfirm() { cfg.resetAll(); showResetConfirm.value = false }
function onResetCancel() { showResetConfirm.value = false }
function onSaveShareLink() { cfg.showShare.value = true }

/* ──────────── LeadModal: единая форма заявки менеджеру ──────────── */
/* leadCtx хранит источник + (для fixture-режима) ссылку на конкретный
   светильник. Когда не null — рендерится LeadModal поверх остального UI.
   Запрашивается через emit('lead') от FxEditor / BuyModal / ShareModal. */
interface LeadCtx {
  source: LeadSource
  roomId?: string
  fxIdx?: number
}
const leadCtx = ref<LeadCtx | null>(null)
const leadCtxRoom = computed<Room | null>(() => {
  if (!leadCtx.value?.roomId) return null
  return (cfg.rooms.find((r: Room) => r.id === leadCtx.value!.roomId) as Room) ?? null
})
function openLeadFromFx() {
  const af = cfg.activeFx.value
  if (!af) return
  leadCtx.value = { source: 'fixture', roomId: af.roomId, fxIdx: af.fxIdx }
}
function openLeadFromForest() { leadCtx.value = { source: 'forest' } }
/* «Менеджеру» из ShareModal на главной/RoomDetail/BuyModal — это заявка
   на весь дом (тот же поток что «Отправить план леса» из Моего Леса):
   общий заголовок-имя дома, сводный список комнат и светильников. Не
   используем 'consult' — он короче и без комплектации, а юзер ожидает
   ту же форму что и из «Мой Лес». */
function openLeadFromShare() { leadCtx.value = { source: 'forest' } }
function onLeadClose() { leadCtx.value = null }

const anyModalOpen = computed<boolean>(() => cfg.showFirst.value || cfg.showName.value || cfg.showStory.value || cfg.showShare.value || cfg.showMoodDetail.value !== null || cfg.picker.value || colorPickRoom.value !== null || showResetConfirm.value || cfg.showZoneModal.value || cfg.showPriceDetails.value || cfg.showLead.value)

/* Главный экран (список комнат): нет открытого светильника, нет активной комнаты,
   нет открытого «Моего Леса», приветствие уже показано. На вложенных экранах
   с NavHeader (RoomDetail/FxEditor/BuyModal) SoundButton встаёт по центру
   панели сверху (top: 6px), а на главной висит ниже в линию с бейджем
   «WOODLED Студия». */
const isHome = computed<boolean>(() => !activeFxData.value && !activeRoom.value && !cfg.showBuy.value && cfg.welcomeSeen.value)

watch(() => [cfg.active.value, cfg.activeFx.value, cfg.welcomeSeen.value, cfg.showBuy.value], () => { nextTick(() => window.scrollTo({ top: 0, behavior: 'instant' })) })

/* Если inline-preloader в config.mts уже отработал в branded-режиме
   (та же визуальная анимация, что и Preloader.vue), Vue-Preloader.vue
   не показываем — он отыграет дубль и пользователь увидит две интро-
   анимации подряд. Inline сам себя финализирует с оригинальным тэглайном
   «Настоящее дерево становится живым светом в доме». */
const wlBrandedActive = typeof window !== 'undefined'
  && !!(window as unknown as { __wlBranded?: boolean }).__wlBranded
const preloaderDone = ref(wlBrandedActive)
watch(() => cfg.welcomeSeen.value, (seen) => { if (!seen && !wlBrandedActive) preloaderDone.value = false })
function onPreloaderDone() { preloaderDone.value = true }

/* ──────────── Фотогалерея «Лес шепчет» на главной ──────────── */
// ВАЖНО: random() использует Math.random() → SSR-hydration mismatch
// в VitePress. Загружаем ТОЛЬКО на клиенте через onMounted.
const galleryItems = ref<ReturnType<typeof random>>([])
const galleryDisplayItems = computed(() => galleryItems.value.map(toDisplayItem))
const galleryIsClient = ref(false)

onMounted(() => {
  galleryIsClient.value = true
  try {
    galleryItems.value = random(12)
    if (galleryItems.value.length) preloadAspects(galleryItems.value)
  } catch (err) {
    console.error('[WOODLED Gallery] Home init failed:', err)
  }
})

/** Клик по «+3000₽ на свет» в TapLeafWidget → открывает «Мой Лес» (BuyModal).
 *  Тот же flow что у кнопки «Мой Лес» в sticky-footer (StickyBar emit 'buy'). */
function onGalleryGiftClick() {
  cfg.showBuy.value = true
}
</script>

<template>
  <template v-if="activeFxData">
    <!-- Кастомный светильник (другой бренд) — отдельная страница с другой формой. -->
    <CustomFxEditor
      v-if="activeFxData.fx.custom"
      :key="activeFxData.roomId + ':' + activeFxData.fxIdx + ':custom'"
      :item="activeFxData.fx"
      :back-label="fxBackLabel"
      :room-name="fxEditorRoomContext?.roomName"
      :room-tint="fxEditorRoomContext?.roomTint"
      :is-provisional="fxIsProvisional"
      @save="onFxSave"
      @delete="onFxDelete"
      @close="onFxClose"
      @feedback="cfg.showFB"
    />
    <FxEditor v-else :key="activeFxData.roomId + ':' + activeFxData.fxIdx" :item="activeFxData.fx" :def-wood="activeFxData.fx.wood ?? 'oak'" :back-label="fxBackLabel" :room-area="fxEditorRoomContext?.roomArea" :room-base-lm="fxEditorRoomContext?.roomBaseLm" :room-current-lm-without-this="fxEditorRoomContext?.roomCurrentLmWithoutThis" :room-name="fxEditorRoomContext?.roomName" :room-tint="fxEditorRoomContext?.roomTint" :is-provisional="fxIsProvisional" @save="onFxSave" @delete="onFxDelete" @close="onFxClose" @feedback="cfg.showFB" @lead="openLeadFromFx" />
  </template>

  <template v-else-if="activeRoom">
    <RoomDetail :room="activeRoom" @update="onEditRoom" @delete="onDeleteRoom" @close="onCloseRoom" @feedback="cfg.showFB" @open-fx="(roomId, fxIdx, isNew) => onOpenFx(roomId, fxIdx, isNew)" />
  </template>

  <template v-else-if="!cfg.welcomeSeen.value">
    <Transition name="preloader-fade" mode="out-in">
      <Preloader v-if="!preloaderDone" key="preloader" @done="onPreloaderDone" />
      <WelcomeScreen v-else key="welcome" />
    </Transition>
  </template>

  <template v-else>
    <!-- PWA-баннер «Откройте WOODLED как приложение». Sticky top z:100.
         Только на главной, и только когда поверх неё не открыты другие
         модалки (BuyModal/StoryModal/Share/Name/Picker/ColorPicker/...).
         BuyModal сам по себе fullscreen, но баннер z:100 выше его z:55 —
         без этого guard'а он торчит сверху над «Мой Лес». -->
    <PWAInstallBanner v-if="!anyModalOpen && !cfg.showBuy.value && !cfg.showStory.value && !cfg.showShare.value" />
    <div
      :style="{
        position: 'relative',
        maxWidth: '560px', margin: '0 auto', padding: '16px',
        fontFamily: `'Segoe UI', system-ui, sans-serif`,
        color: T.text, background: T.bg, minHeight: '100vh',
      }"
    >
      <!-- Reload только в iOS-standalone, в левом-верхнем углу страницы.
           НЕ fixed — скроллится вместе с контентом. Зеркалит SoundButton:
           top:20 = на одной линии с центром бейджа «WOODLED Студия»
           (16 home pad + 8 wrap padTop + ~15 полвысоты бейджа ≈ 39;
           полкнопки ~20 → top 19-20). -->
      <ReloadButton :style="{ position: 'absolute', top: '20px', left: '16px', zIndex: 1 }" />
      <div :style="{ textAlign: 'center', marginBottom: '20px', paddingTop: '8px' }">
        <div
          :style="{
            display: 'inline-block', marginBottom: '10px', padding: '5px 18px',
            borderRadius: '999px', background: T.neutral + '18',
            fontSize: '17px', fontWeight: 500, color: T.neutral,
          }"
        >
          WOODLED Студия
        </div>
        <div :style="{ display: 'flex', alignItems: 'center', justifyContent: 'center' }">
          <div
            :style="{
              fontSize: '30px',
              fontWeight: 500,
              color: T.text,
              lineHeight: 1.2,
              paddingBottom: '1px',
              cursor: 'pointer',
              backgroundImage: `repeating-linear-gradient(to right, ${T.text} 0, ${T.text} 9px, transparent 9px, transparent 13px)`,
              backgroundSize: '100% 1px',
              backgroundPosition: 'bottom',
              backgroundRepeat: 'no-repeat',
            }"
            @click="cfg.showName.value = true"
          >
            {{ cfg.name.value }}
          </div>
        </div>
      </div>

      <HouseStats @share-link="onSaveShareLink" @change-home="onResetClick" />

      <div :style="{ fontSize: '24px', fontWeight: 600, color: T.text, marginTop: '32px', marginBottom: '20px', textAlign: 'center' }">
        {{ subtitle }}
      </div>

      <div :style="{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }">
        <RoomCard v-for="r in sortedRooms" :key="r.id" :room="r" @click="cfg.active.value = r.id" @pick-color="onPickColor(r)" />
        <!-- Добавить комнату — белая CTA -->
        <button
          :style="{
            width: '100%', height: '60px', borderRadius: '16px', border: 'none', cursor: 'pointer',
            background: '#EAE0CA', color: T.bg, fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 2px 12px rgba(0,0,0,0.25)',
          }"
          @click="cfg.picker.value = true"
        >
          <span :style="{ width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(19,17,14,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }">
            <svg width="16" height="16" viewBox="0 0 22 22" :style="{ display: 'block' }">
              <line x1="11" y1="4" x2="11" y2="18" :stroke="T.bg" stroke-width="2.5" stroke-linecap="round" />
              <line x1="4" y1="11" x2="18" y2="11" :stroke="T.bg" stroke-width="2.5" stroke-linecap="round" />
            </svg>
          </span>
          <span :style="{ fontSize: '16px', fontWeight: 700 }">Добавить комнату</span>
        </button>
      </div>

      <!-- Фотогалерея «Лес шепчет» — вдохновляющая подборка случайных фото.
           v-if="galleryIsClient" гарантирует client-only render (SSR-safe).
           gift-click открывает «Мой Лес» (тот же flow что и sticky-footer). -->
      <GallerySection
        v-if="galleryIsClient"
        :items="galleryDisplayItems"
        title="Лес шепчет"
        context="home"
        :accent="T.neutral"
        @gift-click="onGalleryGiftClick"
      />

      <PromoBlock @click="onPromoClick" />
      <OnboardingLink />
      <Footer />
      <div v-if="stickyVisible" :style="{ height: '80px' }" />
    </div>
  </template>

  <template v-if="!activeFxData">
    <TypePicker v-if="cfg.picker.value" @pick="(tid) => cfg.add(tid)" @close="cfg.picker.value = false" />
    <FirstModal v-if="cfg.showFirst.value" :rooms="rooms" :first-id="cfg.firstId.value" @update="(id) => (cfg.firstId.value = id)" @close="cfg.showFirst.value = false" />
    <NameModal v-if="cfg.showName.value" :value="cfg.name.value" @save="cfg.setName" @close="cfg.showName.value = false" />
    <BuyModal v-if="cfg.showBuy.value" :rooms="rooms" @edit-fx="onBuyEditFx" @open-fx="(roomId, fxIdx) => cfg.openFx(roomId, fxIdx)" @close="onBuyClose" @feedback="cfg.showFB" @story="cfg.showStory.value = true" @lead="openLeadFromForest" />
    <StoryModal v-if="cfg.showStory.value" :rooms="rooms" :name="cfg.name.value" @close="cfg.showStory.value = false" />
    <ShareModal v-if="cfg.showShare.value" :name="cfg.name.value" :rooms="rooms" @close="cfg.showShare.value = false" @feedback="cfg.showFB" @lead="openLeadFromShare" />
    <ColorPickerModal v-if="colorPickRoom" :current="colorPickRoom.cardColor" :room-name="colorPickRoom.customName || getRT(colorPickRoom.typeId).name" @pick="onColorPicked" @close="colorPickRoom = null" />
    <MoodDetailModal v-if="cfg.showMoodDetail.value" :mood="cfg.showMoodDetail.value" @close="cfg.showMoodDetail.value = null" />

    <Modal v-if="showResetConfirm" @close="onResetCancel">
      <div :style="{ padding: '24px 20px', textAlign: 'center' }">
        <div :style="{ fontSize: '17px', fontWeight: 700, color: T.text, marginBottom: '10px' }">Сбросить дом?</div>
        <div :style="{ fontSize: '13px', color: T.textSec, lineHeight: 1.55, marginBottom: '20px', maxWidth: '320px', marginLeft: 'auto', marginRight: 'auto' }">Текущий дом и все настройки сбросятся. Вы вернётесь к выбору формата.</div>
        <div :style="{ display: 'flex', gap: '8px' }">
          <button :style="{ flex: 1, padding: '12px', background: 'none', border: `1px solid ${T.border}`, color: T.textSec, borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, fontFamily: 'inherit' }" @click="onResetCancel">Отмена</button>
          <button :style="{ flex: 1, padding: '12px', background: T.neutral, color: T.bg, border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 700, fontFamily: 'inherit' }" @click="onResetConfirm">Да, сбросить</button>
        </div>
      </div>
    </Modal>

    <StickyBar v-if="stickyVisible" @share="cfg.showShare.value = true" @buy="cfg.showBuy.value = true" />
  </template>

  <!-- LeadModal — поверх всего: над FxEditor, BuyModal, ShareModal.
       leadCtx ставится из openLeadFromFx/Forest/Share, onLeadClose снимает.
       Источник определяет заголовок: «Заявка на светильник» / «Новый Лес
       WOODLED» / «WOODLED Студия — Консультация». -->
  <LeadModal
    v-if="leadCtx"
    :source="leadCtx.source"
    :room="leadCtxRoom ?? undefined"
    :fx-idx="leadCtx.fxIdx"
    :rooms="rooms"
    :house-name="cfg.name.value"
    @close="onLeadClose"
    @feedback="cfg.showFB"
  />

  <!-- SoundButton:
       • Главная: top = 20px — на линии с центром бейджа «WOODLED Студия».
         С PWA-банером сдвигается на --wl-banner-h.
       • Остальные экраны (RoomDetail/FxEditor/CustomFxEditor): top = 6px —
         внутри NavHeader 44px, центр кнопки ≈ 22px (полкнопки ~16px).
         На главной такое значение не годится (бейдж бы перекрывался). -->
  <div
    :style="{
      position: 'fixed',
      top: isHome
        ? 'calc(20px + var(--wl-banner-h, 0px))'
        : '6px',
      right: '16px',
      zIndex: 90,
      transition: 'top 360ms cubic-bezier(0.4, 0, 0.2, 1)',
      display: anyModalOpen ? 'none' : 'block',
    }"
  >
    <SoundButton />
  </div>
  <Toast :msg="cfg.fb.value" :icon="cfg.fbIcon.value" @done="cfg.clearFB" />
</template>

<style>
/* Единый фон страницы (десктоп): и body, и контейнеры VitePress
   (Layout/Content) — всё одного цвета. Иначе на широком экране видно
   три полосы — фон сайта, центральная колонка 560px и нижняя плашка
   StickyBar. */
:root {
  --vp-c-bg: #13110E;
  --vp-c-bg-alt: #13110E;
  --vp-c-bg-elv: #13110E;
  --vp-c-bg-soft: #13110E;
}
html, body,
.Layout, .VPContent, .VPPage, .vp-doc {
  background: #13110E !important;
  margin: 0;
  padding: 0;
}
.VPContent { padding: 0 !important; }
input, textarea, select {
  font-size: 16px !important;
  touch-action: manipulation;
}
* {
  touch-action: manipulation;
}
input::placeholder,
textarea::placeholder {
  color: #5C544A !important;
  opacity: 0.7 !important;
}
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}
.preloader-fade-leave-active { transition: opacity 0.8s ease; }
.preloader-fade-enter-active { transition: opacity 0.6s ease; }
.preloader-fade-leave-to, .preloader-fade-enter-from { opacity: 0; }
</style>
