<template>
  <footer class="custom-footer">
    <nav class="custom-footer-nav">
      <a href="/journal">Журнал</a>
      <span class="dot">•</span>
      <a href="https://t.me/runscale" target="_blank" rel="noopener noreferrer">Телеграм-канал</a>
      <span class="dot">•</span>
      <a href="/support">Поддержка</a>
      <span class="dot">•</span>
      <a href="/terms">Условия использования</a>
      <span class="dot">•</span>
      <a href="/about/contacts">Контакт</a>
    </nav>
    <div class="custom-copy">© Модуль Роста® 2010 — 2025</div>
  </footer>
</template>

<script setup>
// Ничего не нужно импортировать — VitePress сам подхватит этот компонент вместо стандартного DocFooter
</script>

<style>
.custom-footer {
  padding: 24px 0;
  text-align: center;
  font-size: 0.875em;
  color: var(--vp-c-text-2);
}

.custom-footer-nav {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-bottom: 8px;
}

.custom-footer-nav a {
  text-decoration: none;
  color: inherit;
  transition: color 0.3s;
}

.custom-footer-nav a:hover {
  color: var(--vp-c-brand);
}

.dot {
  color: var(--vp-c-text-3);
}

.custom-copy {
  color: var(--vp-c-text-3);
  font-size: 0.75em;
}
</style>