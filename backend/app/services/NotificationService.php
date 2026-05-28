<?php

declare(strict_types=1);

namespace App\Services;

use App\Config\Database;
use Exception;

class NotificationService
{
    private string $apiKey;
    private string $apiUrl;

    public function __construct()
    {
        $this->apiKey = $_ENV['CHATVIK_API_KEY'] ?? '';
        $this->apiUrl = $_ENV['CHATVIK_API_URL'] ?? 'https://api.chatvik.com/v1/send';
    }

    public function lessonBooked(int $userId, array $lesson): void
    {
        $message = "✅ *DriveWise AI* – Lesson Confirmed!\n\n"
            . "📅 Date: " . date('D, d M Y H:i', strtotime($lesson['scheduled_at'])) . "\n"
            . "📚 Topic: " . $lesson['topic'] . "\n"
            . "⏱ Duration: " . $lesson['duration_mins'] . " mins\n\n"
            . "Safe driving! 🚗";
        $this->send($userId, $message, 'lesson_booked');
    }

    public function lessonReminder(int $userId, array $lesson, int $hoursAhead): void
    {
        $message = "⏰ *DriveWise AI* – Lesson Reminder\n\n"
            . "Your lesson is in *{$hoursAhead} hour(s)*!\n"
            . "📅 " . date('D, d M Y H:i', strtotime($lesson['scheduled_at'])) . "\n"
            . "📚 Topic: " . $lesson['topic'] . "\n\n"
            . "See you soon! 🚘";
        $this->send($userId, $message, 'lesson_reminder');
    }

    public function lessonCancelled(int $userId, array $lesson): void
    {
        $message = "❌ *DriveWise AI* – Lesson Cancelled\n\n"
            . "Your lesson on " . date('D, d M Y H:i', strtotime($lesson['scheduled_at'])) . " has been cancelled.\n"
            . "Please contact your instructor to reschedule.";
        $this->send($userId, $message, 'lesson_cancelled');
    }

    public function milestoneAchieved(int $userId, string $milestone): void
    {
        $message = "🎉 *DriveWise AI* – Milestone Achieved!\n\n"
            . "Congratulations! You've completed: *{$milestone}*\n"
            . "Keep up the great work! 🏆";
        $this->send($userId, $message, 'milestone');
    }

    public function sendCustom(int $userId, string $message): void
    {
        $this->send($userId, $message, 'custom');
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private function send(int $userId, string $message, string $type): void
    {
        $db = Database::getConnection();

        // Get user's phone number (stored as whatsapp_number in users table)
        $stmt = $db->prepare('SELECT whatsapp_number FROM users WHERE id = ?');
        $stmt->execute([$userId]);
        $user = $stmt->fetch();

        if (!$user || empty($user['whatsapp_number'])) {
            return; // No WhatsApp number, skip
        }

        $sent = $this->dispatchWhatsApp($user['whatsapp_number'], $message);

        // Log to notifications table
        $db->prepare(
            'INSERT INTO notifications (user_id, type, message, channel, sent_at) VALUES (?, ?, ?, ?, NOW())'
        )->execute([$userId, $type, $message, 'whatsapp']);
    }

    private function dispatchWhatsApp(string $phone, string $message): bool
    {
        if (!$this->apiKey) {
            return false; // Not configured
        }

        $payload = json_encode([
            'to'      => $phone,
            'message' => $message,
        ]);

        $ch = curl_init($this->apiUrl);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $payload,
            CURLOPT_HTTPHEADER     => [
                'Content-Type: application/json',
                "Authorization: ******",
            ],
            CURLOPT_TIMEOUT        => 10,
        ]);

        $body = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        return $code === 200;
    }
}
