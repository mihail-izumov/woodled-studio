<script setup lang="ts">
/**
 * SmartHelpModal.vue — Модалка «WOODLED Smart — как мы считаем свет».
 *
 * Переписана под новую модель (метод коэф. использования, FX_FACTORS,
 * отделка стен, свес подвеса) и новые статусы яркости.
 *
 * Структура (по ТЗ):
 *   1. Rotor-hero + заголовок
 *   2. «Сколько нужно» — норма (вместо «100 лм/м²»)
 *   3. «Сколько доходит» — отдача корпуса (НОВЫЙ блок)
 *   4. «Что значит шкала» — 5 статусов (новые названия)
 *   5. «Имя сцены — про другое» — снимаем путаницу двух индикаторов
 *   6. Размерный блок (кнопка «Выбери за меня» + советы)
 *
 * Открывается из FxEditor и ForestMood (кнопка «WOODLED Smart»).
 */

import { T } from '../../theme/tokens'

defineEmits<{ close: [] }>()

const helpStatuses = [
  { label: 'Темно',     color: T.red,     desc: 'Меньше половины нормы. Будет темновато даже днём. Стоит добавить света.' },
  { label: 'Полусвет',  color: T.yellow,  desc: 'Чуть меньше нормы. Мягкий свет, но для дел может не хватить.' },
  { label: 'Светло',    color: T.green,   desc: 'Целевой диапазон. Хватает на все задачи, менять ничего не нужно.' },
  { label: 'Ярко',      color: T.neutral, desc: 'Света больше нормы. Для рабочих зон или тёмных стен — то что надо.' },
  { label: 'Праздник',  color: T.textSec, desc: 'Света с большим запасом. Можно приглушить диммером или просто наслаждаться.' },
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
            <div :style="{ fontSize: '13px', color: T.textSec, lineHeight: 1.6, maxWidth: '340px', margin: '0 auto' }">Сравниваем, сколько света дают ваши светильники, со сколько нужно комнате — и переводим в понятную картину.</div>
          </div>

          <!-- 1. Сколько нужно (норма) -->
          <div :style="{ marginBottom: '24px' }">
            <div :style="{ fontSize: '12px', fontWeight: 700, color: T.textSec, textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '10px' }">Сколько нужно</div>
            <div :style="{ padding: '14px', background: T.card, border: `1px solid ${T.border}`, borderRadius: '12px', display: 'flex', gap: '12px', alignItems: 'flex-start' }">
              <div :style="{ flexShrink: 0, width: '36px', height: '36px', borderRadius: '10px', background: T.neutral + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" :stroke="T.neutral" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M14 15H9v-5"/><path d="M16 3h5v5"/><path d="M21 3 9 15"/></svg></div>
              <div :style="{ flex: 1 }">
                <div :style="{ fontSize: '13px', fontWeight: 700, color: T.text, marginBottom: '3px' }">Норма для комнаты</div>
                <div :style="{ fontSize: '12px', color: T.textSec, lineHeight: 1.5 }">Норма — сколько света нужно комнате под её задачи. Складывается из: тип комнаты (кухне ярче, спальне мягче), площадь, высота потолка, отделка стен (светлые отражают — нужно меньше, тёмные забирают — больше) и мебель (диван, шкаф забирают часть).</div>
              </div>
            </div>
          </div>

          <!-- 2. Сколько доходит (отдача) -->
          <div :style="{ marginBottom: '24px' }">
            <div :style="{ fontSize: '12px', fontWeight: 700, color: T.textSec, textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '10px' }">Сколько доходит</div>
            <div :style="{ padding: '14px', background: T.card, border: `1px solid ${T.border}`, borderRadius: '12px', display: 'flex', gap: '12px', alignItems: 'flex-start' }">
              <div :style="{ flexShrink: 0, width: '36px', height: '36px', borderRadius: '10px', background: T.yellow + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" :stroke="T.yellow" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg></div>
              <div :style="{ flex: 1 }">
                <div :style="{ fontSize: '13px', fontWeight: 700, color: T.text, marginBottom: '3px' }">Реальная отдача</div>
                <div :style="{ fontSize: '12px', color: T.textSec, lineHeight: 1.5 }">Люмены на коробке лампы — не то, что доходит до комнаты. Свет Rotor идёт сквозь деревянные ламели: мягчает и часть гасит. Бра отдают часть в стену, настольная светит локально. Считаем реальную отдачу корпуса, а не паспорт лампы.</div>
              </div>
            </div>
          </div>

          <!-- 3. Что значит шкала -->
          <div :style="{ marginBottom: '24px' }">
            <div :style="{ fontSize: '12px', fontWeight: 700, color: T.textSec, textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '10px' }">Что значит шкала</div>
            <div :style="{ display: 'flex', flexDirection: 'column', gap: '6px' }">
              <div v-for="row in helpStatuses" :key="row.label" :style="{ padding: '10px 12px', background: T.card, border: `1px solid ${T.border}`, borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px' }">
                <div :style="{ padding: '4px 10px', borderRadius: '6px', background: row.color + '22', color: row.color, fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0, minWidth: '82px', textAlign: 'center' }">{{ row.label }}</div>
                <div :style="{ fontSize: '12px', color: T.textSec, lineHeight: 1.4, flex: 1 }">{{ row.desc }}</div>
              </div>
            </div>
          </div>

          <!-- 4. Имя сцены — про другое -->
          <div :style="{ marginBottom: '24px' }">
            <div :style="{ fontSize: '12px', fontWeight: 700, color: T.textSec, textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '10px' }">Имя сцены — про другое</div>
            <div :style="{ padding: '14px', background: T.card, border: `1px solid ${T.border}`, borderRadius: '12px', display: 'flex', gap: '12px', alignItems: 'flex-start' }">
              <div :style="{ flexShrink: 0, width: '36px', height: '36px', borderRadius: '10px', background: T.green + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" :stroke="T.green" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 10c.7-.7 1.69 0 2.5 0a2.5 2.5 0 1 0 0-5 .5.5 0 0 1-.5-.5 2.5 2.5 0 1 0-5 0c0 .81.7 1.8 0 2.5l-7 7c-.7.7-1.69 0-2.5 0a2.5 2.5 0 0 0 0 5c.28 0 .5.22.5.5a2.5 2.5 0 1 0 5 0c0-.81-.7-1.8 0-2.5Z"/></svg></div>
              <div :style="{ flex: 1 }">
                <div :style="{ fontSize: '13px', fontWeight: 700, color: T.text, marginBottom: '3px' }">Два разных вопроса</div>
                <div :style="{ fontSize: '12px', color: T.textSec, lineHeight: 1.5 }">Шкала говорит, сколько света. А имя сцены — роща, чаща, поляна — говорит, откуда он: сверху, ровно или снизу. Это характер света, не его количество. Два разных элемента, а не повтор.</div>
              </div>
            </div>
          </div>

          <!-- 5. Кнопка «Выбери за меня» -->
          <div :style="{ marginBottom: '24px' }">
            <div :style="{ fontSize: '12px', fontWeight: 700, color: T.textSec, textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '10px' }">Кнопка «Выбери за меня»</div>
            <div :style="{ padding: '14px', background: T.green + '10', border: `1px solid ${T.green}33`, borderRadius: '12px' }">
              <div :style="{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }">
                <span :style="{ width: '22px', height: '22px', borderRadius: '50%', background: T.green, color: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700 }">✓</span>
                <span :style="{ fontSize: '13px', fontWeight: 700, color: T.green }">Доверьтесь алгоритму</span>
              </div>
              <div :style="{ fontSize: '12px', color: T.textSec, lineHeight: 1.6 }">Если несколько размеров подходят — нажмите «Выбери за меня». Алгоритм выберет самый сбалансированный: ровно столько света, сколько нужно, без переплаты за избыточный размер.</div>
            </div>
          </div>

          <!-- 6. Советы -->
          <div :style="{ marginBottom: '24px' }">
            <div :style="{ padding: '14px', background: T.cardAlt, border: `1px solid ${T.border}`, borderRadius: '12px' }">
              <div :style="{ fontSize: '13px', fontWeight: 700, color: T.text, marginBottom: '10px' }">Когда алгоритм не угадает — выбирайте сами:</div>
              <div :style="{ display: 'flex', flexDirection: 'column', gap: '8px' }">
                <div :style="{ display: 'flex', gap: '8px', alignItems: 'flex-start' }"><span :style="{ color: T.yellow, fontSize: '14px', flexShrink: 0, marginTop: '1px' }">→</span><div :style="{ fontSize: '12px', color: T.textSec, lineHeight: 1.5 }"><b :style="{ color: T.text }">Высокий потолок (>3 м)</b> — на размер крупнее, свет расходится на больший объём</div></div>
                <div :style="{ display: 'flex', gap: '8px', alignItems: 'flex-start' }"><span :style="{ color: T.yellow, fontSize: '14px', flexShrink: 0, marginTop: '1px' }">→</span><div :style="{ fontSize: '12px', color: T.textSec, lineHeight: 1.5 }"><b :style="{ color: T.text }">Тёмные стены</b> — тоже крупнее, тёмные поверхности забирают свет</div></div>
                <div :style="{ display: 'flex', gap: '8px', alignItems: 'flex-start' }"><span :style="{ color: T.yellow, fontSize: '14px', flexShrink: 0, marginTop: '1px' }">→</span><div :style="{ fontSize: '12px', color: T.textSec, lineHeight: 1.5 }"><b :style="{ color: T.text }">Конкретная задача</b> (чтение, готовка) — выбирайте под зону, а не под всю комнату</div></div>
                <div :style="{ display: 'flex', gap: '8px', alignItems: 'flex-start' }"><span :style="{ color: T.yellow, fontSize: '14px', flexShrink: 0, marginTop: '1px' }">→</span><div :style="{ fontSize: '12px', color: T.textSec, lineHeight: 1.5 }"><b :style="{ color: T.text }">Хотите минимализм</b> — возьмите компактнее, добавьте диммер</div></div>
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
