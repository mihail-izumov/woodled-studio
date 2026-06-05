<script setup lang="ts">
/**
 * AddFxModal.vue — Горизонтальный слайдер коллекций.
 *
 * v3: Вертикальные карточки 3:4 с фото, автослайдер,
 *     сегменты, «Уже в {комнате}» оверлей.
 *
 * batch9 #7: Убраны hidden preload <img> из шаблона — на iOS Safari
 *   display:none img иногда резервирует место, создавая белую полосу.
 *   Заменено на JS-preload через new Image() в watch на groups.
 */

import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { T } from '../theme/tokens'
import {
  MD, ALL_ZONES, FAMILIES, fxTitle,
  type ZoneId, type ModelId, type FamilyId, type Fixture,
} from '../data/catalog'
import { type Wood } from '../data/materials'
import { pickBestSize } from '../engine/autosize'

interface Props {
  zone: ZoneId
  defWood: Wood
  roomArea: number
  roomBaseLm: number
  roomCurrentLm: number
  roomFixtures?: Fixture[]
  roomName?: string
}
const props = withDefaults(defineProps<Props>(), { roomFixtures: () => [], roomName: '' })
const emit = defineEmits<{
  add: [fx: Fixture]
  /** Выбор «Другой бренд» — открыть CustomFxEditor с этой зоной. */
  addCustom: [zone: ZoneId]
  close: []
}>()

/* ──────────── Склонение: «Уже в Гостиной» ──────────── */

function inRoom(name: string): string {
  if (!name) return ''
  if (name.endsWith('ая')) return name.slice(0, -2) + 'ой'
  if (name.endsWith('яя')) return name.slice(0, -2) + 'ей'
  if (name.endsWith('ня')) return name.slice(0, -2) + 'не'
  if (name.endsWith('я')) return name.slice(0, -1) + 'е'
  if (name.endsWith('а')) return name.slice(0, -1) + 'е'
  return name + 'е'
}

/* ──────────── Группы (как раньше, но упрощённые) ──────────── */

interface Group {
  type: 'family' | 'single' | 'custom'
  family?: FamilyId
  name: string
  models: ModelId[]
}

const zone = computed(() => ALL_ZONES.find(z => z.id === props.zone)!)

const groups = computed<Group[]>(() => {
  const seen = new Set<string>()
  const out: Group[] = []
  for (const mid of zone.value.models) {
    const m = MD[mid]
    if (!m || seen.has(mid)) continue
    if (m.family && FAMILIES[m.family]) {
      if (!seen.has(m.family)) {
        seen.add(m.family)
        const fams = FAMILIES[m.family].filter(fid => zone.value.models.includes(fid))
        if (fams.length > 0) {
          // У люстровых семейств подпись = название линейки (Rotor / Rotor X / Rotor Elliptical),
          // у остальных семейств (где все Rotor) — тип + форма («Спот подвесной», «Бра вертикальное»).
          const head = MD[fams[0]]
          const baseName = head.type === 'люстра' ? head.collection : fxTitle(fams[0])
          out.push({ type: 'family', family: m.family, name: baseName, models: fams })
        }
      }
    } else {
      seen.add(mid)
      // Одиночные модели подписываем через fxTitle (без поля name): «Бра горизонтальное»,
      // «Спот настенный», «Настольная», «Торшер на треноге/стойке».
      out.push({ type: 'single', name: fxTitle(mid) || m.collection, models: [mid] })
    }
  }
  // Последняя карточка слайдера — «Другой бренд» (не из каталога WOODLED).
  // Открывает CustomFxEditor с зоной из «+» — без выбора модели.
  out.push({ type: 'custom', name: 'Другой бренд', models: [] })
  return out
})

/* ──────────── Уже добавленные семейства ──────────── */

const addedFamilies = computed(() => {
  const set = new Set<string>()
  for (const fx of props.roomFixtures) {
    const m = MD[fx.m]
    if (m?.family) set.add(m.family)
    else set.add(fx.m)
  }
  return set
})

function isAdded(g: Group): boolean {
  // Карточку «Другой бренд» можно нажимать всегда — каждый кастом уникальный.
  if (g.type === 'custom') return false
  if (g.family) return addedFamilies.value.has(g.family)
  return addedFamilies.value.has(g.models[0])
}

/* ──────────── Площадь покрытия ──────────── */

function sqRange(models: ModelId[]): string {
  const mins = models.map(id => MD[id].sqMin).filter(Boolean)
  const maxs = models.map(id => MD[id].sqMax).filter(Boolean)
  if (mins.length === 0) return ''
  return `${Math.min(...mins)}–${Math.max(...maxs)} м²`
}

/* ──────────── Фото коллекции ──────────── */

const PHOTO_MAP: Record<string, string> = {
  rotor: 'rotor_family',
  rotor_x: 'rotor-x_family',
  elliptical: 'elliptical_family',
  spot: 'spot_family',
  bra_v: 'bra_vertical_family',
  bra_h: 'bra_horizontal_family',
  unit: 'unit_family',
  table_lamp: 'table_lamp',
  floor_lamp: 'floor_lamp',
  floor_lamp_s: 'floor_lamp_s',
}

function collectionPhotos(g: Group): [string, string] {
  const key = g.family ?? g.models[0]
  const prefix = PHOTO_MAP[key] ?? key
  const base = '/woodled-studio/customizer/collections/'
  return [`${base}${prefix}_1.jpg`, `${base}${prefix}_2.jpg`]
}

/* ──────────── Выбор ──────────── */

const selected = ref<number | null>(null)

function handleSelect(idx: number) {
  const g = groups.value[idx]
  if (isAdded(g)) return
  // «Другой бренд» — не показываем «Выбрать», открываем редактор сразу.
  if (g.type === 'custom') {
    emit('addCustom', props.zone)
    return
  }
  selected.value = selected.value === idx ? null : idx
}

function doAdd() {
  if (selected.value === null) return
  confirmAdd(groups.value[selected.value])
}

function confirmAdd(g: Group) {
  if (g.type === 'custom') {
    emit('addCustom', props.zone)
    return
  }
  let mid: ModelId
  if (g.models.length === 1) {
    mid = g.models[0]
  } else {
    const deficit = props.roomBaseLm - props.roomCurrentLm
    mid = pickBestSize(g.models, props.roomArea, deficit)
  }
  const m = MD[mid]
  emit('add', { m: mid, q: 1, wood: props.defWood, zone: props.zone, l: m.lamps })
}

/* ──────────── Скролл-трекинг ──────────── */

const CARD_W = 220
const GAP = 12
const scrollEl = ref<HTMLDivElement | null>(null)
const activeIdx = ref(0)

function onScroll() {
  if (!scrollEl.value) return
  const idx = Math.round((scrollEl.value.scrollLeft + 12) / (CARD_W + GAP))
  activeIdx.value = Math.max(0, Math.min(idx, groups.value.length - 1))
}

function scrollTo(idx: number) {
  scrollEl.value?.scrollTo({ left: idx * (CARD_W + GAP), behavior: 'smooth' })
}

/* ──────────── Фото-слайдер ──────────── */

const photoPhase = ref(0)
let photoTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  photoTimer = setInterval(() => { photoPhase.value = (photoPhase.value + 1) % 2 }, 3500)
})
onUnmounted(() => { if (photoTimer) clearInterval(photoTimer) })

/** Трекинг загрузки — показываем фото на границе цикла анимации (5с). */
const loadedPhotos = ref(new Set<string>())
const readyGroups = ref(new Set<string>())

function onPhotoLoad(src: string) {
  loadedPhotos.value = new Set([...loadedPhotos.value, src])
}

function photosLoaded(g: Group): boolean {
  const [a, b] = collectionPhotos(g)
  return loadedPhotos.value.has(a) && loadedPhotos.value.has(b)
}

function isReady(g: Group): boolean {
  return readyGroups.value.has(g.family ?? g.models[0])
}

/**
 * batch9 #7: JS-preload вместо hidden <img> в DOM.
 * new Image() не создаёт DOM-элемент → нет белой полосы на iOS Safari.
 * onload/onerror оба вызывают onPhotoLoad чтобы не блокировать UI.
 */
function preloadGroupPhotos(groupList: Group[]) {
  for (const g of groupList) {
    if (g.type === 'custom') continue // у кастомной карточки нет фото
    const [src1, src2] = collectionPhotos(g)
    for (const src of [src1, src2]) {
      if (loadedPhotos.value.has(src)) continue
      const img = new Image()
      img.onload = () => onPhotoLoad(src)
      img.onerror = () => onPhotoLoad(src)
      img.src = src
    }
  }
}

// Запуск preload при появлении групп
watch(groups, (gs) => { preloadGroupPhotos(gs) }, { immediate: true })

// Каждые 5с (= конец цикла анимации) проверяем загруженные группы
let cycleTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  cycleTimer = setInterval(() => {
    for (const g of groups.value) {
      if (g.type === 'custom') continue // у кастомной карточки нет фото
      const key = g.family ?? g.models[0]
      if (photosLoaded(g) && !readyGroups.value.has(key)) {
        readyGroups.value = new Set([...readyGroups.value, key])
      }
    }
  }, 5000)
})
onUnmounted(() => { if (cycleTimer) clearInterval(cycleTimer) })

/** Фаза фото: ротация на выбранной ИЛИ активной карточке. */
function cardPhase(idx: number): number {
  if (selected.value !== null) {
    return idx === selected.value ? photoPhase.value : 0
  }
  return idx === activeIdx.value ? photoPhase.value : 0
}
</script>

<template>
  <Teleport to="body">
  <!-- Fullscreen overlay -->
  <div :style="{
    position: 'fixed', inset: 0, zIndex: 99999,
    background: '#000',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    gap: '16px', padding: '0 16px',
  }" @click.self="emit('close')">

    <!-- Zone badge — OUTSIDE modal -->
    <div :style="{
      padding: '8px 20px', borderRadius: '22px',
      background: T.neutral + '22', border: `1px solid ${T.neutral}44`,
      fontSize: '14px', fontWeight: 600, color: T.neutral,
    }">
      {{ zone.name }}
    </div>

    <!-- Modal card -->
    <div :style="{
      width: '100%', maxWidth: '400px',
      background: T.card, borderRadius: '18px',
      border: `1px solid ${T.border}`, overflow: 'hidden',
    }">
      <!-- Title -->
      <div :style="{ padding: '18px 24px 8px', textAlign: 'center', fontSize: '17px', fontWeight: 700, color: T.text }">
        Коллекции WOODLED
      </div>

      <!-- Segment indicators -->
      <div v-if="groups.length > 1" :style="{ display: 'flex', justifyContent: 'center', gap: '5px', padding: '0 24px 14px' }">
        <button
          v-for="(_, i) in groups"
          :key="i"
          :style="{
            height: '4px', border: 'none', cursor: 'pointer',
            width: '36px', borderRadius: '2px', padding: 0,
            background: i === activeIdx ? T.neutral : T.neutral + '33',
            transition: 'background .3s',
          }"
          @click="scrollTo(i)"
        />
      </div>

      <!-- Horizontal slider -->
      <div
        ref="scrollEl"
        class="fx-add-slider"
        :style="{
          overflowX: 'auto', overflowY: 'hidden',
          display: 'flex', gap: GAP + 'px',
          padding: `0 ${GAP}px 20px 24px`,
          WebkitOverflowScrolling: 'touch',
          justifyContent: groups.length === 1 ? 'center' : 'flex-start',
        }"
        @scroll="onScroll"
      >
        <button
          v-for="(g, i) in groups"
          :key="i"
          :style="{
            flexShrink: 0, width: CARD_W + 'px',
            cursor: isAdded(g) ? 'not-allowed' : 'pointer',
            border: 'none',
            background: selected === i
              ? `linear-gradient(135deg, ${T.neutral}44, ${T.neutral}22)`
              : 'transparent',
            borderRadius: '18px', padding: '6px',
            textAlign: 'center',
            transition: 'all .35s ease',
            opacity: (isAdded(g) || (selected !== null && selected !== i)) ? 0.4 : 1,
            filter: (isAdded(g) || (selected !== null && selected !== i)) ? 'brightness(0.65)' : 'none',
            position: 'relative',
          }"
          @click="handleSelect(i)"
        >
          <!-- Photo 3:4 -->
          <div :style="{ position: 'relative' }">
            <div :style="{
              width: '100%', aspectRatio: '3 / 4', borderRadius: '14px',
              overflow: 'hidden', position: 'relative',
              background: g.type === 'custom' ? T.cardAlt : T.card,
              boxSizing: 'border-box',
            }">
              <!-- Custom-карточка: только большой плюс по центру, без подписи. -->
              <div v-if="g.type === 'custom'" :style="{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }">
                <span :style="{
                  width: '72px', height: '72px', borderRadius: '50%',
                  background: T.neutral + '22',
                  border: `1.5px solid ${T.neutral}55`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }">
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" :stroke="T.neutral" stroke-width="2.6" stroke-linecap="round">
                    <path d="M12 5v14" />
                    <path d="M5 12h14" />
                  </svg>
                </span>
              </div>

              <template v-else>
                <!-- Loading: rotor animation -->
                <div :style="{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: '#fff', zIndex: 2,
                  opacity: isReady(g) ? 0 : 1,
                  transition: 'opacity .6s ease',
                  pointerEvents: isReady(g) ? 'none' : 'auto',
                }">
                  <div class="rotor-load" aria-hidden="true">
                    <div v-for="j in 12" :key="j" class="rotor-load-l" :style="{'--rot': ((j-1)/12*360)+'deg', animationDelay: ((j-1)*30)+'ms'}" />
                  </div>
                </div>
                <!-- batch9 #7: hidden preload imgs УДАЛЕНЫ — заменены на JS new Image() -->
                <!-- Visible photos -->
                <img :src="collectionPhotos(g)[0]" alt="" :style="{
                  position: 'absolute', inset: 0, width: '100%', height: '100%',
                  objectFit: 'cover',
                  opacity: cardPhase(i) === 0 ? 1 : 0,
                  transition: 'opacity 1.2s ease-in-out',
                }" />
                <img :src="collectionPhotos(g)[1]" alt="" :style="{
                  position: 'absolute', inset: 0, width: '100%', height: '100%',
                  objectFit: 'cover',
                  opacity: cardPhase(i) === 1 ? 1 : 0,
                  transition: 'opacity 1.2s ease-in-out',
                }" />
              </template>
            </div>

            <!-- Overlay: «Уже в ...» -->
            <div v-if="isAdded(g) && props.roomName" :style="{
              position: 'absolute', inset: 0, borderRadius: '14px',
              background: 'rgba(10,9,8,0.65)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }">
              <div :style="{ fontSize: '13px', fontWeight: 600, color: T.text }">
                Уже в {{ inRoom(props.roomName) }}
              </div>
            </div>

            <!-- Кнопка «Выбрать» поверх выбранной карточки -->
            <div v-if="selected === i && !isAdded(g)" :style="{
              position: 'absolute', inset: 0, borderRadius: '14px',
              background: 'rgba(10,9,8,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }" @click.stop>
              <div :style="{
                padding: '10px 28px', borderRadius: '12px',
                background: T.text, color: T.bg,
                fontSize: '14px', fontWeight: 700,
                cursor: 'pointer',
              }" @click.stop="doAdd">
                Выбрать
              </div>
            </div>
          </div>

          <!-- Name + badge -->
          <div :style="{ padding: '10px 4px 8px' }">
            <div :style="{ fontSize: '16px', fontWeight: 700, color: T.text, marginBottom: '6px' }">
              {{ g.name }}
            </div>
            <span v-if="sqRange(g.models)" :style="{
              display: 'inline-block',
              padding: '3px 12px', borderRadius: '10px',
              background: T.neutral + '22',
              border: `1px solid ${T.neutral}44`,
              fontSize: '12px', fontWeight: 600, color: T.neutral,
            }">
              {{ sqRange(g.models) }}
            </span>
            <!-- Заглушка-высота для custom-карточки, чтобы выровняться с WOODLED-карточками. -->
            <span v-else-if="g.type === 'custom'" :style="{
              display: 'inline-block', padding: '3px 12px',
              fontSize: '12px', fontWeight: 600, color: 'transparent',
              border: '1px solid transparent',
            }">·</span>
          </div>
        </button>
        <div v-if="groups.length > 1" :style="{ flexShrink: 0, width: '12px' }" />
      </div>

      <!-- Cancel: заливка чуть светлее фона модалки, без обводки, 17px/600. -->
      <div :style="{ padding: '0 24px 18px' }">
        <button :style="{
          width: '100%', padding: '14px',
          background: 'rgba(255,255,255,0.06)',
          border: 'none', borderRadius: '12px',
          cursor: 'pointer', color: T.text,
          fontSize: '17px', fontWeight: 600, fontFamily: 'inherit',
        }" @click="emit('close')">
          Отмена
        </button>
      </div>
    </div>
  </div>
  </Teleport>
</template>

<style scoped>
.fx-add-slider::-webkit-scrollbar { display: none; }
.fx-add-slider { -ms-overflow-style: none; scrollbar-width: none; }

.rotor-load { width: 40px; height: 40px; position: relative; }
.rotor-load-l {
  position: absolute; top: 50%; left: 50%;
  width: 2.5px; height: 10px; margin: -5px 0 0 -1.25px;
  border-radius: 1px;
  background: linear-gradient(to bottom, #d4b87a, #b4915a, #8a6e3e);
  transform-origin: 50% 50%;
  animation: rotorLoadCycle 5000ms ease-in-out infinite;
  opacity: 0;
}
@keyframes rotorLoadCycle {
  0%   { transform: rotate(var(--rot)) translateY(-26px) scale(0.3); opacity: 0; }
  5%   { transform: rotate(var(--rot)) translateY(-14px) scale(1);   opacity: 0.95; }
  80%  { transform: rotate(var(--rot)) translateY(-14px) scale(1);   opacity: 0.95; }
  90%  { transform: rotate(var(--rot)) translateY(-26px) scale(0.3); opacity: 0; }
  100% { transform: rotate(var(--rot)) translateY(-26px) scale(0.3); opacity: 0; }
}
</style>
