<?php

declare(strict_types=1);

namespace App\Presentation;

use Nette\Application\UI\Presenter;
use App\Service\AuthService;

abstract class SecuredPresenter extends Presenter
{
    protected array $identity;

    public function __construct(
        private AuthService $auth
    ) {
        parent::__construct();
    }

    protected function startup(): void
    {
        parent::startup();

        $header = $this->getHttpRequest()->getHeader('Authorization');

        if (!$header || !str_starts_with($header, 'Bearer ')) {
            $this->error('Unauthorized', 401);
        }

        $token = substr($header, 7);

        try {
            $this->identity = $this->auth->verify($token);
        } catch (\Throwable $e) {
            $this->error('Invalid token', 401);
        }
    }
}
