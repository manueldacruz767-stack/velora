<?php

class User {
    private PDO $db;

    public function __construct(PDO $db) {
        $this->db = $db;
    }

    public function create(string $nome, string $email, string $hash, string $tipo = 'client'): int {
        $stmt = $this->db->prepare('
            INSERT INTO users (nome, email, senha, tipo) VALUES (?, ?, ?, ?)
        ');
        $stmt->execute([$nome, $email, $hash, $tipo]);
        return (int) $this->db->lastInsertId();
    }

    public function findByEmail(string $email): ?array {
        $stmt = $this->db->prepare('SELECT * FROM users WHERE email = ?');
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        return $user ?: null;
    }

    public function findById(int $id): ?array {
        $stmt = $this->db->prepare('SELECT id, nome, email, tipo, created_at FROM users WHERE id = ?');
        $stmt->execute([$id]);
        $user = $stmt->fetch();
        return $user ?: null;
    }

    public function emailExists(string $email): bool {
        $stmt = $this->db->prepare('SELECT COUNT(*) FROM users WHERE email = ?');
        $stmt->execute([$email]);
        return $stmt->fetchColumn() > 0;
    }
}
