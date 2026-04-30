import { ADAPTERS, getAdapter } from './adapters/index.js';

const REFRESH_MS = 60_000;

const $ = (sel) => document.querySelector(sel);

const els = {
  tour:           $('#tour'),
  scoresUrl:      $('#scoresUrl'),
  ytUrl:          $('#ytUrl'),
  ytFrame:        $('#ytFrame'),
  videoEmpty:     $('#videoEmpty'),
  refreshBtn:     $('#refreshNow'),
  pauseBtn:       $('#togglePause'),
  status:         $('#status'),
  scoresMeta:     $('#scoresMeta'),
  scoresTitle:    $('#scoresTitle'),
  scoresEmpty:    $('#scoresEmpty'),
  tableWrap:      $('#tableWrap'),
  divider:        $('#divider'),
  split:          document.querySelector('.split'),
  findBroadcasts: $('#findBroadcasts')
};

let timer = null;
let paused = false;

// --- tour selector ---
for (const a of ADAPTERS) {
  const opt = document.createElement('option');
  opt.value = a.id;
  opt.textContent = a.name;
  els.tour.appendChild(opt);
}

function applyAdapterDefaults() {
  const a = getAdapter(els.tour.value);
  els.scoresUrl.value = a.defaultUrl || '';
  els.scoresTitle.textContent = a.name;
  const q = a.broadcastSearch || `${a.name} live`;
  els.findBroadcasts.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
}
els.tour.addEventListener('change', () => {
  applyAdapterDefaults();
  loadScores();
});

// --- youtube ---
function youtubeIdFromUrl(raw) {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (u.hostname === 'youtu.be') return u.pathname.slice(1) || null;
    if (u.hostname.endsWith('youtube.com')) {
      if (u.pathname === '/watch') return u.searchParams.get('v');
      const m = u.pathname.match(/^\/(embed|live|shorts)\/([^/]+)/);
      if (m) return m[2];
    }
  } catch { /* fall through */ }
  return null;
}

function applyYoutube() {
  const id = youtubeIdFromUrl(els.ytUrl.value.trim());
  if (!id) {
    els.ytFrame.hidden = true;
    els.ytFrame.src = 'about:blank';
    els.videoEmpty.hidden = false;
    return;
  }
  const src = `https://www.youtube.com/embed/${id}?autoplay=0&modestbranding=1&rel=0`;
  if (els.ytFrame.dataset.src !== src) {
    els.ytFrame.src = src;
    els.ytFrame.dataset.src = src;
  }
  els.ytFrame.hidden = false;
  els.videoEmpty.hidden = true;
}

let ytDebounce;
els.ytUrl.addEventListener('input', () => {
  clearTimeout(ytDebounce);
  ytDebounce = setTimeout(applyYoutube, 250);
});

// --- scores ---
async function loadScores() {
  const adapter = getAdapter(els.tour.value);
  const url = els.scoresUrl.value.trim();
  if (!url) {
    setStatus('no url', 'idle');
    return;
  }
  setStatus('loading…', 'live');
  try {
    const html = await fetchProxied(url);
    const data = adapter.parse(html);
    renderTable(data);
    setStatus(`updated ${formatTime(new Date())}`, 'live');
  } catch (err) {
    setStatus(err.message, 'error');
  }
}

async function fetchProxied(url) {
  const res = await fetch(`/proxy?url=${encodeURIComponent(url)}`);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`proxy ${res.status}: ${body || res.statusText}`);
  }
  return res.text();
}

function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

function renderTable({ columns, rows }) {
  clear(els.tableWrap);

  if (!rows.length) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = 'no rows parsed';
    els.tableWrap.appendChild(empty);
    els.scoresMeta.textContent = '0 players';
    return;
  }

  const table = document.createElement('table');
  table.className = 'lb';

  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  for (const c of columns) {
    const th = document.createElement('th');
    th.textContent = c.label || '';
    if (c.width) th.style.width = `${c.width}px`;
    headRow.appendChild(th);
  }
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  for (const r of rows) {
    const tr = document.createElement('tr');
    for (const c of columns) {
      const td = document.createElement('td');
      const val = r[c.key] ?? '';
      td.textContent = val;
      if (c.align === 'left') td.classList.add('player');
      if (c.key === 'score' || c.key === 'today') td.classList.add(scoreClass(val));
      if (c.key === 'country') {
        td.textContent = '';
        const span = document.createElement('span');
        span.className = 'country-flag';
        span.textContent = val;
        td.appendChild(span);
      }
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);

  els.tableWrap.appendChild(table);
  els.scoresMeta.textContent = `${rows.length} players`;
}

function scoreClass(v) {
  if (typeof v !== 'string') return 'score-even';
  const s = v.trim();
  if (s.startsWith('-')) return 'score-neg';
  if (s === 'E' || s === '0') return 'score-even';
  if (/^\+?\d/.test(s)) return 'score-pos';
  return 'score-even';
}

function formatTime(d) {
  return d.toTimeString().slice(0, 8);
}

function setStatus(text, kind) {
  els.status.textContent = text;
  els.status.className = `status ${kind || ''}`;
}

// --- refresh loop ---
function startTimer() {
  stopTimer();
  if (paused) return;
  timer = setInterval(loadScores, REFRESH_MS);
}
function stopTimer() {
  if (timer) clearInterval(timer);
  timer = null;
}

els.refreshBtn.addEventListener('click', loadScores);
els.pauseBtn.addEventListener('click', () => {
  paused = !paused;
  els.pauseBtn.textContent = paused ? '▶' : '⏸';
  if (paused) stopTimer(); else startTimer();
});

// --- resizer ---
let dragging = false;
els.divider.addEventListener('mousedown', () => { dragging = true; document.body.style.cursor = 'col-resize'; });
window.addEventListener('mouseup', () => { dragging = false; document.body.style.cursor = ''; });
window.addEventListener('mousemove', e => {
  if (!dragging) return;
  const w = window.innerWidth;
  const pct = Math.max(20, Math.min(80, (e.clientX / w) * 100));
  els.split.style.setProperty('--left',  `${pct}fr`);
  els.split.style.setProperty('--right', `${100 - pct}fr`);
});

// --- boot ---
applyAdapterDefaults();
applyYoutube();
loadScores();
startTimer();
