<?php
declare(strict_types=1);

namespace App\Repository;

use MongoDB\Collection;
use MongoDB\Database;
use MongoDB\BSON\ObjectId;
use MongoDB\BSON\UTCDateTime;

final class SensorDataRepository
{
    private Collection $collection;

    public function __construct(Database $database)
    {
        $this->collection = $database->selectCollection('sensordata');
    }

   public function create(string $userId, array $data): array
{
    $timestamp = (new \DateTimeImmutable('now', new \DateTimeZone('UTC')))
        ->format('Y-m-d\TH:i:s.v\Z');
    
    $document = [
        'deviceId'  => new ObjectId($data['deviceId']),
        'timestamp' => $timestamp,
    ];

    // volitelná pole
    if (array_key_exists('temperature', $data)) {
        $document['temperature'] = (float) $data['temperature'];
    }

    if (array_key_exists('humidity', $data)) {
        $document['humidity'] = (int) $data['humidity'];
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
        $doc['_id'] = (string) $doc['_id'];
        $doc['deviceId'] = (string) $doc['deviceId'];
        $items[] = $doc;
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

    $data = $doc->getArrayCopy();
    $data['_id'] = (string) $data['_id'];
    $data['deviceId'] = (string) $data['deviceId'];

    return $data;
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

    $data = $updated->getArrayCopy();
    $data['_id'] = (string) $data['_id'];
    $data['deviceId'] = (string) $data['deviceId'];

    return $data;
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

}
