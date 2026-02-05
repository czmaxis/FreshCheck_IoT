<?php
declare(strict_types=1);

namespace App\Presentation;

use App\Service\JwtService;
use App\Service\SensorDataService;

final class SensorDataPresenter extends BaseApiPresenter
{
    

    public function __construct(
        JwtService $jwt,
        private SensorDataService $sensorData
    ) {
        parent::__construct($jwt);
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

    $this->sendJson(
          $items,
    );
}

/**
 * POST /sensordata/<id>/update
 */
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

    $updated = $this->sensorData->update($userId, $id, $data);
    if (!$updated) {
        $this->error('Sensor data not found', 404);
    }

    $this->sendJson($updated);
}

/**
 * POST /sensordata/<id>/delete
 */
public function actionDelete(string $id): void
{
    $userId = $this->getUserIdFromJwt();

    $deleted = $this->sensorData->delete($userId, $id);
    if (!$deleted) {
        $this->error('Sensor data not found', 404);
    }

    $this->sendJson(['deleted' => true]);
}
}
