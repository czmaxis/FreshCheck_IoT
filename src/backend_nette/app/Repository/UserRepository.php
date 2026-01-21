<?php

declare(strict_types=1);

namespace App\Repository;

use MongoDB\Database;
use MongoDB\BSON\ObjectId;

final class UserRepository
{
    public function __construct(
        private Database $db
    ) {}

    private function collection()
    {
        return $this->db->selectCollection('user');
    }

    public function findByEmail(string $email): ?array
    {
        return $this->collection()->findOne(['email' => $email]);
    }

    public function findById(string $id): ?array
    {
        return $this->collection()->findOne(['_id' => new ObjectId($id)]);
    }

    public function findAll(): array
    {
        return $this->collection()->find()->toArray();
    }
}
