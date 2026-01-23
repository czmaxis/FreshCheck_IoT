<?php
declare(strict_types=1);

namespace App\Repository;

use MongoDB\Database;
use MongoDB\BSON\ObjectId;
use MongoDB\Collection;

final class AlertRepository
{
    private Collection $collection;

    public function __construct(Database $database)
    {
        $this->collection = $database->selectCollection('alerts');
    }

    public function create(
        string $userId,
        string $deviceId,
        string $type,
        $value
    ): array {
        $doc = [
            'userId'     => new ObjectId($userId),
            'deviceId'   => new ObjectId($deviceId),
            'type'       => $type,
            'value'      => $value,
            'active'     => true,
            'timestamp'  => new \DateTimeImmutable(),
            'resolvedAt' => null,
        ];

        $result = $this->collection->insertOne($doc);

        $doc['_id'] = (string) $result->getInsertedId();
        $doc['userId'] = (string) $doc['userId'];
        $doc['deviceId'] = (string) $doc['deviceId'];

        return $doc;
    }

    public function findActiveByDevice(string $deviceId): array
    {
        $cursor = $this->collection->find(
            [
                'deviceId' => new ObjectId($deviceId),
                'active' => true,
            ],
            [
                'sort' => ['timestamp' => -1],
            ]
        );

        $out = [];
        foreach ($cursor as $doc) {
            $doc['_id'] = (string) $doc['_id'];
            $doc['deviceId'] = (string) $doc['deviceId'];
            $doc['userId'] = (string) $doc['userId'];
            $out[] = $doc;
        }

        return $out;
    }
}
