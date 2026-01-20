<?php

declare(strict_types=1);

namespace App\Presentation;

use Nette\Application\UI\Presenter;

final class ApiPresenter extends Presenter
{
    public function actionStatus(): void
    {
        $this->sendJson([
            'status' => 'ok',
            'time' => time(),
        ]);
    }
}