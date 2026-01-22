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
     * Vytvoří nové zařízení
     */
    public function createDevice(string $userId, array $data): array
    {
      
        return $this->devices->create($userId, $data);
    }

    /**
     * Vrátí zařízení uživatele
     */
    public function getDevicesForUser(string $userId): array
    {
        return $this->devices->findByUser($userId);
    }
}
