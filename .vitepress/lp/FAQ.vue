<script setup lang="ts">
import { ref } from 'vue'
import { PAGE } from './tokens'

const FAQ_ITEMS = [
  {
    q: 'С чего начать?',
    a: 'Выберите один из трёх готовых домов — 45, 65 или 85 м² — и сразу увидите расставленный свет по комнатам. Можно начать с пустого дома и собрать всё с нуля. Передумали — «Начать заново» внизу страницы вернёт к выбору.',
  },
  {
    q: 'Я не дизайнер — справлюсь?',
    a: 'Да. В каждой комнате свет уже подобран — можно ничего не менять, можно менять что угодно: дерево, размер светильника, количество света. Конструктор сам считает яркость и подсказывает, где её мало, а где с запасом — в люменах разбираться не придётся.',
  },
  {
    q: 'Что такое настроения комнаты?',
    a: 'Это три состояния света: Тёплые сумерки, Утро в лесу и Ясный полдень. Вы выбираете не яркость в цифрах, а то, как должно ощущаться в комнате — а свет настроится под это сам.',
  },
  {
    q: 'Из чего сделаны светильники?',
    a: 'Это светильники с деревянными ламелями — дуб, орех или чёрный дуб. Лампочки обычные, цоколь E27 или E14. Свет проходит между ламелями и оставляет на стенах мягкие тени — будто солнце сквозь стволы деревьев.',
  },
  {
    q: 'Нужно ли регистрироваться?',
    a: 'Нет. План хранится прямо в ссылке — отправьте её себе в мессенджер или сохраните в закладки, и в следующий раз дом откроется таким же, каким вы его собрали. Имя и телефон — только если решите получить расчёт.',
  },
  {
    q: 'Как поделиться планом?',
    a: 'Нажмите «Поделиться» — получите ссылку на ваш дом. Её можно отправить близким, дизайнеру или себе в заметки. Кто откроет — увидит ровно тот же дом и сможет посоветовать или продолжить вместе с вами.',
  },
  {
    q: 'Что такое «Получить подарок»?',
    a: 'Это первый шаг к покупке. Вы отправляете план — наши эксперты связываются, смотрят, что получилось, и помогают оформить первый светильник со скидкой 3 000 ₽ как подарок. Дальше — в вашем темпе.',
  },
  {
    q: 'Можно ли менять план потом?',
    a: 'Да, всегда. Пока ссылка под рукой — план открывается и редактируется снова. Захотели дуб вместо ореха, добавить детскую, заменить торшер на бра — всё нормально, конструктор для этого и сделан.',
  },
  {
    q: 'Можно купить только один светильник?',
    a: 'Да, и обычно так и начинают. Берёте один — со скидкой 3 000 ₽ как подарок. Остальные ждут в плане: через месяц, полгода, перед переездом. Шаг за шагом, как вам удобно.',
  },
  {
    q: 'Что происходит после «Получить подарок»?',
    a: 'Наш эксперт свяжется с вами в течение дня — в мессенджере или по телефону, как удобнее. Посмотрит план, ответит на вопросы и поможет оформить первый светильник. Никаких автозвонков и рассылок — следующий шаг всегда за вами.',
  },
]

const openIndex = ref<number | null>(null)

function toggle(i: number) {
  openIndex.value = openIndex.value === i ? null : i
}
</script>

<template>
  <section :style="{ padding: '40px 24px 56px', maxWidth: '720px', margin: '0 auto' }">
    <h2
      :style="{
        fontSize: 'clamp(28px, 6vw, 40px)',
        fontWeight: 700,
        color: PAGE.text,
        textAlign: 'center',
        margin: '0 0 36px',
        letterSpacing: '-0.025em',
      }"
    >
      Вопросы и ответы
    </h2>

    <div :style="{ display: 'flex', flexDirection: 'column', gap: '10px' }">
      <div
        v-for="(item, i) in FAQ_ITEMS"
        :key="i"
        :style="{
          background: 'rgba(255, 250, 244, 0.55)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: `1px solid rgba(255, 255, 255, 0.5)`,
          borderRadius: '18px',
          boxShadow: '0 4px 14px rgba(184, 125, 82, 0.08)',
          overflow: 'hidden',
        }"
      >
        <button
          @click="toggle(i)"
          :style="{
            width: '100%',
            background: 'transparent',
            border: 'none',
            padding: '18px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            cursor: 'pointer',
            fontFamily: 'inherit',
            textAlign: 'left',
          }"
        >
          <span
            :style="{
              fontSize: '17px',
              fontWeight: 600,
              color: PAGE.text,
              lineHeight: 1.4,
            }"
          >
            {{ item.q }}
          </span>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            :stroke="PAGE.textSec"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            :style="{
              flexShrink: 0,
              transform: openIndex === i ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 200ms ease',
            }"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        <div
          :style="{
            maxHeight: openIndex === i ? '500px' : '0px',
            overflow: 'hidden',
            transition: 'max-height 300ms ease, padding 300ms ease',
            padding: openIndex === i ? '0 22px 18px' : '0 22px',
          }"
        >
          <p
            :style="{
              margin: 0,
              fontSize: '15px',
              fontWeight: 500,
              lineHeight: 1.55,
              color: PAGE.textSec,
            }"
          >
            {{ item.a }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
