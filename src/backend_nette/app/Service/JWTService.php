<?php

declare(strict_types=1);

namespace App\Service;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Exception;

final class JwtService
{
    private string $secret;

    public function __construct(string $secret)
    {
        $this->secret = $secret;
    }

    /**
     * Ověří JWT a vrátí payload
     */
    public function verify(string $token): object
    {
        try {
            return JWT::decode($token, new Key($this->secret, 'HS256'));
        } catch (Exception $e) {
            throw new \RuntimeException('Invalid token');
        }
    }

    /**
     * Vytvoří JWT (už máš, ale pro úplnost)
     */
    public function generate(array $payload): string
    {
        return JWT::encode($payload, $this->secret, 'HS256');
    }
}
