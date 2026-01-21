<?php

declare(strict_types=1);

namespace App\Database;

use MongoDB\Client;
use MongoDB\Database;

final class MongoConnection
{
    private Database $db;

    public function __construct()
    {
        $uri = $_ENV['MONGO_URI'] ?? 'mongodb://localhost:27017/freshcheck';

        $client = new Client($uri);

        $dbName = ltrim(parse_url($uri, PHP_URL_PATH) ?? '', '/') ?: 'freshcheck';
        $this->db = $client->selectDatabase($dbName);
    }

    public function db(): Database
    {
        return $this->db;
    }
}
