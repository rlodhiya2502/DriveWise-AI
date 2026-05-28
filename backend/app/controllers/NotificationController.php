<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Config\Database;
use App\Middleware\AuthMiddleware;

class NotificationController
{
    /** GET /api/notifications */
    public function index(): void
    {
        AuthMiddleware::handle();
        $user = AuthMiddleware::getUser();
        $db   = Database::getConnection();

        $stmt = $db->prepare(
            'SELECT * FROM notifications WHERE user_id = ? ORDER BY sent_at DESC LIMIT 50'
        );
        $stmt->execute([$user['sub']]);
        $this->respond(200, ['notifications' => $stmt->fetchAll()]);
    }

    /** PUT /api/notifications/:id/read */
    public function markRead(int $id): void
    {
        AuthMiddleware::handle();
        $db = Database::getConnection();
        $db->prepare('UPDATE notifications SET read_at = NOW() WHERE id = ?')->execute([$id]);
        $this->respond(200, ['message' => 'Marked as read']);
    }

    private function respond(int $code, array $data): void
    {
        http_response_code($code);
        echo json_encode($data);
        exit;
    }
}
