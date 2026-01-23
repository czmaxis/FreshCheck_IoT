<?php

namespace App\Service;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

final class JwtService
{
    private string $secret;

    public function __construct(string $jwtSecret)
    {
        if ($jwtSecret === '') {
            throw new \RuntimeException('JWT secret is empty');
        }

        $this->secret = $jwtSecret;
    }

    public function verify(string $token): object
    {
        return JWT::decode($token, new Key($this->secret, 'HS256'));
    }

    public function create(array $payload): string
    {
        return JWT::encode($payload, $this->secret, 'HS256');
    }
}