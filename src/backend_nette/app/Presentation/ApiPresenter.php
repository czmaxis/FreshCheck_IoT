<?php

declare(strict_types=1);

namespace App\Presentation;

use Nette\Application\UI\Presenter;
use App\Database\MongoConnection;

final class ApiPresenter extends Presenter
{
    public function __construct(
        private MongoConnection $mongo
    ) {
        parent::__construct();
    }
    //test connection to db
    public function actionStatus(): void
    {
        $collections = iterator_to_array(
            $this->mongo->db()->listCollections()
        );

        $this->sendJson([
            'status' => 'ok',
            'collections' => array_map(
                fn($c) => $c->getName(),
                $collections
            ),
        ]);
    }
public function actionUsers(): void
{
    $collection = $this->mongo->db()->selectCollection('user');

    $cursor = $collection->find(
        [],
        [
            'projection' => [
                'passwordHash' => 0,
                'permanentToken' => 0,
                '__v' => 0,
            ],
            'sort' => ['createdAt' => -1],
        ]
    );

    $users = [];

    foreach ($cursor as $doc) {
        $users[] = [
            'id' => (string) $doc->_id,
            'email' => $doc->email ?? null,
            'name' => $doc->name ?? null,
            'createdAt' => isset($doc->createdAt)
                ? $doc->createdAt->toDateTime()->format(DATE_ATOM)
                : null,
        ];
    }

    $this->sendJson([
        'count' => count($users),
        'users' => $users,
    ]);
}

}
