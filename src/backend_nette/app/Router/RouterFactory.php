<?php

declare(strict_types=1);

namespace App\Router;

use Nette\Application\Routers\Route;
use Nette\Application\Routers\RouteList;

final class RouterFactory
{
    public static function createRouter(): RouteList
    {
        $router = new RouteList;

        // AUTH
        $router->addRoute('auth/<action>', 'Auth:default');

        // USERS
        $router->addRoute('user/<action>', 'User:default');

        // DEVICES (GET, POST )
        $router->addRoute('devices', 'Device:default');

        return $router;
    }
}
