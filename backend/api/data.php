<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

error_reporting(0);
ini_set('display_errors', 0);
ob_start();

require_once dirname(__DIR__) . '/services/DataService.php';

try {
    $ds   = new DataService();
    $data = $ds->getAll();
} catch (Throwable $e) {
    error_log("[data.php] " . $e->getMessage());
    ob_end_clean();
    http_response_code(500);
    echo json_encode(["error" => "Ошибка загрузки данных"], JSON_UNESCAPED_UNICODE);
    exit;
}

ob_end_clean();
echo json_encode($data, JSON_UNESCAPED_UNICODE);
exit;