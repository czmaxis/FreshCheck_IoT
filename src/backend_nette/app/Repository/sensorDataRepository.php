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
        if (empty($data['deviceId'])) {
            throw new \InvalidArgumentException('deviceId is required');
        }

        $document = [
            'deviceId' => new ObjectId($data['deviceId']),
            'userId'   => new ObjectId($userId),
            'type'     => $data['type']   ?? null,
            'value'    => $data['value']  ?? null,
            'unit'     => $data['unit']   ?? null,
            'createdAt'=> new UTCDateTime(),
        ];

        $result = $this->collection->insertOne($document);

        return [
            'id'        => (string) $result->getInsertedId(),
            'deviceId'  => $data['deviceId'],
            'type'      => $document['type'],
            'value'     => $document['value'],
            'unit'      => $document['unit'],
            'createdAt' => $document['createdAt']->toDateTime()->format(DATE_ATOM),
        ];
    }
}
