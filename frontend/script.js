const API_URL  = "/AI-Decision-Engine-main/backend/api/analyze.php";
const DATA_URL = "/AI-Decision-Engine-main/backend/api/data.php";

// ── Глобальное состояние ──────────────────────────────────────
let liveData = null;
let currentSection = 'all';
let lineChart, pieChart;
let historyData = { labels: [], traffic: [], aqi: [], incidents: [], zhkh: [] };
let currentImage = null;

// ── Тема ─────────────────────────────────────────────────────
function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.getAttribute('data-theme') === 'dark';
  html.setAttribute('data-theme', isDark ? 'light' : 'dark');
  localStorage.setItem('theme', isDark ? 'light' : 'dark');
  updateChartTheme();
}

function applyTheme() {
  const saved = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (prefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
}
applyTheme();

function getChartColors() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  return {
    grid:   isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    tick:   isDark ? '#5555aa' : '#9090aa',
    text:   isDark ? '#9090c0' : '#6060a0',
  };
}

function updateChartTheme() {
  if (!lineChart || !pieChart) return;
  const c = getChartColors();
  lineChart.options.scales.x.ticks.color  = c.tick;
  lineChart.options.scales.y.ticks.color  = c.tick;
  lineChart.options.scales.x.grid.color   = c.grid;
  lineChart.options.scales.y.grid.color   = c.grid;
  lineChart.update();
}

// ── Загрузка данных ───────────────────────────────────────────
async function loadData() {
  const dot = document.getElementById('statusDot');
  dot.className = 'status-dot';

  try {
    const res = await fetch(DATA_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    liveData = data;

    dot.className = 'status-dot live';
    document.getElementById('updateTime').textContent = 'Обновлено в ' + (data.updated_at || '--:--');

    updateWeather(data.weather);
    updateHistory(data);
    renderKPI(currentSection);
    renderProblems();
    updateCharts();

  } catch (e) {
    console.error('🔥 Ошибка загрузки данных:', e);
    dot.className = 'status-dot error';
    document.getElementById('updateTime').textContent = 'Ошибка загрузки';
  }
}

// ── Погода ───────────────────────────────────────────────────
function updateWeather(w) {
  if (!w) return;
  const icon = w.temp > 25 ? '☀️' : w.temp > 10 ? '🌤' : w.temp > 0 ? '🌥' : '❄️';
  document.getElementById('wTemp').textContent    = icon + ' ' + w.temp + '°C';
  document.getElementById('wDesc').textContent    = w.desc || '';
  document.getElementById('wHumidity').textContent = w.humidity ?? '—';
  document.getElementById('wWind').textContent    = w.wind_speed ?? '—';
  document.getElementById('wVis').textContent     = w.visibility ?? '—';
}

// ── История для графика ───────────────────────────────────────
function updateHistory(data) {
  const now = new Date();
  const label = now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0');

  const maxPoints = 12;
  if (historyData.labels.length >= maxPoints) {
    ['labels','traffic','aqi','incidents','zhkh'].forEach(k => historyData[k].shift());
  }

  historyData.labels.push(label);
  historyData.traffic.push(data.traffic?.load ?? 0);
  historyData.aqi.push(data.air?.aqi ?? 0);
  historyData.incidents.push(data.safety?.incidents ?? 0);
  historyData.zhkh.push((data.zhkh?.accidents ?? 0) * 5);
}

// ── Секции / KPI ──────────────────────────────────────────────
function setSection(section, el) {
  currentSection = section;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  renderKPI(section);
}

function renderKPI(section) {
  if (!liveData) return;
  const d = liveData;

  const levelLabel = { high: 'Критично', medium: 'Внимание', low: 'Норма' };
  const sourceTag  = (src) => {
    if (!src) return '';
    if (src.includes('live') || src.includes('open_meteo')) return '🟢 live';
    if (src.includes('model') || src.includes('time'))      return '🔵 расчёт';
    if (src.includes('serper'))                              return '🟣 поиск';
    return '🔴 нет связи';
  };

  const sections = {
    all: [
      { label: 'Загруженность дорог',  value: (d.traffic?.load ?? '—') + '%',  level: d.traffic?.level,  source: d.traffic?.source },
      { label: 'Качество воздуха AQI', value: d.air?.aqi ?? '—',               level: d.air?.level,      source: d.air?.source },
      { label: 'Инциденты / сутки',    value: d.safety?.incidents ?? '—',       level: d.safety?.level,   source: d.safety?.source },
      { label: 'Аварии ЖКХ',          value: d.zhkh?.accidents ?? '—',         level: d.zhkh?.level,     source: d.zhkh?.source },
    ],
    transport: [
      { label: 'Загруженность дорог',   value: (d.traffic?.load ?? '—') + '%',      level: d.traffic?.level },
      { label: 'Среднее время в пути',  value: (d.traffic?.avg_time ?? '—') + ' мин', level: d.traffic?.level },
      { label: 'Температура воздуха',   value: (d.weather?.temp ?? '—') + '°C',     level: 'low' },
      { label: 'Видимость на дорогах',  value: (d.weather?.visibility ?? '—') + ' км',
        level: (d.weather?.visibility < 3) ? 'high' : (d.weather?.visibility < 7) ? 'medium' : 'low' },
    ],
    ecology: [
      { label: 'AQI (индекс воздуха)', value: d.air?.aqi ?? '—',    level: d.air?.level },
      { label: 'PM2.5 (мкг/м³)',       value: d.air?.pm25 ?? '—',   level: (d.air?.pm25 > 55) ? 'high' : (d.air?.pm25 > 25) ? 'medium' : 'low' },
      { label: 'NO2 (мкг/м³)',         value: d.air?.no2 ?? '—',    level: (d.air?.no2 > 40) ? 'high' : (d.air?.no2 > 20) ? 'medium' : 'low' },
      { label: 'Влажность воздуха',    value: (d.weather?.humidity ?? '—') + '%', level: 'low' },
    ],
    safety: [
      { label: 'Инциденты / сутки',     value: d.safety?.incidents ?? '—',          level: d.safety?.level },
      { label: 'Время реагирования',    value: (d.safety?.response ?? '—') + ' мин', level: (d.safety?.response > 10) ? 'high' : (d.safety?.response > 7) ? 'medium' : 'low' },
      { label: 'Тёмные участки улиц',   value: (d.safety?.dark_areas ?? '—') + '%', level: 'medium' },
      { label: 'ДТП за сутки',         value: d.safety?.dtp ?? '—',                level: (d.safety?.dtp > 3) ? 'high' : (d.safety?.dtp > 1) ? 'medium' : 'low' },
    ],
    zhkh: [
      { label: 'Аварии ЖКХ',          value: d.zhkh?.accidents ?? '—',    level: d.zhkh?.level },
      { label: 'Отключения воды',      value: d.zhkh?.water_off ?? '—',   level: (d.zhkh?.water_off > 3) ? 'high' : (d.zhkh?.water_off > 0) ? 'medium' : 'low' },
      { label: 'Жалобы граждан',       value: d.zhkh?.complaints ?? '—',  level: (d.zhkh?.complaints > 150) ? 'high' : (d.zhkh?.complaints > 100) ? 'medium' : 'low' },
      { label: 'Выполнение заявок',    value: (d.zhkh?.execution ?? '—') + '%', level: (d.zhkh?.execution < 70) ? 'high' : (d.zhkh?.execution < 85) ? 'medium' : 'low' },
    ]
  };

  const kpis = sections[section] || sections.all;
  document.getElementById('kpiGrid').innerHTML = kpis.map(k => `
    <div class="kpi ${k.level || 'low'}">
      <div class="kpi-label">${k.label}</div>
      <div class="kpi-value">${k.value ?? '—'}</div>
      <span class="kpi-badge badge-${k.level || 'low'}">${levelLabel[k.level] || 'Норма'}</span>
      <div class="kpi-source">${sourceTag(k.source)}</div>
    </div>
  `).join('');
}

// ── Проблемы ──────────────────────────────────────────────────
function renderProblems() {
  if (!liveData) return;
  const d = liveData;
  const problems = [];

  // Критичные
  if (d.air?.level === 'high')      problems.push({ name: `Превышение нормы AQI: ${d.air.aqi} (PM2.5: ${d.air.pm25} мкг/м³)`, sector: 'Экология', level: 'high' });
  if (d.traffic?.level === 'high')  problems.push({ name: `Критическая загруженность: ${d.traffic.load}% (${d.traffic.peak ? 'час пик' : 'вне пика'})`, sector: 'Транспорт', level: 'high' });
  if ((d.safety?.dtp ?? 0) > 3)    problems.push({ name: `Высокое число ДТП за сутки: ${d.safety.dtp}`, sector: 'Безопасность', level: 'high' });
  if ((d.zhkh?.complaints ?? 0) > 150) problems.push({ name: `Большое число жалоб граждан: ${d.zhkh.complaints}`, sector: 'ЖКХ', level: 'high' });

  // Средние
  if (d.air?.level === 'medium')     problems.push({ name: `Умеренное загрязнение воздуха: AQI ${d.air.aqi}`, sector: 'Экология', level: 'medium' });
  if (d.traffic?.level === 'medium') problems.push({ name: `Повышенная загруженность дорог: ${d.traffic.load}%`, sector: 'Транспорт', level: 'medium' });
  if ((d.zhkh?.water_off ?? 0) > 0) problems.push({ name: `Отключения водоснабжения: ${d.zhkh.water_off} случаев`, sector: 'ЖКХ', level: 'medium' });
  if ((d.safety?.response ?? 0) > 9) problems.push({ name: `Долгое время реагирования: ${d.safety.response} мин`, sector: 'Безопасность', level: 'medium' });
  if ((d.weather?.visibility ?? 99) < 5) problems.push({ name: `Плохая видимость на дорогах: ${d.weather.visibility} км`, sector: 'Транспорт', level: 'medium' });

  if (problems.length === 0) {
    problems.push({ name: 'Критических проблем не выявлено', sector: 'Система', level: 'low' });
  }

  const levelLabel = { high: 'Высокий', medium: 'Средний', low: 'Низкий' };
  document.getElementById('problemsList').innerHTML = problems.map(p => `
    <div class="problem-row">
      <div class="prob-dot ${p.level}"></div>
      <div class="prob-name">${p.name}</div>
      <div class="prob-sector">${p.sector}</div>
      <span class="kpi-badge badge-${p.level}">${levelLabel[p.level]}</span>
    </div>
  `).join('');
}

// ── Графики ───────────────────────────────────────────────────
function initCharts() {
  const c = getChartColors();

  document.getElementById('lineLegend').innerHTML = [
    ['Трафик %', '#6d63ff'],
    ['AQI',      '#ef4444'],
    ['Инциденты','#f59e0b'],
    ['ЖКХ (×5)', '#10b981'],
  ].map(([l, col]) => `<span><span class="legend-dot" style="background:${col}"></span>${l}</span>`).join('');

  lineChart = new Chart(document.getElementById('lineChart'), {
    type: 'line',
    data: {
      labels: historyData.labels,
      datasets: [
        { label: 'Трафик',     data: historyData.traffic,   borderColor: '#6d63ff', backgroundColor: 'rgba(109,99,255,0.08)', fill: true, borderWidth: 2, pointRadius: 3, tension: 0.4 },
        { label: 'AQI',        data: historyData.aqi,       borderColor: '#ef4444', backgroundColor: 'transparent', borderWidth: 2, pointRadius: 3, tension: 0.4 },
        { label: 'Инциденты',  data: historyData.incidents, borderColor: '#f59e0b', backgroundColor: 'transparent', borderWidth: 2, pointRadius: 3, tension: 0.4 },
        { label: 'ЖКХ (×5)',   data: historyData.zhkh,     borderColor: '#10b981', backgroundColor: 'transparent', borderWidth: 2, pointRadius: 3, tension: 0.4 },
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          ticks: { font: { size: 10, family: 'JetBrains Mono' }, color: c.tick, maxRotation: 0 },
          grid:  { display: false }
        },
        y: {
          ticks: { font: { size: 10, family: 'JetBrains Mono' }, color: c.tick },
          grid:  { color: c.grid }
        }
      },
      animation: { duration: 500, easing: 'easeInOutQuart' }
    }
  });

  pieChart = new Chart(document.getElementById('pieChart'), {
    type: 'doughnut',
    data: {
      labels: ['Критично', 'Внимание', 'Норма'],
      datasets: [{
        data: [1, 1, 2],
        backgroundColor: ['#ef4444', '#f59e0b', '#10b981'],
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: { legend: { display: false } },
      animation: { duration: 600, easing: 'easeInOutQuart' }
    }
  });
}

function updateCharts() {
  if (!liveData || !lineChart) return;

  lineChart.data.labels = [...historyData.labels];
  lineChart.data.datasets[0].data = [...historyData.traffic];
  lineChart.data.datasets[1].data = [...historyData.aqi];
  lineChart.data.datasets[2].data = [...historyData.incidents];
  lineChart.data.datasets[3].data = [...historyData.zhkh];
  lineChart.update();

  const levels = [liveData.traffic?.level, liveData.air?.level, liveData.safety?.level, liveData.zhkh?.level];
  const high   = levels.filter(l => l === 'high').length;
  const medium = levels.filter(l => l === 'medium').length;
  const low    = levels.filter(l => l === 'low').length;

  pieChart.data.datasets[0].data = [high || 0, medium || 0, low || 0];
  pieChart.update();

  document.getElementById('pieStats').innerHTML = `
    <div class="pie-stat" style="border-color:rgba(239,68,68,0.3)">
      <div class="ps-val" style="color:var(--high)">${high}</div>
      <div class="ps-label">Критично</div>
    </div>
    <div class="pie-stat" style="border-color:rgba(245,158,11,0.3)">
      <div class="ps-val" style="color:var(--mid)">${medium}</div>
      <div class="ps-label">Внимание</div>
    </div>
    <div class="pie-stat" style="border-color:rgba(16,185,129,0.3)">
      <div class="ps-val" style="color:var(--low)">${low}</div>
      <div class="ps-label">Норма</div>
    </div>
  `;
}

// ── Чат ───────────────────────────────────────────────────────
async function sendChat() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text && !currentImage) return;

  addChatMessage(text || '📷 Анализируй фото', 'user');
  input.value = '';

  const imageToSend = currentImage;
  currentImage = null;
  document.getElementById('imagePreview').style.display = 'none';
  document.getElementById('previewImg').src = '';

  const typingEl = addTypingIndicator();

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: text, image: imageToSend, context: liveData })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    typingEl.remove();
    addChatMessage(data.answer || data.error || 'Нет ответа', 'ai');
  } catch (e) {
    typingEl.remove();
    addChatMessage('❌ Ошибка соединения с сервером', 'ai');
    console.error('Chat error:', e);
  }
}

function addChatMessage(text, type) {
  const chat = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = 'chat-msg ' + type;

  if (type === 'ai') {
    div.innerHTML = `<div class="ai-avatar">А</div><div class="msg-bubble">${escapeHtml(text)}</div>`;
  } else {
    div.innerHTML = `<div class="msg-bubble">${escapeHtml(text)}</div>`;
  }

  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
  return div;
}

function addTypingIndicator() {
  const chat = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = 'chat-msg ai';
  div.innerHTML = `<div class="ai-avatar">А</div><div class="msg-bubble"><div class="typing-dots"><span></span><span></span><span></span></div></div>`;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
  return div;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

function removeImage() {
  currentImage = null;
  document.getElementById('imagePreview').style.display = 'none';
  document.getElementById('previewImg').src = '';
}

function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  readImageFile(file);
}

function readImageFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    currentImage = e.target.result.split(',')[1];
    document.getElementById('imagePreview').style.display = 'flex';
    document.getElementById('previewImg').src = e.target.result;
  };
  reader.readAsDataURL(file);
}

document.addEventListener('paste', (e) => {
  for (const item of e.clipboardData.items) {
    if (item.type.startsWith('image/')) {
      readImageFile(item.getAsFile());
      break;
    }
  }
});

// ── Старт ─────────────────────────────────────────────────────
initCharts();
loadData();
setInterval(loadData, 5 * 60 * 1000);
