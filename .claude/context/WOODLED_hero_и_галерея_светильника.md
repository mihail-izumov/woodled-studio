# WOODLED — Hero и галерея на странице светильника

> Версия: 1.0 · Дата: 6 июня 2026
> Назначение: спецификация Hero-блока и нижней галереи в FxEditor — реактивная подборка фото под текущий выбор юзера. После прочтения должно быть ясно: какой алгоритм, какие файлы трогать, как проверять изменения, какие edge cases оставлены.

---

## TL;DR

На странице любого светильника (`FxEditor.vue`) есть **две зоны фото**:

1. **Hero сверху** (`FxHeroGallery.vue`) — квадрат-герой с clean BG-фото (studio + detail) под текущий fixture. Меняется живьём от выбора юзера. При тонкой выборке (≤2 фото) добавляется CTA-слайд-якорь на нижнюю галерею.
2. **GallerySection снизу** (старый, room-level paid, не трогаем) — интерьеры под fixture+wood. Источник = курация из `data/gallery.ts` (172) + добивка из `_seed.js` (179) когда курация для конкретного fixture+wood пуста.

Алгоритм матчинга один — `pickFxPhotos(config, mode)` в `engine/fx-gallery.ts`. Режим `hero` использует HERO_FIELDS, режим `gallery` — GALLERY_FIELDS.

---

## Архитектура

```
┌─────────────── FxEditor.vue ────────────────┐
│                                              │
│  ┌─ FxHeroGallery (новое) ─────────────┐    │
│  │  build (ref) → fxToConfig → pickFx   │    │
│  │  Слои: strict → partial → substitute │    │
│  │  ≤2 фото + есть интерьеры → CTA-слайд│    │
│  │  Disclaimer внизу                    │    │
│  └──────────────────────────────────────┘    │
│                ↓                              │
│  [ Plate · Комплектация · Save · Share ]     │
│                ↓                              │
│  ┌─ GallerySection (старое) ───────────┐    │
│  │  id="fx-interiors" (якорь CTA)       │    │
│  │  galleryDisplayItems =               │    │
│  │    byFixture(build) ?? seedFallback  │    │
│  └──────────────────────────────────────┘    │
└──────────────────────────────────────────────┘
```

---

## Карта файлов

### Новые

| Файл | Назначение |
|---|---|
| `data/fx-photos.ts` | Типизированный датасет фото (179 шт). Автогенерация из `public/photo-tagging/_seed.js`. |
| `engine/fx-gallery.ts` | Алгоритм `pickFxPhotos`, константы `HERO_FIELDS` / `GALLERY_FIELDS` / `FAMILIES` / `MATCH_BADGE` / `HERO_DISCLAIMER`. |
| `components/FxHeroGallery.vue` | Hero-блок: слайдер фото, плашки слоёв, CTA-слайд, lightbox. |

### Изменённые

| Файл | Что добавлено |
|---|---|
| `engine/gallery-engine.ts` | `byFixture(build)` — strict-фильтр model+wood (заменяет `byModel` для FxEditor); `seedInteriorsForBuild(build, offset, opts?)` — подкачка из `_seed.js`; `preloadSeedAspects(urls)` — preload для добивки. Старые `byModel`/`byRoom`/`byCombined`/`random` нетронуты. |
| `components/FxEditor.vue` | Импорт + `<FxHeroGallery>` сверху; `galleryDisplayItems` = `curated` + `seed-fallback`; `id="fx-interiors"` на обёртке нижней галереи. |

### НЕ ТРОНУТО

- `data/gallery.ts` — 172 курированных фото, схема (rooms/models/woods/zones) сохранена. Под апгрейд позже.
- `components/RoomDetail.vue` — room-level galleria через `byCombined`, работает как до.
- `components/App.vue` — главная страница через `random()`.
- `components/gallery/GallerySection.vue`, `PhotoCard.vue`, `Lightbox.vue` — UI старого pipeline'а, переиспользуется как-есть.

### Источник правды для алгоритма

`public/photo-tagging/tagger.html` — теггер с тремя вкладками (Тегирование / Симулятор / Покрытие). Алгоритм в TS — это **порт** из этого HTML. При расхождении доверяй теггеру и обнови `engine/fx-gallery.ts`.

---

## Алгоритм `pickFxPhotos(config, mode)`

### Вход

```ts
interface FxPhotoConfig {
  model: ModelId
  wood: Wood | ''
  mount?: string       // user-pick ceiling/flush/pendant/track, нормализуется
  diffuser?: string    // 'yes' | 'no' | '' (only rotor_x)
  bodyColor?: string   // 'white' | 'black' | '' (only floor_lamp)
}
```

Сборка через `fxToConfig(fx)` — изолирует UI-маппинги (mount 'ceiling' → 'flush').

### Выход

```ts
interface FxPickResult {
  hero: { strict, partial, woodSubstitute: FxPhotoMatch[] }
  interiors: { strict, partial: FxPhotoMatch[] }
}
```

### Ключевые поля (HERO_FIELDS / GALLERY_FIELDS)

|  Коллекция  | Hero | Gallery |
|---|---|---|
| rotor | wood + mount | wood + mount |
| rotor_x | wood + diffuser | wood |
| elliptical / spot / unit | wood | wood |
| bra_h / bra_v / table_lamp | wood | wood |
| floor_lamp | wood + bodyColor | wood + bodyColor |
| floor_lamp_s | wood | wood |

В матчере НЕ участвуют: `bowl` (0/179 размечено), `btemp` (9/179), `patrons` (3/179), `socket`, `lamps`, `on`.

### Семейства (cross-size fallback)

```ts
FAMILIES = {
  rotor_s|m|l|1000 → 'rotor',
  rotor_x_m|l → 'rotor_x',
  elliptical_s|l → 'elliptical',
  bra_v_s|l → 'bra_v',
  // spot_s / spot_l — НЕ в одной семье (Ø12×12 куб vs Ø12×30 труба)
}
```

### Этажи матчинга (Hero)

```
strict           — все user-picks реально совпали
  ↓ пусто
partial          — есть wildcards (у фото поле не размечено)
  ↓ пусто
woodSubstitute   — тот же fixture, другое дерево, бейдж «цвет на фото отличается»
  ↓ пусто
empty            — UI рисует CTA-плашку (в реальных данных недостижимо)
```

`sameSize` — тайбрейкер в сортировке, не tier. Внутри слоя: `matchCount DESC` → `sameSize` первым.

### Этажи матчинга (Gallery)

```
strict → partial → (нет woodSubstitute — для интерьеров критично дерево)
```

### User-facing copy (MATCH_BADGE)

```ts
{
  strict:         '',                              // без плашки
  partial:        'деталь может отличаться',       // wildcards
  woodSubstitute: 'цвет на фото отличается',       // другое дерево
}
```

### Глобальный disclaimer

```
HERO_DISCLAIMER = 'Фото не отражает выбор чаши, цоколя, температуры и количества ламп'
```

Виден всегда под Hero, не зависит от слоя.

---

## Иерархия нижней галереи (GallerySection)

В `FxEditor.vue`:

```ts
const galleryItems = byFixture({m, wood: build.wood})         // 1. Курация strict
const seed = curated.length > 0
  ? []                                                          // курация есть → seed не нужен
  : seedInteriorsForBuild(build) ||                            // 2. Strict-seed (тот же wood)
    seedInteriorsForBuild(build, 0, {relaxWood: true})         // 3. Relaxed-wood (другое дерево)

galleryDisplayItems = [...curated, ...seed]
```

Правило **«курация главная»**: seed подкачка добавляется ТОЛЬКО когда курация для текущего fixture+wood пуста. Иначе курация — единственный источник. Это исключает дубли в стиле unit/oak.

**Cap** в `seedInteriorsForBuild`: максимум 2 фото на (model, wood) — защита от похожих ракурсов.

---

## CTA-слайд в Hero

Появляется когда `photos.length ≤ 2 AND interiorCount > 0`. Структура:

```
┌─────────────────────────────┐
│   {fxTitle} в интерьере     │   заголовок
│                             │
│   [▢][▢][▢]                │   мини-сетка 52×52
│   [▢][▢]                   │   (без промежутков)
│                             │
│   [ Посмотреть ↓ ]          │   кнопка цвета комнаты
└─────────────────────────────┘
```

- Адаптивная сетка: ≤3 → 1 строка, 4 → 2×2, 5-6 → 3 cols (на 5 последний угол цвета комнаты).
- Весь блок (заголовок+сетка+кнопка) кликабельный — `@click="jumpToInteriors"`.
- Якорь — `#fx-interiors` на обёртке нижней галереи + `scroll-margin-top: 60px` для отступа.

---

## Чек-лист проверки (по `WOODLED_проверка_фичей_чек-лист.md`)

### Парсинг (Шаг 1)

```
✓ engine/fx-gallery.ts
✓ data/fx-photos.ts
✓ components/FxHeroGallery.vue
✓ components/FxEditor.vue
✓ engine/gallery-engine.ts
```

### Mental-симуляция (Шаг 2)

**C. Просмотр результата в UI** — пройдено:
- Hero рендерится для всех 17 моделей × 3 деревьев = 51 каталожной комбинации.
- На каждой — Hero непустой (43 strict / 0 partial / 8 substitute / 0 empty).
- Плашки слоёв: strict — без, partial/substitute — соответствующая копия из `MATCH_BADGE`.
- Disclaimer показан всегда.

**D. Редактирование существующего** — пройдено:
- `build` — Vue `ref`, computed внутри `FxHeroGallery` подписан реактивно.
- Изменение `wood` → Hero пересортируется. Изменение `mount` (rotor) → Hero меняет slider. Изменение `bodyColor` (floor_lamp) / `diffuser` (rotor_x) → Hero реагирует.
- `idx` сбрасывается на 0 через `watch(photos)` при смене выборки.
- `isDirty` не задевается — Hero только читает build, не пишет.

**F. Шаринг** — N/A. Hero — computed из build, не сериализуется в URL.

**G. Persist** — N/A. Hero не пишется в store, не персистится в localStorage.

**H. Влияние на forest/story** — N/A. Hero изолирован, не пересекается с лесом/Story.

**Custom fixtures** — обработано. `fx.custom` → роутится в `CustomFxEditor.vue` (другой компонент), `FxHeroGallery` для кастомов не рендерится. У кастомов в датасете нет фото.

### Grep-проверки (Шаг 3)

- `byModel` вызовы: только `App.vue` (random), `RoomDetail.vue` (byCombined). FxEditor переведён на `byFixture`. ✓
- `pickFxPhotos` / `fxToConfig`: используются в `FxHeroGallery.vue` и `gallery-engine.ts/seedInteriorsForBuild`. ✓
- `FX_PHOTOS` импорт: только в `engine/fx-gallery.ts`. ✓
- `HERO_DISCLAIMER` / `MATCH_BADGE`: централизованы в `engine/fx-gallery.ts`, импортируются в Hero. ✓

### Типичные баги (Шаг 4) — проверены

- **Баг 1 (undefined optional)**: `fxToConfig` обрабатывает все опциональные поля через `||` / явные дефолты. `Build.diffuser: boolean` (не undefined). `Build.wood` = `oak` по дефолту через `mkBuild`. ✓
- **Баг 4 (isDirty false positive)**: Hero не пишет в `build`. `isDirty` сравнивает `JSON.stringify(build.value)` со снапшотом — Hero не задевает. ✓
- **Баг 5 (перекошенный агрегат)**: N/A.
- **Баг 8 (module-level let)**: нет module-level mutable state.

---

## Результаты прогона по 19 проблемным конфигурациям

| Fixture × Wood | Curated | Seed | Источник |
|---|---|---|---|
| rotor_1000 × walnut | 1 | 0 | strict-curated |
| rotor_1000 × oak | 2 | 0 | strict-curated |
| rotor_1000 × black | 0 | 3 | strict-seed |
| rotor_l × walnut | 10 | 0 | strict-curated |
| rotor_l × black | 1 | 0 | strict-curated |
| floor_lamp × oak | 15 | 0 | strict-curated |
| floor_lamp × black | 0 | 2 | strict-seed |
| floor_lamp × walnut | 7 | 0 | strict-curated |
| floor_lamp_s × oak | 0 | 1 | strict-seed |
| floor_lamp_s × walnut | 0 | 1 | strict-seed |
| **floor_lamp_s × black** | **0** | **2** | **relaxed-seed** |
| table_lamp × oak | 5 | 0 | strict-curated |
| table_lamp × walnut | 0 | 2 | strict-seed |
| table_lamp × black | 0 | 2 | strict-seed |
| unit × oak | 0 | 2 | strict-seed |
| unit × walnut | 1 | 0 | curated (seed скипнут) |
| unit × black | 3 | 0 | curated (seed скипнут) |
| spot_l × oak | 14 | 0 | strict-curated |
| spot_s × oak | 1 | 0 | strict-curated |

**Итог**: каждая ячейка имеет минимум 1 фото в галерее. Пустых состояний нет.

---

## Edge cases (оставлены как есть)

1. **CTA «empty Hero» недостижим в данных** — `woodSubstitute` всегда находит фото в текущих 51 каталожных комбинациях. CTA-плашка с надписью «Hero пуст» в `pickFxPhotos` логически выживает, но юзер её не увидит. Защита для будущего (новые модели без фото).
2. **`bowl` 0/179 размечено** — выбор чаши в FxEditor не отражается в Hero. Дисклеймер про это говорит. Закрыто потенциально path B из плана (теггинг контрастных чаш).
3. **`gallery.ts` не имеет mount/bodyColor тегов** — `byFixture` фильтрует только по `model + wood`. Полная точность под Hero-уровень требует дотегирования (см. task #23 в бэклоге).
4. **`unit/oak` — 2 seed-фото cap-2** — могут визуально походить друг на друга (нет автоматического dedup). Юзер может вручную убрать одно фото из `_seed.js` если жалоба.
5. **`floor_lamp_s × black` через relaxed-wood** — показывает walnut/oak floor_lamp_s в нижней галерее без плашки «цвет отличается» (PhotoCard не поддерживает плашки). Юзер может не заметить wood-mismatch на интерьерном фото — это сознательный trade-off.
6. **`socket` / `btemp` / `lamps` в дисклеймере** — глобальный disclaimer закрывает.

---

## Бэклог

- **#23** — Апгрейд `gallery-engine.ts` под принципы Hero: применить тот же `pickFxPhotos`-pattern к `gallery.ts`, дотегировать ~30-50 фото в gallery.ts (mount для rotor, bodyColor для floor_lamp). После — `byFixture` сможет фильтровать строго по всем визуальным полям.
- **Tagging bowls** (path B из плана): размечать контрастные чаши (none / black / wood / chrome) в `_seed.js` через теггер. Добавить `bowl` в HERO_FIELDS. Дисклеймер скорректировать.
- **Унификация датасетов**: миграция 172 курированных в schema `_seed.js` (deep tags) ИЛИ объединение через build-time merge. Сейчас два параллельных pipeline'а. Один источник правды — лучше, но требует ~3-4 часа ручной разметки.

---

## Запуск / тестирование

```bash
cd /Users/mihailizumov/work-2026/woodled/woodled-studio
npm run docs:dev
```

Открой страницу любого светильника. Тест-кейсы для проверки:

- **rotor_l + walnut** → strict, ~10 фото, без плашки.
- **floor_lamp_s + black** → substitute, плашка «цвет на фото отличается».
- **table_lamp + oak** → 1 фото Hero + CTA-слайд → tap → скролл к интерьерам.
- **unit + black** → 3 фото curated, no seed (правило «курация главная»).

Теггер фото: `http://localhost:5173/photo-tagging/tagger.html` (источник правды для алгоритма, вкладки Симулятор + Покрытие).

---

## Связанные документы

- `WOODLED_проверка_фичей_чек-лист.md` — методика проверки после правок.
- `WOODLED_рационал_и_архитектура.md` — карта файлов проекта.
- `WOODLED_шаринг.md` — на случай если решим сериализовать Hero state в URL.
- `NON_WOODLED_FIXTURES.md` — почему у кастомов нет Hero (другой роутинг).
