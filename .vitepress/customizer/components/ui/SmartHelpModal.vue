<script setup lang="ts">
/**
 * SmartHelpModal.vue — Модалка «WOODLED Smart — как мы считаем свет».
 *
 * Структура:
 *   1. Rotor-hero + заголовок
 *   2. «Учитываем» — 3 карточки (норма, отдача корпуса, мебель)
 *   3. «Что значит шкала» — 5 статусов
 *   4. «Выбери за меня» + «Когда положиться»
 *   5. «Как пользоваться» — 4 шага
 *
 * Открывается из FxEditor и ForestMood (кнопка «WOODLED Smart»).
 */

import { T } from '../../theme/tokens'

defineEmits<{ close: [] }>()

const helpStatuses = [
  { label: 'Темно',     color: T.red,     desc: 'Меньше половины нормы. Добавьте света — пока темновато.' },
  { label: 'Полусвет',  color: T.yellow,  desc: 'Немного не дотягивает. Для вечера хорошо, для дел — мало.' },
  { label: 'Светло',    color: T.green,   desc: 'Хватает на всё. Менять ничего не нужно.' },
  { label: 'Ярко',      color: T.neutral, desc: 'Больше нормы. Для рабочих зон и тёмных стен — отлично.' },
  { label: 'Праздник',  color: T.textSec, desc: 'Света с запасом. Поставьте диммер — и управляйте настроением.' },
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
            <div :style="{ fontSize: '22px', fontWeight: 800, color: T.text, lineHeight: 1.2, marginBottom: '10px' }">Как мы считаем свет</div>
            <div :style="{ fontSize: '13px', color: T.textSec, lineHeight: 1.6, maxWidth: '340px', margin: '0 auto' }">Алгоритм сравнивает свет ваших светильников с нормой для комнаты и подсказывает, чего не хватает.</div>
          </div>

          <!-- Учитываем -->
          <div :style="{ marginBottom: '24px' }">
            <div :style="{ fontSize: '12px', fontWeight: 700, color: T.textSec, textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '10px' }">Что учитываем</div>
            <div :style="{ display: 'flex', flexDirection: 'column', gap: '8px' }">
              <div :style="{ padding: '14px', background: T.card, border: `1px solid ${T.border}`, borderRadius: '12px', display: 'flex', gap: '12px', alignItems: 'flex-start' }">
                <div :style="{ flexShrink: 0, width: '36px', height: '36px', borderRadius: '10px', background: T.neutral + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" :stroke="T.neutral" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M14 15H9v-5"/><path d="M16 3h5v5"/><path d="M21 3 9 15"/></svg></div>
                <div :style="{ flex: 1 }"><div :style="{ fontSize: '13px', fontWeight: 700, color: T.text, marginBottom: '3px' }">Норма для комнаты</div><div :style="{ fontSize: '12px', color: T.textSec, lineHeight: 1.5 }">Кухне нужно больше света, спальне — меньше. Норма зависит от площади, высоты потолка и отделки стен: светлые стены отражают свет, тёмные — забирают.</div></div>
              </div>
              <div :style="{ padding: '14px', background: T.card, border: `1px solid ${T.border}`, borderRadius: '12px', display: 'flex', gap: '12px', alignItems: 'flex-start' }">
                <div :style="{ flexShrink: 0, width: '36px', height: '36px', borderRadius: '10px', background: T.yellow + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" :stroke="T.yellow" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg></div>
                <div :style="{ flex: 1 }"><div :style="{ fontSize: '13px', fontWeight: 700, color: T.text, marginBottom: '3px' }">Отдача светильника</div><div :style="{ fontSize: '12px', color: T.textSec, lineHeight: 1.5 }">Люмены на коробке лампы — это не то, что дойдёт до комнаты. Свет Rotor идёт сквозь деревянные ламели и мягчеет. Бра отдаёт часть в стену, настольная светит на стол. Мы считаем то, что реально доходит.</div></div>
              </div>
              <div :style="{ padding: '14px', background: T.card, border: `1px solid ${T.border}`, borderRadius: '12px', display: 'flex', gap: '12px', alignItems: 'flex-start' }">
                <div :style="{ flexShrink: 0, width: '36px', height: '36px', borderRadius: '10px', background: T.green + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" :stroke="T.green" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3"/><path d="M3 16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V11a2 2 0 0 0-4 0z"/><path d="M5 18v2"/><path d="M19 18v2"/></svg></div>
                <div :style="{ flex: 1 }"><div :style="{ fontSize: '13px', fontWeight: 700, color: T.text, marginBottom: '3px' }">Мебель и тени</div><div :style="{ fontSize: '12px', color: T.textSec, lineHeight: 1.5 }">Диван, шкаф, кровать загораживают часть света. Чем больше мебели — тем темнее углы и тем больше нужно источников.</div></div>
              </div>
            </div>
          </div>

          <!-- Что значит шкала -->
          <div :style="{ marginBottom: '24px' }">
            <div :style="{ fontSize: '12px', fontWeight: 700, color: T.textSec, textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '10px' }">Что означают статусы</div>
            <div :style="{ display: 'flex', flexDirection: 'column', gap: '6px' }">
              <div v-for="row in helpStatuses" :key="row.label" :style="{ padding: '10px 12px', background: T.card, border: `1px solid ${T.border}`, borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px' }">
                <div :style="{ padding: '4px 10px', borderRadius: '6px', background: row.color + '22', color: row.color, fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0, minWidth: '82px', textAlign: 'center' }">{{ row.label }}</div>
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
              <div :style="{ fontSize: '12px', color: T.textSec, lineHeight: 1.6 }">Если подходят несколько размеров — нажмите «Выбери за меня». Алгоритм подберёт самый сбалансированный: света ровно столько, сколько нужно, без переплаты за лишний размер.</div>
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
              <div :style="{ fontSize: '12px', color: T.textSec, lineHeight: 1.6 }">Обычная мебель, потолок до 2.7 м, светлые или средние стены — рекомендация попадёт точно.</div>
            </div>
            <div :style="{ padding: '14px', background: T.cardAlt, border: `1px solid ${T.border}`, borderRadius: '12px' }">
              <div :style="{ fontSize: '13px', fontWeight: 700, color: T.text, marginBottom: '10px' }">Когда лучше выбрать самим:</div>
              <div :style="{ display: 'flex', flexDirection: 'column', gap: '8px' }">
                <div :style="{ display: 'flex', gap: '8px', alignItems: 'flex-start' }"><span :style="{ color: T.yellow, fontSize: '14px', flexShrink: 0, marginTop: '1px' }">→</span><div :style="{ fontSize: '12px', color: T.textSec, lineHeight: 1.5 }"><b :style="{ color: T.text }">Высокий потолок (> 3 м)</b> — берите на размер крупнее, свет расходится на больший объём</div></div>
                <div :style="{ display: 'flex', gap: '8px', alignItems: 'flex-start' }"><span :style="{ color: T.yellow, fontSize: '14px', flexShrink: 0, marginTop: '1px' }">→</span><div :style="{ fontSize: '12px', color: T.textSec, lineHeight: 1.5 }"><b :style="{ color: T.text }">Тёмные стены, мало окон</b> — тоже крупнее, тёмные поверхности забирают свет</div></div>
                <div :style="{ display: 'flex', gap: '8px', alignItems: 'flex-start' }"><span :style="{ color: T.yellow, fontSize: '14px', flexShrink: 0, marginTop: '1px' }">→</span><div :style="{ fontSize: '12px', color: T.textSec, lineHeight: 1.5 }"><b :style="{ color: T.text }">Готовка, чтение, работа</b> — выбирайте под конкретную зону, а не под всю комнату</div></div>
                <div :style="{ display: 'flex', gap: '8px', alignItems: 'flex-start' }"><span :style="{ color: T.yellow, fontSize: '14px', flexShrink: 0, marginTop: '1px' }">→</span><div :style="{ fontSize: '12px', color: T.textSec, lineHeight: 1.5 }"><b :style="{ color: T.text }">Хочется минимализм</b> — возьмите компактнее и добавьте диммер</div></div>
              </div>
            </div>
          </div>

          <!-- Как пользоваться -->
          <div :style="{ marginBottom: '24px' }">
            <div :style="{ fontSize: '12px', fontWeight: 700, color: T.textSec, textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '10px' }">Как пользоваться</div>
            <div :style="{ display: 'flex', flexDirection: 'column', gap: '6px' }">
              <div :style="{ padding: '12px 14px', background: T.card, border: `1px solid ${T.border}`, borderRadius: '10px', display: 'flex', gap: '10px', alignItems: 'flex-start' }">
                <span :style="{ width: '22px', height: '22px', borderRadius: '6px', background: T.neutral + '22', color: T.neutral, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, flexShrink: 0 }">1</span>
                <div :style="{ fontSize: '12px', color: T.textSec, lineHeight: 1.5 }"><b :style="{ color: T.text }">Сравните размеры</b> — у каждого свой статус яркости для вашей комнаты.</div>
              </div>
              <div :style="{ padding: '12px 14px', background: T.card, border: `1px solid ${T.border}`, borderRadius: '10px', display: 'flex', gap: '10px', alignItems: 'flex-start' }">
                <span :style="{ width: '22px', height: '22px', borderRadius: '6px', background: T.neutral + '22', color: T.neutral, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, flexShrink: 0 }">2</span>
                <div :style="{ fontSize: '12px', color: T.textSec, lineHeight: 1.5 }"><b :style="{ color: T.text }">Нажмите «Выбери за меня»</b> — если сомневаетесь. Алгоритм подставит лучший вариант.</div>
              </div>
              <div :style="{ padding: '12px 14px', background: T.card, border: `1px solid ${T.border}`, borderRadius: '10px', display: 'flex', gap: '10px', alignItems: 'flex-start' }">
                <span :style="{ width: '22px', height: '22px', borderRadius: '6px', background: T.neutral + '22', color: T.neutral, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, flexShrink: 0 }">3</span>
                <div :style="{ fontSize: '12px', color: T.textSec, lineHeight: 1.5 }"><b :style="{ color: T.text }">Всё пересчитывается</b> — добавили или убрали светильник, статусы обновятся сами.</div>
              </div>
              <div :style="{ padding: '12px 14px', background: T.card, border: `1px solid ${T.border}`, borderRadius: '10px', display: 'flex', gap: '10px', alignItems: 'flex-start' }">
                <span :style="{ width: '22px', height: '22px', borderRadius: '6px', background: T.neutral + '22', color: T.neutral, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, flexShrink: 0 }">4</span>
                <div :style="{ fontSize: '12px', color: T.textSec, lineHeight: 1.5 }"><b :style="{ color: T.text }">Можно вернуться</b> — параметры меняются в любой момент, когда светильников станет больше.</div>
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
            Понятно
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
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
