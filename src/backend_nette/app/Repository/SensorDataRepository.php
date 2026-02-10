<?php
declare(strict_types=1);

namespace App\Repository;

use MongoDB\Collection;
use MongoDB\Database;
use MongoDB\BSON\ObjectId;

final class SensorDataRepository
{
    private Collection $collection;

    public function __construct(Database $database)
    {
        $this->collection = $database->selectCollection('sensordata');
    }

   public function create(string $userId, array $data): array
{
    if (!empty($data['timestamp'])) {
        $timestamp = $data['timestamp'];
    } else {
        $timestamp = (new \DateTimeImmutable('now', new \DateTimeZone('UTC')))
            ->format('Y-m-d\TH:i:s.v\Z');
    }

    $document = [
        'deviceId'  => new ObjectId($data['deviceId']),
        'timestamp' => $timestamp,
    ];

    // volitelná pole
    if (array_key_exists('temperature', $data)) {
        $document['temperature'] = (float) $data['temperature'];
    }

    if (array_key_exists('humidity', $data)) {
        $document['humidity'] = (float) $data['humidity'];
    }

    if (array_key_exists('illuminance', $data)) {
        $document['illuminance'] = (int) $data['illuminance'];
    }

    if (array_key_exists('doors', $data)) {
        $document['doors'] = (bool) $data['doors'];
    }
   

    $result = $this->collection->insertOne($document);

    $document['_id'] = (string) $result->getInsertedId();
    $document['deviceId'] = (string) $document['deviceId'];

    return $document;
}

public function findByDevice(string $deviceId): array
{
    $cursor = $this->collection->find(
        [
            'deviceId' => new ObjectId($deviceId),
        ],
        [
            'sort' => ['timestamp' => -1], 
        ]
    );

    $items = [];

    foreach ($cursor as $doc) {
        $items[] = $this->normalize($doc);
    }

    return $items;
}

public function findById(string $id): ?array
{
    $doc = $this->collection->findOne([
        '_id' => new ObjectId($id),
    ]);

    if ($doc === null) {
        return null;
    }

    return $this->normalize($doc);
}

public function updateById(string $id, array $set): ?array
{
    if ($set === []) {
        return $this->findById($id);
    }

    $updated = $this->collection->findOneAndUpdate(
        ['_id' => new ObjectId($id)],
        ['$set' => $set],
        ['returnDocument' => \MongoDB\Operation\FindOneAndUpdate::RETURN_DOCUMENT_AFTER]
    );

    if ($updated === null) {
        return null;
    }

    return $this->normalize($updated);
}

public function deleteById(string $id): bool
{
    try {
        $result = $this->collection->deleteOne([
            '_id' => new ObjectId($id),
        ]);
    } catch (\Throwable) {
        return false;
    }

    return $result->getDeletedCount() === 1;
}
//delete all sensor data of devices (for user deletion)
public function deleteByDeviceIds(array $deviceIds): int
{
    if ($deviceIds === []) {
        return 0;
    }

    $objectIds = [];
    foreach ($deviceIds as $id) {
        $objectIds[] = new ObjectId((string) $id);
    }

    try {
        $result = $this->collection->deleteMany([
            'deviceId' => ['$in' => $objectIds],
        ]);
    } catch (\Throwable) {
        return 0;
    }

    return $result->getDeletedCount();
}

private function normalize(array|\MongoDB\Model\BSONDocument $doc): array
{
    $data = (array) $doc;

    return [
        '_id' => (string) $data['_id'],
        'deviceId' => isset($data['deviceId']) ? (string) $data['deviceId'] : null,
        'timestamp' => $data['timestamp'] ?? null,
        'temperature' => $data['temperature'] ?? null,
        'humidity' => $data['humidity'] ?? null,
        'illuminance' => $data['illuminance'] ?? null,
        'doors' => $data['doors'] ?? null,
    ];
}

}
