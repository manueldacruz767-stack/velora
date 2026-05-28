<?php

class AuthController {
    private AuthService $authService;

    public function __construct(PDO $db) {
        $this->authService = new AuthService($db);
    }

    private function getInput(): array {
        $json = json_decode(file_get_contents('php://input'), true);
        if (is_array($json)) return $json;
        return $_POST;
    }

    public function register(): array {
        $data = $this->getInput();
        $resultado = $this->authService->register($data);

        if (($resultado['status_registo'] ?? '') === 'pendente') {
            http_response_code(201);
            return [
                'message' => 'Cadastro realizado com sucesso! Aguarde a aprovação de um administrador antes de fazer login.',
            ];
        }

        return $resultado;
    }

    public function login(): array {
        $data = $this->getInput();
        return $this->authService->login($data);
    }
}
