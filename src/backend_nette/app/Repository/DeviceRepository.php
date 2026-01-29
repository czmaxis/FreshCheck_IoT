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

public function create(string $userId, array $data): array
{
    \Tracy\Debugger::log('SensorDataService::create called', 'sensor');

    // 1️⃣ uložit sensor data
    $this->sensorDataRepository->create($userId, $data);

    // 2️⃣ najít zařízení (SPRÁVNÁ METODA)
    $device = $this->deviceRepository->findByUserAndId(
        $userId,
        $data['deviceId']
    );

    \Tracy\Debugger::log([
        'deviceFound' => (bool) $device,
        'deviceId' => $data['deviceId'],
    ], 'sensor');

    // 3️⃣ 🚨 vyhodnotit alerty
    if ($device) {
        $this->alertService->evaluate($device, $data);
    }

    return $data;
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

         return array_map(function ($doc) {
        return [
            '_id' => (string) $doc->_id,
            'name' => $doc->name,
            'type' => $doc->type,
            'ownerId' => (string) $doc->ownerId,
            'createdAt' => $doc->createdAt ?? null,
        ];
    }, iterator_to_array($cursor));
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

// BSONDocument → array
$device = $doc->getArrayCopy();

// normalizace ID
$device['_id'] = (string) $device['_id'];
$device['ownerId'] = (string) $device['ownerId'];

return $device;

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

public function update(
    string $deviceId,
    string $userId,
    array $data
): ?array {

    $update = [];

    foreach ([
        'name',
        'type',
        'location',
        'threshold',
        'doorOpenMaxSeconds',
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
            '_id' => new \MongoDB\BSON\ObjectId($deviceId),
            'ownerId' => new \MongoDB\BSON\ObjectId($userId),
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

    
    $array = $result->getArrayCopy();

    
    $array['_id'] = (string) $array['_id'];
    $array['ownerId'] = (string) $array['ownerId'];

    return $array;
}

}
