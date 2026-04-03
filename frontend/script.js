// ===== ДАННЫЕ =====
const districts = {
    "Центр": { traffic: 85, pollution: 70 },
    "Алмалинский": { traffic: 60, pollution: 50 },
    "Ауэзовский": { traffic: 40, pollution: 30 },
    "Бостандыкский": { traffic: 75, pollution: 65 }
};

// ===== ПОЛУЧЕНИЕ ДАННЫХ =====
function getSelectedData() {
    const district = document.getElementById("district").value;
    let data = districts[district];

    return {
        traffic: data.traffic + Math.floor(Math.random() * 10 - 5),
        pollution: data.pollution + Math.floor(Math.random() * 10 - 5)
    };
}

// ===== ВКЛАДКИ =====
function switchTab(tabName) {
    document.querySelectorAll(".tab").forEach(btn => btn.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(tab => tab.classList.remove("active"));

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

    zones.forEach(zone => {
        if (!zone) return;
        zone.classList.remove("red", "yellow", "green");
        zone.classList.add(levelClass);
    });
}

// ===== ЧАТ (старый) =====
function toggleChat() {
    document.getElementById("chat").classList.toggle("hidden");
}

async function sendMessage() {
    const input = document.getElementById("chat-input");
    const message = input.value;

    if (!message) return;

    const messages = document.getElementById("chat-messages");

    messages.innerHTML += `<div><b>Ты:</b> ${message}</div>`;
    input.value = "";

    try {
        const res = await fetch("http://localhost:8000/api/analyze.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question: message })
        });

        const data = await res.json();
        messages.innerHTML += `<div><b>AI:</b> ${data.answer}</div>`;
        messages.scrollTop = messages.scrollHeight;

    } catch (err) {
        console.error(err);
        messages.innerHTML += `<div>Ошибка ответа</div>`;
    }
}

// ===== АНАЛИЗ (основной) =====
async function analyze() {
    try {
        const inputData = getSelectedData();

        const res = await fetch("http://localhost:8000/backend/api/analyze.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(inputData)
        });

        const data = await res.json();

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

        // ===== SUMMARY =====
        const summary = `📊 В районе "${document.getElementById("district").value}" наблюдается ${data.problem.toLowerCase()}.
Это ${data.level === "high" ? "критическая ситуация" : "контролируемая ситуация"}, требующая внимания.`;

        document.getElementById("summary").innerText = summary;

        // ===== РАМКА =====
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
        alert("Ошибка при анализе данных");
    }
}

// ===== НОВЫЙ ЧАТ =====
const SESSION_ID = "user_" + Math.random().toString(36).substr(2, 9);
let currentImage = null;

async function sendChat() {
    const input = document.getElementById("chatInput");
    const text = input.value.trim();
    if (!text && !currentImage) return;

    addChatMessage(text || "Анализируй фото", "user");
    input.value = "";

    const imageToSend = currentImage;
    currentImage = null;
    document.getElementById("imagePreview").style.display = "none";

    addChatMessage("...", "ai", "typing");

    const res = await fetch("http://localhost:8000/backend/api/analyze.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            question: text,
            session_id: SESSION_ID,
            image: imageToSend
        })
    });

    const data = await res.json();
    document.getElementById("typing")?.remove();
    addChatMessage(data.answer, "ai");
}

function addChatMessage(text, type, id) {
    const chat = document.getElementById("chatMessages");
    const div = document.createElement("div");
    div.className = "chat-msg " + type;
    div.textContent = text;
    if (id) div.id = id;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        currentImage = e.target.result.split(',')[1];
        document.getElementById("imagePreview").style.display = "block";
        document.getElementById("previewImg").src = e.target.result;
    };
    reader.readAsDataURL(file);
}

document.addEventListener('paste', (e) => {
    for (let item of e.clipboardData.items) {
        if (item.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                currentImage = ev.target.result.split(',')[1];
                document.getElementById("imagePreview").style.display = "block";
                document.getElementById("previewImg").src = ev.target.result;
            };
            reader.readAsDataURL(item.getAsFile());
        }
    }
});