<?php

class AuthService {
    private PDO $db;
    private User $userModel;

    public function __construct(PDO $db) {
        $this->db = $db;
        $this->userModel = new User($db);
    }

    public function register(array $data): array {
        $nome = trim($data['nome'] ?? '');
        $email = trim($data['email'] ?? '');
        $senha = $data['senha'] ?? '';
        $tipo = $data['tipo'] ?? 'client';

        if (empty($nome) || empty($email) || empty($senha)) {
            throw new RuntimeException('Todos os campos são obrigatórios', 400);
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new RuntimeException('Email inválido', 400);
        }

        if (strlen($senha) < 6) {
            throw new RuntimeException('A senha deve ter pelo menos 6 caracteres', 400);
        }

        if ($this->userModel->emailExists($email)) {
            throw new RuntimeException('Email já registado', 409);
        }

        $hash = password_hash($senha, PASSWORD_ARGON2ID);

        $precisaAprovacao = in_array($tipo, ['admin', 'vendedor'], true);
        $status = $precisaAprovacao ? 'pendente' : 'ativo';

        $userId = $this->userModel->create($nome, $email, $hash, $tipo, $status);

        if ($precisaAprovacao) {
            return ['status_registo' => 'pendente'];
        }

        $token = AuthMiddleware::generateToken($userId);

        return [
            'status_registo' => 'ativo',
            'user' => $this->userModel->findById($userId),
            'token' => $token,
        ];
    }

    public function login(array $data): array {
        $email = trim($data['email'] ?? '');
        $senha = $data['senha'] ?? '';

        if (empty($email) || empty($senha)) {
            throw new RuntimeException('Email e senha são obrigatórios', 400);
        }

        $user = $this->userModel->findByEmail($email);

        if (!$user || !password_verify($senha, $user['senha'])) {
            throw new RuntimeException('Credenciais inválidas', 401);
        }

        if (($user['status'] ?? 'ativo') !== 'ativo') {
            throw new RuntimeException('A sua conta ainda não foi aprovada. Aguarde a aprovação de um administrador.', 403);
        }

        $token = AuthMiddleware::generateToken($user['id']);

        return [
            'user' => [
                'id' => $user['id'],
                'nome' => $user['nome'],
                'email' => $user['email'],
                'tipo' => $user['tipo'],
            ],
            'token' => $token,
        ];
    }
}
