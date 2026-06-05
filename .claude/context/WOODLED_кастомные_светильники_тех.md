# WOODLED — Кастомные светильники: техническая реализация

> Версия: 1.0 | Дата: 5 июня 2026
> Дополнение к `NON_WOODLED_FIXTURES.md` — там UI/UX принципы, здесь тех. слой: типы данных, регистрация в MD, фильтры в «лесу», шаринг, проверка после релиза.
> Связанные документы: `WOODLED_шаринг.md`, `WOODLED_коэффициенты_светильников.md`, `WOODLED_рационал_и_архитектура.md`, `WOODLED_проверка_фичей_чек-лист.md`.

---

## Главный принцип

**Не переписывать живой движок.** Все 48 lookup'ов `MD[fx.m]` и `FX_FACTORS[fx.m]` в `brightness.ts`, `zone-engine.ts`, `forest.ts`, `forest-cards.ts`, `story-engine.ts`, `RoomCard.vue`, `ZoneCard.vue`, `BuyModal.vue`, `FxEditor.vue`, `ZoneFixturesModal.vue` продолжают работать без правок. Это даётся рантайм-регистрацией кастомной модели в `MD` — обычный JS-объект, не файл.

---

## Источник правды — `Fixture.custom: CustomSpec`

Поле в `data/catalog.ts`:

```ts
interface Fixture {
  m: ModelId           // для кастома: 'custom_<hash>'
  q: number
  wood: Wood           // для кастома: nearestWood из палитры цвета
  zone: ZoneId
  l?: number
  opts?: Partial<FxOpts>
  done?: string[]
  custom?: CustomSpec  // здесь живёт спека другого бренда
}
```

`CustomSpec` хранит ВСЁ что нужно движку и UI:

```ts
interface CustomSpec {
  name: string                                // ≤16 символов
  brand: string                               // ≤18, пусто → fxLine скрывается
  type: FxType
  chip: string                                // размер у люстр, иначе ''
  zone: ZoneId
  lamps: number                               // для bulb; LED/лента → 1
  lmPer: number                               // люмены на одну лампу/устройство
  body: number                                // КПД корпуса: 1.0/0.8/0.6
  ambient: number                             // доля в общий свет (по type)
  btemp: string                               // 2700/3000/4000
  tint: { id: string; hex: string }
  url?: string
  source: 'bulb' | 'led' | 'tape'
  socket?: string                             // E27/E14/GX53/GU10/G9 (только bulb)
  sqMin?: number; sqMax?: number
  inputs?: {                                  // UI-state для точного reopen
    manualLm?: boolean
    manualLmValue?: number
    watt?: Record<string, number>
    tapeW?: number; tapeLen?: number
  }
}
```

---

## Рантайм-регистрация в `MD`

`engine/custom-registry.ts` — три функции:

- `customIdFor(spec) → 'custom_<hash>'` — DJB2-хеш по содержательным полям (без `inputs`). Стабилен между сессиями и устройствами.
- `registerCustom(spec) → id` — записывает `Model`-объект в `MD[id]` и `FX_FACTORS[id]`.
- `registerAllCustoms(rooms)` — пробегает все fixtures с `.custom`, регистрирует, обновляет `fx.m` если id поменялся.

**5 точек регистрации** — все потоки данных, которые могут принести кастомный fixture в реактивный store, регистрируют его в MD ДО первого рендера:

| Точка | Где |
|---|---|
| `addFixture(roomId, fx)` | в `store/configurator.ts` |
| `updateFixture(roomId, idx, next)` | spec мог измениться → новый id |
| `updateRoom(next)` | RoomDetail может ставить fixtures через `emit('update')` |
| `restorePersistedState()` | загрузка из localStorage при старте |
| `loadFromHash()` | загрузка из URL-хеша |

Плюс синхронный `registerCustom()` в `RoomDetail.addCustomFx()` — перед `emit('update')`, чтобы реактивность не вызвала рендер с пустым `MD[id]`.

---

## «Лес» = только WOODLED

Кастомы НЕ участвуют в смысловом слое «леса». Фильтры через `f.custom`:

| Файл | Что фильтрует |
|---|---|
| `engine/forest.ts` `woodOrder` | подсчёт деревьев для имени сцены |
| `engine/forest-cards.ts` `woodCard` | карточка «Дерево» в ForestMood |
| `engine/story-engine.ts` | dominantWood, totalTrees, totalLamps, sceneMap.woods, lampsByCap, avgKelvin sum |
| `components/RoomCard.vue` `tally` | глянцевые шары дерева на главной |

Если все светильники — кастомные, `forestScene` возвращает stub:
```
{ name: '—', legend: 'В комнате только светильники других брендов — лес собирается из WOODLED.' }
```

**Но в общую яркость кастомы входят** (это весь смысл фичи):
- `fxLm`, `zoneLm`, `zoneFxCount` — считают все fixtures
- `baseLm` не зависит от fixtures вообще
- `ratio` растёт когда добавляешь кастом — как и должно

---

## Шаринг (URL-hash)

`engine/share.ts`:

```ts
interface PackedFixture {
  m: string
  q?: number; w?: string; z?: string; l?: number
  o?: Partial<FxOpts>; d?: string[]
  c?: CustomSpec    // вся спека целиком, включая inputs
}
```

Roundtrip:
1. Отправитель: `packFixture` кладёт `fx.custom` в `c`.
2. Получатель: `unpackFixture` восстанавливает `fixture.custom = p.c`.
3. `loadFromHash` вызывает `registerAllCustoms(rooms)` ДО `rooms.splice(...)` — MD заполнен к первому рендеру.
4. `customIdFor(spec)` стабилен — у получателя тот же id что в URL.

**Правило:** новое поле в `CustomSpec` едет в URL автоматически — `PackedFixture.c` это `CustomSpec` целиком. Никаких сквозных правок в `share.ts` не требуется (если только не добавляется поле ВНЕ `CustomSpec`).

---

## Группировка кастомов в карточках «Где свет»

`groupByModel` в `forest-cards.ts`:

```ts
// Для кастомов нормализуем ключ по type+chip (не по f.m):
const groupId = f.custom ? `custom:${m.type}|${m.chip || ''}` : f.m
const key = `${groupId}|${wood}|${btemp}|${zone}`
```

Без этого два кастомных торшера (с разными hash-id) попадают в разные группы → текст карточки получался «торшер, торшер подсвечивают комнату» вместо «два торшера».

---

## `inputs` — UI-state для точного reopen

`lmPer` уезжает в spec как итоговое число люмен. Один и тот же `lmPer` можно получить разными комбинациями (E27×10Вт ≈ E14×11Вт ≈ LED×9Вт). Без сохранения «сырого» UI-state форма после reopen открывалась бы с пересчётом и теряла точность (особенно ленты — там 3 неизвестных в одном lmPer).

`CustomSpec.inputs` хранит:
- `manualLm: boolean` — был ли включён режим «знаю люмены»
- `manualLmValue?: number` — значение в этом режиме
- `watt?: Record<string, number>` — выбранная мощность по каждому цоколю
- `tapeW?: number; tapeLen?: number` — параметры ленты

При сохранении `buildSpec()` всегда кладёт текущий UI-state. При reopen `CustomFxEditor` инициализирует refs из `c.inputs ?? defaults`.

**Важно:**
- `isDirty` сравнивает spec без `inputs` (через `stripInputs`) — иначе reopen existing fixture ложно помечал бы как dirty.
- `customIdFor` тоже игнорирует `inputs` — два кастома с одинаковыми содержательными полями (но разными inputs) делят одну MD-запись.

---

## Чтение `btemp` кастома

У кастомов `f.opts` отсутствует — температура в `f.custom.btemp`. Чтение через chain:

```ts
const btemp = f.opts?.btemp ?? f.custom?.btemp ?? DEF_OPT.btemp
```

Применяется в:
- `engine/forest-cards.ts` `groupByModel` (для карточки «Оттенок»)
- `engine/forest.ts` `tempWarmth` (для легенды сцены)

В `story-engine.ts` `avgKelvin` отфильтровали к `ownFx` целиком (не правили fallback) — «Характер дома» в Story говорит про WOODLED-лес.

---

## Карта правок (что было сделано в фиче)

| Файл | Что |
|---|---|
| `data/catalog.ts` | +`CustomSpec`, `Fixture.custom`, ModelId с `string` хвостом |
| `engine/custom-registry.ts` | новый: `registerCustom`, `customIdFor`, `registerAllCustoms` |
| `store/configurator.ts` | регистрация в 5 точках |
| `engine/share.ts` | `PackedFixture.c` + pack/unpack |
| `engine/forest.ts` | `woodOrder` фильтр !custom, `tempWarmth` chain btemp |
| `engine/forest-cards.ts` | `woodCard` фильтр, `groupByModel` ключ + btemp chain |
| `engine/story-engine.ts` | фильтр кастомов в 6 местах |
| `components/RoomCard.vue` | tally фильтрует custom |
| `components/ZoneCard.vue` | `orbStyle(fixture)` → custom.tint.hex; `fxLine` v-if при пустом бренде |
| `components/AddFxModal.vue` | последняя карточка слайдера |
| `components/CustomFxEditor.vue` | НОВЫЙ — страница по паттернам FxEditor |
| `components/RoomDetail.vue` | `addCustomFx(zone)` создаёт placeholder, регистрирует, открывает |
| `components/App.vue` | роутер `v-if="fx.custom"` → CustomFxEditor |

---

## Edge cases (известные)

- **BuyModal показывает «0 ₽» для кастома** — цена ноль (`p:{oak:0,walnut:0,black:0}`). Косметика. Можно скрыть строку для кастомов или показать «—». Не блокер.
- **Смена `type` в форме не валидирует лимит новой зоны** — при изменении «бра» → «торшер» зона уезжает с `wall` на `floor`. Лимит не проверяется (аналогично у WOODLED где тип фиксирован).
- **«Мёртвые» MD-записи** — после правки spec → новый id, старая остаётся в MD до перезагрузки. ~200 байт каждая. Refresh очищает.
- **Legacy без `inputs`** — для сохранений до фикса бага. Восстановление мощности через приближение `lmPer / lmPerW`. Для ленты — дефолт 5×9.6м. После пересохранения inputs появляются.

---

## Найденные баги при проверке (исправлены)

Полный отчёт см. в чате обсуждения. Краткая сводка:

1. **`inputs` не восстанавливался при reopen** (критический) — UI-state терялся, lmPer пересчитывался с потерей точности. Особенно видно на ленте (6× расхождение). Фикс: `CustomSpec.inputs`.
2. **`btemp` кастомов читался как «4000K»** — `f.opts?.btemp` не находил, fallback на DEF_OPT. Искажались «Оттенок» в ForestMood и `tempWarmth`. Фикс: chain `f.opts?.btemp ?? f.custom?.btemp ?? DEF_OPT.btemp`.
3. **`avgKelvin` в Story перекошен** — `denom` без кастомов, `sum` со всеми. Фикс: `ownFx` целиком.

---

## Связанные документы

- `NON_WOODLED_FIXTURES.md` — UI/UX принципы (минимализм пользовательской карточки, отсутствие ярлыков «свой/чужой»).
- `WOODLED_шаринг.md` — общая схема URL-хеша.
- `WOODLED_коэффициенты_светильников.md` — `FX_FACTORS.body/ambient` для WOODLED; для кастомов берутся из `CustomSpec.body/ambient`.
- `WOODLED_рационал_и_архитектура.md` — формула яркости, идентична для WOODLED и кастомов.
- `WOODLED_проверка_фичей_чек-лист.md` — методика верификации.
