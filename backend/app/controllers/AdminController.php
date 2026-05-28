<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Config\Database;
use App\Middleware\AuthMiddleware;

class AdminController
{
    /** GET /api/admin/users */
    public function listUsers(): void
    {
        AuthMiddleware::requireRole('admin');
        $db   = Database::getConnection();
        $stmt = $db->query('SELECT id, name, email, role, avatar, created_at FROM users ORDER BY created_at DESC');
        $this->respond(200, ['users' => $stmt->fetchAll()]);
    }

    /** PUT /api/admin/users/:id/role */
    public function updateRole(int $id): void
    {
        AuthMiddleware::requireRole('admin');
        $body = json_decode(file_get_contents('php://input'), true) ?? [];
        $role = $body['role'] ?? '';

        if (!in_array($role, ['admin', 'instructor', 'student'], true)) {
            $this->respond(400, ['error' => 'Invalid role']);
        }

        $db = Database::getConnection();
        $db->prepare('UPDATE users SET role = ? WHERE id = ?')->execute([$role, $id]);

        // If promoted to instructor, create instructor profile if missing
        if ($role === 'instructor') {
            $db->prepare(
                'INSERT IGNORE INTO instructors (user_id, rating) VALUES (?, 0)'
            )->execute([$id]);
        }

        $this->respond(200, ['message' => 'Role updated']);
    }

    /** GET /api/admin/reports */
    public function reports(): void
    {
        AuthMiddleware::requireRole('admin');
        $db = Database::getConnection();

        $stats = [];

        // Total counts
        $stats['total_students']    = $db->query('SELECT COUNT(*) FROM students')->fetchColumn();
        $stats['total_instructors'] = $db->query('SELECT COUNT(*) FROM instructors')->fetchColumn();
        $stats['total_lessons']     = $db->query('SELECT COUNT(*) FROM lessons')->fetchColumn();

        // Lessons this week
        $stats['lessons_this_week'] = $db->query(
            "SELECT COUNT(*) FROM lessons WHERE YEARWEEK(scheduled_at, 1) = YEARWEEK(NOW(), 1)"
        )->fetchColumn();

        // Pass rate (completed lessons with score >= 7)
        $total     = $db->query("SELECT COUNT(*) FROM lesson_feedback")->fetchColumn();
        $passed    = $db->query("SELECT COUNT(*) FROM lesson_feedback WHERE score >= 7")->fetchColumn();
        $stats['pass_rate'] = $total > 0 ? round(($passed / $total) * 100, 1) : 0;

        // Lessons by status
        $stmt = $db->query('SELECT status, COUNT(*) AS count FROM lessons GROUP BY status');
        $stats['lessons_by_status'] = $stmt->fetchAll();

        // Lessons per week (last 8 weeks)
        $stmt = $db->query(
            "SELECT YEARWEEK(scheduled_at, 1) AS week, COUNT(*) AS count
             FROM lessons
             WHERE scheduled_at >= DATE_SUB(NOW(), INTERVAL 8 WEEK)
             GROUP BY week ORDER BY week"
        );
        $stats['lessons_per_week'] = $stmt->fetchAll();

        $this->respond(200, ['reports' => $stats]);
    }

    private function respond(int $code, array $data): void
    {
        http_response_code($code);
        echo json_encode($data);
        exit;
    }
}
