<?php

declare(strict_types=1);

namespace App\Router;

use Nette\Application\Routers\RouteList;
use Nette\Application\Routers\Route;

final class RouterFactory
{
    public static function createRouter(): RouteList
    {
        $router = new RouteList;

        $router->addRoute('api/<action>', 'Api:Api');

        return $router;
    }
}
