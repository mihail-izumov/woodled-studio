# HANDOFF — Умная галерея на странице светильника (FxEditor)

Контекст для нового чата. Прошлый разросся. Тут — где остановились, что готово, что осталось.

## TL;DR
Делаем умную галерею-«герой» в верхней части `FxEditor.vue`, чтобы фото реактивно
менялось под выбранные параметры (дерево / крепление / плафон / диффузор / цвет корпуса).
Референс — конфигуратор iPhone и Tesla.

Дата-слой готов на 100%. Осталось — код во Vue.

## Что уже сделано (фаза «данные»)

### 1. Размеченный датасет
- **Папка:** `public/photo-tagging/`
- **Файлы:**
  - `tagger.html` — внутренняя утилита-тэггер (3 вкладки: Тегирование / Алгоритм / Покрытие).
  - `_seed.js` — 179 фото с тегами (wood, mount, bowl, diffuser, bodyColor, patrons, on, btemp, shot, skuWood, woodVerified, deleted, notes).
- **Открыть тэггер локально:**
  - В терминале из корня `woodled-studio`: `npm run docs:dev`
  - В браузере: `http://localhost:5173/photo-tagging/tagger.html`
  - (или просто открыть файл напрямую в браузере — `file://...tagger.html` тоже работает, фото грузятся из той же папки)
- **Статус:** 179/179 подтверждено вручную (100%). Дерево + тип съёмки расставлены.
- **Storage key:** `woodled-tagger-v20` (бампать при изменении схемы).

### 2. Ключевые решения по алгоритму
- **Plan A** (single pool + shot-priority + interior fallback) — выбран.
- **FAMILIES** — кросс-размерный fallback: `rotor_s/m/l/1000 → rotor`, `elliptical_s/l → elliptical`, etc.
- **MATCH_FIELDS_BY_COLL** — каждая коллекция фильтруется только по релевантным полям:
  - `rotor: ['wood','mount','bowl']`
  - `rotor_x: ['wood','diffuser','bowl']`
  - `elliptical / spot / unit: ['wood','bowl']`
  - `bra_h / bra_v / table_lamp: ['wood']`
  - `floor_lamp: ['wood','bodyColor']`
  - `floor_lamp_s: ['wood']`
- **Strict match**: фото попадает в «точно подходят» только если ВСЕ user-picked поля явно совпали (а не «хотя бы одно»).
- **Shot priority**: «Без фона» (detail, белый фон) + «Студия» (серый фон) → clean BG, идут в Hero первыми. «Интерьер» → fallback / нижняя галерея.
- **4-tier раскладка результата:** exactSame → exactOther → partialSame → partialOther → fallback.
- **SKU как источник правды для дерева:** `R-01=oak, R-02=walnut, R-03=black, R-04=acryl`. 82 фото авто-залочены по имени файла/папки, остальные подтверждены вручную.

### 3. Особенности данных (важно для алгоритма)
- **Multi-color фото** — `wood` может быть массивом (`["oak","walnut","black"]`) когда на одном фото 3 цвета вместе.
- **Кастомы** в `_seed.js` НЕ участвуют — это только WOODLED каталог.
- **Wildcard mount** на rotor_1000 в студии с двусмысленных ракурсов — `mount: ''`.
- **rotor_x в каталоге** имеет `hasMount: false`, но фактически бывают подвес + вплотную (или ультра-короткий подвес похожий на вплотную) — это уже UI-вопрос, не фильтра.

## Что НЕ сделано (фаза «код»)

### Бэклог по приоритету:

1. **Расширить `.vitepress/customizer/data/gallery.ts`** — новая схема под per-fixture фото:
   - Добавить поля из `_seed.js`: model, wood (string|array), mount, bowl, diffuser, bodyColor, patrons, on, btemp, shot, deleted, notes.
   - Импортировать FAMILIES.
   - Старый формат фото для «вдохновения» (комнаты целиком) — оставить, не ломать.

2. **Обновить `.vitepress/customizer/engine/gallery-engine.ts`:**
   - Добавить функцию `pickFxPhotos(fx, build)` — на вход Fixture + текущий build из FxEditor, на выход 4-tier раскладка.
   - Strict-match как описано выше.
   - Shot priority sort: detail → studio → interior.
   - Если в exactSame пусто — поднимаем из exactOther (другой размер той же семьи). И т.д. до fallback.
   - Гарантия: возвращать минимум 1 фото даже при полном промахе (fallback = первое фото семьи).

3. **Создать `.vitepress/customizer/components/FxHeroGallery.vue`:**
   - Квадратная карточка вверху страницы светильника.
   - Реактивно меняет фото при изменении build (как iPhone-конфигуратор).
   - Свайп между фото в одной раскладке (если их несколько).
   - Tap → Lightbox (переиспользовать `gallery/Lightbox.vue`).
   - Плашка-подсказка если показано фото «другого размера» / «без фона» / только интерьер.

4. **Интеграция в `.vitepress/customizer/components/FxEditor.vue`:**
   - Перед блоком «Комплектация» (наверху, после `NavHeader`).
   - Прокинуть computed `build` из FxEditor.
   - Не ломать существующий поток provisional / dirty / save.

### Уже существующая галерея «вдохновение» (НЕ трогать):
`components/gallery/GallerySection.vue` + `PhotoCard.vue` + `TapLeafWidget.vue` + `Lightbox.vue` —
живёт в `RoomDetail.vue` и на главной. Использует свой `gallery-constants.js` / `gallery-engine.ts`.
Эту систему НЕ трогаем, добавляем рядом второй pipeline для Hero на FxEditor.
Lightbox можно переиспользовать — он универсальный.

## Файлы и ссылки (внутри проекта `woodled-studio`)

### Свежедобавленные (фаза «данные»):
- `public/photo-tagging/tagger.html` — утилита тэггера (v20).
- `public/photo-tagging/_seed.js` — финальный размеченный датасет (179 entries, 100% verified).

### Каталог и источники правды:
- `.vitepress/customizer/data/catalog.ts` — `MD` + `FX_FACTORS` + типы / chip / size + `hasMount` / `baseColors`.
- `.vitepress/customizer/data/materials.ts` — `BOWLS` / `BTEMPS` / `DEF_OPT`.
- `.vitepress/customizer/components/FxEditor.vue` — куда встраивать Hero.
- `.vitepress/customizer/components/gallery/GallerySection.vue` — существующий «вдохновение»-pipeline, переиспользуем Lightbox.

### Спецификации:
- `CLAUDE.md` (корень) — карта проекта.
- `.claude/context/README.md` — индекс базы знаний.
- `.claude/context/NAMING_SPEC.md` — артикулы (R-01-S, R-T-01-01 etc.).
- `.claude/context/WOODLED_коэффициенты_светильников.md`.

## Подводные камни

- **Multi-color wood** — везде проверяй `Array.isArray(photo.wood) ? photo.wood.includes(w) : photo.wood === w`.
- **«Лес» = только WOODLED**, кастомы не участвуют ни в каких алгоритмах настроения (в Hero они тоже не участвуют — у кастома нет фото в датасете).
- **`hasMount: false`** для rotor_x/elliptical/spot/unit — пользователь крепление НЕ выбирает в FxEditor, значит и в фильтр не подаём.
- **`baseColors` только у floor_lamp** — для остальных bodyColor не учитываем.
- **`acryl` (R-04)** — не каталожная опция, но фото есть. Решали показывать как partial / fallback.
- **`deleted: true`** в _seed.js — пропускать.
- **`CLAUDE.md`** проекта в корне — обязательно прочитать в начале сессии. Там карта папок, конвенции, синхронизация порогов BRIGHT и пр.
