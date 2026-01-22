<?php

declare(strict_types=1);

namespace App\Presentation;

use Nette\Application\UI\Presenter;
use App\Service\AuthService;

final class AuthPresenter extends Presenter
{
    public function __construct(
        private AuthService $auth
    ) {
        parent::__construct();
    }

public function actionLogin(): void
{
    $request = $this->getHttpRequest();
    $data = json_decode($request->getRawBody(), true);

    if (
        !is_array($data) ||
        empty($data['email']) ||
        empty($data['password'])
    ) {
        $this->error('Missing credentials', 400);
    }

    $token = $this->auth->login(
        $data['email'],
        $data['password']
    );

    if (!$token) {
        $this->error('Invalid credentials', 401);
    }

    $this->sendJson([
        'token' => $token,
    ]);
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
        $user = $this->auth->register(
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
