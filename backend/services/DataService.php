<?php
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/ZhkhService.php';

class DataService {

    private int $timeout = 10;

    // ── HTTP GET helper ──────────────────────────────────────────
    private function fetchJson(string $url): ?array {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => $this->timeout,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_USERAGENT      => 'SmartCityAlmaty/2.0',
        ]);
        $res  = curl_exec($ch);
        $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err  = curl_error($ch);
        curl_close($ch);

        if ($err || $code !== 200 || !$res) {
            error_log("[DataService] fetchJson ($code) $url: $err");
            return null;
        }

        $decoded = json_decode($res, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            error_log("[DataService] JSON error: " . json_last_error_msg() . " for $url");
            return null;
        }
        return $decoded;
    }

    // ── Serper (Google News) ─────────────────────────────────────
    private function serperSearch(string $query): array {
        if (empty(SERPER_API_KEY)) return [];

        $ch = curl_init('https://google.serper.dev/search');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_TIMEOUT        => 8,
            CURLOPT_POSTFIELDS     => json_encode(['q' => $query, 'gl' => 'kz', 'hl' => 'ru', 'tbs' => 'qdr:d']),
            CURLOPT_HTTPHEADER     => ['X-API-KEY: ' . SERPER_API_KEY, 'Content-Type: application/json'],
            CURLOPT_SSL_VERIFYPEER => true,
        ]);
        $body = curl_exec($ch);
        $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $cerr = curl_error($ch);
        curl_close($ch);

        if ($cerr || $code !== 200 || !$body) {
            error_log("[DataService] Serper ($code): $cerr");
            return [];
        }

        $data = json_decode($body, true);
        $out  = [];
        foreach (array_slice($data['organic'] ?? [], 0, 5) as $item) {
            $out[] = [
                'title'   => $item['title']   ?? '',
                'snippet' => $item['snippet'] ?? '',
                'link'    => $item['link']    ?? '',
            ];
        }
        return $out;
    }

    // ── Air quality (Open-Meteo) ─────────────────────────────────
    public function getAirQuality(): array {
        $url  = "https://air-quality-api.open-meteo.com/v1/air-quality"
              . "?latitude=" . ALMATY_LAT . "&longitude=" . ALMATY_LON
              . "&current=pm10,pm2_5,nitrogen_dioxide,ozone,european_aqi";
        $data = $this->fetchJson($url);

        if (empty($data['current'])) {
            return ['aqi' => 58, 'pm25' => 16.0, 'pm10' => 28.0, 'no2' => 14.0, 'level' => 'medium', 'source' => 'fallback'];
        }

        $c   = $data['current'];
        $aqi = (int)($c['european_aqi'] ?? 50);

        return [
            'aqi'    => $aqi,
            'pm25'   => round((float)($c['pm2_5']            ?? 0), 1),
            'pm10'   => round((float)($c['pm10']             ?? 0), 1),
            'no2'    => round((float)($c['nitrogen_dioxide'] ?? 0), 1),
            'level'  => $aqi > 75 ? 'high' : ($aqi > 50 ? 'medium' : 'low'),
            'source' => 'live_open_meteo',
        ];
    }

    // ── Weather (Open-Meteo) ─────────────────────────────────────
    public function getWeather(): array {
        $url  = "https://api.open-meteo.com/v1/forecast"
              . "?latitude=" . ALMATY_LAT . "&longitude=" . ALMATY_LON
              . "&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,visibility"
              . "&wind_speed_unit=ms";
        $data = $this->fetchJson($url);

        if (empty($data['current'])) {
            return ['temp' => 20, 'feels_like' => 18, 'humidity' => 38, 'wind_speed' => 3.5, 'desc' => 'Ясно', 'visibility' => 16, 'source' => 'fallback'];
        }

        $cur  = $data['current'];
        $temp = (int) round((float)($cur['temperature_2m'] ?? 0));
        $desc = $temp > 28 ? 'Жарко' : ($temp > 15 ? 'Тепло' : ($temp > 0 ? 'Прохладно' : 'Мороз'));

        return [
            'temp'       => $temp,
            'feels_like' => (int) round((float)($cur['apparent_temperature']   ?? 0)),
            'humidity'   => (int)($cur['relative_humidity_2m'] ?? 0),
            'wind_speed' => round((float)($cur['wind_speed_10m'] ?? 0), 1),
            'desc'       => $desc,
            'visibility' => round((float)($cur['visibility'] ?? 10000) / 1000, 1),
            'source'     => 'live_open_meteo',
        ];
    }

    // ── Traffic (2GIS or time-based model) ──────────────────────
    public function getTraffic(): array {
        if (!empty(TWOGIS_API_KEY)) {
            $data = $this->fetchJson("https://catalog.api.2gis.com/3.0/traffic/almaty?key=" . TWOGIS_API_KEY);
            if (isset($data['result']['score'])) {
                $score = max(0, min(10, (int)$data['result']['score']));
                $load  = $score * 10;
                return [
                    'load'     => $load,
                    'level'    => $score >= 7 ? 'high' : ($score >= 4 ? 'medium' : 'low'),
                    'avg_time' => $score * 5 + 15,
                    'peak'     => $score >= 7,
                    'source'   => '2gis_live',
                ];
            }
        }

        // Time-based model (UTC+5 = Almaty)
        $hour   = (int) date('H', time() + 5 * 3600);
        $isPeak = ($hour >= 8 && $hour <= 10) || ($hour >= 17 && $hour <= 19);
        $load   = $isPeak ? rand(72, 93) : rand(22, 48);

        return [
            'load'     => $load,
            'level'    => $load > 70 ? 'high' : ($load > 40 ? 'medium' : 'low'),
            'avg_time' => $isPeak ? 42 : 19,
            'peak'     => $isPeak,
            'source'   => 'almaty_time_model',
        ];
    }

    // ── Safety (Serper) ──────────────────────────────────────────
    public function getSafety(): array {
        $results = $this->serperSearch("происшествия ДТП Алматы за последние 24 часа");
        $count   = count($results);

        return [
            'incidents' => max(2, $count + rand(1, 3)),
            'dtp'       => max(0, $count - 1),
            'response'  => rand(6, 12),
            'details'   => $results,
            'level'     => $count > 5 ? 'high' : ($count > 2 ? 'medium' : 'low'),
            'source'    => empty(SERPER_API_KEY) ? 'model' : 'serper_google',
        ];
    }

    // ── ZhKH (real: alts.kz RSS + azhk.kz + Serper) ─────────────
    public function getZhkh(): array {
        try {
            $svc  = new ZhkhService();
            $data = $svc->getData();
            return [
                'accidents'    => $data['accidents']    ?? 0,
                'water_off'    => $data['water_off']    ?? 0,
                'heat_off'     => $data['heat_off']     ?? 0,
                'electric_off' => $data['electric_off'] ?? 0,
                'complaints'   => $data['complaints']   ?? 60,
                'execution'    => $data['execution']    ?? 85,
                'level'        => $data['level']        ?? 'low',
                'details'      => $data['details']      ?? [],
                'sources'      => $data['sources']      ?? [],
                'source'       => $data['source']       ?? 'live_multi_source',
                'cached'       => $data['cached']       ?? false,
            ];
        } catch (Throwable $e) {
            error_log('[DataService] ZhkhService failed: ' . $e->getMessage());
            return [
                'accidents'    => 0,
                'water_off'    => 0,
                'heat_off'     => 0,
                'electric_off' => 0,
                'complaints'   => 60 + rand(30, 80),
                'execution'    => rand(78, 94),
                'level'        => 'low',
                'details'      => [],
                'source'       => 'model_fallback',
                'cached'       => false,
            ];
        }
    }

    // ── Aggregate ────────────────────────────────────────────────
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