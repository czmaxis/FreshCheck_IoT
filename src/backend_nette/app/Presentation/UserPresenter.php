<?php

declare(strict_types=1);

namespace App\Presentation;

use App\Repository\UserRepository;

final class UserPresenter extends SecuredPresenter
{
    public function __construct(
        private UserRepository $users,
        \App\Service\AuthService $auth
    ) {
        parent::__construct($auth);
    }

    public function actionDefault(): void
    {
        $data = [];

        foreach ($this->users->findAll() as $u) {
            $data[] = [
                'id' => (string) $u['_id'],
                'email' => $u['email'],
                'name' => $u['name'],
            ];
        }

        $this->sendJson($data);
    }

    public function actionDetail(string $id): void
    {
        $u = $this->users->findById($id);

        if (!$u) {
            $this->error('User not found', 404);
        }

        $this->sendJson([
            'id' => (string) $u['_id'],
            'email' => $u['email'],
            'name' => $u['name'],
        ]);
    }
}
