# Безопасная интеграция Telegram-бота с фронтенд-формой

## Проблема

Telegram-бот управляется через токен. Если токен попадает в клиентский JavaScript — любой посетитель сайта может его украсть и захватить бота.

### Что НЕЛЬЗЯ делать

```javascript
// ❌ НИКОГДА — Vite инлайнит VITE_ переменные в клиентский JS-бандл
const TOKEN = import.meta.env.VITE_TG_BOT_TOKEN

// ❌ НИКОГДА — токен виден в DevTools → Sources
fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, ...)

// ❌ НИКОГДА — даже если .env в .gitignore, после сборки токен в dist/
// файл .env НЕ помогает, потому что Vite вшивает значение в бандл при сборке
```

### Почему .env + .gitignore недостаточно

```
1. Разработчик кладёт токен в .env
2. .env добавлен в .gitignore ← кажется безопасным
3. Vite при сборке читает VITE_* из .env
4. Вшивает значение ПРЯМО В JavaScript-бандл (dist/assets/xxx.js)
5. Бандл деплоится на хостинг
6. Любой посетитель → DevTools → видит токен в JS
7. Бот захвачен
```

---

## Решение: Google Apps Script как серверный прокси

```
Браузер (форма)                    Google Apps Script              Telegram
     │                                    │                           │
     │  GET ?data={json}                  │                           │
     ├───────────────────────────────────→│                           │
     │  (URL скрипта — не секрет)         │  POST /sendMessage        │
     │                                    │  + токен (СЕКРЕТ,         │
     │                                    │    только на сервере)      │
     │                                    ├──────────────────────────→│
     │                                    │                           │
     │  opaque response (no-cors)         │  {"ok": true}             │
     │←───────────────────────────────────┤←──────────────────────────┤
```

Токен живёт ТОЛЬКО внутри Google Apps Script. В git, в клиентском коде, в бандле — его нет.

---

## Пошаговая настройка

### Шаг 1. Создать бота

1. Telegram → @BotFather → `/newbot`
2. Задать имя и username (должен заканчиваться на `bot`)
3. Сохранить токен (вида `7123456789:AAH-xxxxx`)
4. Написать боту любое сообщение (`/start`)
5. Открыть в браузере: `https://api.telegram.org/bot<ТОКЕН>/getUpdates`
6. Найти `"chat":{"id": ЧИСЛО}` — это Chat ID

### Шаг 2. Создать Google Apps Script

1. Открыть [script.google.com](https://script.google.com) → Новый проект
2. Вставить код (см. ниже)
3. Подставить токен и Chat ID
4. **Деплой** → **Новое развёртывание** → Тип: **Веб-приложение**
   - Запуск от имени: **Я**
   - Кто имеет доступ: **Все**
5. Скопировать URL (вида `https://script.google.com/macros/s/.../exec`)
6. Проверить в браузере — должно показать `{"status":"ok",...}`

### Шаг 3. Подключить форму к скрипту

В клиентском коде:

```javascript
// URL скрипта закодирован в base64 (см. раздел про base64 ниже)
const _f = 'BASE64_СТРОКА_СЮДА'
const API_URL = typeof atob !== 'undefined' ? atob(_f) : ''

async function submitForm(formData) {
  const payload = JSON.stringify(formData)
  // GET + no-cors — обходит CORS и проблему потери тела при редиректе
  await fetch(API_URL + '?data=' + encodeURIComponent(payload), { mode: 'no-cors' })
}
```

### Шаг 4. Обновление скрипта без смены URL

При изменении кода скрипта:
- **Деплой** → **Управление развёртываниями** → **карандашик** (редактировать)
- Версия: **Новая версия**
- Нажать **Развернуть**

URL остаётся прежним. НЕ создавать новое развёртывание — иначе URL сменится.

---

## Код Google Apps Script (Code.gs)

```javascript
const TG_BOT_TOKEN = 'ВСТАВИТЬ_ТОКЕН'
const TG_CHAT_ID   = 'ВСТАВИТЬ_CHAT_ID'

function sendToTelegram(data) {
  const name       = data.name || '—'
  const company    = data.company || '—'
  const contact    = data.contact || '—'
  const bottleneck = data.bottleneck || '—'
  const otherText  = data.otherText ? '\n  Другое: ' + data.otherText : ''
  const revenue    = data.revenue || '—'
  const urgency    = data.urgency || '—'

  const text = [
    '*Новая заявка*',
    '',
    '*Имя:* ' + name,
    '*Компания/Проект:* ' + company,
    '*Телефон:* ' + contact,
    '',
    '*Что тормозит:* ' + bottleneck + otherText,
    '*Оборот:* ' + revenue,
    '*Когда нужно:* ' + urgency,
  ].join('\n')

  const url = 'https://api.telegram.org/bot' + TG_BOT_TOKEN + '/sendMessage'

  const res = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({
      chat_id: TG_CHAT_ID,
      text: text,
      parse_mode: 'Markdown',
    }),
  })

  return JSON.parse(res.getContentText())
}

function doGet(e) {
  try {
    if (e.parameter.data) {
      const data = JSON.parse(e.parameter.data)
      const result = sendToTelegram(data)
      return ContentService
        .createTextOutput(JSON.stringify({ ok: result.ok }))
        .setMimeType(ContentService.MimeType.JSON)
    }
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok', service: 'lead-form' }))
      .setMimeType(ContentService.MimeType.JSON)
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON)
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents)
    const result = sendToTelegram(data)
    return ContentService
      .createTextOutput(JSON.stringify({ ok: result.ok }))
      .setMimeType(ContentService.MimeType.JSON)
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON)
  }
}

function testSend() {
  const e = {
    parameter: {
      data: JSON.stringify({
        name: 'Тест', company: 'Тестовая', contact: '+7999',
        bottleneck: 'тест', otherText: '', revenue: 'стартап', urgency: 'вчера'
      })
    }
  }
  const result = doGet(e)
  Logger.log(result.getContent())
}
```

---

## Base64 кодирование URL

### Зачем

URL Google Apps Script не является секретом (без токена бота он бесполезен), но лучше его скрыть от автоматических сканеров и любопытных глаз. Base64 — обфускация, не шифрование.

### Как закодировать

В терминале:
```bash
echo -n 'https://script.google.com/macros/s/AKfycb.../exec' | base64 -w0
```

Флаг `-w0` — вывод в одну строку без переносов.

### Как использовать в коде

```javascript
const _f = 'aHR0cHM6Ly9zY3Jp...'  // base64-строка
const API_URL = typeof atob !== 'undefined' ? atob(_f) : ''
```

`atob()` — встроенная функция браузера, декодирует base64 в строку.

### Проверка

```bash
# Закодировать
echo -n 'https://example.com/exec' | base64 -w0
# → aHR0cHM6Ly9leGFtcGxlLmNvbS9leGVj

# Раскодировать обратно
echo 'aHR0cHM6Ly9leGFtcGxlLmNvbS9leGVj' | base64 -d
# → https://example.com/exec
```

---

## Почему GET, а не POST

Google Apps Script при обработке POST-запросов делает **302 редирект**. Браузер при редиректе **теряет тело запроса** (POST body). Поэтому данные не доходят.

GET-запрос с параметрами (`?data=...`) не имеет этой проблемы — параметры являются частью URL и сохраняются при любых редиректах.

### Почему `mode: 'no-cors'`

Google Apps Script не всегда возвращает заголовок `Access-Control-Allow-Origin`. Без `no-cors` браузер блокирует запрос с ошибкой CORS.

С `no-cors`:
- Запрос **уходит** и обрабатывается сервером
- Ответ **непрозрачный** — его нельзя прочитать в браузере
- Это нормально — нам не нужен ответ, достаточно факта отправки

---

## .gitignore

Минимально необходимое:

```gitignore
# Зависимости
node_modules

# Сборка (может содержать инлайненные секреты)
.vitepress/dist
.vitepress/cache
dist

# Переменные окружения
.env
.env.*
.env.local
.env.production
```

### Что .gitignore НЕ защищает

- Строки внутри отслеживаемых файлов (токены, вшитые в .vue/.js)
- Файлы, которые уже были закоммичены (остаются в истории git)
- Скомпилированный бандл если он деплоится отдельно

### Если токен уже попал в git

```bash
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch .env .env.*' \
  --prune-empty --tag-name-filter cat -- --all
git push --force --all
```

После этого — **обязательно отозвать старый токен** через @BotFather → `/revoke`.

---

## Чеклист безопасности

- [ ] Токен бота **НЕ** в клиентском коде (никаких `VITE_*`)
- [ ] Токен бота **НЕ** в git-репозитории (ни в файлах, ни в истории)
- [ ] Токен бота **ТОЛЬКО** в Google Apps Script
- [ ] Google Apps Script задеплоен как **Веб-приложение** (не Библиотека)
- [ ] Доступ к скрипту: **Все**
- [ ] URL скрипта закодирован в base64 в клиентском коде
- [ ] Форма отправляет данные через **GET + no-cors**
- [ ] `.env` и `dist/` в `.gitignore`
- [ ] `testSend()` проходит — сообщение приходит в бота

---

## Отладка

| Симптом | Причина | Решение |
|---------|---------|---------|
| CORS ошибка в консоли | Нет `mode: 'no-cors'` или используется POST | Переключить на GET + `mode: 'no-cors'` |
| Форма «отправлена» но бот молчит | Тело запроса потеряно при редиректе | Использовать GET с `?data=` параметром |
| 404 от Telegram API | Неверный токен | Проверить токен: `api.telegram.org/bot<токен>/getMe` |
| «Не удалось открыть файл» | Скрипт задеплоен как Библиотека | Передеплоить как Веб-приложение |
| Скрипт возвращает старую версию | Не выбрана «Новая версия» при деплое | Управление развёртываниями → карандашик → Новая версия |
| `getUpdates` пустой | Бот не получал сообщений | Написать боту `/start`, потом повторить |
