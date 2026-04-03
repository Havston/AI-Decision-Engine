// ===== ДАННЫЕ =====
const districts = {
    "Центр": { traffic: 85, pollution: 70 },
    "Алмалинский": { traffic: 60, pollution: 50 },
    "Ауэзовский": { traffic: 40, pollution: 30 },
    "Бостандыкский": { traffic: 75, pollution: 65 }
};

function resolveApiUrl() {
    if (window.location.protocol === "file:") {
        return "http://localhost:8000/backend/api/analyze.php";
    }

    return `${window.location.origin}/backend/api/analyze.php`;
}

const API_URL = resolveApiUrl();

// ===== ПОЛУЧЕНИЕ ДАННЫХ =====
function getSelectedData() {
    const district = document.getElementById("district").value;
    const data = districts[district] || { traffic: 50, pollution: 50 };

    return {
        traffic: data.traffic + Math.floor(Math.random() * 10 - 5),
        pollution: data.pollution + Math.floor(Math.random() * 10 - 5)
    };
}

// ===== ВКЛАДКИ =====
function switchTab(tabName) {
    document.querySelectorAll(".tab").forEach((btn) => btn.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach((tab) => tab.classList.remove("active"));

    document.getElementById(tabName).classList.add("active");

    if (tabName === "transport") {
        document.querySelectorAll(".tab")[0].classList.add("active");
    } else {
        document.querySelectorAll(".tab")[1].classList.add("active");
    }
}

// ===== ОБНОВЛЕНИЕ КАРТЫ =====
function updateMapZones(pollution) {
    const zones = [
        document.getElementById("zone-center"),
        document.getElementById("zone-auezov"),
        document.getElementById("zone-bost")
    ];

    let levelClass = "";

    if (pollution > 70) {
        levelClass = "red";
    } else if (pollution > 40) {
        levelClass = "yellow";
    } else {
        levelClass = "green";
    }

    zones.forEach((zone) => {
        if (!zone) return;
        zone.classList.remove("red", "yellow", "green");
        zone.classList.add(levelClass);
    });
}

function appendChatMessage(container, author, text) {
    const row = document.createElement("div");
    const who = document.createElement("b");
    who.textContent = `${author}: `;

    const msg = document.createElement("span");
    msg.textContent = text;

    row.appendChild(who);
    row.appendChild(msg);
    container.appendChild(row);
    container.scrollTop = container.scrollHeight;
}

function extractErrorMessage(data, fallback) {
    if (data && typeof data === "object") {
        if (typeof data.error === "string") return data.error;
        if (typeof data.answer === "string" && data.answer.startsWith("Ошибка")) return data.answer;
    }

    return fallback;
}

async function postJson(payload) {
    const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    let data = null;
    try {
        data = await res.json();
    } catch (e) {
        data = null;
    }

    if (!res.ok) {
        throw new Error(extractErrorMessage(data, `HTTP ${res.status}`));
    }

    return data;
}

// ===== ЧАТ =====
function toggleChat() {
    document.getElementById("chat").classList.toggle("hidden");
}

async function sendMessage() {
    const input = document.getElementById("chat-input");
    const message = input.value.trim();

    if (!message) return;

    const messages = document.getElementById("chat-messages");
    appendChatMessage(messages, "Ты", message);
    input.value = "";

    try {
        const data = await postJson({ question: message });
        appendChatMessage(messages, "AI", data.answer || "Пустой ответ сервера");
    } catch (err) {
        console.error(err);
        appendChatMessage(messages, "Система", err.message || "Ошибка ответа сервера");
    }
}

// ===== АНАЛИЗ (основной) =====
async function analyze() {
    try {
        const inputData = getSelectedData();
        const data = await postJson(inputData);

        if (data.error) {
            throw new Error(data.error);
        }

        // ===== ЭКОЛОГИЯ =====
        const pollution = inputData.pollution;

        let ecoLevel = "";
        let ecoColor = "";

        if (pollution > 70) {
            ecoLevel = "🔴 Высокий";
            ecoColor = "red";
        } else if (pollution > 40) {
            ecoLevel = "🟡 Средний";
            ecoColor = "orange";
        } else {
            ecoLevel = "🟢 Низкий";
            ecoColor = "green";
        }

        document.getElementById("eco-level").innerText = "Уровень: " + ecoLevel;
        document.getElementById("eco-indicator").style.background = ecoColor;

        updateMapZones(pollution);

        // ===== ТРАНСПОРТ =====
        document.getElementById("problem").innerText = "❗ Проблема: " + data.problem;

        const levelMap = {
            high: "🔴 Высокий",
            medium: "🟡 Средний",
            low: "🟢 Низкий"
        };

        document.getElementById("level").innerText =
            "Уровень: " + (levelMap[data.level] || data.level);

        document.getElementById("recommendation").innerText =
            "📌 Рекомендация: " + data.recommendation;

        const summary = `📊 В районе "${document.getElementById("district").value}" наблюдается ${data.problem.toLowerCase()}.
Это ${data.level === "high" ? "критическая ситуация" : "контролируемая ситуация"}, требующая внимания.`;

        document.getElementById("summary").innerText = summary;

        const resultBlock = document.getElementById("result");

        if (data.level === "high") {
            resultBlock.style.border = "3px solid red";
        } else if (data.level === "medium") {
            resultBlock.style.border = "3px solid orange";
        } else {
            resultBlock.style.border = "3px solid green";
        }

        resultBlock.classList.remove("hidden");
    } catch (error) {
        console.error(error);
        alert("Ошибка при анализе данных: " + error.message);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const chatInput = document.getElementById("chat-input");
    if (!chatInput) return;

    chatInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            sendMessage();
        }
    });
});
