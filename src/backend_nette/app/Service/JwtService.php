<?php

namespace App\Service;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

final class JwtService


 {
    public function __construct(
        private string $secret,
        private int $ttl
    ) {}

    public function verify(string $token): object
    {
        return JWT::decode($token, new Key($this->secret, 'HS256'));
    }

    public function create(array $payload): string
    {
        return JWT::encode($payload, $this->secret, 'HS256');
    }


    public function createToken(array $user): string
    {
        $now = time();

        $payload = [
            'iat' => $now,
            'exp' => $now + $this->ttl,
            'sub' => (string) $user['_id'],
            'email' => $user['email'],
        ];

        return JWT::encode($payload, $this->secret, 'HS256');
    }
}