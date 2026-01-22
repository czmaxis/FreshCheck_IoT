<?php

declare(strict_types=1);

namespace App\Repository;

use MongoDB\Database;
use MongoDB\BSON\ObjectId;
use MongoDB\BSON\UTCDateTime;

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
        return $this->collection()->findOne(['_id' => new ObjectId($id)]);
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

}  
