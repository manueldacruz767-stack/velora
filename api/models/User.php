<?php

class User {
    private PDO $db;

    public function __construct(PDO $db) {
        $this->db = $db;
    }

    public function create(string $nome, string $email, string $hash, string $tipo = 'client', string $status = 'ativo'): int {
        $stmt = $this->db->prepare('
            INSERT INTO users (nome, email, senha, tipo, status) VALUES (?, ?, ?, ?, ?)
        ');
        $stmt->execute([$nome, $email, $hash, $tipo, $status]);
        return (int) $this->db->lastInsertId();
    }

    public function findByEmail(string $email): ?array {
        $stmt = $this->db->prepare('SELECT * FROM users WHERE email = ?');
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        return $user ?: null;
    }

    public function findById(int $id): ?array {
        $stmt = $this->db->prepare('SELECT id, nome, email, tipo, status, created_at FROM users WHERE id = ?');
        $stmt->execute([$id]);
        $user = $stmt->fetch();
        return $user ?: null;
    }

    public function emailExists(string $email): bool {
        $stmt = $this->db->prepare('SELECT COUNT(*) FROM users WHERE email = ?');
        $stmt->execute([$email]);
        return $stmt->fetchColumn() > 0;
    }

    public function updateStatus(int $userId, string $status): void {
        $stmt = $this->db->prepare('UPDATE users SET status = ? WHERE id = ?');
        $stmt->execute([$status, $userId]);
    }

    public function findByStatus(string $status): array {
        $stmt = $this->db->prepare('SELECT id, nome, email, tipo, status, created_at FROM users WHERE status = ? ORDER BY created_at DESC');
        $stmt->execute([$status]);
        return $stmt->fetchAll();
    }
}
