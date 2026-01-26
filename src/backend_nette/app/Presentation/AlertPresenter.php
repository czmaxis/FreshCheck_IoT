<?php

declare(strict_types=1);

namespace App\Presentation;

use App\Service\AlertService;
use App\Service\JwtService;

final class AlertPresenter extends BaseApiPresenter
{
    public function __construct(
        JwtService $jwt,
        private AlertService $alerts,
    ) {
        parent::__construct($jwt);
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

        $alert = $this->alerts->create($userId, $data);

        $this->sendJson($alert);
    }

    public function actionResolve(string $id): void
{
    $userId = $this->getUserIdFromJwt();

    $updated = $this->alerts->resolve($userId, $id);

    if (!$updated) {
        $this->error('Alert not found', 404);
    }

    $this->sendJson($updated);
} 

public function actionDefault(): void
{
    $userId = $this->getUserIdFromJwt();

    $activeParam = $this->getParameter('active');

    if ($activeParam === null) {
       // /alerts all alerts
        $alerts = $this->alerts->getAll($userId);
    } else {
        // /alerts?active=true|false
        $active = filter_var($activeParam, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);

        if ($active === null) {
            $this->error('Invalid active parameter', 400);
        }

        $alerts = $this->alerts->getByActive($userId, $active);
    }

    $this->sendJson($alerts);
}

}
