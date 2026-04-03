<?php
require_once __DIR__ . '/AIService.php';

class Analyzer {
    private $ai;
    
    public function __construct() {
        $this->ai = new AIService();
    }
    
    public function analyze($data) {
        $traffic = $data['traffic'] ?? 50;
        $pollution = $data['pollution'] ?? 50;
        
        // Быстрый анализ без AI
        if ($traffic > 70) {
            $level = "high";
            $problem = "Высокая загруженность дорог";
        } elseif ($pollution > 60) {
            $level = "medium";
            $problem = "Высокое загрязнение воздуха";
        } else {
            $level = "low";
            $problem = "Ситуация стабильна";
        }
        
        // AI рекомендация
        $aiPrompt = "Данные города Алматы: трафик {$traffic}%, загрязнение {$pollution}%. Дай короткую рекомендацию акимату.";
        $recommendation = $this->ai->generate($aiPrompt);
        
        return [
            "problem" => $problem,
            "level" => $level,
            "recommendation" => $recommendation,
            "data" => ["traffic" => $traffic, "pollution" => $pollution]
        ];
    }
    
    public function chat($question, $imageBase64 = null, $history = []) {
        return $this->ai->generate($question, $imageBase64);
    }
}
