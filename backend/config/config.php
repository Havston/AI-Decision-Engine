<?php
// =============================================
// CONFIG — загружаем из .env (2 уровня вверх)
// =============================================
$envFile = dirname(__DIR__, 2) . '/.env';

if (file_exists($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#' || strpos($line, '=') === false) continue;
        [$k, $v] = array_map('trim', explode('=', $line, 2));
        putenv("$k=$v"); $_ENV[$k] = $v; $_SERVER[$k] = $v;
    }
} else {
    error_log('[SmartCity] .env not found at ' . $envFile);
}

define('OPENAI_API_KEY', $_ENV['OPENAI_API_KEY'] ?? '');
define('OPENAI_MODEL',   $_ENV['OPENAI_MODEL']   ?? 'gpt-4o');
define('SERPER_API_KEY', $_ENV['SERPER_API_KEY']  ?? '');
define('TWOGIS_API_KEY', $_ENV['TWOGIS_API_KEY']  ?? '');
define('ALMATY_LAT',     $_ENV['ALMATY_LAT']       ?? '43.2220');
define('ALMATY_LON',     $_ENV['ALMATY_LON']       ?? '76.8512');