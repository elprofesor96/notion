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
  var sessionsEl = container.querySelector('.sessions');
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

  // ── State ──
  var mode = 'focus';
  var totalSecs = MODES.focus.minutes * 60;
  var remaining = totalSecs;
  var running = false;
  var interval = null;
  var sessionCount = 0;
  var audioCtx = null;

  // ── Audio ──
  function ensureAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
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
    sessionsEl.textContent = sessionCount + ' session' + (sessionCount !== 1 ? 's' : '');
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
  }

  // ── Timer controls ──
  function start() {
    ensureAudio();
    running = true;
    playBtn.classList.add('playing');
    playIcon.style.display = 'none';
    pauseIcon.style.display = '';
    interval = setInterval(tick, 1000);
  }

  function pause() {
    running = false;
    playBtn.classList.remove('playing');
    playIcon.style.display = '';
    pauseIcon.style.display = 'none';
    clearInterval(interval);
  }

  function toggle() {
    running ? pause() : start();
  }

  function reset() {
    pause();
    remaining = totalSecs;
    render();
  }

  function tick() {
    remaining--;
    if (remaining <= 0) {
      remaining = 0;
      render();
      complete();
      return;
    }
    render();
  }

  function complete() {
    pause();
    if (mode === 'focus') {
      sessionCount++;
      chime();
    }
    // Body pulse
    document.body.classList.remove('pulse');
    void document.body.offsetWidth;
    document.body.classList.add('pulse');
  }

  // ── Events ──
  playBtn.addEventListener('click', toggle);
  resetBtn.addEventListener('click', reset);

  modeBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      setMode(btn.dataset.mode);
    });
  });

  // ── Init ──
  applyAccent();
  render();
})();
