<?php

declare(strict_types=1);

namespace App\Presentation;

use App\Service\DeviceService;
use App\Service\JwtService;

final class DevicePresenter extends BaseApiPresenter
{
    private DeviceService $devices;

    public function __construct(
        DeviceService $devices,
        JwtService $jwt
    ) {
        parent::__construct($jwt);
        $this->devices = $devices;
    }

    public function actionDefault(): void
    {
        $method = $this->getHttpRequest()->getMethod();
        $userId = $this->getUserIdFromJwt();

        // GET /devices
        if ($method === 'GET') {
            $devices = $this->devices->getDevicesForUser($userId);
            $this->sendJson($devices);
        }

        // POST /devices
        if ($method === 'POST') {
            $raw = $this->getHttpRequest()->getRawBody();
            $data = json_decode($raw, true);

            if (!is_array($data)) {
                $this->error('Invalid JSON', 400);
            }

            if (empty($data['name'])) {
                $this->error('Missing required fields', 400);
            }

            $device = $this->devices->create(
                $userId,
                $data['name'],
                $data['location'] ?? null,
                $data['threshold'] ?? []
            );
            $this->sendJson(['device' => $device]);
        }

        $this->error('Method not allowed', 405);
    }

    /**
     * GET /devices/{id}
     */
    public function actionDetail(string $id): void
    {
        $userId = $this->getUserIdFromJwt();

        $device = $this->devices->getDeviceById($userId, $id);

        if ($device === null) {
            $this->error('Device not found', 404);
        }

        $this->sendJson($device);
    }

    /**
     * DELETE /devices/{id}
     */
    public function actionDelete(string $id): void
    {
        $userId = $this->getUserIdFromJwt();

        $this->devices->deleteDevice($userId, $id);

        $this->sendJson([
            'deleted' => true,
            'id' => $id,
        ]);
    }

    /**
     * PUT /devices/{id}
     */
    public function actionUpdate(string $id): void
    {
        $raw = trim($this->getHttpRequest()->getRawBody());

        if ($raw === '') {
            $data = [];
        } else {
            $data = json_decode($raw, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                $this->error('Invalid JSON', 400);
            }
        }

        $userId = $this->getUserIdFromJwt();

        $device = $this->devices->updateDevice(
            $id,
            $userId,
            $data
        );

        if (!$device) {
            $this->error('Device not found', 404);
        }

        $this->sendJson([
            'device' => $device,
        ]);
    }
}
