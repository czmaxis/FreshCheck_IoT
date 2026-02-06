<?php

declare(strict_types=1);

namespace App\Repository;

use MongoDB\Collection;
use MongoDB\Database;
use MongoDB\BSON\ObjectId;
use MongoDB\Operation\FindOneAndUpdate; 

final class DeviceRepository
{
    private Collection $collection;

    public function __construct(Database $database)
    {
        $this->collection = $database->selectCollection('device');
    }

    public function insert(array $data): array
{
    $document = array_merge($data, [
        'createdAt' => (new \DateTimeImmutable('now', new \DateTimeZone('UTC')))
            ->format(DATE_ATOM),
        'permanentToken' => bin2hex(random_bytes(24)),
    ]);

    $result = $this->collection->insertOne($document);

    $document['_id'] = (string) $result->getInsertedId();

    return $document;
}


public function findByUser(string $userId): array
{
    $cursor = $this->collection->find([
        'ownerId' => new ObjectId($userId),
    ]);

    $devices = [];
    foreach ($cursor as $doc) {
        $devices[] = $this->normalize($doc);
    }

    return $devices;
}

public function findIdsByUser(string $userId): array
{
    $cursor = $this->collection->find(
        ['ownerId' => new ObjectId($userId)],
        ['projection' => ['_id' => 1]]
    );

    $ids = [];
    foreach ($cursor as $doc) {
        $ids[] = (string) $doc['_id'];
    }

    return $ids;
}




 public function findOneByUserAndId(string $userId, string $deviceId): ?array
{
$doc = $this->collection->findOne(
    [
        '_id' => new ObjectId($deviceId),
        'ownerId' => new ObjectId($userId),
    ]
);

if (!$doc) {
    return null;
}

// BSONDocument to array
$device = $doc->getArrayCopy();

return $doc ? $this->normalize($doc) : null;
}






public function deleteByUserAndId(string $userId, string $deviceId): bool
{
    try {
        $result = $this->collection->deleteOne([
            '_id' => new ObjectId($deviceId),
            'ownerId' => new ObjectId($userId),
        ]);
    } catch (\Throwable) {
        return false;
    }

    return $result->getDeletedCount() === 1;
}
//delete all devices of user (for user deletion)
public function deleteByUserId(string $userId): int
{
    try {
        $result = $this->collection->deleteMany([
            'ownerId' => new ObjectId($userId),
        ]);
    } catch (\Throwable) {
        return 0;
    }

    return $result->getDeletedCount();
}






public function update(
    string $deviceId,
    string $userId,
    array $data
): ?array {

    $update = [];

    foreach ([
        'name',
        'location',
        'threshold',
    ] as $field) {
        if (array_key_exists($field, $data)) {
            $update[$field] = $data[$field];
        }
    }

    if (!$update) {
        return null;
    }

    $result = $this->collection->findOneAndUpdate(
        [
            '_id' => new ObjectId($deviceId),
            'ownerId' => new ObjectId($userId),
        ],
        [
            '$set' => $update,
        ],
        [
            'returnDocument' => FindOneAndUpdate::RETURN_DOCUMENT_AFTER,
        ]
    );

    if (!$result) {
        return null;
    }

    
    return $this->normalize($result);
}

private function normalize(array|\MongoDB\Model\BSONDocument $doc): array
{
    $data = (array) $doc;

    return [
        '_id' => (string) $data['_id'],
        'ownerId' => isset($data['ownerId']) ? (string) $data['ownerId'] : null,
        'name' => $data['name'] ?? null,
        'location' => $data['location'] ?? null,
        'createdAt' => $data['createdAt'] ?? null,
        'threshold' => $data['threshold'] ?? null, 
    ];
}

}


