<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json; charset=utf-8");

// ЗАЩИТА ОТ ЛЮБОГО МУСОРА В JSON
error_reporting(0);
ini_set('display_errors', 0);
ob_start(); // очищаем любой случайный вывод

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

require_once __DIR__ . '/../services/DataService.php';

$ds = new DataService();
$data = $ds->getAll();

// Финальная очистка и вывод ТОЛЬКО JSON
ob_end_clean();
echo json_encode($data, JSON_UNESCAPED_UNICODE);
exit;