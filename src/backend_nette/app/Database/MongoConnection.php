<?php

declare(strict_types=1);

namespace App\Database;

use MongoDB\Client;
use MongoDB\Database;

final class MongoConnection
{
    private Database $database;

    public function __construct()
    {
        $uri = $_ENV['MONGO_URI'];

        $client = new Client($uri);

        // databázi bereme explicitně
        $this->database = $client->selectDatabase('freshcheck');
    }

    public function getDatabase(): Database
    {
        return $this->database;
    }
}
