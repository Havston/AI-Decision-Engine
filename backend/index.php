<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/services/AIService.php';
require_once __DIR__ . '/services/Analyzer.php';

$analyzer = new Analyzer();
$uri = $_SERVER['REQUEST_URI'];
$body = json_decode(file_get_contents('php://input'), true);

// Роутинг
if (strpos($uri, '/analyze') !== false) {
    $question = $body['question'] ?? '';
    $image    = $body['image']    ?? null;
    $context  = $body['context']  ?? null;
    echo json_encode(['answer' => $analyzer->chat($question, $image, $context)]);

} elseif (strpos($uri, '/ask') !== false) {
    $question = $body['question'] ?? '';
    $image = $body['image'] ?? null;
    $answer = $analyzer->chat($question, $image);
    echo json_encode(["answer" => $answer]);

} else {
    echo json_encode(["status" => "AI Decision Engine работает"]);
}