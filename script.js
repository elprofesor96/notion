;(function () {
  'use strict';

  var btn = document.querySelector('.btn-theme');
  var sun = btn.querySelector('.icon-sun');
  var moon = btn.querySelector('.icon-moon');

  function applyTheme(light) {
    document.documentElement.classList.toggle('light', light);
    sun.style.display = light ? 'none' : '';
    moon.style.display = light ? '' : 'none';
    try { localStorage.setItem('catalogue-theme', light ? 'light' : 'dark'); } catch (e) { /* private browsing */ }
  }

  var saved = null;
  try { saved = localStorage.getItem('catalogue-theme'); } catch (e) { /* private browsing */ }
  applyTheme(saved === 'light');

  btn.addEventListener('click', function () {
    applyTheme(!document.documentElement.classList.contains('light'));
  });

  var yearEl = document.querySelector('.footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
