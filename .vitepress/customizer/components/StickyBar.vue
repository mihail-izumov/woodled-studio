<script setup lang="ts">
/**
 * StickyBar.vue — Закреплённая нижняя панель с двумя кнопками.
 *
 * Fix 3: Кнопка «Мой Лес» — белый фон, без обводки, тёмный текст.
 *
 * batch10 #5:
 *   - Обе кнопки переведены в pill (borderRadius 999px).
 *   - «Поделиться»: убрана обводка, фон rgba(255,255,255,0.08).
 *   - «Мой Лес»: белая pill + сзади вращающийся conic-gradient ring
 *     через GradientRing (3px, 14s, по часовой). Цвета — cardColor
 *     всех комнат, fallback на палитру настроений.
 *
 * batch10 #5 v2:
 *   - Шрифт обеих кнопок 13px → 15px (+2 кегля).
 *   - «Мой лес» → «Мой Лес» (заглавная Л).
 */

import { computed } from 'vue'
import { T, Z } from '../theme/tokens'
import { useConfigurator } from '../store/configurator'
import Icon from './ui/Icons.vue'
import GradientRing from './ui/GradientRing.vue'

const cfg = useConfigurator()

const emit = defineEmits<{ share: []; buy: [] }>()

/** Цвета карточек всех комнат, с фильтром undefined. */
const roomColors = computed<string[]>(() =>
  cfg.rooms
    .map((r) => r.cardColor)
    .filter((c): c is string => !!c),
)
</script>

<template>
  <div :style="{
    position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: Z.stickyBar,
  }">
    <div :style="{
      height: '32px',
      background: `linear-gradient(to bottom, transparent, ${T.bg})`,
    }" />
    <div :style="{
      background: T.bg, padding: '8px 16px 16px',
      maxWidth: '560px', margin: '0 auto',
    }">
      <div :style="{ display: 'flex', gap: '10px' }">
        <!-- Поделиться: pill, без обводки, чуть светлее фона -->
        <button :style="{
          flex: 1, padding: '12px 0',
          background: 'rgba(255,255,255,0.08)',
          border: 'none',
          borderRadius: '999px',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '8px', color: T.text, fontSize: '15px', fontWeight: 600,
          fontFamily: 'inherit',
        }" @click="emit('share')">
          <svg
            width="16" height="16" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round"
          >
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
          Поделиться
        </button>

        <!-- Мой Лес: pill с вращающимся ring -->
        <div :style="{ flex: 1 }">
          <GradientRing :colors="roomColors" :border-radius="999">
            <button :style="{
              width: '100%', padding: '12px 0',
              background: '#FFFFFF', border: 'none', borderRadius: '999px',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '8px', color: T.bg, fontSize: '15px', fontWeight: 600,
              fontFamily: 'inherit',
            }" @click="emit('buy')">
              <Icon name="trees" :color="T.bg" :size="16" />
              Мой Лес
            </button>
          </GradientRing>
        </div>
      </div>
    </div>
  </div>
</template>
