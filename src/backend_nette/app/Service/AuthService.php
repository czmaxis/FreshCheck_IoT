<?php

declare(strict_types=1);

namespace App\Service;

use App\Repository\UserRepository;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

final class AuthService
{
    public function __construct(
        private UserRepository $users,
        private JwtService $jwtService
    ) {}

    public function login(string $email, string $password): array
    {
        $user = $this->users->findByEmail($email);

        if (!$user) {
            throw new AuthenticationException('User not found');
        }

        if (!password_verify($password, $user['passwordHash'])) {
            throw new AuthenticationException('Invalid credentials');
        }

        $token = $this->jwtService->createToken($user);

        return [
            'token' => $token,
            'user' => [
                '_id' => (string) $user['_id'],
                'email' => $user['email'],
                'name' => $user['name'],
            ],
        ];
    }



    public function verify(string $token): array
    {
        return (array) JWT::decode(
            $token,
            new Key($_ENV['JWT_SECRET'], 'HS256')
        );
    }

    public function register(string $email, string $password, string $name): array
{
    if ($this->users->existsByEmail($email)) {
        throw new \RuntimeException('User already exists');
    }

    $hash = password_hash($password, PASSWORD_BCRYPT);

    return $this->users->create($email, $hash, $name);
}
}
