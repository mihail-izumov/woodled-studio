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

      /* Branded boot-preloader — копия Preloader.vue для работы до
         загрузки Vue-бандла. Те же имена классов, что в Preloader.vue,
         не конфликтуют благодаря Vue scoped-стилям (Vue добавляет
         data-атрибут к своим селекторам). */
      .wl-pl { position: fixed; top:0; left:0; right:0; bottom:0; z-index:2147483647; background:#0A0908; color:#F0EAE0; font-family:'SF Pro Display',-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',system-ui,sans-serif; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:0 24px; overflow:hidden; -webkit-font-smoothing:antialiased; opacity:1; transition:opacity .5s ease; }
      .wl-pl-logo { font-size:clamp(26px,6vw,40px); font-weight:600; letter-spacing:-0.02em; line-height:1; color:#F0EAE0; text-align:center; margin-bottom:44px; opacity:0; transform:translateY(10px); transition:opacity 1s ease, transform 1s ease; }
      .wl-pl-logo.v { opacity:1; transform:translateY(0); }
      .wl-pl-stage { position:relative; width:100%; max-width:340px; height:240px; display:flex; align-items:center; justify-content:center; margin-bottom:44px; }
      .wl-pl-rotor { position:absolute; width:200px; height:200px; display:flex; align-items:center; justify-content:center; opacity:0; transition:opacity 1.2s ease; }
      .wl-pl-rotor.v { opacity:1; }
      .wl-pl-asm { width:200px; height:200px; position:relative; }
      .wl-pl-asm.spin { animation:wlPlSpin 48s linear infinite; }
      .wl-pl-rs { position:absolute; top:50%; left:50%; width:6px; height:60px; border-radius:2px; margin-top:-30px; margin-left:-3px; transform-origin:center center; opacity:0; transition:transform 1s, opacity .8s; background:linear-gradient(to bottom, #d4b87a, #b4915a, #8a6e3e); }
      .wl-pl-rs.in { opacity:.85; }
      .wl-pl-sub { text-align:center; max-width:360px; font-size:clamp(15px,4vw,18px); font-weight:600; line-height:1.45; letter-spacing:.1px; color:#F0EAE0; opacity:0; transform:translateY(14px); transition:opacity .6s ease, transform .6s ease; }
      .wl-pl-sub.v { opacity:1; transform:translateY(0); }
      .wl-pl-ver { position:absolute; left:0; right:0; bottom:calc(env(safe-area-inset-bottom, 0px) + 22px); text-align:center; font-size:12px; font-weight:500; letter-spacing:.06em; color:#C0B8AE; opacity:.35; }
      @keyframes wlPlSpin { to { transform:rotate(360deg); } }
      @media (max-width:420px) {
        .wl-pl-logo { margin-bottom:32px; }
        .wl-pl-stage { height:200px; margin-bottom:32px; }
      }
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
        var mode = null;       // 'simple' (reload) | 'branded' (initial)
        var startTime = 0;     // время старта branded preloader
        var LAMEL_COUNT = 20, R_FAR = 170, R_NEAR = 80;

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

        function buildSimple(initialText) {
          rootEl = document.createElement('div');
          rootEl.id = 'wl-boot';
          rootEl.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:16px;padding:24px;color:#8B8075;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;z-index:2147483647;text-align:center;background:#13110E;opacity:1';
          rootEl.innerHTML = '<div style="width:28px;height:28px;border:2px solid #2E2921;border-top-color:#A89878;border-radius:50%;animation:wlBootSpin 1s linear infinite"></div><div id="wl-boot-text" style="font-size:14px;line-height:1.5;max-width:280px;font-weight:500"></div>';
          textEl = rootEl.querySelector('#wl-boot-text');
          if (initialText) textEl.textContent = initialText;
          document.body.appendChild(rootEl);
        }

        function buildBranded(initialText) {
          rootEl = document.createElement('div');
          rootEl.id = 'wl-boot';
          rootEl.className = 'wl-pl';
          var lamelles = '';
          for (var i = 0; i < LAMEL_COUNT; i++) {
            var deg = i / LAMEL_COUNT * 360;
            lamelles += '<div class="wl-pl-rs" style="transform:rotate(' + deg + 'deg) translateY(-' + R_FAR + 'px);transition-delay:' + (i * 50) + 'ms"></div>';
          }
          rootEl.innerHTML =
            '<div class="wl-pl-logo" id="wl-pl-logo">WOODLED&nbsp;Студия</div>' +
            '<div class="wl-pl-stage"><div class="wl-pl-rotor" id="wl-pl-rotor"><div class="wl-pl-asm" id="wl-pl-asm">' + lamelles + '</div></div></div>' +
            '<div class="wl-pl-sub" id="wl-boot-text">' + (initialText || '') + '</div>' +
            '<div class="wl-pl-ver">v0.3</div>';
          textEl = rootEl.querySelector('#wl-boot-text');
          document.body.appendChild(rootEl);
          startTime = Date.now();
          // Stage 1 (+50мс): тексты проявляются, ламели влетают в круг.
          timers.push(setTimeout(function () {
            var logo = document.getElementById('wl-pl-logo');
            var rotor = document.getElementById('wl-pl-rotor');
            var rss = rootEl ? rootEl.querySelectorAll('.wl-pl-rs') : [];
            if (logo) logo.classList.add('v');
            if (textEl) textEl.classList.add('v');
            if (rotor) rotor.classList.add('v');
            for (var i = 0; i < rss.length; i++) {
              var deg = i / LAMEL_COUNT * 360;
              rss[i].classList.add('in');
              rss[i].style.transform = 'rotate(' + deg + 'deg) translateY(-' + R_NEAR + 'px)';
            }
          }, 50));
          // Stage 2 (+2500мс): start slow spin.
          timers.push(setTimeout(function () {
            var asm = document.getElementById('wl-pl-asm');
            if (asm) asm.classList.add('spin');
          }, 2500));
        }

        var Boot = {
          // Простой спиннер с текстом — для reload и быстрых сообщений.
          show: function (text, hints) {
            clearTimers();
            var doShow = function () {
              if (!rootEl) { mode = 'simple'; buildSimple(text || ''); }
              else if (textEl && text) textEl.textContent = text;
              if (hints && hints.length) {
                for (var i = 0; i < hints.length; i++) (function (h) {
                  timers.push(setTimeout(function () {
                    if (textEl) textEl.textContent = h.text;
                  }, h.at));
                })(hints[i]);
              }
            };
            if (document.body) doShow(); else whenBody(doShow);
          },
          // Брендовый preloader — копия Preloader.vue для initial-сценария.
          showBranded: function (text, hints) {
            clearTimers();
            var doShow = function () {
              if (!rootEl) {
                mode = 'branded';
                buildBranded(text || '');
                window.__wlBranded = true;
              } else if (textEl && text) {
                textEl.textContent = text;
              }
              if (hints && hints.length) {
                for (var i = 0; i < hints.length; i++) (function (h) {
                  timers.push(setTimeout(function () {
                    if (textEl) textEl.textContent = h.text;
                  }, h.at));
                })(hints[i]);
              }
            };
            if (document.body) doShow(); else whenBody(doShow);
          },
          setText: function (text) { if (textEl) textEl.textContent = text; },
          // Закрытие. Для simple — стандартный fade-out. Для branded
          // делаем финал: ждём минимум до 2с от старта (чтобы пользователь
          // увидел анимацию), переключаем подзаголовок на оригинальный
          // тэглайн «Настоящее дерево становится живым светом в доме»,
          // даём 1.2с прочитать — и фейдаемся.
          clear: function () {
            clearTimers();
            if (!rootEl) return;
            if (mode === 'branded') {
              var elapsed = Date.now() - startTime;
              var waitMin = Math.max(0, 2000 - elapsed);
              timers.push(setTimeout(function () {
                if (textEl) textEl.textContent = 'Настоящее дерево становится живым светом в доме';
                timers.push(setTimeout(function () {
                  if (!rootEl) return;
                  var el = rootEl;
                  el.style.opacity = '0';
                  setTimeout(function () {
                    if (el && el.parentNode) el.parentNode.removeChild(el);
                  }, 500);
                  rootEl = null; textEl = null;
                  try { window.dispatchEvent(new CustomEvent('wl:preloader-done')); } catch (e) {}
                }, 1200));
              }, waitMin));
            } else {
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

        // Initial: какой preloader показать?
        //  • штатное открытие PWA → branded (копия Preloader.vue).
        //    Подсказки про VPN на 6с/18с.
        //  • после ReloadButton (флаг ?_reload=1) → simple-спиннер,
        //    подсказки на 4с/10с. Это переживает navigation: новая
        //    страница подхватывает контекст из query.
        var isReload = false;
        try { isReload = new URLSearchParams(window.location.search).get('_reload') === '1'; } catch (e) {}
        if (isReload) {
          Boot.show('Перезагружаем…', [
            { at: 4000,  text: 'Долго не отвечает. С VPN такое бывает — подождите.' },
            { at: 10000, text: 'Не получается? Закройте и откройте приложение, проверьте интернет.' },
          ]);
        } else {
          Boot.showBranded('Загружаем лес WOODLED…', [
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
