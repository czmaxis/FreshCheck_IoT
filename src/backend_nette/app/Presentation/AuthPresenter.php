<?php

declare(strict_types=1);

namespace App\Presentation;

use Nette\Application\UI\Presenter;
use App\Service\AuthService;

final class AuthPresenter extends Presenter
{
       public function __construct(
        private AuthService $authService
    ) {
        parent::__construct();
    }
public function actionLogin(): void
{
    $request = $this->getHttpRequest();

    $data = json_decode($request->getRawBody(), true);

    if (!is_array($data) || !isset($data['email'], $data['password'])) {
        $this->error('Invalid JSON payload', 400);
    }

    $result = $this->authService->login(
        $data['email'],
        $data['password']
    );

    
    $this->sendJson($result);
}


    public function actionRegister(): void
{
    $request = $this->getHttpRequest();

   
    $raw = $request->getRawBody();
    $data = json_decode($raw, true);

    if (
        !is_array($data) ||
        empty($data['email']) ||
        empty($data['password']) ||
        empty($data['name'])
    ) {
        $this->error('Missing required fields', 400);
    }

    try {
        $user = $this->authService->register(
            $data['email'],
            $data['password'],
            $data['name']
        );
    } catch (\RuntimeException $e) {
        $this->error($e->getMessage(), 409);
    }

    $this->sendJson($user);
}

}
