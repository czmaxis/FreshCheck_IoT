<?php
declare(strict_types=1);

namespace App\Presentation;

use App\Service\JwtService;
use App\Service\SensorDataService;

final class SensorDataPresenter extends BaseApiPresenter
{
    private SensorDataService $sensorData;

    public function __construct(
        JwtService $jwt,
        SensorDataService $sensorData
    ) {
        parent::__construct($jwt);
        $this->sensorData = $sensorData;
    }

    /**
     * POST /sensordata
     */
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

    if (empty($data['deviceId'])) {
        $this->error('deviceId is required', 400);
    }

    $created = $this->sensorData->create($userId, $data);

    $this->sendJson($created);
}

public function actionDefault(string $deviceId): void
{
    $userId = $this->getUserIdFromJwt();

    $items = $this->sensorData->getByDevice($userId, $deviceId);

    $this->sendJson([
        'count' => count($items),
        'items' => $items,
    ]);
}
}
