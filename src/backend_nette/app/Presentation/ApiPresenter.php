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
    $db = $this->mongo->db();

    $collections = [];
    foreach ($db->listCollections() as $c) {
        $collections[] = $c->getName();
    }

    $this->sendJson([
        'database' => $db->getDatabaseName(),
        'collections' => $collections,
    ]);
    $this->sendJson([
    'env_mongo_uri' => $_ENV['MONGO_URI'] ?? null,
]);
$this->sendJson([
    'env_loaded' => isset($_ENV['MONGO_URI']),
    'mongo_uri' => $_ENV['MONGO_URI'] ?? null,
]);
}

}
