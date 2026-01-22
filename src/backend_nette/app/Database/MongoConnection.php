<?php

declare(strict_types=1);

namespace App\Database;

use MongoDB\Client;
use MongoDB\Database;

final class MongoConnection
{
    private Client $client;
    private string $databaseName;

    public function __construct(string $mongoUri, string $databaseName = 'freshcheck')
    {
        if (!$mongoUri) {
            throw new \RuntimeException('MONGO_URI is not set');
        }

        $this->client = new Client($mongoUri);
        $this->databaseName = $databaseName;
    }

    public function getDatabase(): Database
    {
        return $this->client->selectDatabase($this->databaseName);
    }
}
