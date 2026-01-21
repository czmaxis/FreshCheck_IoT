<?php

declare(strict_types=1);

namespace App\Service;

use App\Repository\UserRepository;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

final class AuthService
{
    public function __construct(
        private UserRepository $users
    ) {}

    public function login(string $email, string $password): ?string
    {
        $user = $this->users->findByEmail($email);

        if (!$user) {
            return null;
        }

        if (!password_verify($password, $user['passwordHash'])) {
            return null;
        }

        $payload = [
            'sub' => (string) $user['_id'],
            'email' => $user['email'],
            'iat' => time(),
            'exp' => time() + (int) ($_ENV['JWT_TTL'] ?? 3600),
        ];

        return JWT::encode(
            $payload,
            $_ENV['JWT_SECRET'],
            'HS256'
        );
    }

    public function verify(string $token): array
    {
        return (array) JWT::decode(
            $token,
            new Key($_ENV['JWT_SECRET'], 'HS256')
        );
    }
}
