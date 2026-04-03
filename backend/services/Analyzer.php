<?php
require_once __DIR__ . '/AIService.php';

class Analyzer {
    private $ai;

    public function __construct() {
        $this->ai = new AIService();
    }

    public function analyze($data) {
        $traffic = (int)($data['traffic'] ?? 50);
        $pollution = (int)($data['pollution'] ?? 50);

        $traffic = max(0, min(100, $traffic));
        $pollution = max(0, min(100, $pollution));

        if ($traffic > 70) {
            $level = 'high';
            $problem = 'Высокая загруженность дорог';
        } elseif ($pollution > 60) {
            $level = 'medium';
            $problem = 'Высокое загрязнение воздуха';
        } else {
            $level = 'low';
            $problem = 'Ситуация стабильна';
        }

        $aiPrompt = "Ты система управления городом Алматы.\n\n"
            . "Данные:\n"
            . "- трафик: {$traffic}%\n"
            . "- загрязнение: {$pollution}%\n\n"
            . "Проблема: {$problem}\n\n"
            . "Задача: дай конкретную рекомендацию для акимата.\n"
            . "Требования: максимум 2 предложения, без воды, только действия.";

        $recommendation = $this->ai->generate($aiPrompt);

        return [
            'problem' => $problem,
            'level' => $level,
            'recommendation' => $recommendation,
            'data' => ['traffic' => $traffic, 'pollution' => $pollution]
        ];
    }

    public function chat($question, $imageBase64 = null) {
        return $this->ai->generate($question, $imageBase64);
    }
}