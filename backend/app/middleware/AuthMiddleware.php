<?php

declare(strict_types=1);

namespace App\Middleware;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Exception;

class AuthMiddleware
{
    public static function handle(): void
    {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

        if (!str_starts_with($authHeader, 'Bearer ')) {
            self::unauthorized('Missing or invalid Authorization header');
        }

        $token = substr($authHeader, 7);

        try {
            $secret = $_ENV['JWT_SECRET'] ?? 'change-me';
            $decoded = JWT::decode($token, new Key($secret, 'HS256'));
            \Flight::set('auth_user', (array) $decoded);
        } catch (Exception $e) {
            self::unauthorized('Invalid or expired token');
        }
    }

    public static function requireRole(string ...$roles): void
    {
        self::handle();
        $user = \Flight::get('auth_user');
        if (!in_array($user['role'] ?? '', $roles, true)) {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden: insufficient permissions']);
            exit;
        }
    }

    public static function getUser(): array
    {
        return \Flight::get('auth_user') ?? [];
    }

    private static function unauthorized(string $message): void
    {
        http_response_code(401);
        echo json_encode(['error' => $message]);
        exit;
    }
}
