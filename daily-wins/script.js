;(function () {
  'use strict';

  // ── Theme ──
  if (new URLSearchParams(window.location.search).get('theme') === 'light') {
    document.documentElement.classList.add('light');
  }

  // ── Constants ──
  var STORAGE_KEY = 'dailyWins';
  var MAX_WINS = 10;

  // ── DOM ──
  var input      = document.querySelector('.win-input');
  var addBtn     = document.querySelector('.btn-add');
  var list       = document.querySelector('.win-list');
  var doneEl     = document.querySelector('.counter-done');
  var totalEl    = document.querySelector('.counter-total');
  var celebration = document.querySelector('.celebration');

  // ── State ──
  var state = { date: '', wins: [] };
  var nextId = 1;
  var lastDone = -1;  // tracks previous done count for bump animation
  var celebrationShown = false;

  // ── Helpers ──
  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  // ── localStorage ──
  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.date === todayStr() && Array.isArray(parsed.wins)) {
          state = parsed;
          var maxId = 0;
          for (var i = 0; i < state.wins.length; i++) {
            if (state.wins[i].id > maxId) maxId = state.wins[i].id;
          }
          nextId = maxId + 1;
          return;
        }
      }
    } catch (e) { /* corrupted data, fall through to reset */ }
    state = { date: todayStr(), wins: [] };
    nextId = 1;
    saveState();
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  // ── Counter ──
  function countDone() {
    var c = 0;
    for (var i = 0; i < state.wins.length; i++) {
      if (state.wins[i].done) c++;
    }
    return c;
  }

  function updateCounter() {
    var done = countDone();
    var total = state.wins.length;
    doneEl.textContent = done;
    totalEl.textContent = total;

    // Bump animation on done count change
    if (lastDone !== -1 && done !== lastDone) {
      doneEl.classList.remove('bump');
      void doneEl.offsetWidth; // reflow
      doneEl.classList.add('bump');
    }
    lastDone = done;

    // Input limit
    var atMax = total >= MAX_WINS;
    input.disabled = atMax;
    addBtn.disabled = atMax;
    if (atMax) {
      input.placeholder = 'Max ' + MAX_WINS + ' wins reached';
    } else {
      input.placeholder = 'Add a win for today...';
    }
  }

  // ── Create DOM element for a win ──
  function createWinElement(win) {
    var li = document.createElement('li');
    li.className = 'win-item' + (win.done ? ' done' : '');
    li.dataset.id = win.id;

    // Checkbox
    var checkBtn = document.createElement('button');
    checkBtn.className = 'win-check';
    checkBtn.setAttribute('aria-label', 'Toggle win');
    checkBtn.innerHTML =
      '<svg width="20" height="20" viewBox="0 0 20 20">' +
        '<rect class="check-box" x="2" y="2" width="16" height="16" rx="4"/>' +
        '<polyline class="check-mark" points="6,10 9,13 14,7"/>' +
      '</svg>';

    // Text
    var span = document.createElement('span');
    span.className = 'win-text';
    span.textContent = win.text;

    // Delete
    var delBtn = document.createElement('button');
    delBtn.className = 'win-delete';
    delBtn.setAttribute('aria-label', 'Delete win');
    delBtn.textContent = '\u00d7';

    li.appendChild(checkBtn);
    li.appendChild(span);
    li.appendChild(delBtn);
    return li;
  }

  // ── Render all ──
  function renderAll() {
    list.innerHTML = '';
    for (var i = 0; i < state.wins.length; i++) {
      var el = createWinElement(state.wins[i]);
      el.style.animation = 'none'; // skip entrance animation on initial render
      list.appendChild(el);
    }
    updateCounter();
  }

  // ── Actions ──
  function addWin(text) {
    text = text.trim();
    if (!text || state.wins.length >= MAX_WINS) return;

    var win = { id: nextId++, text: text, done: false };
    state.wins.push(win);
    saveState();

    var el = createWinElement(win);
    list.appendChild(el);
    updateCounter();

    input.value = '';
    celebrationShown = false; // allow re-trigger if they add more
  }

  function toggleWin(id) {
    for (var i = 0; i < state.wins.length; i++) {
      if (state.wins[i].id === id) {
        state.wins[i].done = !state.wins[i].done;
        break;
      }
    }
    saveState();

    var el = list.querySelector('[data-id="' + id + '"]');
    if (el) el.classList.toggle('done');
    updateCounter();
    checkCelebration();
  }

  function deleteWin(id) {
    // Remove from state
    for (var i = 0; i < state.wins.length; i++) {
      if (state.wins[i].id === id) {
        state.wins.splice(i, 1);
        break;
      }
    }
    saveState();

    var el = list.querySelector('[data-id="' + id + '"]');
    if (el) {
      el.classList.add('removing');
      el.addEventListener('animationend', function () {
        el.remove();
      });
    }
    // Defer counter update slightly so animation plays first
    setTimeout(updateCounter, 200);
  }

  // ── Celebration ──
  function checkCelebration() {
    var done = countDone();
    var total = state.wins.length;
    if (total > 0 && done === total && !celebrationShown) {
      celebrationShown = true;
      celebration.classList.remove('active');
      void celebration.offsetWidth; // reflow
      celebration.classList.add('active');
      setTimeout(function () {
        celebration.classList.remove('active');
      }, 2500);
    }
  }

  // ── Events ──
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') addWin(input.value);
  });

  addBtn.addEventListener('click', function () {
    addWin(input.value);
    input.focus();
  });

  // Event delegation on win list
  list.addEventListener('click', function (e) {
    var checkBtn = e.target.closest('.win-check');
    if (checkBtn) {
      var li = checkBtn.closest('.win-item');
      if (li) toggleWin(Number(li.dataset.id));
      return;
    }

    var delBtn = e.target.closest('.win-delete');
    if (delBtn) {
      var li = delBtn.closest('.win-item');
      if (li) deleteWin(Number(li.dataset.id));
    }
  });

  // Dismiss celebration on click
  celebration.addEventListener('click', function () {
    celebration.classList.remove('active');
  });

  // ── Init ──
  loadState();
  renderAll();
})();
