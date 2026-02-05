<?php

declare(strict_types=1);

namespace App\Presentation;

use App\Service\JwtService;
use Nette\Application\UI\Presenter;

abstract class BaseApiPresenter extends Presenter
{
    protected JwtService $jwt;

    public function __construct(JwtService $jwt)
    {
        parent::__construct();
        $this->jwt = $jwt;
    }

    protected function getUserIdFromJwt(): string
    {
        $request = $this->getHttpRequest();

        $auth =
            $request->getHeader('Authorization')
            ?? $request->getHeader('authorization')
            ?? ($_SERVER['HTTP_AUTHORIZATION'] ?? null)
            ?? ($_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? null)
            ?? ($_SERVER['Authorization'] ?? null);

        if (!$auth && function_exists('getallheaders')) {
            $all = getallheaders();
            foreach ($all as $key => $value) {
                if (strtolower((string) $key) === 'authorization') {
                    $auth = $value;
                    break;
                }
            }
        }

        if (!$auth || !preg_match('~^Bearer\s+(.+)$~i', $auth, $m)) {
            \Tracy\Debugger::log([
                'authHeader' => $auth,
                'serverAuth' => [
                    'HTTP_AUTHORIZATION' => $_SERVER['HTTP_AUTHORIZATION'] ?? null,
                    'REDIRECT_HTTP_AUTHORIZATION' => $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? null,
                    'Authorization' => $_SERVER['Authorization'] ?? null,
                ],
                'headers' => function_exists('getallheaders') ? getallheaders() : null,
            ], 'auth');
            $this->error('Unauthorized', 401);
        }

        $payload = $this->jwt->verify($m[1]);

        return (string) $payload->sub;
    }


    public function sendJson(mixed $data): void
    {
        $this->getHttpResponse()->setContentType('application/json');
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        $this->terminate();
    }
}
