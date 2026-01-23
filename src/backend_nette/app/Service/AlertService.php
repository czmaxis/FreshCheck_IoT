<?php
declare(strict_types=1);

namespace App\Service;

use App\Repository\AlertRepository;

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
}
