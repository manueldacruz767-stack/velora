<?php

class Order {
    private PDO $db;

    public function __construct(PDO $db) {
        $this->db = $db;
    }

    public function getByUserId(int $userId): array {
        $stmt = $this->db->prepare('
            SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC
        ');
        $stmt->execute([$userId]);
        return $stmt->fetchAll();
    }

    public function findById(int $id): ?array {
        $stmt = $this->db->prepare('SELECT * FROM orders WHERE id = ?');
        $stmt->execute([$id]);
        $order = $stmt->fetch();
        return $order ?: null;
    }

    public function create(int $userId, float $total): int {
        $stmt = $this->db->prepare('
            INSERT INTO orders (user_id, total, status) VALUES (?, ?, ?)
        ');
        $stmt->execute([$userId, $total, 'pendente']);
        return (int) $this->db->lastInsertId();
    }

    public function addItem(int $orderId, int $productId, string $productNome, int $quantidade, float $preco): int {
        $stmt = $this->db->prepare('
            INSERT INTO order_items (order_id, product_id, product_nome, quantidade, preco)
            VALUES (?, ?, ?, ?, ?)
        ');
        $stmt->execute([$orderId, $productId, $productNome, $quantidade, $preco]);
        return (int) $this->db->lastInsertId();
    }

    public function addItemWithOrigin(
        int $orderId,
        ?int $productId,
        string $productNome,
        int $quantidade,
        float $preco,
        string $origem = 'local',
        ?int $vendedorId = null
    ): int {
        $stmt = $this->db->prepare('
            INSERT INTO order_items (order_id, product_id, product_nome, quantidade, preco, origem, vendedor_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([$orderId, $productId, $productNome, $quantidade, $preco, $origem, $vendedorId]);
        return (int) $this->db->lastInsertId();
    }

    public function getItemsByOrderId(int $orderId): array {
        $stmt = $this->db->prepare('SELECT * FROM order_items WHERE order_id = ?');
        $stmt->execute([$orderId]);
        return $stmt->fetchAll();
    }

    public function findAll(): array {
        $stmt = $this->db->query('
            SELECT o.*, u.nome AS user_nome, u.email AS user_email
            FROM orders o
            JOIN users u ON o.user_id = u.id
            ORDER BY o.created_at DESC
        ');
        return $stmt->fetchAll();
    }

    public function updateStatus(int $id, string $status): bool {
        $stmt = $this->db->prepare('UPDATE orders SET status = ? WHERE id = ?');
        return $stmt->execute([$status, $id]);
    }
}
