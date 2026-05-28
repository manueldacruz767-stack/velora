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

    public function metrics(): array {
        $this->requireAdmin();

        $totalUsers = $this->db->query("SELECT COUNT(*) FROM users")->fetchColumn();
        $totalVendedores = $this->db->query("SELECT COUNT(*) FROM users WHERE tipo = 'vendedor'")->fetchColumn();
        $totalProdutos = $this->db->query("SELECT COUNT(*) FROM products")->fetchColumn();
        $totalPedidos = $this->db->query("SELECT COUNT(*) FROM orders")->fetchColumn();
        $pedidosPendentes = $this->db->query("SELECT COUNT(*) FROM orders WHERE status = 'pendente'")->fetchColumn();
        $pedidosPagos = $this->db->query("SELECT COUNT(*) FROM orders WHERE status = 'pago'")->fetchColumn();

        $faturamentoTotal = $this->db->query("SELECT COALESCE(SUM(total), 0) FROM orders WHERE status IN ('pago','processando','enviado','entregue')")->fetchColumn();

        $stmt = $this->db->query("SELECT COALESCE(SUM(saldo + saldo_bloqueado), 0) FROM wallet WHERE user_id IN (SELECT id FROM users WHERE tipo = 'admin')");
        $saldoAdmin = $stmt->fetchColumn();

        $stmt = $this->db->query("
            SELECT DATE(created_at) AS dia, COUNT(*) AS total
            FROM users
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
            GROUP BY DATE(created_at)
            ORDER BY dia ASC
        ");
        $novosUsers = $stmt->fetchAll();

        $stmt = $this->db->query("
            SELECT DATE(created_at) AS dia, COUNT(*) AS total, COALESCE(SUM(total), 0) AS receita
            FROM orders
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            GROUP BY DATE(created_at)
            ORDER BY dia ASC
        ");
        $pedidosPorDia = $stmt->fetchAll();

        $stmt = $this->db->query("
            SELECT COUNT(*) AS total
            FROM avaliacoes
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        ");
        $avaliacoesMes = (int) $stmt->fetchColumn();

        return ['data' => [
            'total_users' => (int) $totalUsers,
            'total_vendedores' => (int) $totalVendedores,
            'total_produtos' => (int) $totalProdutos,
            'total_pedidos' => (int) $totalPedidos,
            'pedidos_pendentes' => (int) $pedidosPendentes,
            'pedidos_pagos' => (int) $pedidosPagos,
            'faturamento_total' => (float) $faturamentoTotal,
            'saldo_admin' => (float) $saldoAdmin,
            'novos_utilizadores' => $novosUsers,
            'pedidos_por_dia' => $pedidosPorDia,
            'avaliacoes_mes' => $avaliacoesMes,
        ]];
    }
}
