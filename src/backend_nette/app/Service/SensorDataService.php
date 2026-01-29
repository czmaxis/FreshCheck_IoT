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
