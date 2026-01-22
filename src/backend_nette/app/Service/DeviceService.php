<?php

declare(strict_types=1);

namespace App\Service;

use App\Repository\DeviceRepository;

final class DeviceService
{
    public function __construct(
        private DeviceRepository $devices
    ) {}

    public function createDevice(string $userId, array $data): array
    {
        if (empty($data['name']) || empty($data['type'])) {
            throw new \RuntimeException('Missing device data');
        }

        return $this->devices->create(
            $userId,
            $data['name'],
            $data['type']
        );
    }
}
