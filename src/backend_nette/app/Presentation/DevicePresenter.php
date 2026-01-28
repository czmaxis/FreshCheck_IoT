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

           $device = $this->devices->create(
            $userId,
            $data['name'],
            $data['type'],
            $data['location'] ?? null,
            $data['threshold'] ?? [],
            $data['doorOpenMaxSeconds'] ?? null
            );
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
 protected function getUserIdFromJwt(): string
{
    $authHeader = $this->getHttpRequest()->getHeader('Authorization');

    if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
        $this->error('Missing Authorization header', 401);
    }

    $token = substr($authHeader, 7);

    try {
        $payload = \Firebase\JWT\JWT::decode(
            $token,
            new \Firebase\JWT\Key($_ENV['JWT_SECRET'], 'HS256')
        );
    } catch (\Throwable $e) {
        $this->error('Invalid token', 401);
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


   

     $device = $this->deviceService->create(
        $this->userId, // from JWT
        $data['name'],
        $data['type'],
        $data['location'] ?? null,
        $data['threshold'] ?? [],
        $data['doorOpenMaxSeconds'] ?? null
    );

    $this->sendJson($device);
}
  /**
         * UP /devices/{id}
         */
public function actionUpdate(string $id): void
{
    $raw = $this->getHttpRequest()->getRawBody();
    $data = json_decode($raw, true);

    if (!is_array($data)) {
        $this->error('Invalid JSON', 400);
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