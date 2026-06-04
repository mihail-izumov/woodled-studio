import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'WOODLED',
  description: 'WOODLED — дизайнерские светильники из дерева',
  lang: 'ru-RU',

  head: [
    ['meta', { name: 'viewport', content: 'width=device-width, initial-scale=1.0' }],
    ['link', { rel: 'icon', type: 'image/png', href: '/woodled-studio/apple-touch-icon.png' }],
    // iOS home-screen icon. sizes указывать обязательно (иначе iOS иногда
    // молча отказывается грузить), и желательно дублировать на /apple-touch-icon.png
    // в корне — некоторые версии Safari дёргают именно этот путь.
    ['link', { rel: 'apple-touch-icon', sizes: '180x180', href: '/woodled-studio/apple-touch-icon.png' }],
    ['link', { rel: 'apple-touch-icon-precomposed', sizes: '180x180', href: '/woodled-studio/apple-touch-icon.png' }],
    // iOS standalone mode (когда добавлено на экран Домой):
    //   • capable=yes  — запускать без Safari-хрома
    //   • title        — подпись под иконкой на спрингборде
    //   • status-bar   — прозрачный тёмный статус-бар (под тему сайта)
    //   • theme-color  — цвет статус-бара на Android
    ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
    ['meta', { name: 'apple-mobile-web-app-title', content: 'WOODLED' }],
    ['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' }],
    ['meta', { name: 'mobile-web-app-capable', content: 'yes' }],
    ['meta', { name: 'theme-color', content: '#13110E' }],
    // Full-screen app pages: dark base + hide default chrome from the first paint
    // (kills the white flash and the "WOODLED" nav bar blink between routes).
    // Цвет — T.bg (#13110E). ВАЖНО: !important всем контейнерам, иначе
    // на медленной загрузке встроенный VitePress CSS вкатывает белый фон
    // до того как наша тема приедет — пользователь видит white flash.
    // Здесь же — keyframes для boot-loader, чтобы он начинал крутиться до
    // загрузки Vue-бандла.
    ['style', {}, `
      html, body { background: #13110E !important; margin: 0; }
      #app, .Layout, .VPContent, .VPPage, .vp-doc { background: #13110E !important; }
      .VPNav, .VPLocalNav, .VPBackToTop, .VPFooter, .VPSidebar { display: none !important; }
      .VPContent { padding: 0 !important; }
      @keyframes wlBootSpin { to { transform: rotate(360deg); } }
    `],
    // Boot-loader: универсальный полноэкранный спиннер с текстом, который
    // работает БЕЗ Vue. Используется в двух сценариях:
    //   1) Первый старт PWA — Vue ещё не подгрузился, нужно показать что
    //      приложение запускается. На 8с — подсказка про VPN, на 20с —
    //      «не загружается? обновите».
    //   2) Reload-кнопка из ReloadButton.vue. Вызывает __wlBoot.show()
    //      и сразу запускает location.reload(), чтобы пользователь видел
    //      обратную связь СРАЗУ, а не пытался тыкать кнопку второй раз.
    //
    // Публичное API на window.__wlBoot:
    //   show(text, hints?) — показать оверлей с initial-текстом и опц.
    //     массивом [{at: ms, text: '...'}] — отложенными подсказками
    //   setText(text)     — перебить текущий текст (например с App.vue)
    //   clear()           — плавно убрать оверлей (Vue зовёт после mount)
    ['script', {}, `
      (function () {
        var rootEl = null, textEl = null, timers = [], pendingShow = null;
        function build(initialText) {
          if (document.getElementById('wl-boot')) return;
          rootEl = document.createElement('div');
          rootEl.id = 'wl-boot';
          // z-index максимум, opacity сразу 1, фон жёстко #13110E — чтобы
          // не было борьбы с VitePress slot-ами и белого мига.
          rootEl.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:16px;padding:24px;color:#8B8075;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;z-index:2147483647;text-align:center;background:#13110E;opacity:1';
          rootEl.innerHTML = '<div style="width:28px;height:28px;border:2px solid #2E2921;border-top-color:#A89878;border-radius:50%;animation:wlBootSpin 1s linear infinite"></div><div id="wl-boot-text" style="font-size:14px;line-height:1.5;max-width:280px;font-weight:500"></div>';
          textEl = rootEl.querySelector('#wl-boot-text');
          if (initialText) textEl.textContent = initialText;
          document.body.appendChild(rootEl);
        }
        // Поллим body. На медленных каналах DOMContentLoaded приходит
        // позже, чем нам хотелось бы; пока body нет — просто ждём по 16мс.
        function whenBody(cb) {
          if (document.body) { cb(); return; }
          var iv = setInterval(function () {
            if (document.body) { clearInterval(iv); cb(); }
          }, 16);
        }
        function clearTimers() {
          for (var i = 0; i < timers.length; i++) clearTimeout(timers[i]);
          timers = [];
        }
        var Boot = {
          show: function (text, hints) {
            // Если уже визуально активен — перебиваем текст и таймеры.
            clearTimers();
            var doShow = function () {
              if (!rootEl) build(text || '');
              else if (textEl && text) textEl.textContent = text;
              if (hints && hints.length) {
                for (var i = 0; i < hints.length; i++) (function (h) {
                  timers.push(setTimeout(function () {
                    if (textEl) textEl.textContent = h.text;
                  }, h.at));
                })(hints[i]);
              }
            };
            if (document.body) doShow();
            else whenBody(doShow);
          },
          setText: function (text) {
            if (textEl) textEl.textContent = text;
          },
          clear: function () {
            clearTimers();
            if (rootEl && rootEl.parentNode) {
              var el = rootEl;
              el.style.transition = 'opacity .3s ease';
              el.style.opacity = '0';
              setTimeout(function () {
                if (el && el.parentNode) el.parentNode.removeChild(el);
              }, 320);
              rootEl = null; textEl = null;
            }
          },
        };
        window.__wlBoot = Boot;
        // Initial show — сразу, без задержки. Иначе на медленной загрузке
        // (VPN) пользователь видит несколько сот мс пустого экрана.
        // Текст и таймеры зависят от того, как пришёл пользователь:
        //  • штатное открытие → «Загружаем лес WOODLED…», подсказки на 6с/18с
        //  • после ReloadButton (флаг ?_reload=1) → «Перезагружаем…»,
        //    подсказки на 4с/10с. Это переживает navigation: новая страница
        //    подхватывает контекст из query и продолжает «вид» старой.
        var isReload = false;
        try {
          isReload = new URLSearchParams(window.location.search).get('_reload') === '1';
        } catch (e) { /* старые браузеры */ }
        if (isReload) {
          Boot.show('Перезагружаем…', [
            { at: 4000,  text: 'Долго не отвечает. С VPN такое бывает — подождите.' },
            { at: 10000, text: 'Не получается? Закройте и откройте приложение, проверьте интернет.' },
          ]);
        } else {
          Boot.show('Загружаем лес WOODLED…', [
            { at: 6000,  text: 'Чуть дольше обычного. С VPN такое бывает — подождите.' },
            { at: 18000, text: 'Не загружается? Проверьте интернет и обновите страницу.' },
          ]);
        }
      })();
    `],
  ],

  base: '/woodled-studio/',
  cleanUrls: true,
  appearance: false,
  outDir: '.vitepress/dist',

  themeConfig: {
    siteTitle: 'WOODLED',
    nav: [],
    sidebar: {},
  },
})
