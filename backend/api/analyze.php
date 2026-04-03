<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

error_reporting(0);
ini_set('display_errors', 0);
ob_start();

$base = dirname(__DIR__);
require_once $base . '/services/Analyzer.php';
require_once $base . '/utils/response.php';

$raw   = file_get_contents("php://input");
$input = json_decode($raw, true);

if (json_last_error() !== JSON_ERROR_NONE || !is_array($input)) {
    ob_end_clean();
    sendResponse(["error" => "Неверный JSON"], 400);
}

$question = trim((string)($input['question'] ?? ''));
$image    = isset($input['image']) && is_string($input['image']) ? $input['image'] : null;
$context  = isset($input['context']) && is_array($input['context']) ? $input['context'] : null;

// Sanitise base64
if ($image !== null && !preg_match('/^[A-Za-z0-9+\/=]+$/', $image)) {
    $image = null;
}

try {
    $analyzer = new Analyzer();
    $answer   = $analyzer->chat($question, $image, $context);
} catch (Throwable $e) {
    error_log("[analyze.php] " . $e->getMessage());
    ob_end_clean();
    sendResponse(["error" => "Внутренняя ошибка сервера"], 500);
}

ob_end_clean();
sendResponse(["answer" => $answer]);