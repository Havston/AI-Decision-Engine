<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");

require_once __DIR__ . '/../services/Analyzer.php';
require_once __DIR__ . '/../utils/response.php';

$data = json_decode(file_get_contents("php://input"), true);

$analyzer = new Analyzer();
$result = $analyzer->analyze($data);

sendResponse($result);