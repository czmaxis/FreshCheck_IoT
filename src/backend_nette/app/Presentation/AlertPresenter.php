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
}
