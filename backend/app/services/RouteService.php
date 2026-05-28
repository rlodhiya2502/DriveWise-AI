<?php

declare(strict_types=1);

namespace App\Services;

use Exception;

class RouteService
{
    private const OSRM_BASE  = 'https://router.project-osrm.org/route/v1/driving/';
    private const NOM_BASE   = 'https://nominatim.openstreetmap.org/search';

    /**
     * Geocode an address using Nominatim (OSM).
     * Returns ['lat' => float, 'lon' => float] or null.
     */
    public function geocode(string $address): ?array
    {
        $url = self::NOM_BASE . '?' . http_build_query([
            'q'      => $address,
            'format' => 'json',
            'limit'  => 1,
        ]);

        $body = $this->httpGet($url, ['User-Agent: DriveWiseAI/1.0 (contact@drivewise.ai)']);
        $data = json_decode($body, true);

        if (empty($data)) {
            return null;
        }

        return [
            'lat' => (float) $data[0]['lat'],
            'lon' => (float) $data[0]['lon'],
        ];
    }

    /**
     * Calculate a driving route between waypoints using OSRM.
     * $waypoints = [['lat' => x, 'lon' => y], ...]
     */
    public function calculateRoute(array $waypoints): array
    {
        if (count($waypoints) < 2) {
            throw new Exception('At least 2 waypoints required');
        }

        $coords = implode(';', array_map(
            fn($wp) => "{$wp['lon']},{$wp['lat']}",
            $waypoints
        ));

        $url = self::OSRM_BASE . $coords . '?overview=full&geometries=geojson&steps=true';
        $body = $this->httpGet($url);
        $data = json_decode($body, true);

        if (($data['code'] ?? '') !== 'Ok') {
            throw new Exception('OSRM routing failed: ' . ($data['message'] ?? 'unknown error'));
        }

        $route = $data['routes'][0];
        return [
            'distance_km' => round($route['distance'] / 1000, 2),
            'duration_min' => round($route['duration'] / 60, 1),
            'geometry'    => $route['geometry'],
            'steps'       => $route['legs'][0]['steps'] ?? [],
        ];
    }

    private function httpGet(string $url, array $headers = []): string
    {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => $headers,
            CURLOPT_TIMEOUT        => 15,
            CURLOPT_FOLLOWLOCATION => true,
        ]);
        $body = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($code !== 200) {
            throw new Exception("HTTP request failed ({$code}): {$url}");
        }

        return $body;
    }
}
