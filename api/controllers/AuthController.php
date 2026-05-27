<?php

class AuthController {
    private AuthService $authService;

    public function __construct(PDO $db) {
        $this->authService = new AuthService($db);
    }

    public function register(): array {
        $data = json_decode(file_get_contents('php://input'), true);
        return $this->authService->register($data);
    }

    public function login(): array {
        $data = json_decode(file_get_contents('php://input'), true);
        return $this->authService->login($data);
    }
}
