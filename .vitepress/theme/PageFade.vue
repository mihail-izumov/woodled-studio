<script setup>
/**
 * PageFade — плавный переход между страницами через затемнение.
 * При смене маршрута экран затемняется (fade-to-black) с ротор-спиннером
 * (та же механика, что и загрузчик иконки на лендинге), затем плавно
 * раскрывается новая страница.
 */
import { ref } from 'vue'
import { useRouter } from 'vitepress'

const active = ref(false)
const router = useRouter()

if (typeof window !== 'undefined') {
  const prevBefore = router.onBeforeRouteChange
  router.onBeforeRouteChange = (to) => {
    active.value = true
    return prevBefore ? prevBefore.call(router, to) : undefined
  }

  const prevAfter = router.onAfterRouteChanged
  router.onAfterRouteChanged = (to) => {
    // подержать чёрный поверх момента подмены контента, затем плавно убрать
    window.setTimeout(() => { active.value = false }, 260)
    return prevAfter ? prevAfter.call(router, to) : undefined
  }
}
</script>

<template>
  <div class="wd-fade" :class="{ 'is-on': active }" aria-hidden="true">
    <div class="wd-rotor">
      <span
        v-for="i in 10"
        :key="i"
        class="wd-petal"
        :style="{ '--rot': (((i - 1) / 10) * 360) + 'deg', animationDelay: ((i - 1) * 30) + 'ms' }"
      />
    </div>
  </div>
</template>

<style>
.wd-fade {
  position: fixed;
  inset: 0;
  z-index: 2147483647;
  background: #0A0908;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.36s ease;
}
.wd-fade.is-on {
  opacity: 1;
}

/* ротор виден только когда оверлей активен */
.wd-rotor {
  position: relative;
  width: 60px;
  height: 60px;
  font-size: 28px;
  opacity: 0;
  transition: opacity 0.2s ease 0.06s;
}
.wd-fade.is-on .wd-rotor {
  opacity: 1;
}

.wd-petal {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 2.6px;
  height: 15px;
  margin-top: -7.5px;
  margin-left: -1.3px;
  border-radius: 1.3px;
  background: #E0C882;
  transform-origin: 50% 50%;
  transform: rotate(var(--rot)) translateY(-0.55em);
  animation: wdRotorCycle 2400ms ease-in-out infinite;
  opacity: 0;
}

@keyframes wdRotorCycle {
  0%   { transform: rotate(var(--rot)) translateY(-1.0em) scale(0.3); opacity: 0; }
  5%   { transform: rotate(var(--rot)) translateY(-0.55em) scale(1);  opacity: 0.9; }
  80%  { transform: rotate(var(--rot)) translateY(-0.55em) scale(1);  opacity: 0.9; }
  90%  { transform: rotate(var(--rot)) translateY(-1.0em) scale(0.3); opacity: 0; }
  100% { transform: rotate(var(--rot)) translateY(-1.0em) scale(0.3); opacity: 0; }
}
</style>
