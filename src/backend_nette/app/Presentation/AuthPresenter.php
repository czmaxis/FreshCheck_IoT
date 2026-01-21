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
        $data = $this->getHttpRequest()->getPost();

        $token = $this->auth->login(
            $data['email'] ?? '',
            $data['password'] ?? ''
        );

        if (!$token) {
            $this->sendJson([
                'error' => 'Invalid credentials',
            ]);
            return;
        }

        $this->sendJson([
            'token' => $token,
        ]);
    }
}
