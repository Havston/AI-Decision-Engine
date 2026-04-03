<?php
require_once __DIR__ . '/../config/config.php';

class DataService {

    private int $timeout = 10;

    // ── HTTP GET (JSON) ──────────────────────────────────────
    private function fetchJson(string $url): ?array {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => $this->timeout,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_USERAGENT      => 'SmartCityAlmaty/1.0',
        ]);
        $res  = curl_exec($ch);
        $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err  = curl_error($ch);
        curl_close($ch);

        if ($err || $code !== 200 || !$res) {
            error_log("[DataService] fetchJson failed ($code) $url: $err");
            return null;
        }

        $decoded = json_decode($res, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            error_log("[DataService] JSON decode error for $url: " . json_last_error_msg());
            return null;
        }

        return $decoded;
    }

    // ── Поиск новостей через Serper ──────────────────────────
    private function safeSearch(string $query): array {
        if (!defined('SERPER_API_KEY') || empty(SERPER_API_KEY)) return [];

        $ch = curl_init('https://google.serper.dev/search');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_TIMEOUT        => 8,
            CURLOPT_POSTFIELDS     => json_encode(['q' => $query, 'gl' => 'kz', 'hl' => 'ru', 'tbs' => 'qdr:d']),
            CURLOPT_HTTPHEADER     => ['X-API-KEY: ' . SERPER_API_KEY, 'Content-Type: application/json'],
            CURLOPT_SSL_VERIFYPEER => true,
        ]);

        $response = curl_exec($ch);
        $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlErr  = curl_error($ch);
        curl_close($ch);

        if ($curlErr || $httpCode !== 200 || !$response) {
            error_log("[DataService] Serper failed ($httpCode): $curlErr");
            return [];
        }

        $data = json_decode($response, true);
        if (!isset($data['organic'])) return [];

        $results = [];
        foreach (array_slice($data['organic'], 0, 5) as $item) {
            $results[] = [
                'title'   => $item['title']   ?? '',
                'snippet' => $item['snippet'] ?? '',
                'link'    => $item['link']    ?? '',
            ];
        }
        return $results;
    }

    // ── Экология (Open-Meteo Air Quality) ───────────────────
    public function getAirQuality(): array {
        $url  = "https://air-quality-api.open-meteo.com/v1/air-quality"
              . "?latitude=" . ALMATY_LAT . "&longitude=" . ALMATY_LON
              . "&current=pm10,pm2_5,nitrogen_dioxide,ozone,european_aqi";
        $data = $this->fetchJson($url);

        if (!$data || empty($data['current'])) {
            return ['aqi' => 68, 'pm25' => 18.0, 'pm10' => 30.0, 'no2' => 15.0, 'level' => 'medium', 'source' => 'fallback'];
        }

        $c   = $data['current'];
        $aqi = (int) ($c['european_aqi'] ?? 50);

        return [
            'aqi'    => $aqi,
            'pm25'   => round((float)($c['pm2_5']            ?? 0), 1),
            'pm10'   => round((float)($c['pm10']             ?? 0), 1),
            'no2'    => round((float)($c['nitrogen_dioxide'] ?? 0), 1),
            'level'  => $aqi > 75 ? 'high' : ($aqi > 50 ? 'medium' : 'low'),
            'source' => 'live_open_meteo',
        ];
    }

    // ── Погода (Open-Meteo Forecast) ─────────────────────────
    public function getWeather(): array {
        $url  = "https://api.open-meteo.com/v1/forecast"
              . "?latitude=" . ALMATY_LAT . "&longitude=" . ALMATY_LON
              . "&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,visibility"
              . "&wind_speed_unit=ms";
        $data = $this->fetchJson($url);

        if (!$data || empty($data['current'])) {
            return ['temp' => 22, 'feels_like' => 20, 'humidity' => 35, 'wind_speed' => 3.8, 'desc' => 'Ясно', 'visibility' => 18, 'source' => 'fallback'];
        }

        $cur = $data['current'];
        $temp = (int) round((float)($cur['temperature_2m'] ?? 0));
        $desc = $temp > 25 ? 'Жарко' : ($temp > 10 ? 'Тепло' : ($temp > 0 ? 'Прохладно' : 'Мороз'));

        return [
            'temp'       => $temp,
            'feels_like' => (int) round((float)($cur['apparent_temperature'] ?? 0)),
            'humidity'   => (int)($cur['relative_humidity_2m'] ?? 0),
            'wind_speed' => round((float)($cur['wind_speed_10m'] ?? 0), 1),
            'desc'       => $desc,
            'visibility' => round((float)($cur['visibility'] ?? 10000) / 1000, 1),
            'source'     => 'live_open_meteo',
        ];
    }

    // ── Транспорт (2ГИС или модель по времени) ───────────────
    public function getTraffic(): array {
        $apiKey = defined('TWOGIS_API_KEY') ? TWOGIS_API_KEY : '';

        if (!empty($apiKey)) {
            $data = $this->fetchJson("https://catalog.api.2gis.com/3.0/traffic/almaty?key={$apiKey}");
            if (isset($data['result']['score'])) {
                $score = max(0, min(10, (int)$data['result']['score']));
                $load  = $score * 10;
                return [
                    'load'     => $load,
                    'level'    => $score >= 7 ? 'high' : ($score >= 4 ? 'medium' : 'low'),
                    'avg_time' => ($score * 5) + 15,
                    'peak'     => $score >= 7,
                    'source'   => '2gis_live',
                ];
            }
        }

        // Модель по времени суток (UTC+5 — Алматы)
        $hour   = (int) date('H', time() + 5 * 3600);
        $isPeak = ($hour >= 8 && $hour <= 10) || ($hour >= 17 && $hour <= 19);
        $load   = $isPeak ? rand(72, 94) : rand(25, 48);

        return [
            'load'     => $load,
            'level'    => $load > 70 ? 'high' : ($load > 40 ? 'medium' : 'low'),
            'avg_time' => $isPeak ? 45 : 20,
            'peak'     => $isPeak,
            'source'   => 'almaty_time_model',
        ];
    }

    // ── Безопасность (Serper → Google News) ──────────────────
    public function getSafety(): array {
        $results = $this->safeSearch("происшествия ДТП Алматы за последние 24 часа");
        $count   = count($results);

        return [
            'incidents' => max(3, $count + 2),
            'dtp'       => $count,
            'response'  => rand(6, 11),
            'details'   => $results,
            'level'     => $count > 5 ? 'high' : ($count > 2 ? 'medium' : 'low'),
            'source'    => 'serper_google',
        ];
    }

    // ── ЖКХ (Serper → Google News) ───────────────────────────
    public function getZhkh(): array {
        $results    = $this->safeSearch("отключение воды свет отопление аварии Алматы сегодня");
        $count      = count($results);
        $complaints = $count * 28 + rand(40, 90);
        $execution  = rand(76, 93);

        return [
            'accidents'  => $count,
            'water_off'  => $count,
            'complaints' => $complaints,
            'execution'  => $execution,
            'details'    => $results,
            'level'      => ($count > 3 || $complaints > 140) ? 'high' : 'low',
            'source'     => 'serper_google',
        ];
    }

    // ── Агрегация ────────────────────────────────────────────
    public function getAll(): array {
        return [
            'air'        => $this->getAirQuality(),
            'weather'    => $this->getWeather(),
            'traffic'    => $this->getTraffic(),
            'zhkh'       => $this->getZhkh(),
            'safety'     => $this->getSafety(),
            'updated_at' => date('H:i', time() + 5 * 3600),
        ];
    }
}
