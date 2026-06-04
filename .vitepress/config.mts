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
    // Цвет — T.bg (#13110E), чтобы первый paint совпадал с темой кастомайзера.
    // Здесь же — keyframes для boot-loader, чтобы он начинал крутиться до
    // загрузки Vue-бандла.
    ['style', {}, `
      html, body { background: #13110E; }
      #app, .Layout, .VPContent { background: #13110E; }
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
        var rootEl = null, textEl = null, timers = [];
        function build(initialText) {
          if (document.getElementById('wl-boot')) return;
          rootEl = document.createElement('div');
          rootEl.id = 'wl-boot';
          rootEl.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:16px;padding:24px;color:#8B8075;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;z-index:99998;text-align:center;background:#13110E;opacity:0;transition:opacity .25s ease';
          rootEl.innerHTML = '<div style="width:28px;height:28px;border:2px solid #2E2921;border-top-color:#A89878;border-radius:50%;animation:wlBootSpin 1s linear infinite"></div><div id="wl-boot-text" style="font-size:14px;line-height:1.5;max-width:280px;font-weight:500"></div>';
          textEl = rootEl.querySelector('#wl-boot-text');
          if (initialText) textEl.textContent = initialText;
          document.body.appendChild(rootEl);
          requestAnimationFrame(function () { rootEl.style.opacity = '1'; });
        }
        function clearTimers() {
          for (var i = 0; i < timers.length; i++) clearTimeout(timers[i]);
          timers = [];
        }
        var Boot = {
          show: function (text, hints) {
            // Если уже визуально активен — просто перебиваем текст и
            // обновляем таймеры подсказок.
            clearTimers();
            if (!rootEl) build(text || '');
            else if (textEl && text) textEl.textContent = text;
            if (hints && hints.length) {
              for (var i = 0; i < hints.length; i++) (function (h) {
                timers.push(setTimeout(function () {
                  if (textEl) textEl.textContent = h.text;
                }, h.at));
              })(hints[i]);
            }
          },
          setText: function (text) {
            if (textEl) textEl.textContent = text;
          },
          clear: function () {
            clearTimers();
            if (rootEl && rootEl.parentNode) {
              var el = rootEl;
              el.style.opacity = '0';
              setTimeout(function () {
                if (el && el.parentNode) el.parentNode.removeChild(el);
              }, 300);
              rootEl = null; textEl = null;
            }
          },
        };
        window.__wlBoot = Boot;
        // Сценарий первого старта — стартует через 0.5с, чтобы быстрая
        // загрузка не мигала.
        function startInitial() {
          timers.push(setTimeout(function () {
            Boot.show('Загружаем лес WOODLED…', [
              { at: 8000,  text: 'Чуть дольше обычного. С VPN такое бывает — подождите минуту.' },
              { at: 20000, text: 'Не загружается? Проверьте интернет и обновите страницу.' },
            ]);
          }, 500));
        }
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', startInitial);
        } else { startInitial(); }
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
