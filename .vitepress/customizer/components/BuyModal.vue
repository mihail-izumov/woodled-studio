<script setup lang="ts">
/**
 * BuyModal.vue — «Мой Лес» (v3).
 *
 * Fix 7: Хедеры заменены на NavHeader (единый стиль).
 *
 * batch10 #5 v3:
 *   Блок «Посмотрите на свой лес» использует НОВЫЙ компонент GradientFill —
 *   аврора-фон из дышащих радиальных blob-ов вместо крутящегося conic.
 *
 * batch11 #1:
 *   Добавлена иконка типа светильника (fxIcName) в карточках списка —
 *   квадратик 36×36 с фоном в тон дерева, как в блоке скидки.
 */

import { computed, ref, reactive } from 'vue'
import { T, Z, WCOL } from '../theme/tokens'
import { MD, fxTitle, fxLine, type Fixture } from '../data/catalog'
import { MATS } from '../data/materials'
import { fxPrice, itemPrice } from '../data/price-engine'
import { getRT, type Room } from '../data/rooms'
import { useConfigurator } from '../store/configurator'
import Icon, { fxIcName } from './ui/Icons.vue'
import NavHeader from './ui/NavHeader.vue'
import GradientFill from './ui/GradientFill.vue'

const PANEL_FG = T.bg

const cfg = useConfigurator()

interface Props { rooms: Room[] }
const props = defineProps<Props>()
/* Заявка идёт в LeadModal на уровне App.vue — здесь только emit('lead'),
   App.vue откроет общую форму с source='forest' (заголовок «Новый Лес
   WOODLED»). Старые шаги form/done и поле contact удалены. */
const emit = defineEmits<{
  editFx: [roomId: string, fxIdx: number, next: Fixture | null]
  openFx: [roomId: string, fxIdx: number]
  close: []; feedback: [msg: string]; story: []; lead: []
}>()

const discountMode = ref(false)
const discountFx = ref<{ roomId: string; fxIdx: number } | null>(null)
/**
 * «Мой Лес» — про WOODLED-светильники: каталог, скидка на первый, форма
 * заказа. Кастомы (другие бренды) тут не показываем — у них цена 0 и
 * заказывать их через WOODLED нельзя.
 */
function woodledFx(r: Room): Fixture[] {
  return r.fixtures.filter((f) => !f.custom)
}
/** Индексы WOODLED-светильников в исходном r.fixtures (для discount/onFxClick). */
function woodledEntries(r: Room): Array<{ fx: Fixture; idx: number }> {
  return r.fixtures
    .map((fx, idx) => ({ fx, idx }))
    .filter((x) => !x.fx.custom)
}
const filledRooms = computed(() =>
  props.rooms.filter((r) => woodledFx(r).length > 0),
)
const expandedRooms = reactive<Record<string, boolean>>({})
function isExpanded(roomId: string): boolean { return expandedRooms[roomId] !== false }
function toggleRoom(roomId: string) { expandedRooms[roomId] = !isExpanded(roomId) }

/** batch10 #5: цвета всех комнат для GradientFill. */
const roomColors = computed<string[]>(() =>
  props.rooms.map((r) => r.cardColor).filter((c): c is string => !!c),
)

function toggleDiscountMode() { if (discountMode.value) { discountMode.value = false; discountFx.value = null } else { discountMode.value = true } }
function toggleDiscount(roomId: string, fxIdx: number) { const sel = discountFx.value; if (sel && sel.roomId === roomId && sel.fxIdx === fxIdx) { discountFx.value = null } else { discountFx.value = { roomId, fxIdx } } }
function isDiscounted(roomId: string, fxIdx: number): boolean { const sel = discountFx.value; return !!sel && sel.roomId === roomId && sel.fxIdx === fxIdx }
const discountApplied = computed(() => discountFx.value !== null)

const totalAll = computed(() => filledRooms.value.reduce((s, r) => s + fxPrice(woodledFx(r)), 0))
const grandTotal = computed(() => totalAll.value - (discountApplied.value ? 3000 : 0))
function roomTotal(r: Room): number { const base = fxPrice(woodledFx(r)); if (discountFx.value?.roomId === r.id) return Math.max(0, base - 3000); return base }
function fxCount(r: Room): number { return woodledFx(r).reduce((s, fx) => s + (fx.q ?? 1), 0) }

function onFxClick(roomId: string, fxIdx: number) { if (discountMode.value) { toggleDiscount(roomId, fxIdx) } else { emit('openFx', roomId, fxIdx) } }
function goToFirstRoom() { if (cfg.rooms.length > 0) { cfg.showBuy.value = false; cfg.active.value = cfg.rooms[0].id } else { emit('close') } }
function submitList() { emit('lead') }

/**
 * batch10 #5 v3: PANEL_BG (#EAE0CA) убран — фон формирует GradientFill
 * (cream base + аврора-blob-ы). Здесь остались только полупрозрачные
 * radial-sheen для glass-эффекта поверх blob-ов.
 */
function storyLinkStyle() {
  return {
    background: `radial-gradient(ellipse 90% 70% at 20% 0%, rgba(255,255,255,0.38), transparent 55%), radial-gradient(ellipse 70% 60% at 85% 95%, rgba(19,17,14,0.06), transparent 60%)`,
    border: '1px solid rgba(255,255,255,0.22)',
    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -1px 3px rgba(19,17,14,0.04), 0 4px 20px rgba(0,0,0,0.28)`,
    borderRadius: '12px',
    padding: '14px 16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  }
}
function fxCardStyle(roomId: string, fxIdx: number) {
  const sel = isDiscounted(roomId, fxIdx)
  /* batch11 #2: borderRadius 8 — заметно меньше панели «Итого» (12) */
  return { width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 12px 6px 6px', background: sel ? 'rgba(255,255,255,0.05)' : T.card, border: `1px solid ${sel ? 'rgba(255,255,255,0.15)' : T.border}`, borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'background 0.15s, border-color 0.15s' }
}
function woodBadgeStyle(woodColor: string) {
  /* batch11 #1 v5: padding 0px вертикальный + 6/4 горизонтальный — бейдж ещё компактнее */
  return { display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '0px 6px 0px 4px', borderRadius: '5px', background: woodColor + '14', fontSize: '11px', color: woodColor, fontWeight: 500, alignSelf: 'flex-start' }
}
</script>

<template>
  <!-- Шаг list — единственный. Старые form/done удалены: заявка идёт через
       LeadModal (App.vue открывает её по @lead). -->
  <div :style="{ position: 'fixed', inset: 0, background: T.bg, zIndex: Z.fullscreenModal, overflow: 'auto' }">
    <NavHeader title="Мой Лес" back="Домой" @back="emit('close')" />

    <div :style="{ padding: '16px', maxWidth: '480px', margin: '0 auto' }">
      <!-- batch10 #5 v3: GradientFill с аврора-blob-ами вместо conic. -->
      <div v-if="filledRooms.length > 0" :style="{ marginBottom: '20px' }">
        <GradientFill :colors="roomColors" :border-radius="12">
          <div :style="storyLinkStyle()" @click="emit('story')">
            <div :style="{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(19,17,14,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }"><Icon name="trees" :color="PANEL_FG" :size="22" /></div>
            <div :style="{ flex: 1 }">
              <div :style="{ fontSize: '15px', fontWeight: 600, color: PANEL_FG }">Посмотрите на свой лес</div>
              <div :style="{ fontSize: '13px', fontWeight: 600, color: PANEL_FG, opacity: 0.55, marginTop: '-1px' }">Узнайте, какой свет вы создали</div>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" :stroke="PANEL_FG" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" :style="{ flexShrink: 0 }"><polyline points="9 6 15 12 9 18" /></svg>
          </div>
        </GradientFill>
      </div>

      <!-- batch11 #2 (#10) + batch11 #3 (#4): 2 строки, font 32, weight 600 (было 700).
           «WOODLED» добавлено в третьей строке — подчёркивает что это
           заказ только по WOODLED-каталогу (кастомы скрыты выше). -->
      <div :style="{ textAlign: 'center', marginTop: '8px', marginBottom: '24px', fontSize: '32px', fontWeight: 600, color: T.text, lineHeight: 1.1 }">Освещение<br/>в доме WOODLED</div>

      <div v-if="filledRooms.length > 0" :style="{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '14px 16px', marginBottom: '20px' }">
        <div :style="{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }">
          <!-- batch11 #3 (#2): «Итого» font 15 — как «Скидка 3000» -->
          <span :style="{ fontSize: '15px', color: T.textSec, fontWeight: 500 }">Итого</span>
          <div :style="{ display: 'flex', alignItems: 'baseline', gap: '6px' }">
            <span v-if="discountApplied" :style="{ fontSize: '12px', color: T.textDim, textDecoration: 'line-through' }">{{ totalAll.toLocaleString('ru-RU') }} ₽</span>
            <span :style="{ fontSize: '18px', fontWeight: 700, color: T.text }">{{ grandTotal.toLocaleString('ru-RU') }} ₽</span>
          </div>
        </div>
        <div :style="{ height: '1px', background: T.border, marginBottom: '12px' }" />
        <!-- batch11 #2 (#4-#8): иконка подарка 48×48 как у светильников, тексты в стиле «Посмотрите на свой лес», слайдер 2x жемчужный -->
        <div :style="{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '4px 0' }" @click="toggleDiscountMode">
          <div :style="{ width: '48px', height: '48px', borderRadius: '12px', background: discountMode ? 'rgba(255,255,255,0.1)' : T.neutral + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s', flexShrink: 0 }"><Icon name="gift" :color="discountMode ? T.text : T.neutral" :size="24" /></div>
          <div :style="{ flex: 1 }">
            <div :style="{ fontSize: '15px', fontWeight: 600, color: T.text }">Скидка 3 000 ₽</div>
            <div :style="{ fontSize: '13px', fontWeight: 600, color: T.textSec, marginTop: '-1px' }">{{ discountMode ? (discountApplied ? 'Применена' : 'Выберите светильник') : 'На первый светильник' }}</div>
          </div>
          <!-- batch11 #3 (#1): слайдер -30% (76→53, 44→30, ползунок 32→22) -->
          <div :style="{ width: '53px', height: '30px', borderRadius: '15px', background: discountMode ? T.text : T.text + '22', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }"><div :style="{ width: '22px', height: '22px', borderRadius: '50%', background: discountMode ? T.bg : T.text + '88', position: 'absolute', top: '4px', left: discountMode ? '27px' : '4px', transition: 'left 0.2s' }" /></div>
        </div>
      </div>

      <div v-for="(r, ri) in filledRooms" :key="r.id" :style="{ marginBottom: '2px' }">
        <div :style="{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', cursor: 'pointer' }" @click="toggleRoom(r.id)">
          <div :style="{ display: 'flex', alignItems: 'center', gap: '8px' }">
            <span :style="{ fontSize: '14px', fontWeight: 600, color: T.text }">{{ r.customName || getRT(r.typeId).name }}</span>
            <!-- batch11 #2: бабл шт крупнее, font +2 кегля -->
            <span :style="{ fontSize: '12px', fontWeight: 500, color: T.textDim, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '2px 10px', lineHeight: '18px' }">{{ fxCount(r) }} шт</span>
          </div>
          <div :style="{ display: 'flex', alignItems: 'center', gap: '8px' }">
            <!-- batch11 #2: цена комнаты +2 кегля -->
            <span :style="{ fontSize: '15px', fontWeight: 500, color: T.textDim }">{{ roomTotal(r).toLocaleString('ru-RU') }} ₽</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" :stroke="T.textDim" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :style="{ transition: 'transform 0.25s ease', transform: isExpanded(r.id) ? 'rotate(180deg)' : 'rotate(0)' }"><polyline points="6 9 12 15 18 9" /></svg>
          </div>
        </div>
        <div :style="{ maxHeight: isExpanded(r.id) ? '800px' : '0', overflow: 'hidden', transition: 'max-height 0.3s ease' }">
          <div :style="{ display: 'flex', flexDirection: 'column', gap: '6px', paddingBottom: ri < filledRooms.length - 1 ? '12px' : '0' }">
            <!-- v-for по WOODLED-only через woodledEntries — кастомы (IKEA и пр.)
                 не показываем. idx — оригинальный индекс из r.fixtures, чтобы
                 discount/openFx ссылались на правильный fixture в массиве. -->
            <button v-for="{ fx, idx: i } in woodledEntries(r)" :key="i" :style="fxCardStyle(r.id, i)" @click="onFxClick(r.id, i)">
              <div v-if="discountMode" :style="{ width: '18px', height: '18px', borderRadius: '50%', border: `2px solid ${isDiscounted(r.id, i) ? T.text : T.textDim}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }"><div v-if="isDiscounted(r.id, i)" :style="{ width: '8px', height: '8px', borderRadius: '50%', background: T.text }" /></div>
              <!-- batch11 #1 v3: 48×48 — крупнее, карточка ниже за счёт padding 6px -->
              <div :style="{ width: '48px', height: '48px', borderRadius: '12px', background: WCOL[fx.wood ?? 'oak'] + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }"><Icon :name="fxIcName(MD[fx.m].type)" :color="WCOL[fx.wood ?? 'oak']" :size="24" /></div>
              <!-- Левая колонка: имя + линейка (две строки) -->
              <div :style="{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '2px' }">
                <div :style="{ fontSize: '13px', fontWeight: 600, color: T.text, lineHeight: 1.2 }">
                  <span>{{ fxTitle(fx.m) }}</span>
                  <span v-if="(fx.q ?? 1) > 1" :style="{ color: T.textSec, fontWeight: 400, fontSize: '12px', marginLeft: '6px' }">× {{ fx.q }}</span>
                </div>
                <div :style="{ fontSize: '10px', fontWeight: 700, color: T.textSec, textTransform: 'uppercase', letterSpacing: '0.6px' }">{{ fxLine(fx.m) }}</div>
              </div>
              <!-- Правая колонка: цена + чип дерева под ней -->
              <div :style="{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', gap: '4px' }">
                <div v-if="isDiscounted(r.id, i)" :style="{ fontSize: '12px', color: T.textDim, textDecoration: 'line-through' }">{{ itemPrice(fx).toLocaleString('ru-RU') }} ₽</div>
                <div :style="{ fontSize: '15px', fontWeight: 600, color: T.text }">{{ (isDiscounted(r.id, i) ? Math.max(0, itemPrice(fx) - 3000) : itemPrice(fx)).toLocaleString('ru-RU') }} ₽</div>
                <div :style="{ ...woodBadgeStyle(WCOL[fx.wood ?? 'oak']), alignSelf: 'flex-end' }"><div :style="{ width: '12px', height: '12px', borderRadius: '50%', background: WCOL[fx.wood ?? 'oak'] }" />{{ MATS.find((x) => x.id === (fx.wood ?? 'oak'))?.name }}</div>
              </div>
            </button>
          </div>
        </div>
        <div v-if="ri < filledRooms.length - 1" :style="{ height: '1px', background: T.border, opacity: 0.6 }" />
      </div>

      <div v-if="filledRooms.length === 0" :style="{ textAlign: 'center', padding: '40px 20px' }">
        <div :style="{ fontSize: '14px', color: T.textSec, lineHeight: 1.6, maxWidth: '300px', margin: '0 auto 24px' }">Здесь будет план освещения вашего дома — светильники по комнатам с породами дерева и ценами. Добавьте первый, и лес начнёт расти.</div>
        <button :style="{ padding: '12px 28px', background: '#FFFFFF', color: T.bg, border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit' }" @click="goToFirstRoom">Добавить светильник</button>
      </div>

      <div v-if="filledRooms.length > 0" :style="{ marginTop: '32px', textAlign: 'center', paddingBottom: '32px' }">
        <!-- batch11 #3 (#3): «Лес собран» 1.5x (18→27) -->
        <div :style="{ fontSize: '27px', fontWeight: 700, color: T.text, marginBottom: '10px' }">Лес собран</div>
        <!-- batch11 #3 (#5) + batch11 #4: одна строка, без переноса -->
        <div :style="{ fontSize: '14px', fontWeight: 600, color: T.text, lineHeight: 1.5, marginBottom: '24px' }">Отправьте план и дерево засветит у вас дома</div>
        <!-- batch11 #2 (#9): кнопка +3 кегля, padding пропорционально -->
        <button :style="{ width: '100%', padding: '18px', background: '#FFFFFF', color: T.bg, border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '17px', fontFamily: 'inherit' }" @click="submitList">Отправить план леса</button>
        <div :style="{ fontSize: '12px', color: T.textSec, lineHeight: 1.6, maxWidth: '320px', margin: '14px auto 0' }">Специалист WOODLED получит ваш план освещения и комплектацию каждого светильника.</div>
      </div>
    </div>
  </div>
</template>

