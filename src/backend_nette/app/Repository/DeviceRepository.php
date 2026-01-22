<?php

declare(strict_types=1);

namespace App\Repository;

use MongoDB\Database;
use MongoDB\BSON\UTCDateTime;

final class DeviceRepository
{
    public function __construct(
        private Database $db
    ) {}

    private function collection()
    {
        return $this->db->selectCollection('device');
    }

    public function create(string $ownerId, string $name, string $type): array
    {
        $result = $this->collection()->insertOne([
            'name' => $name,
            'type' => $type,
            'ownerId' => $ownerId,
            'createdAt' => new UTCDateTime(),
        ]);

        return [
            'id' => (string) $result->getInsertedId(),
            'name' => $name,
            'type' => $type,
        ];
    }
}
