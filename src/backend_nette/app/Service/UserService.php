<?php
declare(strict_types=1);

namespace App\Service;

use App\Repository\UserRepository;
use App\Repository\DeviceRepository;
use App\Repository\SensorDataRepository;
use App\Repository\AlertRepository;

final class UserService
{
    public function __construct(
        private UserRepository $users,
        private DeviceRepository $devices,
        private SensorDataRepository $sensorData,
        private AlertRepository $alerts
    ) {}

    public function deleteUserAndData(string $userId): bool
    {
        $user = $this->users->findById($userId);
        if (!$user) {
            return false;
        }

        $deviceIds = $this->devices->findIdsByUser($userId);
        $this->sensorData->deleteByDeviceIds($deviceIds);
        $this->alerts->deleteByUserId($userId);
        $this->devices->deleteByUserId($userId);

        return $this->users->deleteById($userId);
    }
}
