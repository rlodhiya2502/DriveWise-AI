<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Config\Database;
use App\Middleware\AuthMiddleware;
use App\Services\AiService;

class StudentController
{
    private AiService $ai;

    public function __construct()
    {
        $this->ai = new AiService();
    }

    /** GET /api/students */
    public function index(): void
    {
        AuthMiddleware::requireRole('admin', 'instructor');
        $db   = Database::getConnection();
        $stmt = $db->query(
            'SELECT s.*, u.name, u.email, u.avatar
             FROM students s
             JOIN users u ON s.user_id = u.id
             ORDER BY u.name'
        );
        $this->respond(200, ['students' => $stmt->fetchAll()]);
    }

    /** GET /api/students/:id */
    public function show(int $id): void
    {
        AuthMiddleware::handle();
        $db   = Database::getConnection();
        $stmt = $db->prepare(
            'SELECT s.*, u.name, u.email, u.avatar, u.whatsapp_number
             FROM students s
             JOIN users u ON s.user_id = u.id
             WHERE s.id = ?'
        );
        $stmt->execute([$id]);
        $student = $stmt->fetch();

        if (!$student) {
            $this->respond(404, ['error' => 'Student not found']);
        }

        $this->respond(200, ['student' => $student]);
    }

    /** PUT /api/students/:id */
    public function update(int $id): void
    {
        AuthMiddleware::handle();
        $body = json_decode(file_get_contents('php://input'), true) ?? [];
        $db   = Database::getConnection();

        $db->prepare(
            'UPDATE students
             SET test_date = ?, skill_level = ?, learning_pace = ?, preferred_instructor_id = ?
             WHERE id = ?'
        )->execute([
            $body['test_date']             ?? null,
            $body['skill_level']           ?? 'beginner',
            $body['learning_pace']         ?? 'average',
            $body['preferred_instructor_id'] ?? null,
            $id,
        ]);

        // Update whatsapp_number on users table if provided
        if (!empty($body['whatsapp_number'])) {
            $stmt = $db->prepare('SELECT user_id FROM students WHERE id = ?');
            $stmt->execute([$id]);
            $s = $stmt->fetch();
            if ($s) {
                $db->prepare('UPDATE users SET whatsapp_number = ? WHERE id = ?')
                   ->execute([$body['whatsapp_number'], $s['user_id']]);
            }
        }

        $this->respond(200, ['message' => 'Student updated']);
    }

    /** GET /api/students/:id/plan */
    public function getLearningPlan(int $id): void
    {
        AuthMiddleware::handle();
        $db   = Database::getConnection();
        $stmt = $db->prepare('SELECT * FROM learning_plans WHERE student_id = ? ORDER BY created_at DESC LIMIT 1');
        $stmt->execute([$id]);
        $plan = $stmt->fetch();

        $this->respond(200, ['plan' => $plan ?: null]);
    }

    /** POST /api/students/:id/plan/generate */
    public function generatePlan(int $id): void
    {
        AuthMiddleware::handle();
        $db   = Database::getConnection();

        $stmt = $db->prepare(
            'SELECT s.*, u.name FROM students s JOIN users u ON s.user_id = u.id WHERE s.id = ?'
        );
        $stmt->execute([$id]);
        $student = $stmt->fetch();

        if (!$student) {
            $this->respond(404, ['error' => 'Student not found']);
        }

        // Get any existing feedback to identify weaknesses
        $stmt = $db->prepare(
            'SELECT lf.skills_data FROM lesson_feedback lf
             JOIN lessons l ON lf.lesson_id = l.id
             WHERE l.student_id = ?
             ORDER BY lf.id DESC LIMIT 5'
        );
        $stmt->execute([$id]);
        $feedbacks = $stmt->fetchAll();

        $weaknesses = [];
        foreach ($feedbacks as $fb) {
            $skills = json_decode($fb['skills_data'] ?? '{}', true);
            foreach ($skills as $skill => $score) {
                if ($score < 3) {
                    $weaknesses[] = $skill;
                }
            }
        }

        $profile = [
            'skill_level'   => $student['skill_level'],
            'test_date'     => $student['test_date'],
            'learning_pace' => $student['learning_pace'],
            'weaknesses'    => array_unique($weaknesses),
        ];

        $planData = $this->ai->generateLearningPlan($profile);

        // Upsert plan
        $db->prepare(
            'INSERT INTO learning_plans (student_id, ai_generated_plan, created_at, updated_at)
             VALUES (?, ?, NOW(), NOW())
             ON DUPLICATE KEY UPDATE ai_generated_plan = VALUES(ai_generated_plan), updated_at = NOW()'
        )->execute([$id, json_encode($planData)]);

        $this->respond(200, ['plan' => $planData]);
    }

    /** GET /api/students/:id/insights */
    public function getInsights(int $id): void
    {
        AuthMiddleware::handle();
        $db = Database::getConnection();

        $stmt = $db->prepare(
            'SELECT l.scheduled_at, l.topic, lf.instructor_notes, lf.skills_data, lf.score
             FROM lessons l
             JOIN lesson_feedback lf ON l.id = lf.lesson_id
             WHERE l.student_id = ?
             ORDER BY l.scheduled_at DESC
             LIMIT 20'
        );
        $stmt->execute([$id]);
        $lessons = $stmt->fetchAll();

        if (empty($lessons)) {
            $this->respond(200, ['insights' => null, 'message' => 'No lesson data yet']);
        }

        // Decode skills_data JSON
        foreach ($lessons as &$lesson) {
            $lesson['skills_data'] = json_decode($lesson['skills_data'] ?? '{}', true);
        }

        $insights = $this->ai->analysePerformance($lessons);
        $this->respond(200, ['insights' => $insights]);
    }

    private function respond(int $code, array $data): void
    {
        http_response_code($code);
        echo json_encode($data);
        exit;
    }
}
