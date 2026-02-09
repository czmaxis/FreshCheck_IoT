<?php
declare(strict_types=1);

namespace App\Repository;

use MongoDB\Database;
use MongoDB\BSON\ObjectId;
use MongoDB\Collection;
use MongoDB\Model\BSONDocument;
final class AlertRepository
{
    private Collection $collection;

    public function __construct(Database $database)
    {
        $this->collection = $database->selectCollection('alert');
    }

    public function create(
        string $userId,
        string $deviceId,
        string $type,
        $value,
        ?array $alertTreshold = null
    ): array {
        $doc = [
            'userId'     => new ObjectId($userId),
            'deviceId'   => new ObjectId($deviceId),
            'type'       => $type,
            'value'      => $value,
            'active'     => true,
            'timestamp'  => (new \DateTimeImmutable('now', new \DateTimeZone('UTC')))->format(\DATE_ATOM),
            'resolvedAt' => null,
        ];
        if ($alertTreshold !== null) {
            $doc['alertTreshold'] = $alertTreshold;
        }

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
            $out[] = $this->normalize($doc);
        }

        return $out;
    }

public function resolve(string $userId, string $alertId): ?array
{
    $result = $this->collection->findOneAndUpdate(
        [
            '_id' => new ObjectId($alertId),
            'userId' => new ObjectId($userId),
            'active' => true,
        ],
        [
            '$set' => [
                'active' => false,
                'resolvedAt' => (new \DateTimeImmutable(
                    'now',
                    new \DateTimeZone('UTC')
                ))->format(DATE_ATOM),
            ],
        ],
        [
            'returnDocument' => \MongoDB\Operation\FindOneAndUpdate::RETURN_DOCUMENT_AFTER,
        ]
    );

    return $result ? $this->normalize($result) : null;
}

public function deleteById(string $userId, string $alertId): bool
{
    try {
        $result = $this->collection->deleteOne([
            '_id' => new ObjectId($alertId),
            'userId' => new ObjectId($userId),
        ]);
    } catch (\Throwable) {
        return false;
    }

    return $result->getDeletedCount() === 1;
}
//delete all alerts of user (for user deletion)
public function deleteByUserId(string $userId): int
{
    try {
        $result = $this->collection->deleteMany([
            'userId' => new ObjectId($userId),
        ]);
    } catch (\Throwable) {
        return 0;
    }

    return $result->getDeletedCount();
}


public function insert(array $alert): void
    {
        $this->collection->insertOne($alert);
    }

// normalize document to array with string IDs
private function normalize(array|\MongoDB\Model\BSONDocument $doc): array
{
    $data = (array) $doc;

    return [
        '_id'        => (string) $data['_id'],
        'deviceId'   => isset($data['deviceId']) ? (string) $data['deviceId'] : null,
        'userId'     => isset($data['userId']) ? (string) $data['userId'] : null,
        'type'       => $data['type'] ?? null,
        'value'      => $data['value'] ?? null,
        'alertTreshold' => $data['alertTreshold'] ?? null,
        'active'     => (bool) ($data['active'] ?? false),
        'timestamp'  => $data['timestamp'] ?? null,
        'resolvedAt' => $data['resolvedAt'] ?? null,
    ];
}

public function restore(string $userId, string $alertId): ?array
{
    $result = $this->collection->findOneAndUpdate(
        [
            '_id' => new ObjectId($alertId),
            'userId' => new ObjectId($userId),
            'active' => false,
        ],
        [
            '$set' => [
                'active' => true,
                'resolvedAt' => null,
            ],
        ],
        [
            'returnDocument' => \MongoDB\Operation\FindOneAndUpdate::RETURN_DOCUMENT_AFTER,
        ]
    );

    return $result ? $this->normalize($result) : null;
}

    //  TOHLE MUSÍŠ POUŽÍVAT PRO VÝPIS
    public function findByDevice(string $deviceId, ?bool $active = null): array
    {
        $filter = [
            'deviceId' => new ObjectId($deviceId),
        ];

        if ($active !== null) {
            $filter['active'] = $active;
        }

        $cursor = $this->collection->find(
            $filter,
            ['sort' => ['timestamp' => -1]]
        );

        $out = [];

        foreach ($cursor as $doc) {
            $out[] = $this->normalize($doc);
        }

        return $out;
    }
}


