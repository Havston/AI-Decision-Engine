<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

require_once __DIR__ . '/../services/Analyzer.php';
require_once __DIR__ . '/../utils/response.php';

$input = file_get_contents("php://input");
$data = json_decode($input, true);

if (!$data) {
    sendResponse(["error" => "Неверный JSON или пустой запрос"]);
}

$analyzer = new Analyzer();
$answer = $analyzer->chat(
    $data['question'] ?? '', 
    $data['image'] ?? null, 
    $data['context'] ?? null
);

sendResponse(["answer" => $answer]);