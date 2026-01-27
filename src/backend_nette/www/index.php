<?php

declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

use App\Bootstrap;
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

$container = Bootstrap::boot();
$application = $container->getByType(Nette\Application\Application::class);
$application->run();

