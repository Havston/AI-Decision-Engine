<?php

require_once __DIR__ . '/../services/Analyzer.php';
require_once __DIR__ . '/../utils/response.php';

$data = json_decode(file_get_contents("php://input"), true);

$analyzer = new Analyzer();
$result = $analyzer->analyze($data);

sendResponse($result);