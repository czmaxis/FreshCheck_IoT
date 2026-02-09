<?php
declare(strict_types=1);

namespace App\Service;

use App\Repository\AlertRepository;

final class AlertService
{
    public function __construct(
        private AlertRepository $alerts
    ) {}

    public function create(string $userId, array $data): array
    {
        foreach (['deviceId', 'type', 'value'] as $field) {
            if (!isset($data[$field])) {
                throw new \InvalidArgumentException("Missing $field");
            }
        }

        if (!in_array($data['type'], ['temperature', 'humidity', 'door'], true)) {
            throw new \InvalidArgumentException('Invalid alert type');
        }

        return $this->alerts->create(
            $userId,
            $data['deviceId'],
            $data['type'],
            $data['value'],
            $data['alertTreshold'] ?? null
        );
    }
public function resolve(string $userId, string $alertId): ?array
{
    return $this->alerts->resolve($userId, $alertId);
}

public function restore(string $userId, string $alertId): ?array
{
    return $this->alerts->restore($userId, $alertId);
}

public function delete(string $userId, string $alertId): bool
{
    return $this->alerts->deleteById($userId, $alertId);
}


public function getByDevice(
        string $deviceId,
        ?bool $active = null
    ): array {
        return $this->alerts->findByDevice($deviceId, $active);
    }


public function evaluate(array $device, array $sensorData): void
{
    if (!isset($device['threshold'])) {
        return;
    }

    $threshold = $device['threshold'];
    $now = new \DateTimeImmutable('now', new \DateTimeZone('UTC'));
    $timestamp = $now->format(\DATE_ATOM);

    //  TEMPERATURE
    if (
        isset($threshold['temperature']['min'], $threshold['temperature']['max']) &&
        isset($sensorData['temperature'])
    ) {
        $value = (float) $sensorData['temperature'];
        $min   = (float) $threshold['temperature']['min'];
        $max   = (float) $threshold['temperature']['max'];

        if ($value < $min || $value > $max) {
            $alertTreshold = [
                'temperature' => [
                    'min' => $threshold['temperature']['min'],
                    'max' => $threshold['temperature']['max'],
                ],
                'humidity' => $threshold['humidity'] ?? null,
            ];
            $this->alerts->insert([
                'deviceId'   => new \MongoDB\BSON\ObjectId($device['_id']),
                'userId'     => new \MongoDB\BSON\ObjectId($device['ownerId']),
                'type'       => 'temperature',
                'value'      => $value,
                'alertTreshold' => $alertTreshold,
                'active'     => true,
                'timestamp'  => $timestamp,
                'resolvedAt' => null,
            ]);
        }
    }

    //  HUMIDITY
    if (
        isset($threshold['humidity']['min'], $threshold['humidity']['max']) &&
        isset($sensorData['humidity'])
    ) {
        $value = (float) $sensorData['humidity'];
        $min   = (float) $threshold['humidity']['min'];
        $max   = (float) $threshold['humidity']['max'];

        if ($value < $min || $value > $max) {
            $alertTreshold = [
                'temperature' => $threshold['temperature'] ?? null,
                'humidity' => [
                    'min' => $threshold['humidity']['min'],
                    'max' => $threshold['humidity']['max'],
                ],
            ];
            $this->alerts->insert([
                'deviceId'   => new \MongoDB\BSON\ObjectId($device['_id']),
                'userId'     => new \MongoDB\BSON\ObjectId($device['ownerId']),
                'type'       => 'humidity',
                'value'      => $value,
                'alertTreshold' => $alertTreshold,
                'active'     => true,
                'timestamp'  => $timestamp,
                'resolvedAt' => null,
            ]);
        }
    }
}

}
