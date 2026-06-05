# WOODLED — Система прелоадеров

Source of truth: что и когда показывается «пока приложение грузится». Спека покрывает три отдельных preloader'а, их взаимодействие и матрицу контекстов (десктоп / PWA / iOS standalone / медленный интернет / reload).

> При правке любого preloader'а — обновляй этот файл. История правок в `WOODLED_бэклог.md` секции «Сделано».

## Зачем три отдельных preloader'а

Vue-бандл VitePress грузится постепенно: HTML → CSS → JS → mount. Если показать спиннер только из Vue (`Preloader.vue`), пользователь увидит **белый экран** или **VitePress-дефолт** на 1-3 секунды до mount. На iOS-standalone и медленном интернете — до 10-30 секунд. Это критично.

Поэтому:

1. **Inline boot-loader** (в `<head>`, `config.mts`) — стартует мгновенно при первой отрисовке HTML, до загрузки CSS и JS. Реализован чистым DOM API без зависимостей.
2. **Vue Preloader.vue** (`customizer/components/Preloader.vue`) — копия inline-loader'а на Vue, для случаев когда inline уже закрылся, а Vue нужна своя intro-анимация (cold path WelcomeScreen).
3. **PageFade.vue** (`theme/PageFade.vue`) — затемнение при SPA-переходах между маршрутами + начальный fade-in.

Каждый имеет свой scope и не конфликтует с другими **только при правильной синхронизации флагов** (`window.__wlBranded`, `preloaderDone`, `cleared`).

## Слой 1 — Inline boot-loader (`config.mts`)

### Что это
Самописный DOM-loader, инжектится в `<head>` через `config.mts → head: [['script', {}, '...']]`. Запускается из inline-script сразу при парсинге HTML — до того как браузер начал тянуть CSS и Vue-бандл.

### Когда показывается
ТОЛЬКО в одном из двух режимов:
- `?_reload=1` в URL → **simple-спиннер** (после ReloadButton)
- **standalone-PWA** (display-mode: `standalone` / `minimal-ui` / `fullscreen` / `window-controls-overlay` или `navigator.standalone === true`) → **branded preloader** (копия `Preloader.vue` на чистом DOM)

В обычном браузере (десктоп / лендинг / онбординг / `/app`) — **НЕ показывается**. Раньше показывался везде и зависал, если страница не вызывала `__wlBoot.clear()` (это было на /onboarding, лендинге и т.д.).

### Публичное API: `window.__wlBoot`
```js
window.__wlBoot = {
  show(text, hints)        // simple-спиннер (для reload)
  showBranded(text, hints) // branded анимация (для cold start PWA)
  setText(text)            // обновить подсказку без пересборки
  clear()                  // плавно закрыть и удалить из DOM
}
```

`hints` — массив `[{at: ms, text: '...'}]`: отложенные подсказки про VPN/интернет. Для **branded**: 6с / 18с. Для **simple-reload**: 4с / 10с.

### Race-condition guard: флаг `cleared`
Vue может вызвать `clear()` РАНЬШЕ, чем `whenBody`-поллер достроил DOM preloader'а (это бывает на быстром cold-start). Раньше `clear()` тихо выходил по `if (!rootEl) return`, а поллер через 16мс строил preloader, и закрывать его становилось некому.

Теперь:
- `clear()` ставит `cleared = true` независимо от состояния `rootEl`
- `show()` / `showBranded()` сбрасывают `cleared = false` (новый запрос)
- В `whenBody.doShow` стоит `if (cleared) return` — поздний build пропускается

### Branded — этапы анимации
1. **Stage 1 (rAF)** — `.v` / `.in` классы → fade-in логотипа, подзаголовка, ламелей в круг
2. **Stage 2 (2.5с)** — `.spin` на `.wl-pl-asm` → круг ламелей начинает вращаться
3. **clear() финал** — ждём минимум до 2с от старта (чтобы пользователь увидел анимацию), переключаем подзаголовок на «Настоящее дерево становится живым светом в доме», даём 1.2с прочитать, фейдаемся 0.5с

Если Vue mount случился супер-быстро (бандл в кэше Safari) и Stage 1/2 не успели стартовать — `clear()` форсирует их синхронно (`applyStage1` + `applySpin`), иначе пользователь увидит чёрный экран без анимации.

### Где закрывается
Глобально из `theme/PageFade.vue` в `onMounted`:
```js
if (window.__wlBoot && typeof window.__wlBoot.clear === 'function') {
  window.__wlBoot.clear()
}
```
`PageFade` — layout-slot из `theme/index.ts`, монтируется на **каждой** странице VitePress. Это даёт единую точку закрытия для лендинга, `/customizer`, `/onboarding`, `/app`, `/gallery-tagger` и любых будущих страниц.

Дополнительно `customizer/App.vue` тоже вызывает `clear()` в своём `onMounted` — это исторический дубль, не вреден (clear идемпотентен).

## Слой 2 — Vue Preloader.vue (`customizer/components/Preloader.vue`)

### Что это
Copy-paste branded-анимации из inline-loader'а, но на Vue. Используется ТОЛЬКО на cold path **WelcomeScreen** — когда пользователь впервые открывает `/customizer` (нет `welcomeSeen` в localStorage).

### Когда показывается
В `customizer/components/App.vue`:
```vue
<template v-else-if="!cfg.welcomeSeen.value">
  <Transition name="preloader-fade" mode="out-in">
    <Preloader v-if="!preloaderDone" key="preloader" @done="onPreloaderDone" />
    <WelcomeScreen v-else key="welcome" />
  </Transition>
</template>
```

### Защита от двойной анимации: `window.__wlBranded`
Inline-loader при `showBranded()` ставит `window.__wlBranded = true`. Vue `Preloader.vue` это считывает в `App.vue`:
```ts
const wlBrandedActive = typeof window !== 'undefined'
  && !!(window as unknown as { __wlBranded?: boolean }).__wlBranded
const preloaderDone = ref(wlBrandedActive)
```
То есть если inline-branded уже отыграл → `preloaderDone = true` → Vue `Preloader.vue` НЕ показывается, сразу `WelcomeScreen`. Иначе пользователь увидел бы две одинаковые intro-анимации подряд.

### Версия `v0.3`
Дублируется в `Preloader.vue` (`const VERSION`) и в `config.mts` (inline branded — строка `v0.3`). При бампе версии править оба места. См. бэклог.

## Слой 3 — PageFade.vue (`theme/PageFade.vue`)

### Что это
Полноэкранный чёрный overlay с маленьким ротором по центру. Не intro, а **transition между маршрутами**. Также — fade-in при первом рендере.

### Когда показывается
- **При первом рендере** любой страницы → активен с `MIN_BLACK_MS = 1200ms`, плавно гаснет
- **При SPA-переходе** (через `router.onBeforeRouteChange`) → активируется, потом гаснет минимум через 1200ms

### Что НЕ делает
- НЕ показывает текст / подсказки про VPN
- НЕ зависит от состояния сети
- НЕ синхронизирован с inline-loader'ом по времени

### Что делает дополнительно
Вызывает `window.__wlBoot?.clear()` в `onMounted` — это единственная глобальная точка закрытия inline-loader'а.

## Матрица контекстов

| Контекст | Inline boot-loader | Vue Preloader | PageFade |
|---|---|---|---|
| Десктоп, обычный браузер, `/` (лендинг) | ✗ не показывается | ✗ нет | ✓ 1.2с fade |
| Десктоп, обычный браузер, `/customizer` | ✗ | ✓ если первый раз (WelcomeScreen) | ✓ |
| Десктоп, обычный браузер, `/onboarding` | ✗ | ✗ | ✓ |
| Десктоп, обычный браузер, `/app` | ✗ | ✗ | ✓ |
| Айфон, Safari, любая страница | ✗ | как на десктопе | ✓ |
| Айфон, **standalone PWA**, `/customizer` (cold) | ✓ branded, подсказки 6с/18с | ✓ если первый раз И inline уже закрылся | ✓ |
| Айфон, standalone PWA, повторное открытие | ✓ branded (короткий) | ✗ (`welcomeSeen=true`) | ✓ |
| Android, обычный браузер | ✗ | как на десктопе | ✓ |
| Android, PWA с домашнего экрана | ✓ branded | ✓/✗ как iOS | ✓ |
| Reload через ReloadButton (любая платформа) | ✓ simple, подсказки 4с/10с | — | ✓ |

## Медленный интернет — что видит пользователь

Сценарий: standalone-PWA, холодный старт, 3G/нестабильный VPN.

| Время | Inline boot-loader | Что пользователь читает |
|---|---|---|
| 0s | branded анимация запускается | «Загружаем лес WOODLED…» |
| 6s | подсказка #1 | «Чуть дольше обычного. С VPN такое бывает — подождите.» |
| 18s | подсказка #2 | «Не загружается? Проверьте интернет и обновите страницу.» |
| Vue mount (когда успеет) | `PageFade.onMounted → __wlBoot.clear()` | финал branded → «Настоящее дерево становится живым светом в доме» 1.2с → fade-out |

При reload через ReloadButton (`?_reload=1`):

| Время | Что видит |
|---|---|
| 0s | simple-спиннер, «Перезагружаем…» |
| 4s | «Долго не отвечает. С VPN такое бывает — подождите.» |
| 10s | «Не получается? Закройте и откройте приложение, проверьте интернет.» |
| Vue mount | мгновенный fade-out (без branded-финала) |

## Грабли и подводные камни

- **Заведомо НЕ показываем inline boot-loader в обычном браузере.** Раньше показывали — на любой странице кроме `/customizer` он висел вечно, потому что `__wlBoot.clear()` зовётся только из Vue mount, а на `/onboarding`/`/app`/лендинге Vue mount происходит без этого вызова (был баг до перевода `clear()` в `PageFade.onMounted`). См. коммит про PageFade.
- **Standalone-детект должен покрывать все display-mode.** Не только `'standalone'`, но и `'minimal-ui'`, `'fullscreen'`, `'window-controls-overlay'`. iOS Safari дополнительно — `navigator.standalone`.
- **`__wlBoot.clear()` ИДЕМПОТЕНТЕН.** Можно вызывать многократно — нормально. Используется флаг `cleared` + проверка `if (!rootEl) return`.
- **Не вкладывай Vue Preloader в `v-else` без проверки `__wlBranded`.** Иначе на cold-PWA пользователь увидит две branded-анимации подряд (inline → Vue).
- **`white flash` фикс.** В `config.mts` head есть `<style>` с `!important` всем фонам (`html, body, #app, .Layout, .VPContent, .VPPage, .vp-doc { background: #13110E !important; margin: 0; }`). Без этого VitePress базовый CSS успевает накатить белый фон до загрузки нашей темы — пользователь видит вспышку. Не убирать.
- **Версия `v0.3` дублируется** в `Preloader.vue` и `config.mts`. Обновлять оба места.
- **PageFade `MIN_BLACK_MS = 1200`** — минимальное время показа transition. Менять только если хочется убрать «мерцание» при быстрых SPA-переходах; короче 800мс — анимация выглядит дёрганной.

## Где смотреть в коде

| Что | Файл |
|---|---|
| Inline boot-loader (DOM + API) | `.vitepress/config.mts` → `head: [['script', ...]]` блок |
| CSS для inline branded | `.vitepress/config.mts` → `head: [['style', ...]]` блок |
| Vue копия Preloader для WelcomeScreen | `.vitepress/customizer/components/Preloader.vue` |
| Подключение Vue Preloader | `.vitepress/customizer/components/App.vue` template v-else-if welcomeSeen |
| PageFade transition + global clear() | `.vitepress/theme/PageFade.vue` |
| Reload-сценарий (Boot.show из ReloadButton) | `.vitepress/customizer/components/ReloadButton.vue` |
| Standalone-детект (тот же что в PWAInstallBanner) | `.vitepress/config.mts` → inline-script (isStandalone) |
