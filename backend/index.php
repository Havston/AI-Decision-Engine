<!DOCTYPE html>
<html>
<head>
    <title>Smart City Dashboard</title>
</head>
<body>

<h1>AI City Dashboard</h1>

<button onclick="analyze()">Анализировать</button>

<pre id="result"></pre>

<script>
async function analyze() {
    const res = await fetch("http://localhost:8000/analyze", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            traffic: 80,
            pollution: 50
        })
    });

    const data = await res.json();
    document.getElementById("result").innerText = JSON.stringify(data, null, 2);
}
</script>

</body>
</html>