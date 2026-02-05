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
    \Tracy\Debugger::log('SensorDataService constructed', 'sensor');
}

public function create(string $userId, array $data): array
{
    \Tracy\Debugger::log('STEP 1: SensorDataService::create START', 'sensor');

   
    $this->sensorDataRepository->create($userId, $data);

    \Tracy\Debugger::log('STEP 2: AFTER sensor data INSERT', 'sensor');

    
$device = $this->deviceRepository->findOneByUserAndId(
    $userId,
    $data['deviceId']
);

    \Tracy\Debugger::log([
        'STEP 3 RESULT',
        'deviceFound' => (bool) $device,
        'deviceId' => $data['deviceId'],
    ], 'sensor');

   
    if ($device) {
        \Tracy\Debugger::log('STEP 4: CALLING AlertService::evaluate()', 'sensor');
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
        $set['humidity'] = (int) $data['humidity'];
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
    \Tracy\Debugger::log('AFTER INSERT – before device lookup', 'sensor');
    \Tracy\Debugger::log([
    'sensorData' => $sensorData,
], 'sensor');

   
    $device = $this->deviceRepository->findById($sensorData['deviceId']);
    
    \Tracy\Debugger::log([
    'deviceId' => $sensorData['deviceId'],
    'deviceFound' => (bool) $device,
    'device' => $device,
], 'sensor');

   
    if ($device) {
        \Tracy\Debugger::log('CALLING ALERT SERVICE NOW', 'sensor');
        $this->alertService->evaluate($device, $sensorData);
    }
}
}
