<?php

class AdminController {
    private PDO $db;
    private AuthMiddleware $auth;

    public function __construct(PDO $db) {
        $this->db = $db;
        $this->auth = new AuthMiddleware($db);
    }

    private function requireAdmin(): array {
        $user = $this->auth->authenticate();
        if ($user['tipo'] !== 'admin') {
            throw new RuntimeException('Acesso restrito a administradores', 403);
        }
        return $user;
    }

    public function pendingUsers(): array {
        $this->requireAdmin();
        $userModel = new User($this->db);
        return ['data' => $userModel->findByStatus('pendente')];
    }

    public function approveUser(int $id): array {
        $this->requireAdmin();
        $userModel = new User($this->db);
        $user = $userModel->findById($id);
        if (!$user) {
            throw new RuntimeException('Utilizador não encontrado', 404);
        }
        if ($user['status'] !== 'pendente') {
            throw new RuntimeException('Utilizador não está pendente', 400);
        }
        $userModel->updateStatus($id, 'ativo');
        return ['message' => 'Utilizador aprovado com sucesso', 'data' => $userModel->findById($id)];
    }

    public function rejectUser(int $id): array {
        $this->requireAdmin();
        $userModel = new User($this->db);
        $user = $userModel->findById($id);
        if (!$user) {
            throw new RuntimeException('Utilizador não encontrado', 404);
        }
        if ($user['status'] !== 'pendente') {
            throw new RuntimeException('Utilizador não está pendente', 400);
        }
        $userModel->updateStatus($id, 'cancelado');
        return ['message' => 'Utilizador rejeitado', 'data' => $userModel->findById($id)];
    }

    public function allUsers(): array {
        $this->requireAdmin();
        $stmt = $this->db->query('SELECT id, nome, email, tipo, status, created_at FROM users ORDER BY created_at DESC');
        return ['data' => $stmt->fetchAll()];
    }
}
