<?php
declare(strict_types=1);

namespace App\Service;

use App\Repository\AlertRepository;
use DateTimeImmutable;
use DateTimeZone;

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
            $data['value']
        );
    }

    public function getActiveByDevice(string $deviceId): array
    {
        return $this->alerts->findActiveByDevice($deviceId);
    }
    public function resolve(string $userId, string $alertId): ?array
{
    return $this->alerts->resolve($userId, $alertId);
}
public function getAll(string $userId): array
{
    return $this->alerts->findAllByUser($userId);
}

public function getByActive(string $userId, bool $active): array
{
    return $this->alerts->findByActive($userId, $active);
}

   public function evaluate(
    
    
        array $device,
        array $sensorData
    ): void {

    
\Tracy\Debugger::log([
    'device' => $device,
    'sensorData' => $sensorData,
], 'alert');
        $now = (new DateTimeImmutable('now', new DateTimeZone('UTC')))
            ->format(DATE_ATOM);

        //  TEMPERATURE
        if (isset($device['threshold']['temperature'])) {
            $min = $device['threshold']['temperature']['min'];
            $max = $device['threshold']['temperature']['max'];
            $value = $sensorData['temperature'] ?? null;

            if ($value !== null && ($value < $min || $value > $max)) {
                $this->createAlert(
                    
                    $device['_id'],
                    'temperature',
                    "Temperature {$value}°C is out of range ({$min}–{$max})",
                    compact('value', 'min', 'max'),
                    $now
                );
            }
        }

        //  HUMIDITY
        if (isset($device['threshold']['humidity'])) {
            $min = $device['threshold']['humidity']['min'];
            $max = $device['threshold']['humidity']['max'];
            $value = $sensorData['humidity'] ?? null;

            if ($value !== null && ($value < $min || $value > $max)) {
                $this->createAlert(
                    $device['_id'],
                    'humidity',
                    "Humidity {$value}% is out of range ({$min}–{$max})",
                    compact('value', 'min', 'max'),
                    $now
                );
            }
        }

        //  DOOR
        if (
            isset($device['doorOpenMaxSeconds']) &&
            isset($sensorData['doorOpenSeconds']) &&
            $sensorData['doorOpenSeconds'] > $device['doorOpenMaxSeconds']
        ) {
            $this->createAlert(
                $device['_id'],
                'door',
                'Door open too long',
                [
                    'value' => $sensorData['doorOpenSeconds'],
                    'max' => $device['doorOpenMaxSeconds'],
                ],
                $now
            );
        }
        
    }

    private function createAlert(
        string $deviceId,
        string $type,
        string $message,
        array $data,
        string $createdAt
    ): void {
        $this->alerts->insert([
            'deviceId' => $deviceId,
            'type' => $type,
            'message' => $message,
            'data' => $data,
            'createdAt' => $createdAt,
            'resolved' => false,
        ]);
    }
    public function ingest(array $sensorData): void
{
    $device = $this->deviceRepository->findById($sensorData['deviceId']);

    if (!$device) {
        return;
    }

   
    $this->sensorDataRepository->insert($sensorData);

    
    $this->alertService->evaluate($device, $sensorData);
}
}
