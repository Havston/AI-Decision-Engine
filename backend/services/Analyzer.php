<?php

class Analyzer {

    public function analyze($data) {
        $traffic = $data['traffic'] ?? 50;
        $pollution = $data['pollution'] ?? 50;

        if ($traffic > 70) {
            return [
                "problem" => "Высокая загруженность дорог",
                "level" => "high",
                "recommendation" => "Оптимизировать светофоры"
            ];
        }

        if ($pollution > 60) {
            return [
                "problem" => "Высокое загрязнение воздуха",
                "level" => "medium",
                "recommendation" => "Ограничить движение"
            ];
        }

        return [
            "problem" => "Ситуация стабильна",
            "level" => "low",
            "recommendation" => "Мониторинг"
        ];
    }
}