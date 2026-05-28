<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Config\Database;
use Firebase\JWT\JWT;
use Exception;

class AuthController
{
    /**
     * POST /api/auth/google
     * Receives Google ID token, verifies it, creates/finds user, returns JWT.
     */
    public function googleLogin(): void
    {
        $body = json_decode(file_get_contents('php://input'), true);
        $idToken = $body['id_token'] ?? '';

        if (!$idToken) {
            $this->respond(400, ['error' => 'id_token is required']);
        }

        $googleUser = $this->verifyGoogleToken($idToken);
        if (!$googleUser) {
            $this->respond(401, ['error' => 'Invalid Google token']);
        }

        $db   = Database::getConnection();
        $stmt = $db->prepare('SELECT * FROM users WHERE google_id = ?');
        $stmt->execute([$googleUser['sub']]);
        $user = $stmt->fetch();

        if (!$user) {
            // Create new user (default role: student)
            $db->prepare(
                'INSERT INTO users (google_id, email, name, avatar, role, created_at) VALUES (?, ?, ?, ?, ?, NOW())'
            )->execute([
                $googleUser['sub'],
                $googleUser['email'],
                $googleUser['name'],
                $googleUser['picture'] ?? null,
                'student',
            ]);
            $userId = (int) $db->lastInsertId();

            // Create student profile
            $db->prepare(
                'INSERT INTO students (user_id, skill_level, learning_pace) VALUES (?, ?, ?)'
            )->execute([$userId, 'beginner', 'average']);

            $stmt = $db->prepare('SELECT * FROM users WHERE id = ?');
            $stmt->execute([$userId]);
            $user = $stmt->fetch();
        }

        $jwt = $this->generateJwt($user);

        $this->respond(200, [
            'token' => $jwt,
            'user'  => $this->sanitizeUser($user),
        ]);
    }

    /**
     * GET /api/auth/me
     */
    public function me(): void
    {
        \App\Middleware\AuthMiddleware::handle();
        $authUser = \App\Middleware\AuthMiddleware::getUser();

        $db   = Database::getConnection();
        $stmt = $db->prepare('SELECT * FROM users WHERE id = ?');
        $stmt->execute([$authUser['sub']]);
        $user = $stmt->fetch();

        if (!$user) {
            $this->respond(404, ['error' => 'User not found']);
        }

        $this->respond(200, ['user' => $this->sanitizeUser($user)]);
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private function verifyGoogleToken(string $idToken): ?array
    {
        $clientId = $_ENV['GOOGLE_CLIENT_ID'] ?? '';
        $url = "https://oauth2.googleapis.com/tokeninfo?id_token=" . urlencode($idToken);

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 10,
        ]);
        $body = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($code !== 200) {
            return null;
        }

        $data = json_decode($body, true);

        // Verify the token was issued for our app
        if (($data['aud'] ?? '') !== $clientId) {
            return null;
        }

        return $data;
    }

    private function generateJwt(array $user): string
    {
        $secret  = $_ENV['JWT_SECRET'] ?? 'change-me';
        $expiry  = (int) ($_ENV['JWT_EXPIRY'] ?? 86400);
        $payload = [
            'sub'   => $user['id'],
            'email' => $user['email'],
            'name'  => $user['name'],
            'role'  => $user['role'],
            'iat'   => time(),
            'exp'   => time() + $expiry,
        ];

        return JWT::encode($payload, $secret, 'HS256');
    }

    private function sanitizeUser(array $user): array
    {
        unset($user['google_id']);
        return $user;
    }

    private function respond(int $code, array $data): void
    {
        http_response_code($code);
        echo json_encode($data);
        exit;
    }
}
