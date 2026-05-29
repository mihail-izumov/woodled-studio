<script setup>
/**
 * PageFade — плавный переход между страницами через затемнение.
 * При смене маршрута экран затемняется (fade-to-black) с ротор-спиннером
 * (та же механика, что и загрузчик иконки на лендинге), затем плавно
 * раскрывается новая страница.
 */
import { ref } from 'vue'
import { useRouter } from 'vitepress'

// Гарантированное время показа чёрного оверлея (мс). Даже если новая
// страница загрузилась мгновенно — затемнение держится не меньше этого,
// чтобы переход было видно. Если страница грузится дольше — дождётся её.
const MIN_BLACK_MS = 1200

const active = ref(false)
const router = useRouter()

if (typeof window !== 'undefined') {
  let shownAt = 0

  const prevBefore = router.onBeforeRouteChange
  router.onBeforeRouteChange = (to) => {
    active.value = true
    shownAt = Date.now()
    return prevBefore ? prevBefore.call(router, to) : undefined
  }

  const prevAfter = router.onAfterRouteChanged
  router.onAfterRouteChanged = (to) => {
    // держим чёрный минимум MIN_BLACK_MS от момента появления оверлея
    const wait = Math.max(MIN_BLACK_MS - (Date.now() - shownAt), 0)
    window.setTimeout(() => { active.value = false }, wait)
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
  width: 120px;
  height: 120px;
  font-size: 56px;
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
  width: 5.2px;
  height: 30px;
  margin-top: -15px;
  margin-left: -2.6px;
  border-radius: 2.6px;
  background: #E0C882;
  transform-origin: 50% 50%;
  transform: rotate(var(--rot)) translateY(-0.55em);
  animation: wdRotorCycle 1200ms ease-in-out infinite;
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
