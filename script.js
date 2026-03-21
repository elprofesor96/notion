;(function () {
  'use strict';

  var BASE = 'https://notion.elprofesor.io';

  // ── Theme ──

  var btn = document.querySelector('.btn-theme');
  var sun = btn.querySelector('.icon-sun');
  var moon = btn.querySelector('.icon-moon');

  function isLight() {
    return document.documentElement.classList.contains('light');
  }

  function applyTheme(light) {
    document.documentElement.classList.toggle('light', light);
    sun.style.display = light ? 'none' : '';
    moon.style.display = light ? '' : 'none';
    try { localStorage.setItem('catalogue-theme', light ? 'light' : 'dark'); } catch (e) { /* private browsing */ }
  }

  var previewLinks = document.querySelectorAll('.btn-preview');

  function updatePreviewLinks() {
    var suffix = isLight() ? '?theme=light' : '';
    for (var i = 0; i < previewLinks.length; i++) {
      var path = previewLinks[i].getAttribute('data-path');
      previewLinks[i].href = path + suffix;
    }
  }

  var saved = null;
  try { saved = localStorage.getItem('catalogue-theme'); } catch (e) { /* private browsing */ }
  applyTheme(saved === 'light');
  updatePreviewLinks();

  btn.addEventListener('click', function () {
    applyTheme(!isLight());
    updatePreviewLinks();
  });

  // ── Copy Embed URL ──

  var copyBtns = document.querySelectorAll('.btn-copy');

  for (var i = 0; i < copyBtns.length; i++) {
    copyBtns[i].addEventListener('click', handleCopy);
  }

  function handleCopy(e) {
    var btn = e.currentTarget;
    var path = btn.getAttribute('data-path');
    var url = BASE + path + (isLight() ? '?theme=light' : '');

    navigator.clipboard.writeText(url).then(function () {
      var clipboard = btn.querySelector('.icon-clipboard');
      var check = btn.querySelector('.icon-check');

      btn.classList.add('copied');
      clipboard.style.display = 'none';
      check.style.display = '';

      setTimeout(function () {
        btn.classList.remove('copied');
        clipboard.style.display = '';
        check.style.display = 'none';
      }, 2000);
    });
  }

  // ── Footer Year ──

  var yearEl = document.querySelector('.footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
