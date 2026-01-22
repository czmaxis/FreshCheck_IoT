<?php

declare(strict_types=1);

namespace App\Repository;

use MongoDB\Database;
use MongoDB\Collection;
use MongoDB\BSON\ObjectId;

final class DeviceRepository
{
    private Collection $collection;

    public function __construct(Database $database)
    {
        
        $this->collection = $database->selectCollection('device');
    }

    public function create(string $userId, array $data): array
    {
        $device = [
            'name' => $data['name'],
            'type' => $data['type'],
            'ownerId' => new ObjectId($userId),
            'createdAt' => new \MongoDB\BSON\UTCDateTime(),
        ];

        $result = $this->collection->insertOne($device);

        return [
            'id' => (string) $result->getInsertedId(),
            'name' => $device['name'],
            'type' => $device['type'],
            'ownerId' => (string) $device['ownerId'],
            'createdAt' => $device['createdAt']->toDateTime()->format(DATE_ATOM),
        ];
    }

    public function findByUser(string $userId): array
    {
        $cursor = $this->collection->find([
            'ownerId' => new ObjectId($userId),
        ]);

        return array_map(function ($doc) {
            return [
                'id' => (string) $doc->_id,
                'name' => $doc->name,
                'type' => $doc->type,
                'ownerId' => (string) $doc->ownerId,
                'createdAt' => $doc->createdAt->toDateTime()->format(DATE_ATOM),
            ];
        }, iterator_to_array($cursor));
    }
}
