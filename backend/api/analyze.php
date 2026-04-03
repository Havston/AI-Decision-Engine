<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Метод не поддерживается. Используйте POST.'], JSON_UNESCAPED_UNICODE);
    exit;
}

require_once __DIR__ . '/../services/Analyzer.php';
require_once __DIR__ . '/../utils/response.php';

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!is_array($data)) {
    http_response_code(400);
    sendResponse(['error' => 'Некорректный JSON в запросе']);
    exit;
}

$analyzer = new Analyzer();

if (isset($data['question'])) {
    $question = trim((string)$data['question']);

    if ($question === '' && empty($data['image'])) {
        http_response_code(400);
        sendResponse(['error' => 'Вопрос не должен быть пустым']);
        exit;
    }

    $answer = $analyzer->chat($question, $data['image'] ?? null);
    sendResponse(['answer' => $answer]);
    exit;
}

$result = $analyzer->analyze($data);
sendResponse($result);
