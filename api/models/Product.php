<?php

class Product {
    private PDO $db;

    public function __construct(PDO $db) {
        $this->db = $db;
    }

    public function getAll(int $limit = 20, int $offset = 0): array {
        $stmt = $this->db->prepare('SELECT * FROM products ORDER BY created_at DESC LIMIT ? OFFSET ?');
        $stmt->execute([$limit, $offset]);
        return $stmt->fetchAll();
    }

    public function findAll(?string $categoria = null, ?string $search = null): array {
        $sql = 'SELECT * FROM products WHERE 1=1';
        $params = [];

        if ($categoria) {
            $sql .= ' AND categoria = ?';
            $params[] = $categoria;
        }

        if ($search) {
            $sql .= ' AND (nome LIKE ? OR descricao LIKE ?)';
            $params[] = "%$search%";
            $params[] = "%$search%";
        }

        $sql .= ' ORDER BY created_at DESC';

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function findById(int $id): ?array {
        $stmt = $this->db->prepare('SELECT * FROM products WHERE id = ?');
        $stmt->execute([$id]);
        $product = $stmt->fetch();
        return $product ?: null;
    }

    public function create(array $data): int {
        $stmt = $this->db->prepare('
            INSERT INTO products (nome, preco, descricao, imagem, categoria)
            VALUES (?, ?, ?, ?, ?)
        ');
        $stmt->execute([
            $data['nome'],
            $data['preco'],
            $data['descricao'] ?? null,
            $data['imagem'] ?? null,
            $data['categoria'] ?? null,
        ]);
        return (int) $this->db->lastInsertId();
    }

    public function update(int $id, array $data): bool {
        $fields = [];
        $params = [];

        foreach (['nome', 'preco', 'descricao', 'imagem', 'categoria'] as $field) {
            if (array_key_exists($field, $data)) {
                $fields[] = "$field = ?";
                $params[] = $data[$field];
            }
        }

        if (empty($fields)) {
            return false;
        }

        $params[] = $id;
        $stmt = $this->db->prepare('
            UPDATE products SET ' . implode(', ', $fields) . ' WHERE id = ?
        ');
        return $stmt->execute($params);
    }

    public function delete(int $id): bool {
        $stmt = $this->db->prepare('DELETE FROM products WHERE id = ?');
        return $stmt->execute([$id]);
    }

    public function getCategories(): array {
        $stmt = $this->db->query('SELECT DISTINCT categoria FROM products WHERE categoria IS NOT NULL ORDER BY categoria');
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }
}
