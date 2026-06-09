# WOODLED — Продажи и заявки менеджеру

Спека единой формы заявки (LeadModal) и пайплайна «фронт → GAS Web App → Google Sheet + Telegram-чат менеджера». Применять при правках `engine/lead-api.ts`, `engine/lead-text.ts`, `components/LeadModal.vue`, `components/ShareModal.vue` (3-я кнопка «Менеджеру»), а также `Code.gs` в Apps Script.

## 1. Архитектура и поток

```
Юзер                                      Фронт (Vue)                           GAS Web App                    Telegram
 │                                            │                                       │                          │
 │ нажимает кнопку (3 точки входа)            │                                       │                          │
 ├──────────────────────────────────────────►│ открывает LeadModal                   │                          │
 │                                            │ - prefetch shortShareUrl              │                          │
 │                                            │ - prefetch shortHouseShareUrl (fx)    │                          │
 │ заполняет имя + телефон + (tg) + чекбокс  │                                       │                          │
 ├──────────────────────────────────────────►│ submit:                               │                          │
 │                                            │ await prefetch promises (≤20 сек)     │                          │
 │                                            │ POST {leadId, source, ...} ──────────►│ doPost(payload)          │
 │                                            │                                       │ append row → Sheet       │
 │                                            │                                       │ sendMessage ──────────────►│ менеджеру в группу
 │                                            │ step='done' → онбординг 1 экран       │                          │
 │ нажимает «Написать в Telegram»            │                                       │                          │
 ├──────────────────────────────────────────►│ window.open(t.me/WOODLEDINFO) ────────────────────────────────────►│ прямой чат с менеджером
```

**Ключевая идея:** заявка падает менеджеру **до** того, как юзер начинает писать в Telegram. Юзер может вообще не открывать чат — менеджер позвонит/напишет первым по телефону или TG из заявки. Чат — опциональная быстрая дорожка для тех, кто хочет писать сам.

## 2. Три точки входа (`source`)

| `source` | Откуда нажимают | Заголовок NavHeader | Большой заголовок | Что отдаём GAS |
|---|---|---|---|---|
| `fixture` | `FxEditor` → «Купить»; `ShareModal` внутри FxEditor → «Менеджеру» | название светильника (`fxTitle(fx.m)` или `custom.name`) | «Заявка» | summary одного светильника + контекст комнаты + блок «В доме всего: N светильников» (если в доме есть ещё что-то); основной `shareUrl` — `#fx=...`, доп. `houseShareUrl` — `#s=...` |
| `forest` | `BuyModal` → «Отправить план леса»; `ShareModal` на главной/RoomDetail → «Менеджеру» (после **08.06.2026** объединили оба) | реальное имя дома (`cfg.name`), fallback «Новый Лес WOODLED» | «Заявка» | summary всех комнат с фикстурами; `shareUrl` — `#s=...` |
| `consult` | формально есть в типах, **сейчас не вызывается** (был для отдельной «консультации» из ShareModal — заменён на `forest`, см. выше) | «WOODLED Студия» | «Консультация» | минимальный summary; `shareUrl` — `#s=...` |

ShareModal-кнопка «Менеджеру» **на странице светильника** даёт `source='fixture'`; на всех остальных страницах — `source='forest'`. Логика разводки — в `App.vue` (`openLeadFromFx` / `openLeadFromForest` / `openLeadFromShare`) и `FxEditor.vue` (`onShareLead`).

## 3. Бэкенд: Google Apps Script

Один проект в [script.google.com](https://script.google.com), деплой как Web App (Anyone). Файл `Code.gs` — мастер-копия лежит в `/outputs/lead-bot-gas/` репозитория-аутпутов (не в src репо: вне него).

### Секреты — только в Apps Script
- `CFG.TG_TOKEN` — токен бота `@woodled_studio_bot`. Никогда не в коде фронта, не в git.
- `CFG.SHEET_ID` — id таблицы.
- `CFG.TG_GROUP_CHAT_ID` — id группового чата с менеджерами («WOODLED Студия – Заявки»). Отрицательное число.
- `CFG.MANAGER_USERNAME` — фолбэк-username (`WOODLEDINFO`) для подсказок бота.
- `CFG.TZ` — `Europe/Moscow` для timestamp.

URL Web App (`...exec`) — публичный, но обфусцируем base64 в `engine/lead-api.ts/WEBAPP_URL_B64`, декодируется через `atob`. Это снижает риск краулинга и DDoS, не более.

### Деплой и обновления
- Создать новое — Deploy → New deployment → Web app → Execute as: Me · Anyone.
- Обновить — **Manage deployments → карандашик → New version → Deploy**. URL **не меняется**, webhook **не нужно переставлять**. Если случайно нажать New deployment — будет новый URL и придётся обновлять `WEBAPP_URL_B64` + webhook.

### Схема `Leads` (Sheet)
```
A timestamp     B lead_id   C source       D status
E name          F phone     G tg_username  H room_count
I fixture_count J summary   K share_url
```

- `status` — `new / contacted / won / lost` (менеджер обновляет вручную).
- `phone` префиксуется апострофом перед записью (`"'" + phone`) — иначе Sheets читает `+7…` как формулу (`#ERROR!`).
- `timestamp` — `dd.MM.yyyy HH:mm:ss` в МСК через `Utilities.formatDate(new Date(), 'Europe/Moscow', '…')`.
- Полей `tg_chat_started`, `tg_user_id`, `notified` **больше нет** — удалены вместе с бот-флоу.

### Точки входа GAS
- `doGet(e)` — health-check (без параметров → `{ok:true, service:'woodled-lead-bot'}`). Legacy-путь `?data=` (GET с JSON) оставлен для обратной совместимости, но новые лиды летят POST'ом.
- `doPost(e)` — обрабатывает два типа:
  - Telegram webhook (есть `update_id` + `message`) — дедуп по `update_id` через `PropertiesService` (TG ретраит апдейты при 302-редиректе GAS), `handleTelegramMessage` отвечает «напишите менеджеру @WOODLEDINFO» если кто-то всё-таки запустит бота.
  - Лид от фронта (есть `leadId`) — `saveLead(body)` → Sheet + `notifyGroup`.

### Дедуп
- `update_id` Telegram-апдейтов — храним последние 200 в `ScriptProperties` под ключом `tg_seen`. Без него получали поток дублей сообщений в групповой чат.
- `leadId` фронта — если уже есть строка в Sheet, обновляем контакт (имя/телефон/tg), **не** шлём повторно в группу.

### Сообщение менеджеру (`notifyGroup`)
Структура (порядок строк важен — ссылка ВНАВЕРХУ, чтобы менеджер видел её первой):
```
{title}                          ← имя дома для forest, source-title для остальных
{shareUrl}                       ← короткая ссылка, БЕЗ префикса «Ссылка:» (TG её хайлайтит)

Контакт
Имя: {name}
Телефон: {phone}
Telegram: @{tgUsername}          ← опциональная строка
Размер: 4 комнаты, 14 светильников  ← только для не-fixture

{summary}                        ← полная комплектация

Ссылка на весь дом: {houseShareUrl}  ← опциональная, только для fixture-режима когда в доме >1 светильника

Лид: {leadId}
```

Дополнительно `disable_web_page_preview: true` в `sendTelegram` — иначе превью разрастаются и менеджер плохо ориентируется.

## 4. Фронт

### `engine/lead-api.ts`
- `LeadSource = 'fixture' | 'forest' | 'consult'` (consult сейчас не вызывается, но остаётся в типах).
- `LeadPayload` — имя, телефон, tgUsername, summary, shareUrl, houseShareUrl (опц.), houseName (опц.), roomCount, fixtureCount.
- `submitLead(payload)` — POST `Content-Type: text/plain;charset=utf-8` + `mode: 'no-cors'`. Это «simple request» по CORS-спеке, без preflight, GAS принимает тело через `e.postData.contents`. **Не использовать GET** — у GAS лимит URL ~8K, большой лес (10+ светильников) даёт summary 4-8K, и GET возвращает 400.
- `newLeadId()` — 8 символов hex из `crypto.randomUUID()`, fallback на Date+Math.random.
- `managerChatUrl()` — `https://t.me/WOODLEDINFO`. **Не** ведём на бота: TG deep-link `?start=<payload>` срабатывает только при ПЕРВОМ запуске бота юзером. У повторных пользователей payload теряется → бот не знает, какой лид прислать. Прямая ссылка на менеджера работает всегда.
- `WEBAPP_URL_B64` — base64-кодированный exec URL. Декодируется через `atob()`. Это **обфускация**, не шифрование — токен бота к нему не подменяется, для этого нужен доступ к Apps Script.

### `engine/lead-text.ts`
Сериализатор Room/Fixture в plain text для менеджера. Три точки входа:
- `buildFixtureLead(room, fxIdx, allRooms?)` — один светильник + контекст комнаты. Если `allRooms` передан и в доме есть кроме него ещё что-то — внизу добавляется «В доме всего: N светильников в M комнатах».
- `buildForestLead(rooms)` — все заполненные комнаты.
- `buildConsultLead(rooms)` — то же, что forest, при пустом доме отдаёт перечисление комнат.

**Имена моделей.** Внутри сериализатора `MD[m].name` («Rotor 1000») разрешено — это операционный лист для менеджера, не UI. В UI (карточки настроения, дашборд) `collection`/`name` запрещены, см. `NAMING_SPEC.md`.

**Кастомные.** Для `Fixture.custom` — отдельный блок: бренд (`custom.brand`), название (`custom.name`), ссылка `custom.url`, тип/цвет/источник/мощность/корпус/температура из `CustomSpec`.

### `components/LeadModal.vue`
Полноэкранная модалка (`Z.leadModal = 70`, выше FxEditor 60 и StoryOverlay 65). Лочит body-overflow + ставит `cfg.showLead.value = true`, App.vue по флагу скрывает StickyBar и SoundButton. Поверх неё может открыться `PrivacyModal` (`Z.privacyModal = 75`) — см. ниже про согласие 152-ФЗ.

Состояния:
- `form` — имя + телефон + tg (опц.) + чекбокс согласия.
- `sending` — спиннер, юзер не может вернуться.
- `done` — экран онбординга: галочка, «Видим Ваш Дом», подзаголовок про звонок/TG, кнопка «Написать в Telegram», подсказка под кнопкой про «Привет!».

**leadId** — генерируется один раз на mount. Если юзер двойным тапом дважды отправил — GAS отдедупит по leadId, второй вызов обновит контакт, но не задвоит уведомление.

**isDirty гард в FxEditor.** В `onBuyClick` (страница светильника), если `isDirty` — блокируем заявку и подсвечиваем «Сохранить». Иначе менеджер получит снимок ДО правок (юзер крутил настройки, но не сохранил) и будет рассинхрон.

**Форма пустая каждый раз.** Раньше использовался localStorage-persisted, но это создавало ощущение «данные не сбросились»: юзер открывал модалку повторно и видел свои прошлые имя/телефон/TG. Сейчас форма всегда стартует пустой. Можно вернуть persisted, если придёт фидбэк, но обязательно с явным «сброс».

### Маска телефона
Портирована из `BookMyLaunch.vue` (другой репо/проект, идентичная логика). Два режима по первой цифре:
- `mask` — если первая цифра `'7'`: формат `+7(XXX)XXX-XX-XX`, ровно 11 цифр.
- `free` — иначе: `+XX…` до 15 цифр (для иностранных).

Реализация — через `phoneDigits` ref (хранит только цифры) и `phoneMode` computed. Хелперы `formatMask`/`formatFree`/`cursorToDigitIndex`/`digitIndexToCursor`. Обработчики `onPhoneInput` (для autofill/paste) + `onPhoneKeydown` (блок нецифровых клавиш и аккуратное движение курсора через разделители).

**Не** использовать `v-model` на `<input type="tel">` — иначе синхронизация курсора ломается. Только `:value` + `@input` + `@keydown`.

### Согласие 152-ФЗ
Чекбокс «Принимаю политику обработки персональных данных» обязателен, без галки сабмит заблокирован (`canSubmit = name && phoneComplete && privacyConsent`). Текст без точки в конце, нейтрально-гендерный («Принимаю», не «Согласен/согласна»).

**Ссылка открывает встроенную `PrivacyModal`**, а НЕ ведёт на `/privacy` (отдельную страницу). Причина: переход на `/privacy` выкидывает юзера из конструктора и **сбрасывает уже заполненную форму** (имя, телефон, TG). Внутренняя модалка показывает тот же текст поверх формы (z=`Z.privacyModal=75`, выше LeadModal=70) — клик «Назад»/«Закрыть» возвращает к незатронутой форме.

В чекбоксе `@click.prevent.stop="showPrivacy=true"` — `.stop` обязателен, иначе клик по ссылке дёрнет и галку чекбокса.

Маршрут `/privacy` (`privacy.md` в корне) **оставлен** для SEO и для тех, кто шарит прямой URL. Файлы синхронизированы вручную — при правке политики обновлять оба (`privacy.md` для статической страницы, `PrivacyModal.vue` для встроенной).

Стилистика чекбокса: `display: flex; align-items: center` — текст вертикально по центру относительно галки, не центрирован относительно экрана.

### Префетч и шортнинг ссылок
Пока юзер заполняет форму, в фоне делается `shortenLongUrl()` через `engine/shortener.ts` (другой GAS-проект, открытый URL — это отдельная инфраструктура). Промисы хранятся в `shareShortPromise` / `houseShareShortPromise`. В `onSubmit` мы **ждём именно эти промисы** (`Promise.race` с 20-секундным таймаутом), а **не** запускаем новый `shortenLongUrl` — иначе при холодном Apps Script (>5 мин простоя без `warmupShortener`) оба запроса гонятся и проигрывают таймаут, в чат улетают длинные base64-ссылки.

## 5. ShareModal — третья кнопка «Менеджеру»

### Иконка только через `<img src="data:image/svg+xml;base64,...">`
Прямой `<svg>` внутри `<button :style="...">` в Vue по неустановленной причине ломает рендер третьей кнопки целиком (она занимает место в flex, но визуально невидима). Воспроизводилось стабильно на нескольких итерациях. Workaround — встроить SVG как data-URI и подавать через `<img>`. Vue компилятор такой `src` не парсит, браузер рендерит как обычную картинку.

iOS Safari дополнительно требует **base64**-кодирования. С `data:image/svg+xml;utf8,%3Csvg ...` Safari рисует placeholder «?» — он не любит URL-encoded data-URI с одинарными кавычками. Поэтому `data:image/svg+xml;base64,<base64>` — единственная надёжная форма.

Иконка — пузырь чата с тремя точками (Noun Project ID 945232, автор «i cons»). Атрибуцию из SVG-источника **обязательно** вырезать (исходный viewBox `0 0 100 125`, мы используем `0 0 100 100` — оставшиеся 25 пунктов внизу содержат текст «Created by i cons / from the Noun Project»). Цвет `#1a1a1a` зашит в `fill` — `currentColor` через `<img>` не работает.

### Hover/press без scoped CSS
Третья кнопка инлайн-стилизована (по той же причине, что и иконка — scoped-классы `.share-action` / `.share-action-circle` стабильно ломали рендер svg внутри). Hover-эффект (круг светлеет `#f5f5f5 → #ececec`) и press-анимация (`scale(0.96)`) реализованы через Vue refs `managerHover` / `managerPressed` + обработчики `@mouseenter/leave/down/up` и `@touchstart/end/cancel`. Любая попытка вернуться на shared CSS-классы — рискует воскресить баг с невидимой кнопкой.

### Эмиссия `lead`
ShareModal → `emit('lead')` + `emit('close')`. Получатели:
- `App.vue` для главной/RoomDetail/BuyModal-варианта → `openLeadFromShare` → `source='forest'`.
- `FxEditor.vue` для свой ShareModal (страница светильника) → `onShareLead` → `showShare=false` + `emit('lead')` наверх → App `openLeadFromFx` → `source='fixture'`.

## 6. Сценарии и mental-симуляция

### Сценарий A: «Купить» на странице светильника
1. FxEditor view=summary, isDirty=false → юзер жмёт «Купить».
2. `emit('lead')` → App `openLeadFromFx` → `leadCtx={source:'fixture', roomId, fxIdx}`.
3. LeadModal монтируется поверх FxEditor (z 70 > 60).
4. `summary` через `buildFixtureLead(room, fxIdx, rooms)` — этот светильник + контекст комнаты + «В доме всего» если есть ещё.
5. `shortShareUrl` — `#fx=`, `shortHouseShareUrl` — `#s=` (если есть кроме него ещё что-то).
6. Юзер заполняет имя+телефон, ставит галку, жмёт «Отправить».
7. `submitLead` POST → GAS → Sheet + сообщение в группе.
8. step=done → юзер открывает чат с менеджером (или нет).

### Сценарий B: «Отправить план леса» в BuyModal
1. BuyModal step=list → юзер жмёт «Отправить план леса».
2. `emit('lead')` → App `openLeadFromForest` → `leadCtx={source:'forest'}`.
3. LeadModal: rooms=cfg.rooms, houseName=cfg.name. NavHeader = «Живой Дом» (или что юзер задал).
4. `summary` через `buildForestLead(rooms)` — все заполненные комнаты.
5. `shortShareUrl` — `#s=...` от всего дома.
6. Дальше как A.

### Сценарий C: «Менеджеру» на главной (StickyBar → Поделиться → 3-я кнопка)
1. ShareModal на главной открыт.
2. Юзер жмёт «Менеджеру» → ShareModal `emit('lead')` + `emit('close')`.
3. App получает оба события: ShareModal закрывается, `openLeadFromShare` → `leadCtx={source:'forest'}`.
4. Дальше идентично B.

### Сценарий D: «Менеджеру» в ShareModal на странице светильника
1. FxEditor → юзер жмёт «Поделиться» в навбаре → ShareModal внутри FxEditor.
2. Юзер жмёт «Менеджеру» → ShareModal `emit('lead')` + `emit('close')`.
3. FxEditor `onShareLead` ловит `lead`, закрывает свою ShareModal, эмитит наверх.
4. App `openLeadFromFx` → `leadCtx={source:'fixture'}`.
5. Дальше как A (этот светильник).

## 7. Подводные камни

- **Бот webhook оставлен пассивным.** Если кто-то найдёт `@woodled_studio_bot` и нажмёт Start, бот ответит «напишите менеджеру @WOODLEDINFO». Удалять webhook не обязательно — он не мешает. Если надо снести: `https://api.telegram.org/bot<TOKEN>/deleteWebhook`.
- **POST text/plain, а не application/json.** application/json триггерит preflight CORS, GAS его не обрабатывает. text/plain — simple request, проходит напрямую с `no-cors`.
- **Превью ссылок отключено** (`disable_web_page_preview: true`). Иначе две ссылки (на светильник и на дом) тянут две большие превью-карточки с лого, и менеджер тратит время на скролл.
- **Шорт-URL может вернуть длинную.** Если шортнер упал/таймаут, `shortenLongUrl` возвращает оригинальную длинную ссылку (fallback). Это допустимо — лучше длинная, чем пустая, но менеджер видит base64-хвост на пару строк. Если регулярно — проверить шортнер-Apps-Script (отдельный проект, см. `engine/shortener.ts`).
- **`cfg.showLead`** должен быть в `anyModalOpen` и инверсно в `stickyVisible` в App.vue — иначе StickyBar и SoundButton торчат под формой.
- **Чёткий порядок в App.vue:** `<LeadModal v-if="leadCtx" ...>` рендерится **вне** блока `<template v-if="!activeFxData">`, чтобы перекрывать и FxEditor, и главную, и BuyModal/ShareModal одинаково.
- **iOS PWA + `t.me/...`** — `window.open(url, '_blank', 'noopener')` в standalone-режиме корректно открывает приложение Telegram, если установлено. Если не установлено — t.me в браузере. Проверять при обновлении PWA-настроек.
- **`/privacy`** работает как VitePress markdown-страница в корне (`privacy.md` с frontmatter). Стили обёрнуты в `.wl-privacy` класс — белый текст и разделители для тёмной темы. При деплое на новый домен — обязательно проверить mailto-ссылки `info@woodled-studio.ru`.

## 8. Что точно НЕ менять без обсуждения

- Структура полей Sheet — менеджер может смотреть напрямую, и любая правка ломает его привычку.
- Порядок строк в `notifyGroup` — ссылка ВНАВЕРХУ обязательна (UX-требование менеджера).
- `MANAGER_USERNAME` (`WOODLEDINFO`) — поменяется только если перейдёт другому человеку.
- POST text/plain паттерн — менять только при подтверждённой смене инфраструктуры.
- Третья кнопка ShareModal на инлайн-стилях — баг с scoped CSS воспроизводим, не возвращать на shared класс без эксперимента в feature-ветке.
