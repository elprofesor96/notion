;(function () {
  'use strict';

  // ── Theme ──
  if (new URLSearchParams(window.location.search).get('theme') === 'light') {
    document.documentElement.classList.add('light');
  }

  // ── Config ──
  var MODES = {
    focus: { label: 'focus session', minutes: 25, accent: '--accent-focus' },
    break: { label: 'short break',  minutes: 5,  accent: '--accent-break' },
    long:  { label: 'long break',   minutes: 15, accent: '--accent-long'  },
    deep:  { label: 'long focus',   minutes: 60, accent: '--accent-deep'  },
  };

  // ── DOM ──
  var container  = document.querySelector('.container');
  var timeEl     = container.querySelector('.time');
  var ring       = container.querySelector('.ring-progress');
  var playBtn    = container.querySelector('.btn-play');
  var playIcon   = container.querySelector('.play-icon');
  var pauseIcon  = container.querySelector('.pause-icon');
  var resetBtn   = container.querySelector('.btn-reset');
  var modeBtns   = container.querySelectorAll('.modes button');

  // ── Ring math ──
  var R = 88;
  var CIRC = 2 * Math.PI * R;
  ring.style.strokeDasharray = CIRC;
  ring.style.strokeDashoffset = 0;

  // ── Persistence ──
  var STORAGE_KEY = 'focus-timer-state';

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        mode: mode,
        remaining: remaining,
        running: running,
        timestamp: Date.now()
      }));
    } catch (e) { /* private browsing */ }
  }

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function clearState() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* private browsing */ }
  }

  // ── State ──
  var mode = 'focus';
  var totalSecs = MODES.focus.minutes * 60;
  var remaining = totalSecs;
  var running = false;
  var interval = null;
  var audioCtx = null;

  // ── Audio ──
  function ensureAudio() {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { /* blocked without user gesture */ }
  }

  function chime() {
    ensureAudio();
    [660, 784, 988].forEach(function (freq, i) {
      setTimeout(function () {
        var osc = audioCtx.createOscillator();
        var g = audioCtx.createGain();
        osc.connect(g);
        g.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        g.gain.setValueAtTime(0.3, audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      }, i * 180);
    });
  }

  // ── Formatting ──
  function formatTime(s) {
    var m = Math.floor(s / 60).toString().padStart(2, '0');
    var sec = (s % 60).toString().padStart(2, '0');
    return m + ':' + sec;
  }

  // ── Render ──
  function render() {
    timeEl.textContent = formatTime(remaining);
    document.title = formatTime(remaining) + ' \u2014 Focus Timer';
    var pct = remaining / totalSecs;
    ring.style.strokeDashoffset = CIRC * (1 - pct);
  }

  function applyAccent() {
    var accentVar = MODES[mode].accent;
    var style = getComputedStyle(document.documentElement);
    var color = style.getPropertyValue(accentVar).trim();
    document.documentElement.style.setProperty('--accent', color);
  }

  function setMode(newMode) {
    if (running) pause();
    mode = newMode;
    container.setAttribute('data-mode', mode);
    totalSecs = MODES[mode].minutes * 60;
    remaining = totalSecs;
    applyAccent();

    // Update active tab
    modeBtns.forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    // Brief fade on time display
    timeEl.classList.add('switching');
    setTimeout(function () { timeEl.classList.remove('switching'); }, 150);

    playBtn.classList.remove('playing');
    playIcon.style.display = '';
    pauseIcon.style.display = 'none';
    render();
    saveState();
  }

  // ── Timer controls ──
  function start() {
    ensureAudio();
    running = true;
    playBtn.classList.add('playing');
    playIcon.style.display = 'none';
    pauseIcon.style.display = '';
    interval = setInterval(tick, 1000);
    saveState();
  }

  function pause() {
    running = false;
    playBtn.classList.remove('playing');
    playIcon.style.display = '';
    pauseIcon.style.display = 'none';
    clearInterval(interval);
    saveState();
  }

  function toggle() {
    running ? pause() : start();
  }

  function reset() {
    pause();
    remaining = totalSecs;
    render();
    clearState();
  }

  function tick() {
    remaining--;
    if (remaining <= 0) {
      remaining = 0;
      render();
      complete();
      clearState();
      return;
    }
    render();
    saveState();
  }

  function complete() {
    pause();
    chime();
    // Body pulse
    document.body.classList.remove('pulse');
    void document.body.offsetWidth;
    document.body.classList.add('pulse');
  }

  // ── Persist on tab close / hide ──
  document.addEventListener('visibilitychange', function () {
    if (document.hidden && running) saveState();
  });
  window.addEventListener('beforeunload', function () {
    if (running) saveState();
  });

  // ── Events ──
  playBtn.addEventListener('click', toggle);
  resetBtn.addEventListener('click', reset);

  modeBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      setMode(btn.dataset.mode);
    });
  });

  // ── Init ──
  var saved = loadState();
  if (saved && MODES[saved.mode]) {
    mode = saved.mode;
    container.setAttribute('data-mode', mode);
    totalSecs = MODES[mode].minutes * 60;
    remaining = saved.remaining;

    modeBtns.forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    if (saved.running) {
      var elapsed = Math.floor((Date.now() - saved.timestamp) / 1000);
      remaining = Math.max(0, remaining - elapsed);
      if (remaining > 0) {
        start();
      } else {
        remaining = 0;
        clearState();
      }
    }
  }

  applyAccent();
  render();
})();
