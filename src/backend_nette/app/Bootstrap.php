<?php

declare(strict_types=1);

namespace App;

use Nette\Bootstrap\Configurator;
use Dotenv\Dotenv;

final class Bootstrap
{
    public static function boot(): \Nette\DI\Container
    {
        $configurator = new Configurator;

        $appDir = __DIR__;
        $rootDir = dirname($appDir); // src/backend_nette

        $configurator->setDebugMode(true);
        $configurator->enableTracy($rootDir . '/log');

        // load .env
        Dotenv::createImmutable($rootDir)->load();

        
        $configurator->addDynamicParameters([
            'jwtSecret' => $_ENV['JWT_SECRET'] ?? null,
            'mongoUri'  => $_ENV['MONGO_URI'] ?? null,
        ]);

        $configurator->setTempDirectory($rootDir . '/temp');
        $configurator->addConfig($appDir . '/config.neon');

        return $configurator->createContainer();
    }
}
