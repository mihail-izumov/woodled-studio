<script setup lang="ts">
/**
 * SmartHelpModal.vue — Единая модалка «Как подбирается размер светильника».
 *
 * batch8 #1: Общий компонент, используется в FxEditor.vue и RoomDetail.vue.
 * batch8-fix: Восстановлен ПОЛНЫЙ оригинальный контент из FxEditor (pre-batch8).
 *
 * Содержит 5 секций:
 *   1. Rotor-hero + заголовок WOODLED SMART
 *   2. «Учитываем три фактора» — площадь, светильники, мебель
 *   3. «Что означают статусы» — 5 строк яркости
 *   4. «Кнопка Выбери за меня» + «Когда положиться на алгоритм»
 *   5. «Как пользоваться» — 4 пронумерованных шага
 *
 * Кнопка «Супер!» закрывает модалку через emit close.
 */

import { T } from '../../theme/tokens'

defineEmits<{ close: [] }>()

const helpStatuses = [
  { label: 'Не хватает',  color: T.red,     desc: 'Меньше половины нормы. Будет темно даже днём.' },
  { label: 'Приглушённо', color: T.yellow,  desc: '0.5–0.8× от нормы. Мягкий свет под плед, чашку чая и неспешный вечер.' },
  { label: 'Комфортно',   color: T.green,   desc: '0.8–2× — целевой диапазон. Достаточно для всех задач.' },
  { label: 'С запасом',   color: T.neutral, desc: '2–4×. Для рабочих зон или комнат с тёмными стенами.' },
  { label: 'Избыточно',   color: T.textDim, desc: 'Больше 4× нормы. Поставьте диммер или возьмите меньше.' },
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
        <div :style="{ padding: '20px 20px 16px' }">

          <!-- Hero -->
          <div :style="{ display: 'flex', justifyContent: 'center', padding: '20px 0 14px' }">
            <div class="rotor-hero" aria-hidden="true">
              <div v-for="i in 16" :key="i" class="rotor-hero-l" :style="{ '--rot': ((i - 1) / 16 * 360) + 'deg', animationDelay: ((i - 1) * 40) + 'ms' }" />
            </div>
          </div>

          <div :style="{ textAlign: 'center', marginBottom: '24px' }">
            <div :style="{ fontSize: '10px', fontWeight: 700, color: T.neutral, letterSpacing: '1.5px', marginBottom: '8px' }">WOODLED SMART</div>
            <div :style="{ fontSize: '22px', fontWeight: 800, color: T.text, lineHeight: 1.2, marginBottom: '10px' }">Как подбирается<br/>размер светильника</div>
            <div :style="{ fontSize: '13px', color: T.textSec, lineHeight: 1.6, maxWidth: '340px', margin: '0 auto' }">Алгоритм WOODLED сравнивает яркость всех светильников в комнате с нормой и подсказывает лучшее сочетание.</div>
          </div>

          <!-- Три фактора -->
          <div :style="{ marginBottom: '24px' }">
            <div :style="{ fontSize: '12px', fontWeight: 700, color: T.textSec, textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '10px' }">Учитываем три фактора</div>
            <div :style="{ display: 'flex', flexDirection: 'column', gap: '8px' }">
              <div :style="{ padding: '14px', background: T.card, border: `1px solid ${T.border}`, borderRadius: '12px', display: 'flex', gap: '12px', alignItems: 'flex-start' }">
                <div :style="{ flexShrink: 0, width: '36px', height: '36px', borderRadius: '10px', background: T.neutral + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" :stroke="T.neutral" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M14 15H9v-5"/><path d="M16 3h5v5"/><path d="M21 3 9 15"/></svg></div>
                <div :style="{ flex: 1 }"><div :style="{ fontSize: '13px', fontWeight: 700, color: T.text, marginBottom: '3px' }">Площадь и норма</div><div :style="{ fontSize: '12px', color: T.textSec, lineHeight: 1.5 }">Базовая норма — 100 лм/м². Для спальни мягче, для кухни ярче. Каждая модель Rotor рассчитана на свой диапазон м².</div></div>
              </div>
              <div :style="{ padding: '14px', background: T.card, border: `1px solid ${T.border}`, borderRadius: '12px', display: 'flex', gap: '12px', alignItems: 'flex-start' }">
                <div :style="{ flexShrink: 0, width: '36px', height: '36px', borderRadius: '10px', background: T.yellow + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" :stroke="T.yellow" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m20.9 18.55-8-15.98a1 1 0 0 0-1.8 0l-8 15.98"/><ellipse cx="12" cy="19" rx="9" ry="3"/></svg></div>
                <div :style="{ flex: 1 }"><div :style="{ fontSize: '13px', fontWeight: 700, color: T.text, marginBottom: '3px' }">Все светильники в комнате</div><div :style="{ fontSize: '12px', color: T.textSec, lineHeight: 1.5 }">Спот, бра, торшер — суммируем общий свет и на этом фоне считаем, сколько добавит выбранный Rotor.</div></div>
              </div>
              <div :style="{ padding: '14px', background: T.card, border: `1px solid ${T.border}`, borderRadius: '12px', display: 'flex', gap: '12px', alignItems: 'flex-start' }">
                <div :style="{ flexShrink: 0, width: '36px', height: '36px', borderRadius: '10px', background: T.green + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" :stroke="T.green" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3"/><path d="M3 16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V11a2 2 0 0 0-4 0z"/><path d="M5 18v2"/><path d="M19 18v2"/></svg></div>
                <div :style="{ flex: 1 }"><div :style="{ fontSize: '13px', fontWeight: 700, color: T.text, marginBottom: '3px' }">Мебель и зоны</div><div :style="{ fontSize: '12px', color: T.textSec, lineHeight: 1.5 }">Стол, диван, кухонный гарнитур поднимают локальную норму — рабочей зоне нужно больше света.</div></div>
              </div>
            </div>
          </div>

          <!-- Что означают статусы -->
          <div :style="{ marginBottom: '24px' }">
            <div :style="{ fontSize: '12px', fontWeight: 700, color: T.textSec, textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '10px' }">Что означают статусы</div>
            <div :style="{ display: 'flex', flexDirection: 'column', gap: '6px' }">
              <div v-for="row in helpStatuses" :key="row.label" :style="{ padding: '10px 12px', background: T.card, border: `1px solid ${T.border}`, borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px' }">
                <div :style="{ padding: '4px 10px', borderRadius: '6px', background: row.color + '22', color: row.color, fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0, minWidth: '92px', textAlign: 'center' }">{{ row.label }}</div>
                <div :style="{ fontSize: '12px', color: T.textSec, lineHeight: 1.4, flex: 1 }">{{ row.desc }}</div>
              </div>
            </div>
          </div>

          <!-- Кнопка «Выбери за меня» -->
          <div :style="{ marginBottom: '24px' }">
            <div :style="{ fontSize: '12px', fontWeight: 700, color: T.textSec, textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '10px' }">Кнопка «Выбери за меня»</div>
            <div :style="{ padding: '14px', background: T.green + '10', border: `1px solid ${T.green}33`, borderRadius: '12px' }">
              <div :style="{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }">
                <span :style="{ width: '22px', height: '22px', borderRadius: '50%', background: T.green, color: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700 }">✓</span>
                <span :style="{ fontSize: '13px', fontWeight: 700, color: T.green }">Доверьтесь зелёной галочке</span>
              </div>
              <div :style="{ fontSize: '12px', color: T.textSec, lineHeight: 1.6 }">Если несколько размеров подходят — нажмите «Выбери за меня». Алгоритм выберет самый сбалансированный: ровно столько света, сколько нужно, без переплаты за избыточный размер.</div>
            </div>
          </div>

          <!-- Когда положиться на алгоритм -->
          <div :style="{ marginBottom: '24px' }">
            <div :style="{ fontSize: '12px', fontWeight: 700, color: T.textSec, textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '10px' }">Когда положиться на алгоритм</div>
            <div :style="{ padding: '14px', background: T.green + '10', border: `1px solid ${T.green}33`, borderRadius: '12px', marginBottom: '8px' }">
              <div :style="{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }">
                <span :style="{ width: '22px', height: '22px', borderRadius: '50%', background: T.green, color: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700 }">✓</span>
                <span :style="{ fontSize: '13px', fontWeight: 700, color: T.green }">Обычная комната</span>
              </div>
              <div :style="{ fontSize: '12px', color: T.textSec, lineHeight: 1.6 }">Типичная мебель, потолок до 2.7 м, светлые стены — рекомендация попадёт в комфортный диапазон.</div>
            </div>
            <div :style="{ padding: '14px', background: T.cardAlt, border: `1px solid ${T.border}`, borderRadius: '12px' }">
              <div :style="{ fontSize: '13px', fontWeight: 700, color: T.text, marginBottom: '10px' }">Играйте — выбирайте и пробуйте:</div>
              <div :style="{ display: 'flex', flexDirection: 'column', gap: '8px' }">
                <div :style="{ display: 'flex', gap: '8px', alignItems: 'flex-start' }"><span :style="{ color: T.yellow, fontSize: '14px', flexShrink: 0, marginTop: '1px' }">→</span><div :style="{ fontSize: '12px', color: T.textSec, lineHeight: 1.5 }"><b :style="{ color: T.text }">Высокий потолок (>3 м)</b> — выберите на размер крупнее, свет расходится на больший объём</div></div>
                <div :style="{ display: 'flex', gap: '8px', alignItems: 'flex-start' }"><span :style="{ color: T.yellow, fontSize: '14px', flexShrink: 0, marginTop: '1px' }">→</span><div :style="{ fontSize: '12px', color: T.textSec, lineHeight: 1.5 }"><b :style="{ color: T.text }">Тёмные стены, мало окон</b> — тоже крупнее, тёмные поверхности поглощают свет</div></div>
                <div :style="{ display: 'flex', gap: '8px', alignItems: 'flex-start' }"><span :style="{ color: T.yellow, fontSize: '14px', flexShrink: 0, marginTop: '1px' }">→</span><div :style="{ fontSize: '12px', color: T.textSec, lineHeight: 1.5 }"><b :style="{ color: T.text }">Конкретная задача</b> (чтение, кино, готовка) — выбирайте под зону, а не под всю комнату</div></div>
                <div :style="{ display: 'flex', gap: '8px', alignItems: 'flex-start' }"><span :style="{ color: T.yellow, fontSize: '14px', flexShrink: 0, marginTop: '1px' }">→</span><div :style="{ fontSize: '12px', color: T.textSec, lineHeight: 1.5 }"><b :style="{ color: T.text }">Хотите минимализм</b> — возьмите компактнее, добавьте диммер для управления яркостью</div></div>
              </div>
            </div>
          </div>

          <!-- Как пользоваться -->
          <div :style="{ marginBottom: '24px' }">
            <div :style="{ fontSize: '12px', fontWeight: 700, color: T.textSec, textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '10px' }">Как пользоваться</div>
            <div :style="{ display: 'flex', flexDirection: 'column', gap: '6px' }">
              <div :style="{ padding: '12px 14px', background: T.card, border: `1px solid ${T.border}`, borderRadius: '10px', display: 'flex', gap: '10px', alignItems: 'flex-start' }">
                <span :style="{ width: '22px', height: '22px', borderRadius: '6px', background: T.neutral + '22', color: T.neutral, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, flexShrink: 0 }">1</span>
                <div :style="{ fontSize: '12px', color: T.textSec, lineHeight: 1.5 }"><b :style="{ color: T.text }">Сравните карточки</b> — каждый статус показывает, как изменится освещение именно в этой комнате.</div>
              </div>
              <div :style="{ padding: '12px 14px', background: T.card, border: `1px solid ${T.border}`, borderRadius: '10px', display: 'flex', gap: '10px', alignItems: 'flex-start' }">
                <span :style="{ width: '22px', height: '22px', borderRadius: '6px', background: T.neutral + '22', color: T.neutral, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, flexShrink: 0 }">2</span>
                <div :style="{ fontSize: '12px', color: T.textSec, lineHeight: 1.5 }"><b :style="{ color: T.text }">Нажмите «Выбери за меня»</b> — если не уверены. Алгоритм подставит лучший вариант.</div>
              </div>
              <div :style="{ padding: '12px 14px', background: T.card, border: `1px solid ${T.border}`, borderRadius: '10px', display: 'flex', gap: '10px', alignItems: 'flex-start' }">
                <span :style="{ width: '22px', height: '22px', borderRadius: '6px', background: T.neutral + '22', color: T.neutral, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, flexShrink: 0 }">3</span>
                <div :style="{ fontSize: '12px', color: T.textSec, lineHeight: 1.5 }"><b :style="{ color: T.text }">Подбор обновляется</b> — при любом изменении в комнате (добавление/удаление светильников) статусы пересчитываются.</div>
              </div>
              <div :style="{ padding: '12px 14px', background: T.card, border: `1px solid ${T.border}`, borderRadius: '10px', display: 'flex', gap: '10px', alignItems: 'flex-start' }">
                <span :style="{ width: '22px', height: '22px', borderRadius: '6px', background: T.neutral + '22', color: T.neutral, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, flexShrink: 0 }">4</span>
                <div :style="{ fontSize: '12px', color: T.textSec, lineHeight: 1.5 }"><b :style="{ color: T.text }">Можно менять позже</b> — чек-лист помогает обновлять параметры когда светильников становится больше.</div>
              </div>
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
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 700,
              fontFamily: 'inherit',
              marginBottom: '12px',
            }"
            @click="$emit('close')"
          >
            Супер!
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* FIX-2026-05-09-batch8fix — маркер верификации деплоя */
.rotor-hero {
  width: 100px;
  height: 100px;
  position: relative;
  animation: rotorHeroSpin 18s linear infinite;
}
.rotor-hero-l {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 3px;
  height: 22px;
  margin: -11px 0 0 -1.5px;
  border-radius: 2px;
  background: linear-gradient(to bottom, #d4b87a, #b4915a, #8a6e3e);
  transform-origin: 50% 50%;
  animation: rotorHeroAssemble 3500ms ease-in-out infinite;
  opacity: 0;
}
@keyframes rotorHeroSpin { to { transform: rotate(360deg); } }
@keyframes rotorHeroAssemble {
  0%   { transform: rotate(var(--rot)) translateY(-70px) scale(0.4); opacity: 0; }
  20%  { transform: rotate(var(--rot)) translateY(-32px) scale(1);   opacity: 0.9; }
  70%  { transform: rotate(var(--rot)) translateY(-32px) scale(1);   opacity: 0.9; }
  85%  { transform: rotate(var(--rot)) translateY(-70px) scale(0.4); opacity: 0; }
  100% { transform: rotate(var(--rot)) translateY(-70px) scale(0.4); opacity: 0; }
}
</style>
