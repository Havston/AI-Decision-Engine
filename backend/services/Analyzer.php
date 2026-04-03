<?php
require_once __DIR__ . '/AIService.php';

class Analyzer {
    private $ai;

    public function __construct() {
        $this->ai = new AIService();
    }

    public function chat($question, $imageBase64 = null, $context = null) {
        return $this->ai->generate($question, $imageBase64, $context);
    }
}
