<?php

declare(strict_types=1);

namespace App\Repository;

use MongoDB\Database;
use MongoDB\BSON\ObjectId;
use MongoDB\BSON\UTCDateTime;
use MongoDB\Operation\FindOneAndUpdate;

final class UserRepository
{
    public function __construct(
        private Database $db
    ) {}
//login
    private function collection()
    {
        return $this->db->selectCollection('user');
    }

public function findByEmail(string $email): ?array
{
    $user = $this->collection()->findOne(['email' => $email]);

    if ($user === null) {
        return null;
    }

    return $user->getArrayCopy();
}
    public function findById(string $id): ?array
    {
        $user = $this->collection()->findOne(['_id' => new ObjectId($id)]);

        if ($user === null) {
            return null;
        }

        return $user->getArrayCopy();
    }

    public function findAll(): array
    {
        return $this->collection()->find()->toArray();
    }
//registration
    public function existsByEmail(string $email): bool
    {
    return $this->collection()->countDocuments(['email' => $email]) > 0;
    }

    public function create(string $email, string $passwordHash, string $name): array
    {
    $result = $this->collection()->insertOne([
        'email' => $email,
        'passwordHash' => $passwordHash,
        'name' => $name,
        'createdAt' => new UTCDateTime(),
    ]);

    return [
        'id' => (string) $result->getInsertedId(),
        'email' => $email,
        'name' => $name,
    ];
    }

    public function updateById(string $id, array $set): ?array
    {
        if ($set === []) {
            return $this->findById($id);
        }

        $updated = $this->collection()->findOneAndUpdate(
            ['_id' => new ObjectId($id)],
            ['$set' => $set],
            ['returnDocument' => FindOneAndUpdate::RETURN_DOCUMENT_AFTER]
        );

        if ($updated === null) {
            return null;
        }

        return $updated->getArrayCopy();
    }
//delete user and all his related data
    public function deleteById(string $id): bool
    {
        try {
            $result = $this->collection()->deleteOne([
                '_id' => new ObjectId($id),
            ]);
        } catch (\Throwable) {
            return false;
        }

        return $result->getDeletedCount() === 1;
    }

}
