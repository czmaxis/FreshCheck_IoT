<?php

declare(strict_types=1);

namespace App\Service;

use App\Repository\DeviceRepository;
use MongoDB\BSON\ObjectId; 

final class DeviceService
{
    private DeviceRepository $devices;

    public function __construct(
        private DeviceRepository $deviceRepository
    ) {}

    /**
     * creates a new device for user
     */
 public function create(
    string $ownerId,
    string $name,
    string $type,
    ?string $location,
    array $threshold,
   // ?int $doorOpenMaxSeconds
): array {
    // základní validace thresholds
    if (isset($threshold['temperature'])) {
        $this->validateRange($threshold['temperature']);
    }

    if (isset($threshold['humidity'])) {
        $this->validateRange($threshold['humidity']);
    }

    return $this->deviceRepository->insert([
        'ownerId' => new ObjectId($ownerId),
        'name' => $name,
        'type' => $type,
        'location' => $location,
        'threshold' => $threshold,
       // 'doorOpenMaxSeconds' => $doorOpenMaxSeconds,
    ]);
}

private function validateRange(array $range): void
{
    if (!isset($range['min'], $range['max'])) {
        throw new BadRequestException('Invalid threshold range');
    }
}

    /**
     * retrieves devices for user
     */
    public function getDevicesForUser(string $userId): array
    {
        return $this->deviceRepository->findByUser($userId);
    }

    //get device by id
        public function getDeviceById(string $userId, string $deviceId): ?array
    {
        return $this->deviceRepository->findOneByUserAndId($userId, $deviceId);
    }

    public function deleteDevice(string $userId, string $deviceId): bool
{
    return $this->deviceRepository->deleteByUserAndId($userId, $deviceId);
}
//update device
public function updateDevice(
    string $deviceId,
    string $userId,
    array $data
): ?array {

    
    if (isset($data['threshold'])) {
        if (isset($data['threshold']['temperature'])) {
            $this->validateRange($data['threshold']['temperature']);
        }

        if (isset($data['threshold']['humidity'])) {
            $this->validateRange($data['threshold']['humidity']);
        }
    }

    return $this->deviceRepository->update(
        $deviceId,
        $userId,
        $data
    );
}
}
