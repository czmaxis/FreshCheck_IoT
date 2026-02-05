<?php
declare(strict_types=1);

namespace App\Presentation;

use App\Repository\UserRepository;
use App\Service\UserService;
use MongoDB\BSON\UTCDateTime;

final class UserPresenter extends SecuredPresenter
{
    public function __construct(
        private UserRepository $users,
        private UserService $userService,
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

    public function actionUpdate(): void
    {
        $raw = trim($this->getHttpRequest()->getRawBody());
        if ($raw === '') {
            $this->error('Invalid JSON payload', 400);
        }

        $data = json_decode($raw, true);
        if (!is_array($data)) {
            $this->error('Invalid JSON payload', 400);
        }

        $userId = (string) ($this->identity['sub'] ?? '');
        if ($userId === '') {
            $this->error('Unauthorized', 401);
        }

        $user = $this->users->findById($userId);
        if (!$user) {
            $this->error('User not found', 404);
        }

        $set = [];

        if (array_key_exists('email', $data)) {
            $email = trim((string) $data['email']);
            if ($email === '') {
                $this->error('Invalid email', 400);
            }

            if ($email !== $user['email'] && $this->users->existsByEmail($email)) {
                $this->error('Email already in use', 409);
            }

            $set['email'] = $email;
        }

        if (array_key_exists('name', $data)) {
            $name = trim((string) $data['name']);
            if ($name === '') {
                $this->error('Invalid name', 400);
            }

            $set['name'] = $name;
        }

        if (array_key_exists('password', $data)) {
            $password = (string) $data['password'];
            if ($password === '') {
                $this->error('Invalid password', 400);
            }

            if (!array_key_exists('oldPassword', $data)) {
                $this->error('Old password required', 400);
            }

            $oldPassword = (string) $data['oldPassword'];
            if ($oldPassword === '') {
                $this->error('Invalid old password', 400);
            }

            if (!password_verify($oldPassword, $user['passwordHash'])) {
                $this->error('Old password does not match', 403);
            }

            $set['passwordHash'] = password_hash($password, PASSWORD_BCRYPT);
        }

        if ($set === []) {
            $this->error('No fields to update', 400);
        }

        $set['updatedAt'] = new UTCDateTime();

        $updated = $this->users->updateById($userId, $set);
        if (!$updated) {
            $this->error('User not found', 404);
        }

        $this->sendJson([
            'id' => (string) $updated['_id'],
            'email' => $updated['email'],
            'name' => $updated['name'],
        ]);
    }

    public function actionDelete(): void
    {
        $userId = (string) ($this->identity['sub'] ?? '');
        if ($userId === '') {
            $this->error('Unauthorized', 401);
        }

        $deleted = $this->userService->deleteUserAndData($userId);
        if (!$deleted) {
            $this->error('User not found', 404);
        }

        $this->sendJson(['deleted' => true]);
    }
}

