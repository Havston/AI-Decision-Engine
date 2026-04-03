<?php
require_once __DIR__ . '/AIService.php';

class Analyzer {
    private AIService $ai;

    public function __construct() {
        $this->ai = new AIService();
    }

    /**
     * Chat entrypoint — called from analyze.php
     */
    public function chat(string $question, ?string $imageBase64 = null, ?array $context = null): string {
        return $this->ai->generate($question, $imageBase64, $context);
    }
}