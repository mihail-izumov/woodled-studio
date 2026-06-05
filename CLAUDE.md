# CLAUDE.md — WOODLED Studio (конфигуратор света)

Контекст для AI-ассистента. Читается в начале сессии. Цель — стартовать с полным
пониманием проекта без ручной «разведки».

> 📚 **База знаний** проекта — в `.claude/context/`. После этого файла прочитай `.claude/context/README.md` — там индекс спек, словаря карточек и tone of voice. Под конкретную задачу подтягивай файлы из таблицы там же.

## Что это
Конфигуратор освещения дома: пользователь собирает комнаты, расставляет светильники
по зонам, видит яркость (люмены), настроения и распределение света. Тёплая тёмная тема.

## Стек и команды
- **VitePress + Vue 3** (Composition API, `<script setup lang="ts">`). `"type": "commonjs"`.
- Весь продукт — в `.vitepress/customizer/`.
- Запуск/сборка:
  - `npm run docs:dev` — дев-сервер (так проверяй правки визуально).
  - `npm run docs:build` — прод-сборка. `npm run deploy` — gh-pages.
- ⚠️ В песочнице ассистента **нет `node_modules`** — я не собираю и не типчекаю проект.
  После правок прогоняй `npm run docs:dev` локально.

## Связанные документы (source of truth)
Все лежат в **`.claude/context/`** — индекс там же (`.claude/context/README.md`).

**Источники правды (для конкретных правок):**
- `WOODLED_шкала_яркости_BRIGHT.md` — шкала яркости и пороги 0.5/0.8/1.2/1.5.
- `WOODLED_словарь_карточек_настроения.md` — банки фраз для 7 карточек, FURN_HINT, FURN_GEN, чек-лист ToV.
- `WOODLED_сцены_настроения_спека.md` — концепция лесных сцен (порода × место).
- `WOODLED_все_тексты.md` — банки текстов дашборда (`copy.ts`) и мебели.
- `NAMING_SPEC.md` — как формируется подпись светильника (тип + чип, без `collection`/`name`).
- `WOODLED_цвет_стен.md` — отделка стен: пресеты + свой HEX, автоклассификация по relative luminance (BT.709), пороги, влияние на UF, UI в `RoomSettings`, swatch в карточке настроения, share/persist.
- `WOODLED_шаринг.md` — сериализация состояния в URL-хеш: карта полей `Room`/`Fixture` ↔ `PackedRoom`/`PackedFixture`, дефолты, правило «новое поле в модели → ключ в share.ts», roundtrip-проверка.
- `WOODLED_кастомные_светильники_тех.md` — система светильников другого бренда: `Fixture.custom: CustomSpec`, рантайм-регистрация в `MD` через `engine/custom-registry.ts`, фильтры «леса» (только WOODLED), `inputs` для точного восстановления UI-state при reopen. Концепция UI — `NON_WOODLED_FIXTURES.md`.
- `WOODLED_прелоадеры.md` — три слоя preloader'а (inline boot-loader из `config.mts`, Vue `Preloader.vue`, `PageFade.vue`). Матрица: что показывается на десктопе / iOS / PWA / при медленном интернете / при reload. Правила синхронизации (`__wlBoot.clear()`, `__wlBranded`, флаг `cleared` против race-condition).

**Рационал и голос:**
- `WOODLED_рационал_и_архитектура.md` — почему норма «честная» (UF×MF), архитектура `ratio`.
- `WOODLED_коэффициенты_светильников.md` — `FX_FACTORS` по моделям, обоснование.
- `WOODLED_tone_of_voice.md` — голос (спокойный · тёплый · по делу, «вы», без AI-штампов).
- `WOODLED_аудит_текстов_настроений.md` — чек-лист аудита перед сложными правками.
- `WOODLED_проверка_фичей_чек-лист.md` — методика верификации фичи без dev-сервера (парсинг + mental-симуляция). Применять после любой правки `Fixture`/`Room`/store/share.

## Карта папок (`.vitepress/customizer/`)
- `components/` — все Vue-компоненты (экраны, карточки, модалки). UI-примитивы в `components/ui/`.
- `data/` — статические данные:
  - `catalog.ts` — модели светильников `MD` (с `type`/`chip`/`ltName`/`lmPer`/…), типы, **`ALL_ZONES`** (зоны), `Fixture`, `ZoneId`, **`FX_FACTORS`** (`body`/`ambient` КПД корпуса).
  - `rooms.ts` — типы комнат `RTS` (`lux`, размеры, лимиты, `zones`), тип `Room` (+ `wallFinish`), `ROOM_PREP`, `getRT`.
  - `materials.ts` — дерево (`MATS`, `WCOL`, тип `Wood`: oak/walnut/black), цвета, температуры (`BTEMPS`), `DEF_OPT`.
  - `furniture.ts` — `FURN[id].ab` (поглощение света мебелью), **`FURN_HINT`** (привязка мебели к зоне-источнику + фразе «где»/«польза»), **`FURN_GEN`** (родительный падеж имени мебели), `furnText`, `gword`.
  - `templates.ts`, `gallery.ts`, `moods.ts` (только шкала BRIGHT — старый mood-модуль почти мёртв, см. ниже).
- `engine/` — логика:
  - `brightness.ts` — норма и сумма: `baseLm` (UF×MF), `fxLm`, `fxLamps`, `getArea`, `ratioOf`, `furnPct`. Константы `WORK_PLANE`, `MAINT_FACTOR`, `SUSPENSION_DROP`, `UF_CURVE`, `WALL_UF_MULT`.
  - `zone-engine.ts` — `zoneLm`, `zoneFxCount` (точки = Σ `q`), `roomZones`, `GLOW_POS`, `glowOpacity`, `opacityToHex`.
  - **`forest.ts`** — лесная сцена: `forestScene(rt, room)` → `{ name, legend, place, wood }`. Имя = «{Порода} {место}» (Дубовая роща / Ореховая чаща / …). `place` по `ceilingShare`: ≥60% glade · ≤25% thicket · иначе grove. `brightLevel` 0.8/1.2 (синхронно с BRIGHT).
  - **`forest-cards.ts`** — карточки «Как это работает» для блока настроения: 7 функций-сборщиков (`whereCard`, `howMuchCard`, `wallsCard`, `woodCard`, `furnitureCard`, `tempCard`, `ceilingCard`) + `assembleCards`. Банки фраз с анти-повтором по сиду. Падежи через `fxNameNom`/`fxNameGen`/`fxNameDat` и `zoneKindNom`. **Карточки прячутся, если данных нет** (стены medium / мебель пустая / потолок 2.7 без подвеса).
  - `copy.ts` — детерминированный сборщик подсказок дашборда: `lightState`, `lightHint`, `actionReaction`. Пороги синхронны с BRIGHT (`0.5/0.8/1.2/1.5`).
  - `i18n.ts` — склонения: `pw`/`lw`/`rw`/`tw` (точка/лампа/комната/дерево), **`kindWord(type, n)`** (люстра/торшер/настольная/спот/бра), **`woodWord(wood, n)`** (дуб/орех/чёрный дуб), **`joinList(arr)`** (через «и»), `woodNames` (агрегат «6 орехов и 3 дуба»).
  - `autosize.ts`, `gallery-engine.ts`, `story-engine.ts` (см. ниже).
  - **`share.ts`** — сериализация в URL-хеш (#s=/#fx=). Формат v2 (lz-string). `packRoom`/`unpackRoom` + `packFixture`/`unpackFixture`. **Любое новое поле в `Room`/`Fixture`/`FxOpts` обязано появиться здесь** — иначе шаринг сломается беззвучно (получатель увидит дефолт). Спека и чек-лист — `WOODLED_шаринг.md`.
- `store/configurator.ts` — глобальное состояние (Vue refs): комнаты, активная комната/светильник,
  и **флаги модалок** (`showBuy`, `showStory`, `showShare`, `showRoomSettings`, `showZoneModal`, …).
  • Тосты: `showFB(msg, icon?)` + `fb`/`fbIcon` (`'check'` → чёрный чекмарк «сделано»).
  • Персист-флаги (localStorage): `welcomeSeen`, `dashboardTourSeen`, **`onboardedOnce`**
    (прошёл ли пользователь «Гид по сборке» / сохранил первый светильник — гасит заметную плашку гида).
- `theme/tokens.ts` — дизайн-токены: `T` (фоны/текст/состояния), `WCOL` (дерево), `OPACITY`,
  `RGBA`, `Z` (z-index), `ROOM_TINTS`.

## Ключевые экраны/компоненты
- `App.vue` — корень. Здесь `stickyVisible` (видимость нижнего `StickyBar`) и `anyModalOpen`
  (по нему прячется `SoundButton`). Чтобы скрыть стики/звук под новой модалкой — добавляй её флаг сюда.
  Список комнат на главной — **одна колонка** (`flex column`, не сетка), внизу белая CTA-кнопка
  «Добавить комнату» (`#EAE0CA` на `T.bg`).
- `RoomCard.vue` — карточка комнаты на главной (**редизайн, full-width «дверь + статус света»**).
  Раскладка: верх `[палитра 40px] · имя + НАСТРОЕНИЕ caps под ним · [вход — стеклянный шар]`;
  середина — **солнце-на-линии** (прогресс яркости); низ — тэлли `[круг-сумма + глянцевые шары
  дерева] [бейдж яркости]` (`flexWrap`, на узкой бейдж переносится).
  • Всё тонируется под цвет комнаты `cc = room.cardColor || T.neutral`; `lightCc`/`darkCc` —
    светлый/тёмный замес (`mix(cc,#fff)` / `mix(cc,T.bg)`) для переливающейся грани и линии.
  • **Glass-border**: заливка непрозрачная `clip→padding-box` (тело без волн), рамка `clip→border-box`
    переливается оттенками комнаты. `border: 1.5px solid transparent`.
  • **Прогресс**: `pct = min(100, round(ratio×100))`. Кап на 100%. Раньше было `ratio/2×100` — баг исправлен.
  • Данные: `forestScene(rt, room).name` (имя сцены — «Ореховая роща»), `getBright(ratio).name` (ярлык яркости — «Светло»). Тэлли — суммой `q` по `wood`.
- **`ForestMood.vue`** — блок настроения на странице комнаты. Прозрачный фон, на всю ширину; заголовок 17px/700 как «Светильники»; легенда 14px/500 белым; WOODLED Smart кнопка; горизонтальный слайдер карточек (82% ширины каждая) с фейдами по краям (скрываются при `atStart`/`atEnd`); пагинация-точки 12px / активная 32px, кликабельные. Получает `scene` + `knobs` пропсами из `RoomDetail` (computed) — это сохраняет глубокую реактивность.
- `RoomDetail.vue` — экран комнаты: параметры, дашборд люменов, **блок «Светильники»**
  (сетка 2×2 из `ZoneCard`), мебель, **`ForestMood`** (настроение), галерея, удаление. `scene = forestScene(...)` и `knobs = roomKnobs(...)` — computed.
- `ZoneCard.vue` — карточка-виджет зоны (новый дизайн): заголовок + бейдж % + кнопка «+»,
  скроллируемый список моделей (имя + глянцевый шар дерева, схлопывание одинаковых в «×N»),
  затухание снизу при переполнении, нижняя плашка с пипсами точек + стрелкой.
- `ZoneFixturesModal.vue` — белая модалка деталей зоны (отдельный компонент, дизайн правится тут).
- `AddFxModal.vue` — выбор коллекции/модели для добавления. `RoomSettings.vue` — параметры комнаты
  (заголовок «Параметры комнаты», эталон паттерна «скрыть StickyBar + lock scroll», см. ниже).
  **Последняя карточка слайдера = «Другой бренд»** (плюс по центру, без подписи), `emit('addCustom', zone)` вместо `emit('add', fx)` → `RoomDetail.addCustomFx()` создаёт placeholder, регистрирует кастом в MD, открывает `CustomFxEditor`.
- `FxEditor.vue` — страница светильника (см. «Поток добавления светильника» ниже). Сравнивает `getBright(...).name` со строками «Темно/Полусвет/Светло/Ярко/Праздник» — при переименовании статусов синхронизировать.
- **`CustomFxEditor.vue`** — параллельная страница для светильников другого бренда (не WOODLED). Открывается из `App.vue` через `v-if="activeFxData.fx.custom"` вместо обычного `FxEditor`. Свой набор полей (название/бренд/тип/цвет/источник света/мощность/корпус/температура). Паттерны как у FxEditor: NavHeader iOS large-title (через `IntersectionObserver` на `plateEl`), sticky-плашка «несохранённые изменения» (ТОЛЬКО при редактировании, для нового provisional её нет), спотлайт-кнопка `scrollToSave`, LeaveConfirmModal на back. Полная тех. спека — `WOODLED_кастомные_светильники_тех.md`.
- **`BuyModal.vue`** (он же «Мой Лес», открывается из StickyBar) — каталог заказа. Заголовок «Освещение в доме WOODLED». Фильтрует кастомов из списка через хелперы `woodledFx(r)` / `woodledEntries(r)` — кастомов нельзя заказать по WOODLED, у них цена 0₽. `woodledEntries` возвращает `{fx, idx}` с ОРИГИНАЛЬНЫМИ индексами из `r.fixtures` (нужно для discount/openFx).
- **`StoryModal.vue`** — модалка «Посмотрите на свой лес», 8 слайдов про дом целиком. На лесных сценах (не на старых mood). Слайд 3 — «Три места леса» (поляна/роща/чаща), слайд 4 — карта дома с именами `scene.name`, слайд 5 — контраст по `place`, слайд 8 — лампы + цоколи. Тексты собираются `engine/story-engine.ts` (`buildStorySlides`, `buildStoryContext`). Story НЕ дублирует ForestMood: ForestMood — про комнату с конкретикой, Story — верхнеуровневый взгляд на дом.
- `ui/SmartHelpModal.vue` — модалка «WOODLED Smart» (открывается из `ForestMood` и `FxEditor`). 5 секций: норма / отдача / шкала / «выбери за меня» / как пользоваться. Кнопка закрытия — «Супер!».
- `ui/NavHeader.vue` — единый sticky-хедер по iOS HIG: высота **44px**, кнопка «назад» белая 17px (стрелка 24px),
  заголовок 17px/600 по центру. Раскладка симметричная (3 зоны flex), заголовок усекается и не наезжает на кнопку.
  На странице светильника `back` = имя комнаты (`roomName`), иначе «Назад».
- `ui/LeaveConfirmModal.vue` — **общий** диалог выхода при несохранённых изменениях (FxEditor + RoomSettings).
  Затемняет фон в ноль, блокирует скролл (`touch-action:none` + `overscroll-behavior:contain`, плюс контейнер
  экрана `overflow:hidden`). Пропсы `title`/`saveLabel`. Эмиты `save` / `discard` / `cancel` (тап по фону).
- `Preloader.vue` — брендовая интро-анимация (один экран: ламели Rotor в круг). Версия сборки `VERSION`
  внизу полупрозрачно. Заголовок/подзаголовок крупно, как на share-странице.

## Блок настроения (`ForestMood` + `forest-cards`)
Полная спека текстов — `WOODLED_словарь_карточек_настроения.md`. Кратко:
- **Имя сцены** = «{Порода} {место}» (9 комбинаций: oak/walnut/black × glade/grove/thicket).
  Имя — про РАСПРЕДЕЛЕНИЕ, не про яркость. Тусклый верхний свет — всё равно поляна.
- **Легенда** = `${LEAD[place]}, ${BRIGHT_WARM[bright][warmth]}. ${cap(woodPhrase)}, ${furnPhrase}.`.
- **7 карточек** на конкретной сборке:
  1. Где свет — chip «{зона} {%}», текст с моделями + размерами (никогда `collection`/`name` модели, только `type` + `chip`).
  2. Сколько света — норма + why_room + вердикт + per-room обучение.
  3. Стены — **скрыта** при `medium`; иначе ±10/15%.
  4. Дерево — chip со склонением (`6 орехов · 3 дуба`), текст по wood × моделям через `fxNameGen` (родительный для «у X»).
  5. Мебель — **скрыта** при пустой; топ-2 предмета с %, последствие, совет через `FURN_HINT` + проверка пустых зон (`zoneFxCount`). Зеркало — отдельной строкой.
  6. Оттенок света — одна температура или смесь (с распределением по моделям).
  7. Потолок и подвес — **скрыта** при стандартном 2.7 без подвеса.
- **Анти-повтор** — `pick(arr, seed)`, сид = `fixtures.length * 17 + furnPct`.

## Поведение блока зон (важно при правках)
- Кнопка «+» активна → `emit('add')` → `AddFxModal`; при лимите → замок + `emit('limitHit')`
  → центр-тултип в `RoomDetail`.
- Клик по модели в списке → `emit('edit', idx)` → страница светильника (`openFx`).
- Нижняя плашка/стрелка → `emit('open')` → `ZoneFixturesModal`.
- Счётчик «X из Y» сверху = Σ `zoneFxCount` / Σ лимитов по зонам комнаты.

## Поток добавления светильника (FxEditor) — важно
Цель фидбэка «быстро натыкать»: добавление не загоняет в принудительный онбординг.
- **Быстрое добавление:** «+» → `AddFxModal` → «Выбрать» → `RoomDetail.addFx` кладёт `Fixture` в комнату
  и эмитит `openFx(roomId, fxIdx, isNew=true)`. FxEditor открывается **сразу на сводке** (`view='summary'`,
  дефолты применены), без пошагового онбординга. Тост «добавлен» тут НЕ показываем.
- **Провизорность:** `App.fxIsProvisional` (ставится по `isNew`). «Сохранить»/«Добавить» (`onFxSave`) фиксирует
  светильник; стрелка назад (`onFxClose`) **удаляет** несохранённый. Провизорный светильник на выходе
  спрашивает подтверждение ВСЕГДА (даже без правок) — иначе юзер уходит, думая что «добавил».
- **`isDirty`** = текущий `build` ≠ снимок `initialBuildSnapshot`. При изменениях — липкая плашка
  «несохранённые изменения» (цвет комнаты) с белой кнопкой; тап по кнопке → `scrollToSave`
  (мгновенный `behavior:'auto'` — иначе smooth двигает кнопку под пальцем) + спотлайт (затемнение
  + пульс-подсветка нижней кнопки ~2с). Назад при `isDirty || provisional` → `LeaveConfirmModal`.
- **«Гид по сборке»** (`launchGuided`) — пошаговый онбординг по запросу, внутри блока «Комплектация»:
  первый светильник (`!cfg.onboardedOnce`) → заметная плашка-CTA; дальше → тихая ссылка внизу блока.
- **Легаси-статус шагов:** «всё собрано» определяется по ОТСУТСТВИЮ поля `done` (`hasDoneField`),
  а не по пустому `done:[]` — иначе сохранённый несобранный светильник ошибочно «весь Готово».
- **Тост сохранения** (`App.onFxSave`): новый → «{Модель} в {Комнате}» (склонение `roomPrepName`),
  правки существующего → «Изменения сохранены». Оба с чёрным чекмарком (`showFB(msg,'check')`).

## Поток добавления для другого бренда (CustomFxEditor) — параллельный
Те же провизорность и тост-логика что у WOODLED, но через другой компонент и другую форму.
- **Вход:** `+` в ZoneCard → AddFxModal → последняя карточка «Другой бренд» → `emit('addCustom', zone)`
  → `RoomDetail.addCustomFx(zone)` создаёт `Fixture` с дефолтным `CustomSpec` (зависит от зоны),
  `registerCustom()` синхронно записывает запись в `MD`/`FX_FACTORS`, `emit('update')` + `openFx(roomId, idx, isNew=true)`.
- **Роутер:** `App.vue` через `v-if="activeFxData.fx.custom"` рендерит `CustomFxEditor` вместо
  `FxEditor`. Тот же `fxIsProvisional` / `onFxSave` / `onFxDelete` / `onFxClose` обработчик.
- **Поля формы:** название (16 chars) · бренд (12 chars, UPPERCASE, пусто → плашка `fxLine` скрыта в
  ZoneCard) · ссылка («Где посмотреть» с copy/paste кнопками, paste с fallback на `<input>.focus()`) ·
  тип (FxType dropdown) · спот → «Где крепится» (ceiling/wall) · люстра → размер · источник света
  (E27/E14/GX53/GU10/G9/LED/TAPE) · мощность по типу источника · корпус (open/shade/lamella → body) ·
  цвет 10 пресетов (3 WOODLED + латунь/белый/хром/никель/бронза/графит/тёплый серый) · оттенок света.
- **Превью «В комнату пойдёт»:** `lmPer × lamps × body × ambient` — ровно та же формула что у
  `engine/brightness.ts/fxLm` (diff кастома = 1, q = 1). Цифра в превью идентична той что сдвинет
  бейдж яркости в RoomDetail.
- **`isDirty` + плашка:** sticky-плашка «Есть несохранённые изменения» показывается ТОЛЬКО при
  `isDirty && !isProvisional` (для нового добавления она лишняя — нечего «не сохранять»). Сравнение
  spec идёт через `stripInputs()` — поле `inputs` (UI-state для reopen) не учитывается, чтобы
  reopen существующего fixture не помечал его dirty=true ложно.
- **Подтверждение больших люмен:** если manual lm ≥ 10 000 — модалка «{N} лм — точно?» перед save
  (страховка от опечатки). Из LeaveConfirm идёт мимо confirm'а — один таноз в потоке.

## Конвенции
- **Стили — инлайном** через `:style="{}"` (объекты), почти без CSS-классов. Скоуп-стили — только
  для псевдо (`::-webkit-scrollbar`, `:hover`).
- **Иконки — из `components/ui/Icons.vue`** (`<Icon name="…">` + `fxIcName(type)`). В наборе НЕТ
  `plus`/`chevron`/`x` — их рисуй инлайн-`<svg>` (как в `RoomDetail`/`ZoneCard`/модалках).
- **Акцент = цвет комнаты** = `room.cardColor` (фоллбэк `T.neutral`). В компонентах часто это проп `tint`. Всё, что должно перекрашиваться вместе с комнатой, завязывай на него.
- **В текстах никогда не используем `collection` и `name` модели** (Rotor / Rotor X / Rotor 1000). Только `MD[m].type` + `MD[m].chip` — «огромная люстра», «два торшера», «пара бра».
- **Прозрачность hex-суффиксами**: `${color}33` (≈20%), `${color}66` и т.п. (`OPACITY` в tokens).
- **Типографика заголовков/кнопок** на странице светильника приведена к единому **17px / 600**
  (как заголовок галереи «… в интерьере»). Бежевый `T.neutral` в блоке «Комплектация» заменён на белый.
- Модалка, которая должна скрывать `StickyBar` и лочить фон: в `onMounted` —
  `document.body/html.style.overflow='hidden'` + `cfg.showFlag.value=true`; в `onUnmounted` — вернуть;
  флаг добавить в `App.stickyVisible` (и при необходимости в `anyModalOpen` для звука).

## Подводные камни
- **Зоны завязаны на `id`** (`ceiling/wall/floor/table`), а не на `name`. `name` — только отображение.
  Пример: «Стол» переименован в «Мебель» правкой одного `name` в `ALL_ZONES`, id `table` нетронут —
  иначе ломаются `rooms.ts` limits, `templates`, `gallery`, `autosize`, `GLOW_POS`.
- **glow-распределение света** (`RoomDetail.glowLayers` + `GLOW_POS` + `zoneLm` + `glowOpacity`) — сложный
  алгоритм по id зон; при редизайне UI его не трогать.
- `RoomDetail` — фикс-оверлей `z-index: Z.roomDetail (40)` = стекинг-контекст. `StickyBar` снаружи
  имеет `z 41` → перекрывает содержимое RoomDetail. Поэтому модалки внутри RoomDetail нужно ещё и
  гасить `StickyBar` флагом (а не только z-index).
- «точка» = `zoneFxCount` = сумма `q` (не число записей). «светильник» = запись `Fixture`.
  «лампа» = `lamps × q` (яркость).
- **Синхронизация порогов BRIGHT.** Шкала бейджа `moods.ts/BRIGHT` (0.5/0.8/1.2/1.5),
  `copy.ts/lightState` и `forest.ts`/`forest-cards.ts` `brightLevel` (0.8/1.2) — должны быть согласованы.
  В `FxEditor` строковые сравнения с `'Темно'/'Полусвет'/'Светло'/'Ярко'/'Праздник'` — при переименовании
  синхронизировать (grep `selBright===`).
- **Падежи имён светильников.** В банках карточек используется `fxNameNom` (именительный),
  `fxNameGen` (для «от/у/без X»), `fxNameDat` (для «к X»). Не вставляй `fxNameNom` после «у/от/к».
  Для мебели — `FURN_GEN` (родительный имени из `data/furniture.ts`).
- **Старый mood-модуль** (`moods.ts` `MOODS`/`autoMood`/`moodDesc`/`moodPhase`/`buildMoodSlides`,
  `MoodBlock.vue`, `MoodDetailModal.vue`, `ratioToAngle`) — мёртвый, никем не используется в UI.
  Сейчас оставлен ради `BRIGHT`/`getBright` (живые). При чистке аккуратно: тип `MoodId` экспортируется
  из `rooms.ts`.
- **Глобальный `input::placeholder { …!important }`** в `App.vue` перебивает scoped-стили плейсхолдера —
  чтобы перекрасить, нужен класс + `!important` (см. `RoomSettings .name-input::placeholder`).
- **Спотлайт-подсветка кнопки:** оверлей затемнения `z-index:48` + кнопка `position:relative; z-index:49`
  (всплывает выше). Работает, т.к. корни экранов — `position:fixed` (свой стекинг-контекст). Затемнение
  гасить только через `opacity`-переход (без `visibility`, иначе обрывается фейд).
- **Шаринг и поля моделей.** `engine/share.ts` ведёт собственный список полей
  (`packRoom`/`unpackRoom`, `packFixture`/`unpackFixture`). При добавлении/
  переименовании поля в `Room` (`data/rooms.ts`), `Fixture` (`data/catalog.ts`)
  или `FxOpts` (`data/materials.ts`) — обязательно протянуть его в pack/unpack
  с тем же дефолтом, что используется при создании. Иначе у получателя ссылки
  поле молча подменится на дефолт: меняется тинт UI, плывут проценты яркости
  (через `wallFinishOf`→UF→`baseLm`), может уехать сцена/совет. Чек-лист и
  roundtrip-проверка — `WOODLED_шаринг.md`. Прецедент: `cardColor` забыли в
  pack после унификации физики стен — у получателя пропадал цвет и
  расходились %. Тип `PackedFixture.o` теперь `Partial<FxOpts>` —
  опции `materials.ts` поедут в ссылку без правок share.ts.
- **Sticky-плашки:** `NavHeader` 44px (z 10), плашка «несохранённые изменения» — `sticky top:44` (z 9).
  Клик «сохранить» вешать на саму кнопку-пилюлю, а не на всю плашку (иначе промах при тапе по «назад»).
- **Кастомные светильники (`Fixture.custom`)** — другой бренд хранится в самой Fixture, при загрузке
  регистрируется в `MD`/`FX_FACTORS` через `engine/custom-registry.ts/registerCustom()`. **Регистрация
  должна происходить ДО первого рендера** с этим fixture: 5 точек — `store.addFixture`,
  `store.updateFixture`, `store.updateRoom`, `store.restorePersistedState`, `store.loadFromHash` +
  синхронный вызов в `RoomDetail.addCustomFx()` перед `emit('update')`. Иначе `MD[fx.m] === undefined`
  → crash. Полная спека — `WOODLED_кастомные_светильники_тех.md`.
- **«Лес» = только WOODLED.** В 5 местах фильтруем `f.custom`-out: `forest.ts/woodOrder`,
  `forest-cards.ts/woodCard`, `story-engine.ts` (dominantWood/totalTrees/totalLamps/sceneMap.woods/
  lampsByCap/avgKelvin), `RoomCard.vue/tally`, `BuyModal.vue/woodledFx`. Кастомы участвуют в общей
  яркости (`fxLm`/`zoneLm`) но не в смысловом слое «леса».
- **`groupByKindZone` для «Где свет» — chip только у люстр.** В `forest-cards.ts` отдельный хелпер
  для карточки whereCard: ключ `${type}|${chip}|${zone}` где chip входит ТОЛЬКО для type='люстра'.
  Иначе `floor_lamp` (chip='тренога') + `floor_lamp_s` (chip='стойка') = две группы → текст «торшер,
  торшер». То же для бра гор./верт. и спотов разных подтипов. Остальные карточки (Дерево, Оттенок)
  продолжают использовать `groupByModel` где wood/btemp/chip содержательны.
- **`btemp` кастомов лежит в `f.custom.btemp`, а не `f.opts.btemp`** — все чтения температуры через
  chain `f.opts?.btemp ?? f.custom?.btemp ?? DEF_OPT.btemp` (`forest.ts/tempWarmth`,
  `forest-cards.ts/groupByModel`). Иначе кастом 2700K читался как 4000K и ломал «Оттенок» в ForestMood.
- **Module-level `let` сбрасывается при Vite HMR.** Если фича требует «помнить состояние в сессии до
  reload страницы» (как `PWAInstallBanner.dismissedInSession`), храни флаг в `document.body.dataset` —
  переживает HMR-перезагрузку модуля, очищается только полным reload. Прецедент: при HMR-обновлении
  любого vue-файла модуль баннера пересоздавался, dismissed-флаг сбрасывался, баннер возвращался.
- **Кликабельный родительский `<a>` ест промахи по дочернему `<button>`.** Если внутри ссылки стоит
  кнопка-крестик (как у `PWAInstallBanner`), палец, чуть промазавший мимо иконки, попадает на ссылку
  и навигирует. Решение: вынести кнопку из `<a>` через `position:absolute` с touch-area ≥44×44
  (iOS HIG), визуально внутри 28×28 круг. См. `PWAInstallBanner.vue`.
- **SoundButton разный top для главной/остальных** — `App.vue` через `isHome` computed:
  `isHome ? 'calc(20px + var(--wl-banner-h, 0px))' : '6px'`. На главной — в линию с бейджем
  «WOODLED Студия» (с учётом PWA-баннера); на FxEditor/CustomFxEditor/RoomDetail — в центре NavHeader.

## Как давать задачи (для скорости)
Называй конкретный экран/компонент, прикладывай скриншот, формулируй цель (а не только пиксели).
Прототипы дизайна удобно крутить отдельным `.jsx`-артефактом, и только потом переносить в `.vue`.
