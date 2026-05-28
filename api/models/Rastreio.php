<?php

class Rastreio {
    private PDO $db;

    public function __construct(PDO $db) {
        $this->db = $db;
    }

    public function create(int $orderId, string $status, string $descricao, ?string $localizacao = null): int {
        $stmt = $this->db->prepare('
            INSERT INTO rastreio_pedidos (order_id, status, descricao, localizacao)
            VALUES (?, ?, ?, ?)
        ');
        $stmt->execute([$orderId, $status, $descricao, $localizacao]);
        return (int) $this->db->lastInsertId();
    }

    public function getByOrderId(int $orderId): array {
        $stmt = $this->db->prepare('
            SELECT * FROM rastreio_pedidos WHERE order_id = ? ORDER BY created_at ASC
        ');
        $stmt->execute([$orderId]);
        return $stmt->fetchAll();
    }
}
