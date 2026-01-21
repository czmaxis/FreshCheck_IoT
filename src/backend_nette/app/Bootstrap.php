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
        $configurator->setTempDirectory(__DIR__ . '/../temp');

       
        Dotenv::createImmutable(__DIR__ . '/../../../')->safeLoad();
       

        $configurator->addConfig(__DIR__ . '/config.neon');

        return $configurator->createContainer();
    }
}
