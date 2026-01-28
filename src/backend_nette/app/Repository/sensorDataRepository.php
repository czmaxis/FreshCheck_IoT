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

}
