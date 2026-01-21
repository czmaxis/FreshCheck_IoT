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

        // AUTH
        $router->addRoute('auth/<action>', 'Auth:default');

        // USER (JWT protected)
        $router->addRoute('user[/<action>]', 'User:default');

        // API (legacy / test)
        $router->addRoute('api/<action>', 'Api:default');

        return $router;
    }
}
