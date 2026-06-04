<script setup lang="ts">
/**
 * PaletteHelpModal.vue — Модалка «О палитре» для ColorPickerModal.
 *
 * Открывается по кнопке «?» рядом с заголовком группы пресетов.
 * Объясняет, почему именно эти 12 цветов и что значит каждый из них.
 *
 * 12 цветов разбиты на две группы:
 *   1. Тёплая шкала — от бумажного к шоколадному (6)
 *   2. Холодная шкала и натуральные акценты (6)
 *
 * Для каждого цвета — swatch, название, HEX, бейдж категории
 * (светлый / нейтральный / тёмный по BT.709 luminance) и одна короткая
 * фраза про характер. Тексты — по ToV: спокойный · тёплый · по делу.
 */

import { T } from '../../theme/tokens'

defineEmits<{ close: [] }>()

type Finish = 'light' | 'medium' | 'dark'
interface PaletteRow {
  hex: string
  name: string
  finish: Finish
  desc: string
}

const FINISH_LABEL: Record<Finish, string> = {
  light: 'светлый',
  medium: 'нейтральный',
  dark: 'тёмный',
}
const FINISH_COLOR: Record<Finish, string> = {
  light: T.green,
  medium: T.neutral,
  dark: T.textSec,
}

const WARM: PaletteRow[] = [
  { hex: '#F5F1E8', name: 'Бумага',  finish: 'light',  desc: 'Тёплый off-white с лёгкой кремовой ноткой. Не бликует, не холодит — спокойный фон для дерева.' },
  { hex: '#E0D6C4', name: 'Лён',     finish: 'light',  desc: 'Кремовый с мягким бежевым подтоном. Хорошо рядом с тёплым дубом и орехом.' },
  { hex: '#D7D0C2', name: 'Холст',   finish: 'light',  desc: 'Benjamin Moore Edgecomb Gray HC-173 — эталон universal greige. Самый продаваемый нейтрал последних пяти лет.' },
  { hex: '#C0AE96', name: 'Песок',   finish: 'medium', desc: 'Тёплый средний бежевый. Хорош там, где много света и хочется камерности.' },
  { hex: '#8A7F70', name: 'Камень',  finish: 'medium', desc: 'Greige потемнее. Уютный, чуть приглушает свет — комната становится спокойнее.' },
  { hex: '#4F4438', name: 'Какао',   finish: 'dark',   desc: 'Глубокий тёплый коричневый. Забирает свет, но даёт характер — для кабинета или спальни-каюты.' },
]

const COOL: PaletteRow[] = [
  { hex: '#ECECEC', name: 'Снег',       finish: 'light',  desc: 'Чистый прохладный белый. Безопасный выбор, не желтит на южных окнах.' },
  { hex: '#A8A8A8', name: 'Туман',      finish: 'medium', desc: 'Классический mid grey. Базовый нейтрал без подтона — на нём играют любые акценты.' },
  { hex: '#3A3A3A', name: 'Графит',     finish: 'dark',   desc: 'Глубокий тёмно-серый. Для акцентной стены, кабинета или комнаты с большими окнами.' },
  { hex: '#8B947E', name: 'Шалфей',     finish: 'medium', desc: 'Приглушённый зелёный — главный тренд 2026. Хорошо с дубом и орехом, не кричит.' },
  { hex: '#7A8B98', name: 'Дымка',      finish: 'medium', desc: 'Спокойный пыльно-синий. Холодный воздух без агрессии, для спальни и ванной.' },
  { hex: '#A06B4F', name: 'Терракота',  finish: 'dark',   desc: 'Тёплая глина. Забирает часть света, но создаёт настроение средиземноморского вечера.' },
]
</script>

<template>
  <Teleport to="body">
    <div
      :style="{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(0,0,0,.75)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }"
      @click.self="$emit('close')"
    >
      <div
        :style="{
          width: '100%',
          maxWidth: '480px',
          maxHeight: '92vh',
          overflow: 'auto',
          background: T.bg,
          borderTopLeftRadius: '18px',
          borderTopRightRadius: '18px',
          borderTop: `1px solid ${T.border}`,
        }"
      >
        <div :style="{ padding: '24px 20px 16px' }">
          <!-- Шапка -->
          <div :style="{ textAlign: 'center', marginBottom: '20px' }">
            <div :style="{ fontSize: '10px', fontWeight: 700, color: T.neutral, letterSpacing: '1.5px', marginBottom: '8px' }">ПАЛИТРА СТЕН</div>
            <div :style="{ fontSize: '22px', fontWeight: 800, color: T.text, lineHeight: 1.2, marginBottom: '12px' }">12 цветов под реальные стены</div>
            <div :style="{ fontSize: '14px', fontWeight: 500, color: T.text, lineHeight: 1.55, maxWidth: '360px', margin: '0 auto' }">
              Подобрали по трендам Benjamin Moore, Sherwin-Williams и Farrow &amp; Ball на 2026 год.
              Тёплые нейтрали, ахроматическая шкала и три натуральных акцента — то, на чём держится
              ≈ 80% реальных интерьеров.
            </div>
          </div>

          <!-- Тёплая шкала -->
          <div :style="{ marginBottom: '24px' }">
            <div :style="{ fontSize: '12px', fontWeight: 700, color: T.textSec, textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '4px' }">Тёплая шкала</div>
            <div :style="{ fontSize: '12px', color: T.textDim, marginBottom: '12px', lineHeight: 1.4 }">От бумажного к шоколадному — на тёплой стороне нейтрали с бежево-коричневым подтоном. Хорошо рядом с деревом.</div>
            <div :style="{ display: 'flex', flexDirection: 'column', gap: '8px' }">
              <div
                v-for="row in WARM"
                :key="row.hex"
                :style="{ padding: '12px 14px', background: T.card, border: `1px solid ${T.border}`, borderRadius: '12px', display: 'flex', gap: '14px', alignItems: 'flex-start' }"
              >
                <div
                  :style="{
                    flexShrink: 0,
                    width: '40px', height: '40px',
                    borderRadius: '10px',
                    background: row.hex,
                    border: `1px solid ${T.border}`,
                  }"
                  aria-hidden="true"
                />
                <div :style="{ flex: 1, minWidth: 0 }">
                  <div :style="{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }">
                    <span :style="{ fontSize: '14px', fontWeight: 700, color: T.text }">{{ row.name }}</span>
                    <span :style="{ fontSize: '11px', color: T.textDim, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }">{{ row.hex }}</span>
                    <span :style="{ marginLeft: 'auto', padding: '2px 8px', borderRadius: '6px', background: FINISH_COLOR[row.finish] + '22', color: FINISH_COLOR[row.finish], fontSize: '10px', fontWeight: 700, whiteSpace: 'nowrap' }">{{ FINISH_LABEL[row.finish] }}</span>
                  </div>
                  <div :style="{ fontSize: '12px', color: T.textSec, lineHeight: 1.5 }">{{ row.desc }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Холодная шкала + акценты -->
          <div :style="{ marginBottom: '24px' }">
            <div :style="{ fontSize: '12px', fontWeight: 700, color: T.textSec, textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '4px' }">Холодная и акценты</div>
            <div :style="{ fontSize: '12px', color: T.textDim, marginBottom: '12px', lineHeight: 1.4 }">Ахроматические серые без подтона + три натуральных акцента: шалфей, дымка и терракота — на смену кислотным «акцентным стенам».</div>
            <div :style="{ display: 'flex', flexDirection: 'column', gap: '8px' }">
              <div
                v-for="row in COOL"
                :key="row.hex"
                :style="{ padding: '12px 14px', background: T.card, border: `1px solid ${T.border}`, borderRadius: '12px', display: 'flex', gap: '14px', alignItems: 'flex-start' }"
              >
                <div
                  :style="{
                    flexShrink: 0,
                    width: '40px', height: '40px',
                    borderRadius: '10px',
                    background: row.hex,
                    border: `1px solid ${T.border}`,
                  }"
                  aria-hidden="true"
                />
                <div :style="{ flex: 1, minWidth: 0 }">
                  <div :style="{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }">
                    <span :style="{ fontSize: '14px', fontWeight: 700, color: T.text }">{{ row.name }}</span>
                    <span :style="{ fontSize: '11px', color: T.textDim, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }">{{ row.hex }}</span>
                    <span :style="{ marginLeft: 'auto', padding: '2px 8px', borderRadius: '6px', background: FINISH_COLOR[row.finish] + '22', color: FINISH_COLOR[row.finish], fontSize: '10px', fontWeight: 700, whiteSpace: 'nowrap' }">{{ FINISH_LABEL[row.finish] }}</span>
                  </div>
                  <div :style="{ fontSize: '12px', color: T.textSec, lineHeight: 1.5 }">{{ row.desc }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Сноска -->
          <div :style="{ padding: '14px', background: T.cardAlt, border: `1px solid ${T.border}`, borderRadius: '12px', marginBottom: '20px' }">
            <div :style="{ fontSize: '12px', color: T.textSec, lineHeight: 1.6 }">
              Категория <b :style="{ color: T.text }">светлый / нейтральный / тёмный</b> считается по тому, сколько света стена реально отдаёт обратно в комнату. Расчёт идёт по международной формуле яркости — той же, что используют дисплеи и фоторедакторы для оценки воспринимаемой яркости пикселя. От категории зависит, насколько норма комнаты сдвигается вверх или вниз. Точная отдача любого HEX — на вкладке «Свой цвет».
            </div>
          </div>

          <button
            :style="{
              width: '100%',
              padding: '14px',
              background: T.text,
              color: T.bg,
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              marginBottom: '20px',
            }"
            @click="$emit('close')"
          >Понятно</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
