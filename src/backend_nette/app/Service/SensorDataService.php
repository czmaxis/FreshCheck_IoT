<?php
declare(strict_types=1);

namespace App\Service;

use App\Repository\SensorDataRepository;

final class SensorDataService
{
    public function __construct(
        private SensorDataRepository $sensorDataRepository
    ) {}

    public function create(string $userId, array $data): array
    {
        return $this->sensorDataRepository->create($userId, $data);
    }
}
