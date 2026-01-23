<?php

declare(strict_types=1);

namespace App\Service;

use App\Repository\DeviceRepository;

final class DeviceService
{
    private DeviceRepository $devices;

    public function __construct(DeviceRepository $devices)
    {
        $this->devices = $devices;
    }

    /**
     * creates a new device for user
     */
    public function createDevice(string $userId, array $data): array
    {
      
        return $this->devices->create($userId, $data);
    }

    /**
     * retrieves devices for user
     */
    public function getDevicesForUser(string $userId): array
    {
        return $this->devices->findByUser($userId);
    }

    //get device by id
        public function getDeviceById(string $userId, string $deviceId): ?array
    {
        return $this->devices->findOneByUserAndId($userId, $deviceId);
    }

    public function deleteDevice(string $userId, string $deviceId): bool
{
    return $this->devices->deleteByUserAndId($userId, $deviceId);
}
//update device
public function updateDevice(
    string $deviceId,
    string $userId,
    array $data
): ?array
{
    return $this->devices->update(
        $deviceId,
        $userId,
        $data
    );
}
}
