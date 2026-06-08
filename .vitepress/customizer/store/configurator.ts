/**
 * configurator.ts — Состояние конфигуратора
 *
 * batch11 #9: добавлен showRoomSettings — глобальный флаг открытой
 *   страницы параметров комнаты. Используется в App.vue чтобы скрыть
 *   StickyBar только в RoomSettings (на самом RoomDetail StickyBar
 *   остаётся видимым).
 *
 * Fix 2: flatMap q>1 → отдельные светильники (с deep clone opts/done).
 * Fix 8+: Автоперсистенция после каждой мутации.
 */

import { ref, computed, reactive } from 'vue'
import { getRT, STARTER_ROOM_TYPES, type Room, type RoomTypeId } from '../data/rooms'
import type { Fixture } from '../data/catalog'
import type { Mood } from '../data/moods'
import { TEMPLATES, allStepsForModel, type TemplateRoom } from '../data/templates'
import { decodeState, readHashState } from '../engine/share'
import { registerAllCustoms, registerCustom } from '../engine/custom-registry'
import { ROOM_TINTS } from '../theme/tokens'

/* ──────────────── Счётчик ID ──────────────── */

let _id = 1
function nextId(): string {
  return `r${_id++}`
}

/* ──────────────── Нормализация q>1 → q:1 ──────────────── */
/**
 * Каждый Fixture с q>1 разворачивается в q отдельных записей q:1.
 * Опции и done глубоко копируются, чтобы независимое редактирование одной
 * из «размноженных» строк не задевало соседей.
 *
 * Применяется в любой точке загрузки данных извне (localStorage, hash-share),
 * чтобы в реактивном сторе всегда было «1 запись = 1 физический светильник».
 * Расчёты люмен/цены продолжают читать `q` — для q:1 они идентичны исходным.
 */
function normalizeFixturesQ1(fixtures: Fixture[] | undefined): Fixture[] {
  if (!fixtures || !fixtures.length) return []
  return fixtures.flatMap((f) => {
    const count = Math.max(1, f.q ?? 1)
    if (count === 1) return [{ ...f, q: 1 }]
    return Array.from({ length: count }, () => ({
      ...f,
      q: 1,
      opts: f.opts ? { ...f.opts } : undefined,
      done: f.done ? [...f.done] : undefined,
    }))
  })
}

function normalizeRoomsQ1<R extends { fixtures?: Fixture[] }>(rs: R[]): R[] {
  return rs.map((r) => ({ ...r, fixtures: normalizeFixturesQ1(r.fixtures) }))
}

/* ──────────────── Конструктор комнаты ──────────────── */

function makeRoom(typeId: RoomTypeId): Room {
  const rt = getRT(typeId)
  return {
    id: nextId(),
    typeId,
    customName: '',
    sizeIndex: 1,
    customArea: null,
    ceilingH: 2.7,
    fixtures: [],
    furniture: [],
    limits: { ...rt.limits },
  }
}

function starterRooms(): Room[] {
  return STARTER_ROOM_TYPES.map((tid) => makeRoom(tid))
}

/* ──────────────── State persistence ──────────────── */

const STATE_KEY = 'woodled.state'

function persistState(): void {
  if (typeof window === 'undefined') return
  if (rooms.length === 0) return
  try {
    const data = {
      v: 1,
      name: name.value,
      rooms: JSON.parse(JSON.stringify(rooms)),
    }
    localStorage.setItem(STATE_KEY, JSON.stringify(data))
  } catch { /* quota exceeded */ }
}

function restorePersistedState(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const raw = localStorage.getItem(STATE_KEY)
    if (!raw) return false
    const data = JSON.parse(raw)
    if (!data?.rooms?.length) return false
    name.value = data.name ?? 'Живой Дом'
    // Нормализуем q>1 → отдельные q:1 для старых сохранений.
    const normalized = normalizeRoomsQ1(data.rooms as Room[])
    // Кастомные светильники регистрируем в MD до первого рендера —
    // иначе MD[fx.m] вернёт undefined и движок упадёт.
    registerAllCustoms(normalized)
    rooms.splice(0, rooms.length, ...normalized)
    for (const r of data.rooms) {
      const num = parseInt(String(r.id ?? '').replace('r', '') || '0')
      if (num >= _id) _id = num + 1
    }
    return true
  } catch {
    return false
  }
}

function clearPersistedState(): void {
  if (typeof window === 'undefined') return
  try { localStorage.removeItem(STATE_KEY) } catch {}
}

/* ──────────────── State (singleton) ──────────────── */

const name = ref('Живой Дом')
const rooms = reactive<Room[]>([])

const picker = ref(false)
const active = ref<string | null>(null)
const firstId = ref<string | null>(null)
const showFirst = ref(false)
const showName = ref(false)
const showStory = ref(false)
const showBuy = ref(false)
const showShare = ref(false)

/**
 * batch11 #9: открыт ли экран параметров комнаты (RoomSettings).
 * Сам RoomSettings.vue ставит true в onMounted и false в onUnmounted.
 * App.vue использует этот флаг чтобы скрыть StickyBar именно в настройках,
 * не трогая видимость на самом RoomDetail.
 */
const showRoomSettings = ref(false)
/** Открыта модалка деталей зоны (ZoneFixturesModal) — скрывает StickyBar. */
const showZoneModal = ref(false)
/**
 * Открыта модалка «Детали сборки» на странице светильника
 * (PriceDetailsModal). FxEditor сам управляет своей жизнью, но App.vue
 * читает флаг чтобы скрыть SoundButton под модалкой (anyModalOpen).
 */
const showPriceDetails = ref(false)

const fb = ref<string | null>(null)
/** Иконка тоста: 'check' → зелёный чекмарк «сделано». null → без иконки. */
const fbIcon = ref<'check' | null>(null)

const showMoodDetail = ref<Mood | null>(null)

interface DiscountFx {
  roomId: string
  fxIdx: number
}
const discountFx = ref<DiscountFx | null>(null)

const activeFx = ref<{ roomId: string; fxIdx: number } | null>(null)

function openFx(roomId: string, fxIdx: number) {
  activeFx.value = { roomId, fxIdx }
}

function closeFx() {
  activeFx.value = null
}

const activeRoom = computed<Room | null>(() => {
  if (!active.value) return null
  return rooms.find((r) => r.id === active.value) ?? null
})

const hasFixtures = computed<boolean>(() =>
  rooms.some((r) => r.fixtures.length > 0),
)

/* ──────────────── Мутации (каждая вызывает persistState) ──────────────── */

function setName(v: string) {
  name.value = v
  persistState()
}

function add(typeId: RoomTypeId): string {
  const nr = makeRoom(typeId)
  rooms.push(nr)
  picker.value = false
  const rt = getRT(typeId)
  showFB(`${rt.name} — добавьте свет`)
  persistState()
  setTimeout(() => {
    active.value = nr.id
  }, 80)
  return nr.id
}

function removeRoom(id: string) {
  const idx = rooms.findIndex((r) => r.id === id)
  if (idx === -1) return
  rooms.splice(idx, 1)
  if (firstId.value === id) firstId.value = null
  if (active.value === id) active.value = null
  persistState()
}

function updateRoom(next: Room) {
  const idx = rooms.findIndex((r) => r.id === next.id)
  if (idx === -1) return
  // Перерегистрируем кастомы из новой версии комнаты — иначе при правке
  // через emit('update') (например, добавление кастома в RoomDetail)
  // MD может не содержать запись и любой следующий рендер упадёт.
  for (const fx of next.fixtures) {
    if (fx.custom) {
      const id = registerCustom(fx.custom)
      if (fx.m !== id) fx.m = id
    }
  }
  rooms[idx] = next
  persistState()
}

function patchRoom<K extends keyof Room>(id: string, key: K, value: Room[K], toast?: string) {
  const room = rooms.find((r) => r.id === id)
  if (!room) return
  ;(room as Room)[key] = value
  if (toast) showFB(toast)
  persistState()
}

function addFixture(roomId: string, fx: Fixture): boolean {
  const room = rooms.find((r) => r.id === roomId)
  if (!room) return false

  const rt = getRT(room.typeId)
  const limit = (room.limits ?? rt.limits)?.[fx.zone] ?? 99
  const current = room.fixtures
    .filter((f) => (f.zone ?? 'ceiling') === fx.zone)
    .reduce((s, f) => s + (f.q ?? 1), 0)

  if (current >= limit) return false

  // Регистрируем кастомную модель в MD до того как реактивный слой
  // увидит fixture (иначе ZoneCard/RoomDetail упадут на MD[fx.m] = undefined).
  if (fx.custom) {
    const id = registerCustom(fx.custom)
    if (fx.m !== id) fx.m = id
  }

  room.fixtures.push(fx)
  persistState()
  return true
}

function removeFixture(roomId: string, idx: number) {
  const room = rooms.find((r) => r.id === roomId)
  if (!room) return
  room.fixtures.splice(idx, 1)
  persistState()
}

function updateFixture(roomId: string, idx: number, next: Fixture) {
  const room = rooms.find((r) => r.id === roomId)
  if (!room) return
  // При обновлении кастома спека могла измениться → перерегистрируем
  // (customIdFor вернёт новый id, если поля поменялись).
  if (next.custom) {
    const id = registerCustom(next.custom)
    if (next.m !== id) next.m = id
  }
  room.fixtures[idx] = next
  persistState()
}

function showFB(msg: string | null, icon: 'check' | null = null) {
  fb.value = msg
  fbIcon.value = icon
}

function clearFB() {
  fb.value = null
  fbIcon.value = null
}

function loadFromHash(): boolean {
  const encoded = readHashState()
  if (!encoded) return false
  const decoded = decodeState(encoded, nextId)
  if (!decoded) return false
  if (decoded.name) name.value = decoded.name
  // Нормализуем q>1 → q:1 на случай старого формата ссылки.
  const normalized = normalizeRoomsQ1(decoded.rooms)
  // Регистрируем кастомные светильники из ссылки до первого рендера.
  registerAllCustoms(normalized)
  rooms.splice(0, rooms.length, ...normalized)
  persistState()
  return true
}

const WELCOME_KEY = 'woodled.welcomeSeen'
const DASHBOARD_TOUR_KEY = 'woodled.dashboardTourSeen'
/** Прошёл ли пользователь пошаговый «Гид по сборке» хотя бы раз
 *  (или сохранил/закрыл первый светильник). Пока false — на первом
 *  новом светильнике показываем заметную плашку-CTA гида; потом — тихую ссылку. */
const ONBOARDED_KEY = 'woodled.onboardedOnce'

function shouldForceWelcome(): boolean {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).has('welcome')
}

const welcomeSeen = ref<boolean>(
  typeof window !== 'undefined'
    && !shouldForceWelcome()
    && localStorage.getItem(WELCOME_KEY) === 'true',
)

const dashboardTourSeen = ref<boolean>(
  typeof window !== 'undefined'
    && localStorage.getItem(DASHBOARD_TOUR_KEY) === 'true',
)

function markDashboardTourSeen(): void {
  dashboardTourSeen.value = true
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(DASHBOARD_TOUR_KEY, 'true')
    } catch {}
  }
}

const onboardedOnce = ref<boolean>(
  typeof window !== 'undefined'
    && localStorage.getItem(ONBOARDED_KEY) === 'true',
)

function markOnboardedOnce(): void {
  onboardedOnce.value = true
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(ONBOARDED_KEY, 'true')
    } catch {}
  }
}

function dismissWelcome(): void {
  welcomeSeen.value = true
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(WELCOME_KEY, 'true')
    } catch {}
  }
  ensureStarterRooms()
}

function ensureStarterRooms(): void {
  if (rooms.length === 0) {
    rooms.push(...starterRooms())
    persistState()
  }
}

/**
 * Fix 2: flatMap с deep clone — каждый fixture с q>1 → отдельные записи q=1.
 * Deep clone opts/done чтобы они не шарились по ссылке между копиями.
 */
function loadTemplate(templateId: string): void {
  const tpl = TEMPLATES.find((t) => t.id === templateId)
  if (!tpl) return

  const newRooms: Room[] = tpl.rooms.map((tr: TemplateRoom) => {
    const rt = getRT(tr.typeId)
    return {
      id: nextId(),
      typeId: tr.typeId,
      customName: '',
      sizeIndex: tr.sizeIndex,
      customArea: null,
      ceilingH: tr.ceilingH,
      fixtures: tr.fixtures.flatMap((f) => {
        const doneList = f.done ?? allStepsForModel(f.m)
        return Array.from({ length: f.q }, () => ({
          m: f.m,
          q: 1,
          wood: f.wood,
          zone: f.zone,
          l: f.l,
          opts: f.opts ? { ...f.opts } : undefined,
          done: [...doneList],
        }))
      }),
      furniture: [...tr.furniture],
      limits: { ...rt.limits },
      cardColor: ROOM_TINTS[tr.typeId],
    }
  })

  rooms.splice(0, rooms.length, ...newRooms)
  dismissWelcome()
  persistState()
}

function resetAll(): void {
  rooms.splice(0, rooms.length)
  welcomeSeen.value = false
  dashboardTourSeen.value = false
  onboardedOnce.value = false
  active.value = null
  activeFx.value = null
  showBuy.value = false
  showStory.value = false
  showShare.value = false
  showFirst.value = false
  showName.value = false
  showMoodDetail.value = null
  showRoomSettings.value = false
  showZoneModal.value = false
  showPriceDetails.value = false
  picker.value = false
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(WELCOME_KEY)
      localStorage.removeItem(DASHBOARD_TOUR_KEY)
      localStorage.removeItem(ONBOARDED_KEY)
      localStorage.removeItem(STATE_KEY)
    } catch {}
  }
}

export function useConfigurator() {
  return {
    name,
    rooms,
    picker,
    active,
    firstId,
    showFirst,
    showName,
    showStory,
    showBuy,
    showShare,
    showRoomSettings,
    showZoneModal,
    showPriceDetails,
    fb,
    fbIcon,
    discountFx,
    activeFx,
    showMoodDetail,
    activeRoom,
    hasFixtures,
    setName,
    add,
    removeRoom,
    updateRoom,
    patchRoom,
    addFixture,
    removeFixture,
    updateFixture,
    openFx,
    closeFx,
    showFB,
    clearFB,
    loadFromHash,
    welcomeSeen,
    dismissWelcome,
    loadTemplate,
    ensureStarterRooms,
    resetAll,
    dashboardTourSeen,
    markDashboardTourSeen,
    onboardedOnce,
    markOnboardedOnce,
    persistState,
    restorePersistedState,
    clearPersistedState,
  }
}
