<?php
// =============================================
// КОНФИГУРАЦИЯ — загружаем из .env
// =============================================

$envFile = __DIR__ . '/../../.env';

if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
            list($key, $value) = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value);
            putenv("$key=$value");
            $_ENV[$key] = $value;
            $_SERVER[$key] = $value;
        }
    }
} else {
    die("❌ Файл .env не найден! Создай его в корне проекта.");
}

// === Основные константы ===
define('OPENAI_API_KEY', $_ENV['OPENAI_API_KEY'] ?? '');
define('OPENAI_MODEL', 'gpt-4o');
define('SERPER_API_KEY', $_ENV['SERPER_API_KEY'] ?? '');
define('TWOGIS_API_KEY', $_ENV['TWOGIS_API_KEY'] ?? '');
define('ALMATY_LAT', $_ENV['ALMATY_LAT'] ?? '43.2220');
define('ALMATY_LON', $_ENV['ALMATY_LON'] ?? '76.8512');