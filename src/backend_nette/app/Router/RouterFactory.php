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

        // DEVICES (GET, POST, DELETE)
        $router->addRoute('devices', 'Device:default');
        $router->addRoute('devices/<id>/delete', 'Device:delete'); // DELETE
        $router->addRoute('devices/<id>', 'Device:detail');      // GET/by id
        $router->addRoute('devices/<id>/update', 'Device:update'); // PUT
        // SENSOR DATA
        $router->addRoute('sensordata', 'SensorData:create');
        $router->addRoute('sensordata/<deviceId>', 'SensorData:default');
        // ALERTS
        $router->addRoute('alerts/<id>/resolve', [
        'presenter' => 'Alert',
        'action' => 'resolve',
        ]); // POST
        
        $router->addRoute('alerts', 'Alert:create');
        $router->addRoute('alerts/<deviceId>', 'Alert:default');

        return $router;
    }
}
