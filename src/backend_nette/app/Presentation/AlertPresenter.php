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

    public function actionDefault(string $deviceId): void
    {
        $activeParam = $this->getParameter('active');

        $active = null;
        if ($activeParam !== null) {
            $active = filter_var(
                $activeParam,
                FILTER_VALIDATE_BOOLEAN,
                FILTER_NULL_ON_FAILURE
            );

            if ($active === null) {
                $this->error('Invalid active parameter', 400);
            }
        }

        $alerts = $this->alerts->getByDevice(
            $deviceId,
            $active
        );

        $this->sendJson($alerts);
    }

public function actionResolve(string $id): void
{
    $userId = $this->getUserIdFromJwt(); 

    $alert = $this->alerts->resolve($userId, $id);

    if (!$alert) {
        $this->error('Alert not found', 404);
    }

    $this->sendJson(
        
         $alert,
    );
}

/**
 * POST /alerts/<id>/delete
 */
public function actionDelete(string $id): void
{
    $userId = $this->getUserIdFromJwt();

    $deleted = $this->alerts->delete($userId, $id);
    if (!$deleted) {
        $this->error('Alert not found', 404);
    }

    $this->sendJson(['deleted' => true]);
}
}



