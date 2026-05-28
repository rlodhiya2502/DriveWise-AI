<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Config\Database;
use App\Middleware\AuthMiddleware;

class InstructorController
{
    /** GET /api/instructors */
    public function index(): void
    {
        AuthMiddleware::handle();
        $db   = Database::getConnection();
        $stmt = $db->query(
            'SELECT i.*, u.name, u.email, u.avatar
             FROM instructors i
             JOIN users u ON i.user_id = u.id
             ORDER BY i.rating DESC'
        );
        $this->respond(200, ['instructors' => $stmt->fetchAll()]);
    }

    /** GET /api/instructors/:id */
    public function show(int $id): void
    {
        AuthMiddleware::handle();
        $db   = Database::getConnection();
        $stmt = $db->prepare(
            'SELECT i.*, u.name, u.email, u.avatar
             FROM instructors i
             JOIN users u ON i.user_id = u.id
             WHERE i.id = ?'
        );
        $stmt->execute([$id]);
        $instructor = $stmt->fetch();

        if (!$instructor) {
            $this->respond(404, ['error' => 'Instructor not found']);
        }

        $this->respond(200, ['instructor' => $instructor]);
    }

    /** PUT /api/instructors/:id */
    public function update(int $id): void
    {
        AuthMiddleware::requireRole('admin', 'instructor');
        $body = json_decode(file_get_contents('php://input'), true) ?? [];
        $db   = Database::getConnection();

        $db->prepare(
            'UPDATE instructors
             SET bio = ?, specialisations = ?, vehicle_type = ?
             WHERE id = ?'
        )->execute([
            $body['bio']             ?? null,
            isset($body['specialisations']) ? json_encode($body['specialisations']) : null,
            $body['vehicle_type']    ?? null,
            $id,
        ]);

        $this->respond(200, ['message' => 'Instructor updated']);
    }

    /** GET /api/instructors/:id/availability */
    public function getAvailability(int $id): void
    {
        AuthMiddleware::handle();
        $db   = Database::getConnection();
        $stmt = $db->prepare('SELECT * FROM availability WHERE instructor_id = ? ORDER BY day_of_week, start_time');
        $stmt->execute([$id]);
        $this->respond(200, ['availability' => $stmt->fetchAll()]);
    }

    /** POST /api/instructors/:id/availability */
    public function setAvailability(int $id): void
    {
        AuthMiddleware::requireRole('instructor', 'admin');
        $body = json_decode(file_get_contents('php://input'), true) ?? [];
        $db   = Database::getConnection();

        // Replace all availability for this instructor
        $db->prepare('DELETE FROM availability WHERE instructor_id = ?')->execute([$id]);

        $stmt = $db->prepare(
            'INSERT INTO availability (instructor_id, day_of_week, start_time, end_time) VALUES (?, ?, ?, ?)'
        );

        foreach ($body['slots'] ?? [] as $slot) {
            $stmt->execute([$id, $slot['day_of_week'], $slot['start_time'], $slot['end_time']]);
        }

        $this->respond(200, ['message' => 'Availability updated']);
    }

    /** GET /api/match/instructor?student_id=X */
    public function matchForStudent(): void
    {
        AuthMiddleware::handle();
        $studentId = $_GET['student_id'] ?? null;
        if (!$studentId) {
            $this->respond(400, ['error' => 'student_id is required']);
        }

        $db = Database::getConnection();

        $stmt = $db->prepare(
            'SELECT s.*, u.name FROM students s JOIN users u ON s.user_id = u.id WHERE s.id = ?'
        );
        $stmt->execute([$studentId]);
        $student = $stmt->fetch();

        if (!$student) {
            $this->respond(404, ['error' => 'Student not found']);
        }

        $stmt = $db->query(
            'SELECT i.*, u.name, u.email,
                    (SELECT COUNT(*) FROM lessons l WHERE l.instructor_id = i.id AND l.status = \'completed\') AS completed_lessons
             FROM instructors i
             JOIN users u ON i.user_id = u.id
             ORDER BY i.rating DESC'
        );
        $instructors = $stmt->fetchAll();

        // Use AI to rank instructors
        $ai     = new \App\Services\AiService();
        $ranked = $ai->rankInstructors($student, $instructors);

        $this->respond(200, [
            'instructors' => $instructors,
            'ai_ranking'  => $ranked,
        ]);
    }

    private function respond(int $code, array $data): void
    {
        http_response_code($code);
        echo json_encode($data);
        exit;
    }
}
