<?php
declare(strict_types=1);

namespace App\Service;

use App\Repository\SensorDataRepository;
use App\Repository\DeviceRepository;   
use App\Service\AlertService;

final class SensorDataService
{
    
  public function __construct(
    private SensorDataRepository $sensorDataRepository,
    private DeviceRepository $deviceRepository,
    private AlertService $alertService
    
) {
}

public function create(string $userId, array $data): array
{
    $this->sensorDataRepository->create($userId, $data);

    $device = $this->deviceRepository->findOneByUserAndId(
        $userId,
        $data['deviceId']
    );

    if ($device) {
        $this->alertService->evaluate($device, $data);
    }

    return $data;
}



public function getByDevice(string $userId, string $deviceId): array
{
    return $this->sensorDataRepository->findByDevice($deviceId);
}

public function update(string $userId, string $sensorDataId, array $data): ?array
{
    $existing = $this->sensorDataRepository->findById($sensorDataId);
    if (!$existing) {
        return null;
    }

    $deviceId = (string) $existing['deviceId'];
    $device = $this->deviceRepository->findOneByUserAndId($userId, $deviceId);
    if (!$device) {
        return null;
    }

    $set = [];

    if (array_key_exists('temperature', $data)) {
        $set['temperature'] = (float) $data['temperature'];
    }
    if (array_key_exists('humidity', $data)) {
        $set['humidity'] = (float) $data['humidity'];
    }
    if (array_key_exists('illuminance', $data)) {
        $set['illuminance'] = (int) $data['illuminance'];
    }
    if (array_key_exists('doors', $data)) {
        $set['doors'] = (bool) $data['doors'];
    }
    if (array_key_exists('timestamp', $data)) {
        $set['timestamp'] = (string) $data['timestamp'];
    }

    if ($set === []) {
        return null;
    }

    return $this->sensorDataRepository->updateById($sensorDataId, $set);
}

public function delete(string $userId, string $sensorDataId): bool
{
    $existing = $this->sensorDataRepository->findById($sensorDataId);
    if (!$existing) {
        return false;
    }

    $deviceId = (string) $existing['deviceId'];
    $device = $this->deviceRepository->findOneByUserAndId($userId, $deviceId);
    if (!$device) {
        return false;
    }

    return $this->sensorDataRepository->deleteById($sensorDataId);
}

public function ingest(array $sensorData): void
{
  
    $this->sensorDataRepository->insert($sensorData);

    $device = $this->deviceRepository->findById($sensorData['deviceId']);

    if ($device) {
        $this->alertService->evaluate($device, $sensorData);
    }
}
}
