const districts = {
    "Центр": { traffic: 85, pollution: 70 },
    "Алмалинский": { traffic: 60, pollution: 50 },
    "Ауэзовский": { traffic: 40, pollution: 30 },
    "Бостандыкский": { traffic: 75, pollution: 65 }
};

function getSelectedData() {
    const district = document.getElementById("district").value;
    let data = districts[district];

    // немного "живости"
    return {
        traffic: data.traffic + Math.floor(Math.random() * 10 - 5),
        pollution: data.pollution + Math.floor(Math.random() * 10 - 5)
    };
}

async function analyze() {
    try {
        const inputData = getSelectedData();

        const res = await fetch("http://localhost:8000/api/analyze.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(inputData)
        });

        const data = await res.json();

        // ЭКОЛОГИЯ
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

        // вывод
        document.getElementById("problem").innerText = "❗ Проблема: " + data.problem;

        const levelMap = {
            high: "🔴 Высокий",
            medium: "🟡 Средний",
            low: "🟢 Низкий"
        };

        document.getElementById("level").innerText = "Уровень: " + (levelMap[data.level] || data.level);
        document.getElementById("recommendation").innerText = "📌 Рекомендация: " + data.recommendation;

        // summary (ВАУ блок)
        const summary = `📊 В районе "${document.getElementById("district").value}" наблюдается ${data.problem.toLowerCase()}.
Это ${data.level === "high" ? "критическая ситуация" : "контролируемая ситуация"}, требующая внимания.`;

        document.getElementById("summary").innerText = summary;

        // цвет рамки
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