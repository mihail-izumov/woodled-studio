# Переключение на свой домен (корень)

Сейчас сайт развёрнут на GitHub Pages по **подпути** `/woodled-studio/`, поэтому:
- в `config.mts` стоит `base: '/woodled-studio/'`
- все runtime-пути к ассетам и навигации имеют префикс `/woodled-studio/`
- og-теги указывают на `https://mihail-izumov.github.io/woodled-studio/...`

При подключении своего домена **в корне** (например `https://woodled.ru`) этот префикс надо убрать, иначе пути сломаются. Ниже — точная процедура (она симметрична тому, что делалось при переезде на подпуть).

## Процедура

Выполнять из корня репозитория `woodled-studio`. Подставь свой домен вместо `НОВЫЙ-ДОМЕН` (без слеша на конце, например `https://woodled.ru`).

**1. Подключить домен в GitHub**
Settings → Pages → Custom domain → ввести домен. Дополнительно (надёжнее) создать файл `public/CNAME` с одной строкой — самим доменом без `https://` (например `woodled.ru`), чтобы он сохранялся между деплоями.

**2. Сначала og-теги** (абсолютные URL — их меняем на новый домен ПЕРВЫМИ):
```
grep -rIl "mihail-izumov.github.io/woodled-studio" *.md \
  | xargs sed -i 's#https://mihail-izumov.github.io/woodled-studio#НОВЫЙ-ДОМЕН#g'
```
Затрагивает `index.md`, `customizer.md`, `onboarding.md` (`og:url`, `og:image`, `twitter:image`).

**3. Затем срезать префикс `/woodled-studio/` → `/` везде:**
```
grep -rIl "/woodled-studio/" .vitepress *.md \
  | grep -v node_modules \
  | xargs sed -i 's#/woodled-studio/#/#g'
```
Эта одна замена автоматически чинит:
- `base: '/woodled-studio/'` → `base: '/'` в `config.mts`
- favicon-ссылки в `config.mts`
- ассеты галереи: `customizer/data/gallery.ts`, `customizer/components/gallery/gallery-constants.js`
- `woodled-data.js`: `IMG`, `AUDIO_SRC`, `CUSTOMIZER_URL`
- логотипы/иконки в `customizer/*` и `lp/*` (Footer, Header, WelcomeScreen, OnboardingLink, Preloader, TapLeafWidget, SoundButton)
- слайдер `lp/Slider.vue` (шаблонная строка)
- `lp/AppIcon.vue` `COVER_URL`
- ссылку логотипа в футере кастомайзера
- навигацию (`onboarding.md`, `PrimaryCTA.vue`, gallery-tagger `DEFAULT_BASE_URL`)

**4. Пересобрать и проверить** (см. раздел «Проверка»).

## Гочи — что легко пропустить (находили по ходу работы)

- **Шаблонные строки.** `lp/Slider.vue` строит путь как `` `/woodled-studio/lp/wdld-lp-slider-${i + 1}.jpg` `` — обычный grep по расширению файла его НЕ ловит, потому что в середине переменная. Замена `/woodled-studio/`→`/` его покрывает, но при ручной проверке помни про такие случаи.
- **Файлы в корне `public/`.** `AppIcon.vue` → `/woodled-studio/og-cover.png`, favicon в `config.mts` → `/woodled-studio/apple-touch-icon.png`. Это не `gallery/onboarding/customizer`, легко забыть.
- **og-теги** — отдельная замена (шаг 2), т.к. это абсолютные URL с доменом, а не просто префикс.
- **НЕ трогать внешние ссылки:** `runscale.ru` (логотип и ссылка агентства в `lp/Footer.vue`), `woodled.ru` (если это ссылка на внешний сайт компании, а не наш домен), соцсети (`vk.com/woodled`, `t.me/woodled`, `dzen.ru/woodled`). Замена `/woodled-studio/`→`/` их и так не затрагивает, но при ручной правке — не путать.

## Проверка (как делали)

```
# 1) не осталось ни одного префикса /woodled-studio/
grep -rIn "/woodled-studio/" .vitepress *.md | grep -v node_modules   # → пусто

# 2) полный sweep непрефиксованных динамических путей тоже чист (все стали /...)
grep -rnoE "['\"\`(]/(lp|gallery|onboarding|customizer|share|og-cover|apple-touch)[a-zA-Z0-9_./\$\{\}+ \-]*" \
  .vitepress *.md | grep -v node_modules | grep -v "github.io"

# 3) сборка
npm run docs:build      # должна пройти без ошибок

# 4) аудит ассетов: каждый /<...>.<ext> существует в public/
#    (срезать ведущий слеш и проверить наличие файла в public/)
```

После этого сайт корректно работает в корне домена. Локально проверять: `npm run docs:preview`.

## Если домен будет НЕ в корне (опять подпуть)
Тогда наоборот: `base: '/НОВЫЙ-ПОДПУТЬ/'`, и префикс должен быть `/НОВЫЙ-ПОДПУТЬ/` вместо `/woodled-studio/` — то есть замена `/woodled-studio/` → `/НОВЫЙ-ПОДПУТЬ/`, а og-теги на `https://ДОМЕН/НОВЫЙ-ПОДПУТЬ`.
