<?php

declare(strict_types=1);

namespace App;



// =================

/*require __DIR__ . '/../vendor/autoload.php';

$container = Bootstrap::boot();
$application = $container->getByType(Nette\Application\Application::class);
$application->run();
*/
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
            'jwtTtl'    => (int) ($_ENV['JWT_TTL'] ?? 3600),
            'mongoUri'  => $_ENV['MONGO_URI'] ?? null,
        ]);

        $configurator->setTempDirectory($rootDir . '/temp');
        $configurator->addConfig($appDir . '/config.neon');

        return $configurator->createContainer();
    }


    
}