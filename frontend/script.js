// СУЩЕСТВУЮЩАЯ ФУНКЦИЯ (не меняй)
async function analyze() {
    const res = await fetch("http://localhost:8000/backend/api/analyze.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ traffic: 80, pollution: 70 })
    });
    const data = await res.json();
    const summary = `📊 В городе наблюдается ${data.problem.toLowerCase()}. Это ${data.level === "high" ? "критическая ситуация" : "контролируемая ситуация"}.`;
    document.getElementById("summary").innerText = summary;
    document.getElementById("problem").innerText = "Проблема: " + data.problem;
    document.getElementById("level").innerText = "Уровень: " + data.level;
    document.getElementById("recommendation").innerText = "Рекомендация: " + data.recommendation;
    document.getElementById("result").classList.remove("hidden");
    if (data.level === "high") {
        document.getElementById("result").style.border = "3px solid red";
    } else if (data.level === "medium") {
        document.getElementById("result").style.border = "3px solid orange";
    } else {
        document.getElementById("result").style.border = "3px solid green";
    }
}

// НОВАЯ ФУНКЦИЯ — ЧАТ
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
