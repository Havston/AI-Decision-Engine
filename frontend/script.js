async function analyze() {
    const res = await fetch("http://localhost:8000/api/analyze.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            traffic: 80,
            pollution: 70
        })
    });

    const data = await res.json();

    const summary = `📊 В городе наблюдается ${data.problem.toLowerCase()}.
    Это ${data.level === "high" ? "критическая ситуация" : "контролируемая ситуация"}.`;

    document.getElementById("summary").innerText = summary;

    document.getElementById("problem").innerText = "Проблема: " + data.problem;
    document.getElementById("level").innerText = "Уровень: " + data.level;
    document.getElementById("recommendation").innerText = "Рекомендация: " + data.recommendation;

    document.getElementById("result").classList.remove("hidden");

    // цвет по уровню
    if (data.level === "high") {
        document.getElementById("result").style.border = "3px solid red";
    } else if (data.level === "medium") {
        document.getElementById("result").style.border = "3px solid orange";
    } else {
        document.getElementById("result").style.border = "3px solid green";
    }
}