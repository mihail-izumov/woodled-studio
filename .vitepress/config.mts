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
    // Boot-loader: показывает спиннер и текст до загрузки JS-бандла.
    // Сценарий: пользователь в PWA с VPN — JS может тянуться 10–30 сек,
    // экран остаётся пустым. Этот inline-скрипт работает на чистом DOM,
    // через 0.5с показывает «Загружаем…», на 8с подсказывает про VPN,
    // на 20с — переключается на «не загружается? обновите».
    // Vue после mount вызывает window.__woodledBootClear() — слой исчезает.
    ['script', {}, `
      (function () {
        var SHOW_AFTER = 500, HINT_AT = 8000, WARN_AT = 20000;
        var rootEl = null, textEl = null, t1 = null, t2 = null, t3 = null;
        function build() {
          if (document.getElementById('wl-boot')) return;
          rootEl = document.createElement('div');
          rootEl.id = 'wl-boot';
          rootEl.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:16px;padding:24px;color:#8B8075;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;z-index:9999;text-align:center;background:#13110E;opacity:0;transition:opacity .4s ease';
          rootEl.innerHTML = '<div style="width:28px;height:28px;border:2px solid #2E2921;border-top-color:#A89878;border-radius:50%;animation:wlBootSpin 1s linear infinite"></div><div id="wl-boot-text" style="font-size:14px;line-height:1.5;max-width:280px;font-weight:500">Загружаем лес WOODLED…</div>';
          textEl = rootEl.querySelector('#wl-boot-text');
          document.body.appendChild(rootEl);
          requestAnimationFrame(function () { rootEl.style.opacity = '1'; });
        }
        function start() {
          if (window.__woodledBootCleared) return;
          t1 = setTimeout(build, SHOW_AFTER);
          t2 = setTimeout(function () {
            if (textEl) textEl.textContent = 'Чуть дольше обычного. С VPN такое бывает — подождите минуту.';
          }, HINT_AT);
          t3 = setTimeout(function () {
            if (textEl) textEl.textContent = 'Не загружается? Проверьте интернет и обновите страницу.';
          }, WARN_AT);
        }
        window.__woodledBootClear = function () {
          window.__woodledBootCleared = true;
          if (t1) clearTimeout(t1); if (t2) clearTimeout(t2); if (t3) clearTimeout(t3);
          if (rootEl && rootEl.parentNode) {
            rootEl.style.opacity = '0';
            setTimeout(function () {
              if (rootEl && rootEl.parentNode) rootEl.parentNode.removeChild(rootEl);
            }, 400);
          }
        };
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', start);
        } else { start(); }
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
