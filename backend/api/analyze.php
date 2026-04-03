<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

error_reporting(0);
ini_set('display_errors', 0);
ob_start();

require_once __DIR__ . '/../services/Analyzer.php';
require_once __DIR__ . '/../utils/response.php';

$raw   = file_get_contents("php://input");
$input = json_decode($raw, true);

if (json_last_error() !== JSON_ERROR_NONE || !is_array($input)) {
    ob_end_clean();
    sendResponse(["error" => "Неверный JSON"]);
}

$question = trim((string)($input['question'] ?? ''));
$image    = isset($input['image']) && is_string($input['image']) ? $input['image'] : null;
$context  = isset($input['context']) && is_array($input['context'])  ? $input['context']  : null;

// Базовая валидация изображения (base64)
if ($image !== null && !preg_match('/^[A-Za-z0-9+\/=]+$/', $image)) {
    $image = null;
}

$analyzer = new Analyzer();
$answer   = $analyzer->chat($question, $image, $context);

ob_end_clean();
sendResponse(["answer" => $answer]);
