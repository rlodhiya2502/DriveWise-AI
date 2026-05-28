<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Config\Database;
use App\Middleware\AuthMiddleware;
use App\Services\NotificationService;
use Exception;

class LessonController
{
    private NotificationService $notifications;

    public function __construct()
    {
        $this->notifications = new NotificationService();
    }

    /** GET /api/lessons */
    public function index(): void
    {
        AuthMiddleware::handle();
        $user = AuthMiddleware::getUser();
        $db   = Database::getConnection();

        if ($user['role'] === 'student') {
            $stmt = $db->prepare(
                'SELECT l.*, u.name AS instructor_name
                 FROM lessons l
                 JOIN instructors i ON l.instructor_id = i.id
                 JOIN users u ON i.user_id = u.id
                 JOIN students s ON l.student_id = s.id
                 WHERE s.user_id = ?
                 ORDER BY l.scheduled_at DESC'
            );
            $stmt->execute([$user['sub']]);
        } elseif ($user['role'] === 'instructor') {
            $stmt = $db->prepare(
                'SELECT l.*, u.name AS student_name
                 FROM lessons l
                 JOIN instructors i ON l.instructor_id = i.id
                 JOIN students s ON l.student_id = s.id
                 JOIN users u ON s.user_id = u.id
                 WHERE i.user_id = ?
                 ORDER BY l.scheduled_at DESC'
            );
            $stmt->execute([$user['sub']]);
        } else {
            // Admin: all lessons
            $stmt = $db->query(
                'SELECT l.*,
                        su.name AS student_name,
                        iu.name AS instructor_name
                 FROM lessons l
                 JOIN students s  ON l.student_id  = s.id
                 JOIN users su    ON s.user_id      = su.id
                 JOIN instructors i ON l.instructor_id = i.id
                 JOIN users iu    ON i.user_id      = iu.id
                 ORDER BY l.scheduled_at DESC'
            );
        }

        $this->respond(200, ['lessons' => $stmt->fetchAll()]);
    }

    /** POST /api/lessons */
    public function create(): void
    {
        AuthMiddleware::handle();
        $body = json_decode(file_get_contents('php://input'), true) ?? [];

        $required = ['instructor_id', 'scheduled_at', 'topic', 'duration_mins'];
        foreach ($required as $field) {
            if (empty($body[$field])) {
                $this->respond(400, ['error' => "Field '{$field}' is required"]);
            }
        }

        $db   = Database::getConnection();
        $user = AuthMiddleware::getUser();

        // Resolve student_id
        if ($user['role'] === 'student') {
            $stmt = $db->prepare('SELECT id FROM students WHERE user_id = ?');
            $stmt->execute([$user['sub']]);
            $student = $stmt->fetch();
            if (!$student) {
                $this->respond(404, ['error' => 'Student profile not found']);
            }
            $studentId = $student['id'];
        } else {
            $studentId = $body['student_id'] ?? null;
            if (!$studentId) {
                $this->respond(400, ['error' => 'student_id is required']);
            }
        }

        // Conflict detection: check instructor has no overlapping lesson
        $endTime = date('Y-m-d H:i:s', strtotime($body['scheduled_at']) + ($body['duration_mins'] * 60));
        $stmt = $db->prepare(
            'SELECT id FROM lessons
             WHERE instructor_id = ?
               AND status NOT IN (\'cancelled\')
               AND scheduled_at < ?
               AND DATE_ADD(scheduled_at, INTERVAL duration_mins MINUTE) > ?'
        );
        $stmt->execute([$body['instructor_id'], $endTime, $body['scheduled_at']]);
        if ($stmt->fetch()) {
            $this->respond(409, ['error' => 'Instructor has a conflicting lesson at this time']);
        }

        $db->prepare(
            'INSERT INTO lessons (student_id, instructor_id, scheduled_at, duration_mins, topic, status, route_id, notes)
             VALUES (?, ?, ?, ?, ?, \'scheduled\', ?, ?)'
        )->execute([
            $studentId,
            $body['instructor_id'],
            $body['scheduled_at'],
            $body['duration_mins'],
            $body['topic'],
            $body['route_id'] ?? null,
            $body['notes'] ?? null,
        ]);

        $lessonId = (int) $db->lastInsertId();
        $stmt = $db->prepare('SELECT * FROM lessons WHERE id = ?');
        $stmt->execute([$lessonId]);
        $lesson = $stmt->fetch();

        // Notify student
        $this->notifications->lessonBooked((int) $user['sub'], $lesson);

        $this->respond(201, ['lesson' => $lesson]);
    }

    /** PUT /api/lessons/:id */
    public function update(int $id): void
    {
        AuthMiddleware::handle();
        $body = json_decode(file_get_contents('php://input'), true) ?? [];
        $db   = Database::getConnection();
        $user = AuthMiddleware::getUser();

        $stmt = $db->prepare('SELECT * FROM lessons WHERE id = ?');
        $stmt->execute([$id]);
        $lesson = $stmt->fetch();

        if (!$lesson) {
            $this->respond(404, ['error' => 'Lesson not found']);
        }

        $status    = $body['status']       ?? $lesson['status'];
        $scheduled = $body['scheduled_at'] ?? $lesson['scheduled_at'];
        $notes     = $body['notes']        ?? $lesson['notes'];

        $db->prepare(
            'UPDATE lessons SET status = ?, scheduled_at = ?, notes = ? WHERE id = ?'
        )->execute([$status, $scheduled, $notes, $id]);

        $stmt->execute([$id]);
        $updated = $stmt->fetch();

        if ($status === 'cancelled') {
            $this->notifications->lessonCancelled((int) $user['sub'], $updated);
        }

        $this->respond(200, ['lesson' => $updated]);
    }

    /** POST /api/lessons/:id/feedback */
    public function addFeedback(int $lessonId): void
    {
        AuthMiddleware::requireRole('instructor', 'admin');
        $body = json_decode(file_get_contents('php://input'), true) ?? [];
        $db   = Database::getConnection();

        $db->prepare(
            'INSERT INTO lesson_feedback (lesson_id, instructor_notes, skills_data, score)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE instructor_notes = VALUES(instructor_notes),
                                     skills_data     = VALUES(skills_data),
                                     score           = VALUES(score)'
        )->execute([
            $lessonId,
            $body['instructor_notes'] ?? null,
            isset($body['skills_data']) ? json_encode($body['skills_data']) : null,
            $body['score'] ?? null,
        ]);

        // Mark lesson complete
        $db->prepare('UPDATE lessons SET status = \'completed\' WHERE id = ?')->execute([$lessonId]);

        $this->respond(200, ['message' => 'Feedback saved']);
    }

    /** GET /api/schedule/suggest */
    public function suggestSchedule(): void
    {
        AuthMiddleware::handle();
        $db      = Database::getConnection();
        $user    = AuthMiddleware::getUser();
        $ai      = new \App\Services\AiService();

        $studentId = $_GET['student_id'] ?? null;
        $instructorId = $_GET['instructor_id'] ?? null;

        if (!$studentId || !$instructorId) {
            $this->respond(400, ['error' => 'student_id and instructor_id are required']);
        }

        // Get student profile
        $stmt = $db->prepare('SELECT s.*, u.name FROM students s JOIN users u ON s.user_id = u.id WHERE s.id = ?');
        $stmt->execute([$studentId]);
        $student = $stmt->fetch();

        // Get instructor availability
        $stmt = $db->prepare('SELECT * FROM availability WHERE instructor_id = ?');
        $stmt->execute([$instructorId]);
        $slots = $stmt->fetchAll();

        $suggestions = $ai->suggestLessonTimes($student, $slots);
        $this->respond(200, ['suggestions' => $suggestions]);
    }

    private function respond(int $code, array $data): void
    {
        http_response_code($code);
        echo json_encode($data);
        exit;
    }
}
