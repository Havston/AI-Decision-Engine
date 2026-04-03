<?php

function sendResponse($data) {
    header("Content-Type: application/json");
    echo json_encode($data);
}