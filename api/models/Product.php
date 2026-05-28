<?php

class Product {
    private PDO $db;

    public function __construct(PDO $db) {
        $this->db = $db;
    }

    public function getAll(int $limit = 20, int $offset = 0): array {
        $stmt = $this->db->prepare('
            SELECT p.*, u.nome AS vendedor_nome,
                ROUND(AVG(a.rating), 1) AS avg_rating,
                COUNT(a.id) AS total_reviews
            FROM products p
            LEFT JOIN users u ON p.vendedor_id = u.id
            LEFT JOIN avaliacoes a ON a.product_id = p.id
            GROUP BY p.id
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?
        ');
        $stmt->execute([$limit, $offset]);
        return $stmt->fetchAll();
    }

    public function findAll(?string $categoria = null, ?string $search = null): array {
        $sql = 'SELECT p.*, u.nome AS vendedor_nome,
                    ROUND(AVG(a.rating), 1) AS avg_rating,
                    COUNT(a.id) AS total_reviews
                FROM products p
                LEFT JOIN users u ON p.vendedor_id = u.id
                LEFT JOIN avaliacoes a ON a.product_id = p.id
                WHERE 1=1';
        $params = [];

        if ($categoria) {
            $sql .= ' AND p.categoria = ?';
            $params[] = $categoria;
        }

        if ($search) {
            $sql .= ' AND (p.titulo LIKE ? OR p.descricao LIKE ?)';
            $params[] = "%$search%";
            $params[] = "%$search%";
        }

        $sql .= ' GROUP BY p.id ORDER BY p.created_at DESC';

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function findById(int $id): ?array {
        $stmt = $this->db->prepare('
            SELECT p.*, u.nome AS vendedor_nome,
                ROUND(AVG(a.rating), 1) AS avg_rating,
                COUNT(a.id) AS total_reviews
            FROM products p
            LEFT JOIN users u ON p.vendedor_id = u.id
            LEFT JOIN avaliacoes a ON a.product_id = p.id
            WHERE p.id = ?
        ');
        $stmt->execute([$id]);
        $product = $stmt->fetch();
        return $product ?: null;
    }

    public function findByVendedor(int $vendedorId): array {
        $stmt = $this->db->prepare('
            SELECT * FROM products WHERE vendedor_id = ? ORDER BY created_at DESC
        ');
        $stmt->execute([$vendedorId]);
        return $stmt->fetchAll();
    }

    public function create(array $data): int {
        $stmt = $this->db->prepare('
            INSERT INTO products (vendedor_id, titulo, descricao, preco, stock, imagem_url, categoria)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([
            $data['vendedor_id'] ?? null,
            $data['titulo'],
            $data['descricao'] ?? null,
            $data['preco'],
            $data['stock'] ?? 0,
            $data['imagem_url'] ?? null,
            $data['categoria'] ?? null,
        ]);
        return (int) $this->db->lastInsertId();
    }

    public function decreaseStock(int $productId, int $quantidade): void {
        $stmt = $this->db->prepare('
            UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?
        ');
        $stmt->execute([$quantidade, $productId, $quantidade]);
        if ($stmt->rowCount() === 0) {
            throw new RuntimeException('Stock insuficiente para o produto', 400);
        }
    }

    public function update(int $id, array $data): bool {
        $fields = [];
        $params = [];

        foreach (['vendedor_id', 'titulo', 'descricao', 'preco', 'stock', 'imagem_url', 'categoria'] as $field) {
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
        $stmt = $this->db->prepare('SELECT imagem_url FROM products WHERE id = ?');
        $stmt->execute([$id]);
        $product = $stmt->fetch();

        if ($product && $product['imagem_url']) {
            $filePath = __DIR__ . '/../../' . ltrim($product['imagem_url'], '/');
            if (file_exists($filePath)) {
                unlink($filePath);
            }
        }

        $stmt = $this->db->prepare('DELETE FROM products WHERE id = ?');
        return $stmt->execute([$id]);
    }

    public function getCategories(): array {
        $stmt = $this->db->query('SELECT DISTINCT categoria FROM products WHERE categoria IS NOT NULL ORDER BY categoria');
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }

    public function getImagemPath(): string {
        return __DIR__ . '/../../uploads/produtos/';
    }

    public function getImagemUrlBase(): string {
        return '/uploads/produtos/';
    }
}
