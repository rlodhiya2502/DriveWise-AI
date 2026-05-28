<?php

declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;
use App\Middleware\CorsMiddleware;
use App\Controllers\AuthController;
use App\Controllers\LessonController;
use App\Controllers\StudentController;
use App\Controllers\InstructorController;
use App\Controllers\RouteController;
use App\Controllers\NotificationController;
use App\Controllers\AdminController;

// Load environment
$dotenv = Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->safeLoad();

// Global CORS + JSON headers
CorsMiddleware::handle();

// ─────────────────────────────────────────────────────────────────────────────
// Auth routes (public)
// ─────────────────────────────────────────────────────────────────────────────
Flight::route('POST /api/auth/google', [new AuthController(), 'googleLogin']);
Flight::route('GET /api/auth/me',      [new AuthController(), 'me']);

// ─────────────────────────────────────────────────────────────────────────────
// Lesson & scheduling routes
// ─────────────────────────────────────────────────────────────────────────────
Flight::route('GET /api/lessons',                   [new LessonController(), 'index']);
Flight::route('POST /api/lessons',                  [new LessonController(), 'create']);
Flight::route('PUT /api/lessons/@id',               function (int $id) { (new LessonController())->update($id); });
Flight::route('POST /api/lessons/@id/feedback',     function (int $id) { (new LessonController())->addFeedback($id); });
Flight::route('GET /api/schedule/suggest',          [new LessonController(), 'suggestSchedule']);

// ─────────────────────────────────────────────────────────────────────────────
// Student routes
// ─────────────────────────────────────────────────────────────────────────────
Flight::route('GET /api/students',                    [new StudentController(), 'index']);
Flight::route('GET /api/students/@id',                function (int $id) { (new StudentController())->show($id); });
Flight::route('PUT /api/students/@id',                function (int $id) { (new StudentController())->update($id); });
Flight::route('GET /api/students/@id/plan',           function (int $id) { (new StudentController())->getLearningPlan($id); });
Flight::route('POST /api/students/@id/plan/generate', function (int $id) { (new StudentController())->generatePlan($id); });
Flight::route('GET /api/students/@id/insights',       function (int $id) { (new StudentController())->getInsights($id); });

// ─────────────────────────────────────────────────────────────────────────────
// Instructor routes
// ─────────────────────────────────────────────────────────────────────────────
Flight::route('GET /api/instructors',                         [new InstructorController(), 'index']);
Flight::route('GET /api/instructors/@id',                     function (int $id) { (new InstructorController())->show($id); });
Flight::route('PUT /api/instructors/@id',                     function (int $id) { (new InstructorController())->update($id); });
Flight::route('GET /api/instructors/@id/availability',        function (int $id) { (new InstructorController())->getAvailability($id); });
Flight::route('POST /api/instructors/@id/availability',       function (int $id) { (new InstructorController())->setAvailability($id); });
Flight::route('GET /api/match/instructor',                    [new InstructorController(), 'matchForStudent']);

// ─────────────────────────────────────────────────────────────────────────────
// Route (driving route) endpoints
// ─────────────────────────────────────────────────────────────────────────────
Flight::route('GET /api/routes',         [new RouteController(), 'index']);
Flight::route('GET /api/routes/@id',     function (int $id) { (new RouteController())->show($id); });
Flight::route('POST /api/routes',        [new RouteController(), 'create']);
Flight::route('POST /api/routes/suggest',[new RouteController(), 'suggest']);
Flight::route('POST /api/geocode',       [new RouteController(), 'geocode']);

// ─────────────────────────────────────────────────────────────────────────────
// Notification routes
// ─────────────────────────────────────────────────────────────────────────────
Flight::route('GET /api/notifications',              [new NotificationController(), 'index']);
Flight::route('PUT /api/notifications/@id/read',     function (int $id) { (new NotificationController())->markRead($id); });

// ─────────────────────────────────────────────────────────────────────────────
// Admin routes
// ─────────────────────────────────────────────────────────────────────────────
Flight::route('GET /api/admin/users',              [new AdminController(), 'listUsers']);
Flight::route('PUT /api/admin/users/@id/role',     function (int $id) { (new AdminController())->updateRole($id); });
Flight::route('GET /api/admin/reports',            [new AdminController(), 'reports']);

// 404 catch-all
Flight::map('notFound', function () {
    http_response_code(404);
    echo json_encode(['error' => 'Route not found']);
});

Flight::start();
