<?php

declare(strict_types=1);

namespace App\Services;

use Exception;

class AiService
{
    private string $groqApiKey;
    private string $groqModel;
    private string $geminiApiKey;

    public function __construct()
    {
        $this->groqApiKey  = $_ENV['GROQ_API_KEY'] ?? '';
        $this->groqModel   = $_ENV['GROQ_MODEL'] ?? 'llama3-8b-8192';
        $this->geminiApiKey = $_ENV['GEMINI_API_KEY'] ?? '';
    }

    /**
     * Generate a personalised learning plan for a student.
     */
    public function generateLearningPlan(array $studentProfile): array
    {
        $prompt = $this->buildLearningPlanPrompt($studentProfile);
        $response = $this->chat($prompt);
        return $this->parseJsonResponse($response);
    }

    /**
     * Adapt an existing plan after lesson feedback.
     */
    public function adaptPlan(array $currentPlan, array $feedback): array
    {
        $prompt = "You are a professional driving instructor AI. Given the current learning plan and latest lesson feedback, update the plan.\n\n"
            . "Current plan: " . json_encode($currentPlan) . "\n\n"
            . "Latest feedback: " . json_encode($feedback) . "\n\n"
            . "Return only a valid JSON object with the updated plan using the same structure.";
        $response = $this->chat($prompt);
        return $this->parseJsonResponse($response);
    }

    /**
     * Analyse lesson history and return performance insights.
     */
    public function analysePerformance(array $lessons): array
    {
        $prompt = "You are a driving school AI analyst. Analyse the following lesson feedback records and return a JSON object with:\n"
            . "- summary (string): overall progress summary\n"
            . "- weakAreas (array of strings): topics needing improvement\n"
            . "- strengths (array of strings): topics student excels at\n"
            . "- passProbability (number 0-100): estimated test pass probability\n"
            . "- recommendations (array of strings): actionable next steps\n\n"
            . "Lesson data: " . json_encode($lessons) . "\n\nReturn ONLY the JSON object.";
        $response = $this->chat($prompt);
        return $this->parseJsonResponse($response);
    }

    /**
     * Suggest driving route waypoints for a given topic and city.
     */
    public function suggestRouteWaypoints(string $topic, string $city): array
    {
        $prompt = "You are a driving instructor AI. Suggest a driving practice route for the topic '{$topic}' in {$city}.\n"
            . "Return ONLY a JSON object with:\n"
            . "- description (string): brief route description\n"
            . "- waypoints (array of objects with lat, lon, label)\n"
            . "- tips (array of strings): instructor tips for this topic\n"
            . "Use realistic coordinates for {$city}.";
        $response = $this->chat($prompt);
        return $this->parseJsonResponse($response);
    }

    /**
     * AI-rank instructors for a student.
     */
    public function rankInstructors(array $student, array $instructors): array
    {
        $prompt = "You are a driving school AI. Rank the following instructors for this student profile.\n\n"
            . "Student: " . json_encode($student) . "\n\n"
            . "Instructors: " . json_encode($instructors) . "\n\n"
            . "Return ONLY a JSON array of instructor IDs in ranked order with a brief 'reason' for each: [{\"id\": 1, \"reason\": \"...\"}]";
        $response = $this->chat($prompt);
        return $this->parseJsonResponse($response);
    }

    /**
     * Suggest optimal lesson times for a student given availability slots.
     */
    public function suggestLessonTimes(array $student, array $availableSlots): array
    {
        $daysUntilTest = $student['test_date']
            ? max(0, (int) round((strtotime($student['test_date']) - time()) / 86400))
            : 90;

        $prompt = "You are a driving school scheduling AI. Given a student with test date in {$daysUntilTest} days "
            . "(skill level: {$student['skill_level']}) and these available slots, "
            . "suggest the best 3 lesson times.\n\n"
            . "Available slots: " . json_encode($availableSlots) . "\n\n"
            . "Return ONLY a JSON array of the top 3 slot objects with an added 'reason' field.";
        $response = $this->chat($prompt);
        return $this->parseJsonResponse($response);
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private function buildLearningPlanPrompt(array $profile): string
    {
        return "You are a professional driving instructor AI. Create a personalised lesson plan.\n\n"
            . "Student profile:\n"
            . "- Skill level: {$profile['skill_level']}\n"
            . "- Test date: " . ($profile['test_date'] ?? 'not set') . "\n"
            . "- Weak areas: " . implode(', ', $profile['weaknesses'] ?? []) . "\n"
            . "- Learning pace: " . ($profile['learning_pace'] ?? 'average') . "\n\n"
            . "Return ONLY a JSON object with:\n"
            . "- totalLessons (number)\n"
            . "- milestones (array of {title, lessonsRequired, topics[]})\n"
            . "- weeklyFrequency (number)\n"
            . "- focusAreas (array of strings)\n"
            . "- notes (string)";
    }

    private function chat(string $prompt): string
    {
        // Try Groq first, fall back to Gemini
        if ($this->groqApiKey) {
            return $this->callGroq($prompt);
        }
        if ($this->geminiApiKey) {
            return $this->callGemini($prompt);
        }
        throw new Exception('No AI API key configured');
    }

    private function callGroq(string $prompt): string
    {
        $payload = json_encode([
            'model'    => $this->groqModel,
            'messages' => [['role' => 'user', 'content' => $prompt]],
            'temperature' => 0.3,
        ]);

        $ch = curl_init('https://api.groq.com/openai/v1/chat/completions');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $payload,
            CURLOPT_HTTPHEADER     => [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $this->groqApiKey,
            ],
            CURLOPT_TIMEOUT        => 30,
        ]);

        $body = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($code !== 200) {
            throw new Exception("Groq API error ({$code}): {$body}");
        }

        $data = json_decode($body, true);
        return $data['choices'][0]['message']['content'] ?? '';
    }

    private function callGemini(string $prompt): string
    {
        $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={$this->geminiApiKey}";
        $payload = json_encode([
            'contents' => [['parts' => [['text' => $prompt]]]],
        ]);

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $payload,
            CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
            CURLOPT_TIMEOUT        => 30,
        ]);

        $body = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($code !== 200) {
            throw new Exception("Gemini API error ({$code}): {$body}");
        }

        $data = json_decode($body, true);
        return $data['candidates'][0]['content']['parts'][0]['text'] ?? '';
    }

    private function parseJsonResponse(string $raw): array
    {
        // Strip markdown code fences if present
        $clean = preg_replace('/```json\s*/i', '', $raw);
        $clean = preg_replace('/```\s*/i', '', $clean ?? $raw);
        $result = json_decode(trim($clean ?? $raw), true);
        return is_array($result) ? $result : [];
    }
}
