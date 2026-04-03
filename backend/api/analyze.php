<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

require_once __DIR__ . '/../services/Analyzer.php';
require_once __DIR__ . '/../utils/response.php';

$data = json_decode(file_get_contents("php://input"), true);
$analyzer = new Analyzer();

// Если это чат запрос
if (isset($data['question'])) {
    $answer = $analyzer->chat($data['question'], $data['image'] ?? null);
    sendResponse(["answer" => $answer]);
} else {
    // Это анализ данных
    $result = $analyzer->analyze($data);
    sendResponse($result);
}
