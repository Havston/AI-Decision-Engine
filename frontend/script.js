const API_URL  = "/AI-Decision-Engine-main/backend/api/analyze.php";
const DATA_URL = "/AI-Decision-Engine-main/backend/api/data.php";
// Глобальное состояние
let liveData = null;
let currentSection = 'all';
let lineChart, pieChart;
let historyData = { labels: [], traffic: [], aqi: [], incidents: [], zhkh: [] };

// ── Загрузка реальных данных ───────────────────────────────
async function loadData() {
    const dot = document.getElementById('statusDot');
    dot.className = 'status-dot';

    try {
        const res = await fetch(DATA_URL);
        const data = await res.json();
        liveData = data;

        dot.className = 'status-dot live';
        document.getElementById('updateTime').textContent =
            'Обновлено в ' + data.updated_at;

        updateWeather(data.weather);
        updateHistory(data);
        renderKPI(currentSection);
        renderProblems();
        updateCharts();

    } catch (e) {
        console.error("🔥 ОШИБКА ЗАГРУЗКИ ДАННЫХ:", e);   // ← добавили
        dot.className = 'status-dot error';
        document.getElementById('updateTime').textContent = 'Ошибка загрузки';
    }
}

// ── Погода ─────────────────────────────────────────────────
function updateWeather(w) {
    if (!w) return;
    const icon = w.temp > 25 ? '☀️' : w.temp > 10 ? '🌤' : w.temp > 0 ? '🌥' : '❄️';
    document.getElementById('wTemp').textContent = icon + ' ' + w.temp + '°C';
    document.getElementById('wDesc').textContent = w.desc;
    document.getElementById('wHumidity').textContent = w.humidity;
    document.getElementById('wWind').textContent = w.wind_speed;
    document.getElementById('wVis').textContent = w.visibility;
}

// ── История для графика ────────────────────────────────────
function updateHistory(data) {
    const now = new Date();
    const label = now.getHours() + ':' + String(now.getMinutes()).padStart(2,'0');

    if (historyData.labels.length >= 12) {
        historyData.labels.shift();
        historyData.traffic.shift();
        historyData.aqi.shift();
        historyData.incidents.shift();
        historyData.zhkh.shift();
    }

    historyData.labels.push(label);
    historyData.traffic.push(data.traffic?.load ?? 0);
    historyData.aqi.push(data.air?.aqi ?? 0);
    historyData.incidents.push(data.safety?.incidents ?? 0);
    historyData.zhkh.push((data.zhkh?.accidents ?? 0) * 5);
}

// ── KPI ────────────────────────────────────────────────────
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
    const sourceLabel = { live: '🟢 live', calculated: '🔵 расчёт', fallback: '🔴 нет связи' };

    const sections = {
        all: [
            { label: 'Загруженность дорог', value: d.traffic?.load + '%', level: d.traffic?.level, source: d.traffic?.source },
            { label: 'Качество воздуха AQI', value: d.air?.aqi, level: d.air?.level, source: d.air?.source },
            { label: 'Инциденты / сутки', value: d.safety?.incidents, level: d.safety?.level, source: d.safety?.source },
            { label: 'Аварии ЖКХ', value: d.zhkh?.accidents, level: d.zhkh?.level, source: d.zhkh?.source },
        ],
        transport: [
            { label: 'Загруженность дорог', value: d.traffic?.load + '%', level: d.traffic?.level, source: d.traffic?.source },
            { label: 'Среднее время в пути', value: d.traffic?.avg_time + ' мин', level: d.traffic?.level, source: d.traffic?.source },
            { label: 'Температура воздуха', value: d.weather?.temp + '°C', level: 'low', source: d.weather?.source },
            { label: 'Видимость на дорогах', value: d.weather?.visibility + ' км', level: d.weather?.visibility < 3 ? 'high' : d.weather?.visibility < 7 ? 'medium' : 'low', source: d.weather?.source },
        ],
        ecology: [
            { label: 'AQI (индекс воздуха)', value: d.air?.aqi, level: d.air?.level, source: d.air?.source },
            { label: 'PM2.5 (мкг/м³)', value: d.air?.pm25, level: d.air?.pm25 > 55 ? 'high' : d.air?.pm25 > 25 ? 'medium' : 'low', source: d.air?.source },
            { label: 'NO2 (мкг/м³)', value: d.air?.no2, level: d.air?.no2 > 40 ? 'high' : d.air?.no2 > 20 ? 'medium' : 'low', source: d.air?.source },
            { label: 'Влажность воздуха', value: d.weather?.humidity + '%', level: 'low', source: d.weather?.source },
        ],
        safety: [
            { label: 'Инциденты / сутки', value: d.safety?.incidents, level: d.safety?.level, source: d.safety?.source },
            { label: 'Время реагирования', value: d.safety?.response + ' мин', level: d.safety?.response > 10 ? 'high' : d.safety?.response > 7 ? 'medium' : 'low', source: d.safety?.source },
            { label: 'Тёмные участки улиц', value: d.safety?.dark_areas + '%', level: 'medium', source: d.safety?.source },
            { label: 'ДТП за сутки', value: d.safety?.dtp, level: d.safety?.dtp > 3 ? 'high' : d.safety?.dtp > 1 ? 'medium' : 'low', source: d.safety?.source },
        ],
        zhkh: [
            { label: 'Аварии ЖКХ', value: d.zhkh?.accidents, level: d.zhkh?.level, source: d.zhkh?.source },
            { label: 'Отключения воды', value: d.zhkh?.water_off, level: d.zhkh?.water_off > 3 ? 'high' : d.zhkh?.water_off > 0 ? 'medium' : 'low', source: d.zhkh?.source },
            { label: 'Жалобы граждан', value: d.zhkh?.complaints, level: d.zhkh?.complaints > 150 ? 'high' : d.zhkh?.complaints > 100 ? 'medium' : 'low', source: d.zhkh?.source },
            { label: 'Выполнение заявок', value: d.zhkh?.execution + '%', level: d.zhkh?.execution < 70 ? 'high' : d.zhkh?.execution < 85 ? 'medium' : 'low', source: d.zhkh?.source },
        ]
    };

    const kpis = sections[section] || sections.all;
    document.getElementById('kpiGrid').innerHTML = kpis.map(k => `
        <div class="kpi ${k.level || 'low'}">
            <div class="kpi-label">${k.label}</div>
            <div class="kpi-value">${k.value ?? '—'}</div>
            <span class="kpi-badge badge-${k.level || 'low'}">${levelLabel[k.level] || 'Норма'}</span>
            <div class="kpi-source">${sourceLabel[k.source] || ''}</div>
        </div>
    `).join('');
}

// ── Проблемы ────────────────────────────────────────────────
function renderProblems() {
    if (!liveData) return;
    const d = liveData;
    const problems = [];

    if (d.air?.level === 'high')     problems.push({ name: `Превышение нормы AQI: ${d.air.aqi} (PM2.5: ${d.air.pm25} мкг/м³)`, sector: 'Экология', level: 'high' });
    if (d.traffic?.level === 'high') problems.push({ name: `Критическая загруженность дорог: ${d.traffic.load}% (${d.traffic.peak ? 'час пик' : 'вне пика'})`, sector: 'Транспорт', level: 'high' });
    if (d.safety?.dtp > 3)          problems.push({ name: `Высокое число ДТП за сутки: ${d.safety.dtp}`, sector: 'Безопасность', level: 'high' });
    if (d.zhkh?.complaints > 150)   problems.push({ name: `Большое число жалоб граждан: ${d.zhkh.complaints}`, sector: 'ЖКХ', level: 'high' });

    if (d.air?.level === 'medium')    problems.push({ name: `Умеренное загрязнение воздуха: AQI ${d.air.aqi}`, sector: 'Экология', level: 'medium' });
    if (d.traffic?.level === 'medium') problems.push({ name: `Повышенная загруженность дорог: ${d.traffic.load}%`, sector: 'Транспорт', level: 'medium' });
    if (d.zhkh?.water_off > 0)       problems.push({ name: `Отключения водоснабжения: ${d.zhkh.water_off} случаев`, sector: 'ЖКХ', level: 'medium' });
    if (d.safety?.response > 9)      problems.push({ name: `Долгое время реагирования: ${d.safety.response} мин`, sector: 'Безопасность', level: 'medium' });
    if (d.weather?.visibility < 5)   problems.push({ name: `Плохая видимость на дорогах: ${d.weather.visibility} км`, sector: 'Транспорт', level: 'medium' });

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

// ── Графики ─────────────────────────────────────────────────
function initCharts() {
    document.getElementById('lineLegend').innerHTML = [
        ['Трафик %', '#378ADD'],
        ['AQI', '#E24B4A'],
        ['Инциденты', '#f39c12'],
        ['ЖКХ (×5)', '#4CAF50']
    ].map(([l, c]) => `<span><span class="legend-dot" style="background:${c}"></span>${l}</span>`).join('');

    lineChart = new Chart(document.getElementById('lineChart'), {
        type: 'line',
        data: {
            labels: historyData.labels,
            datasets: [
                { label: 'Трафик', data: historyData.traffic, borderColor: '#378ADD', backgroundColor: 'transparent', borderWidth: 2, pointRadius: 3, tension: 0.4 },
                { label: 'AQI', data: historyData.aqi, borderColor: '#E24B4A', backgroundColor: 'transparent', borderWidth: 2, pointRadius: 3, tension: 0.4 },
                { label: 'Инциденты', data: historyData.incidents, borderColor: '#f39c12', backgroundColor: 'transparent', borderWidth: 2, pointRadius: 3, tension: 0.4 },
                { label: 'ЖКХ (×5)', data: historyData.zhkh, borderColor: '#4CAF50', backgroundColor: 'transparent', borderWidth: 2, pointRadius: 3, tension: 0.4 },
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { font: { size: 10 }, maxRotation: 0 }, grid: { display: false } },
                y: { ticks: { font: { size: 10 } }, grid: { color: 'rgba(0,0,0,0.05)' } }
            },
            animation: { duration: 400 }
        }
    });

    pieChart = new Chart(document.getElementById('pieChart'), {
        type: 'doughnut',
        data: {
            labels: ['Критично', 'Внимание', 'Норма'],
            datasets: [{ data: [1, 1, 2], backgroundColor: ['#e74c3c', '#f39c12', '#4CAF50'], borderWidth: 0 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '65%',
            plugins: { legend: { display: false } },
            animation: { duration: 400 }
        }
    });
}

function updateCharts() {
    if (!liveData || !lineChart) return;

    // Обновляем линейный
    lineChart.data.labels = [...historyData.labels];
    lineChart.data.datasets[0].data = [...historyData.traffic];
    lineChart.data.datasets[1].data = [...historyData.aqi];
    lineChart.data.datasets[2].data = [...historyData.incidents];
    lineChart.data.datasets[3].data = [...historyData.zhkh];
    lineChart.update();

    // Считаем уровни
    const all = [liveData.traffic?.level, liveData.air?.level, liveData.safety?.level, liveData.zhkh?.level];
    const high   = all.filter(l => l === 'high').length;
    const medium = all.filter(l => l === 'medium').length;
    const low    = all.filter(l => l === 'low').length;

    pieChart.data.datasets[0].data = [high, medium, low];
    pieChart.update();

    document.getElementById('pieStats').innerHTML = `
        <div class="pie-stat" style="background:#fdeaea"><div class="ps-val" style="color:#c0392b">${high}</div><div class="ps-label">Критично</div></div>
        <div class="pie-stat" style="background:#fef5e4"><div class="ps-val" style="color:#b7770d">${medium}</div><div class="ps-label">Внимание</div></div>
        <div class="pie-stat" style="background:#eafaf1"><div class="ps-val" style="color:#1e8449">${low}</div><div class="ps-label">Норма</div></div>
    `;
}

// ── Чат ─────────────────────────────────────────────────────
let currentImage = null;

async function sendChat() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text && !currentImage) return;

    addChatMessage(text || 'Анализируй фото', 'user');
    input.value = '';

    const imageToSend = currentImage;
    currentImage = null;
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('previewImg').src = '';

    const typingEl = addChatMessage('⏳ Алем думает...', 'ai');

    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: text, image: imageToSend, context: liveData })
        });
        const data = await res.json();
        typingEl.remove();
        addChatMessage(data.answer || data.error || 'Нет ответа', 'ai');
    } catch (e) {
        typingEl.remove();
        addChatMessage('❌ Ошибка соединения с сервером', 'ai');
    }
}

function addChatMessage(text, type) {
    const chat = document.getElementById('chatMessages');
    const div = document.createElement('div');
    div.className = 'chat-msg ' + type;
    div.textContent = text;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
    return div;
}

function removeImage() {
    currentImage = null;
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('previewImg').src = '';
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        currentImage = e.target.result.split(',')[1];
        document.getElementById('imagePreview').style.display = 'block';
        document.getElementById('previewImg').src = e.target.result;
    };
    reader.readAsDataURL(file);
}

document.addEventListener('paste', (e) => {
    for (let item of e.clipboardData.items) {
        if (item.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                currentImage = ev.target.result.split(',')[1];
                document.getElementById('imagePreview').style.display = 'block';
                document.getElementById('previewImg').src = ev.target.result;
            };
            reader.readAsDataURL(item.getAsFile());
        }
    }
});

// ── Старт ───────────────────────────────────────────────────
initCharts();
loadData();
// Автообновление каждые 5 минут
setInterval(loadData, 5 * 60 * 1000);
