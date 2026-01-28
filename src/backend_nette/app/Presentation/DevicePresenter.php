<?php

declare(strict_types=1);

namespace App\Presentation;

use App\Service\DeviceService;
use App\Service\JwtService;
use Nette\Application\UI\Presenter;
use Nette\Http\IRequest;

final class DevicePresenter extends Presenter
{
    private DeviceService $devices;
    private JwtService $jwt;
    private IRequest $httpRequest;

    public function __construct(
        DeviceService $devices,
        JwtService $jwt,
        IRequest $httpRequest
    ) {
        parent::__construct();
        $this->devices = $devices;
        $this->jwt = $jwt;
        $this->httpRequest = $httpRequest;
    }

    public function actionDefault(): void
    {
        $method = $this->httpRequest->getMethod();
        $userId = $this->getUserIdFromJwt();

        // -------------------------
        // GET /devices
        // -------------------------
        if ($method === 'GET') {
            $devices = $this->devices->getDevicesForUser($userId);

            $this->sendJson(
               $devices,
            );
        }

        // -------------------------
        // POST /devices
        // -------------------------
        if ($method === 'POST') {
            $raw = $this->httpRequest->getRawBody();
            $data = json_decode($raw, true);

            if (!is_array($data)) {
                $this->error('Invalid JSON', 400);
            }

            if (empty($data['name']) || empty($data['type'])) {
                $this->error('Missing required fields', 400);
            }

            $device = $this->devices->createDevice($userId, $data);
            $this->sendJson($device);
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
     * get userId from JWT token
     */
    private function getUserIdFromJwt(): string
    {
        $auth =
            $this->httpRequest->getHeader('Authorization')
            ?? $_SERVER['HTTP_AUTHORIZATION']
            ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
            ?? null;

        if (!$auth || !preg_match('/^Bearer\s+(.+)$/', $auth, $m)) {
            $this->error('Unauthorized', 401);
        }

        $token = $m[1];

        try {
            $payload = $this->jwt->verify($token);
        } catch (\Throwable $e) {
            $this->error('Invalid token', 401);
        }

        if (empty($payload->sub)) {
            $this->error('Invalid token payload', 401);
        }

            return (string) $payload->sub;
        }
        /**
         * DELETE /devices/{id}
         */
  public function actionDelete(string $id): void
{
    $userId = $this->getUserIdFromJwt();

    $result = $this->devices->deleteDevice($userId, $id);

    $this->sendJson([
        'deleted' => true,
        'id' => $id,
    ]);
}
public function actionCreate(): void
{
    $userId = $this->getUserIdFromJwt();

    $data = json_decode(
        $this->getHttpRequest()->getRawBody(),
        true
    );

    if (!is_array($data)) {
        $this->error('Invalid JSON', 400);
    }

    if (!isset($data['name'], $data['type'])) {
        $this->error('Missing required fields', 400);
    }

    // location je volitelná
    $data['location'] = $data['location'] ?? null;

    $device = $this->devices->createDevice($userId, $data);

    $this->sendJson($device);
}

public function actionUpdate(string $id): void
{
    $userId = $this->getUserIdFromJwt();

    $data = json_decode(
        $this->getHttpRequest()->getRawBody(),
        true
    );

    if (!is_array($data)) {
        $this->error('Invalid JSON', 400);
    }

    
    $allowed = ['name', 'type', 'location'];
    $updateData = array_intersect_key($data, array_flip($allowed));

    if ($updateData === []) {
        $this->error('Nothing to update', 400);
    }

    $device = $this->devices->updateDevice(
        $id,
        $userId,
        $updateData
    );

    if (!$device) {
        $this->error('Device not found', 404);
    }

    $this->sendJson($device);
}
}
