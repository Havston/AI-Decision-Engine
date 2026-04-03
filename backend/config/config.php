<?php

$apiKey = getenv('OPENAI_API_KEY') ?: '';
$model = getenv('OPENAI_MODEL') ?: 'gpt-4o';

$localConfig = __DIR__ . '/config.local.php';
if (is_file($localConfig)) {
    require_once $localConfig;

    if (defined('LOCAL_OPENAI_API_KEY') && LOCAL_OPENAI_API_KEY !== '') {
        $apiKey = LOCAL_OPENAI_API_KEY;
    }

    if (defined('LOCAL_OPENAI_MODEL') && LOCAL_OPENAI_MODEL !== '') {
        $model = LOCAL_OPENAI_MODEL;
    }
}

define('OPENAI_API_KEY', $apiKey);
define('OPENAI_MODEL', $model);
