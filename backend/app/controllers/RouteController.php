<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Config\Database;
use App\Middleware\AuthMiddleware;
use App\Services\RouteService;
use App\Services\AiService;

class RouteController
{
    private RouteService $routeService;
    private AiService    $ai;

    public function __construct()
    {
        $this->routeService = new RouteService();
        $this->ai           = new AiService();
    }

    /** GET /api/routes */
    public function index(): void
    {
        AuthMiddleware::handle();
        $db   = Database::getConnection();
        $stmt = $db->query(
            'SELECT r.*, u.name AS created_by_name
             FROM routes r
             LEFT JOIN users u ON r.created_by = u.id
             ORDER BY r.id DESC'
        );
        $this->respond(200, ['routes' => $stmt->fetchAll()]);
    }

    /** GET /api/routes/:id */
    public function show(int $id): void
    {
        AuthMiddleware::handle();
        $db   = Database::getConnection();
        $stmt = $db->prepare('SELECT * FROM routes WHERE id = ?');
        $stmt->execute([$id]);
        $route = $stmt->fetch();

        if (!$route) {
            $this->respond(404, ['error' => 'Route not found']);
        }

        $route['waypoints'] = json_decode($route['waypoints'] ?? '[]', true);
        $this->respond(200, ['route' => $route]);
    }

    /** POST /api/routes */
    public function create(): void
    {
        AuthMiddleware::requireRole('instructor', 'admin');
        $body = json_decode(file_get_contents('php://input'), true) ?? [];
        $user = AuthMiddleware::getUser();
        $db   = Database::getConnection();

        $required = ['name', 'topic', 'waypoints'];
        foreach ($required as $field) {
            if (empty($body[$field])) {
                $this->respond(400, ['error' => "Field '{$field}' is required"]);
            }
        }

        // Calculate route distance via OSRM
        $routeData   = [];
        $distanceKm  = null;
        $waypoints   = $body['waypoints'];

        try {
            $routeData  = $this->routeService->calculateRoute($waypoints);
            $distanceKm = $routeData['distance_km'] ?? null;
        } catch (\Exception $e) {
            // Non-fatal: save route without distance
        }

        $db->prepare(
            'INSERT INTO routes (name, topic, waypoints, distance_km, geometry, created_by)
             VALUES (?, ?, ?, ?, ?, ?)'
        )->execute([
            $body['name'],
            $body['topic'],
            json_encode($waypoints),
            $distanceKm,
            isset($routeData['geometry']) ? json_encode($routeData['geometry']) : null,
            $user['sub'],
        ]);

        $routeId = (int) $db->lastInsertId();
        $stmt    = $db->prepare('SELECT * FROM routes WHERE id = ?');
        $stmt->execute([$routeId]);
        $route = $stmt->fetch();
        $route['waypoints'] = json_decode($route['waypoints'], true);

        $this->respond(201, ['route' => $route]);
    }

    /** POST /api/routes/suggest */
    public function suggest(): void
    {
        AuthMiddleware::handle();
        $body = json_decode(file_get_contents('php://input'), true) ?? [];

        $topic = $body['topic'] ?? '';
        $city  = $body['city']  ?? '';

        if (!$topic || !$city) {
            $this->respond(400, ['error' => 'topic and city are required']);
        }

        $suggestion = $this->ai->suggestRouteWaypoints($topic, $city);
        $this->respond(200, ['suggestion' => $suggestion]);
    }

    /** POST /api/geocode */
    public function geocode(): void
    {
        AuthMiddleware::handle();
        $body    = json_decode(file_get_contents('php://input'), true) ?? [];
        $address = $body['address'] ?? '';

        if (!$address) {
            $this->respond(400, ['error' => 'address is required']);
        }

        $coords = $this->routeService->geocode($address);
        if (!$coords) {
            $this->respond(404, ['error' => 'Address not found']);
        }

        $this->respond(200, $coords);
    }

    private function respond(int $code, array $data): void
    {
        http_response_code($code);
        echo json_encode($data);
        exit;
    }
}
