<?php

class CartController {
    private PDO $db;
    private AuthMiddleware $auth;

    public function __construct(PDO $db) {
        $this->db = $db;
        $this->auth = new AuthMiddleware($db);
    }

    public function index(): array {
        $user = $this->auth->authenticate();
        $stmt = $this->db->prepare('
            SELECT c.*, p.nome, p.preco, p.imagem
            FROM cart c
            JOIN products p ON c.product_id = p.id
            WHERE c.user_id = ?
            ORDER BY c.created_at DESC
        ');
        $stmt->execute([$user['id']]);
        return ['data' => $stmt->fetchAll()];
    }

    public function store(): array {
        $user = $this->auth->authenticate();
        $data = json_decode(file_get_contents('php://input'), true);

        $productId = $data['product_id'] ?? 0;
        $quantidade = max(1, (int) ($data['quantidade'] ?? 1));

        $stmt = $this->db->prepare('
            INSERT INTO cart (user_id, product_id, quantidade)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE quantidade = quantidade + ?
        ');
        $stmt->execute([$user['id'], $productId, $quantidade, $quantidade]);

        return ['message' => 'Produto adicionado ao carrinho'];
    }

    public function update(int $id): array {
        $user = $this->auth->authenticate();
        $data = json_decode(file_get_contents('php://input'), true);
        $quantidade = max(0, (int) ($data['quantidade'] ?? 0));

        if ($quantidade === 0) {
            return $this->destroy($id);
        }

        $stmt = $this->db->prepare('
            UPDATE cart SET quantidade = ? WHERE id = ? AND user_id = ?
        ');
        $stmt->execute([$quantidade, $id, $user['id']]);

        return ['message' => 'Quantidade actualizada'];
    }

    public function destroy(int $id): array {
        $user = $this->auth->authenticate();
        $stmt = $this->db->prepare('DELETE FROM cart WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $user['id']]);
        return ['message' => 'Produto removido do carrinho'];
    }
}
