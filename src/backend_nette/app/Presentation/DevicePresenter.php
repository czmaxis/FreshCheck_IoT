<?php

declare(strict_types=1);

namespace App\Presentation;

use App\Service\DeviceService;
use Nette\Application\UI\Presenter;
use App\Service\JwtService;

final class DevicePresenter extends Presenter
{
   public function __construct(
    private DeviceService $devices,
    private JwtService $jwt
) {}

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

        $device = $this->devices->createDevice($userId, $data);

        $this->sendJson($device);
    }

private function getUserIdFromJwt(): string
{
    
    $request = $this->getHttpRequest();

    $auth =
        $request->getHeader('Authorization')
        ?? $_SERVER['HTTP_AUTHORIZATION']
        ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
        ?? null;

    if (!$auth || !preg_match('/^Bearer\s+(.+)$/', $auth, $m)) {
        $this->error('Unauthorized', 401);
    }

    $token = $m[1];

    $payload = $this->jwt->verify($token);

    return (string) $payload->sub;
}

}
