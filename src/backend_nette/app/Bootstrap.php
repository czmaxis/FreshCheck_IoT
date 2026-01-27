<?php

declare(strict_types=1);

namespace App;

// ===== CORS =====
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// =================

require __DIR__ . '/../vendor/autoload.php';

$container = App\Bootstrap::boot();
$application = $container->getByType(Nette\Application\Application::class);
$application->run();

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