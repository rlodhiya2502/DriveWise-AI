<?php

declare(strict_types=1);

namespace Tests;

use PHPUnit\Framework\TestCase;
use App\Services\AiService;

class AiServiceTest extends TestCase
{
    public function testParseJsonResponseStripsCodeFences(): void
    {
        $service = new AiService();
        $reflection = new \ReflectionMethod($service, 'parseJsonResponse');
        $reflection->setAccessible(true);

        $raw = "```json\n{\"key\": \"value\"}\n```";
        $result = $reflection->invoke($service, $raw);
        $this->assertSame(['key' => 'value'], $result);
    }

    public function testParseJsonResponseHandlesPlainJson(): void
    {
        $service = new AiService();
        $reflection = new \ReflectionMethod($service, 'parseJsonResponse');
        $reflection->setAccessible(true);

        $raw = '{"totalLessons": 20, "weeklyFrequency": 2}';
        $result = $reflection->invoke($service, $raw);
        $this->assertSame(20, $result['totalLessons']);
        $this->assertSame(2, $result['weeklyFrequency']);
    }

    public function testParseJsonResponseReturnsEmptyArrayOnInvalidJson(): void
    {
        $service = new AiService();
        $reflection = new \ReflectionMethod($service, 'parseJsonResponse');
        $reflection->setAccessible(true);

        $result = $reflection->invoke($service, 'not valid json at all');
        $this->assertSame([], $result);
    }
}
