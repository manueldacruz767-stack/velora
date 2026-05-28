<?php

class AvaliacaoController {
    private PDO $db;
    private AuthMiddleware $auth;

    public function __construct(PDO $db) {
        $this->db = $db;
        $this->auth = new AuthMiddleware($db);
    }

    public function index(int $productId): array {
        $stmt = $this->db->prepare('
            SELECT a.*, u.nome AS user_nome
            FROM avaliacoes a
            JOIN users u ON a.user_id = u.id
            WHERE a.product_id = ?
            ORDER BY a.created_at DESC
        ');
        $stmt->execute([$productId]);
        $avaliacoes = $stmt->fetchAll();

        $avgStmt = $this->db->prepare('SELECT ROUND(AVG(rating), 1) AS media, COUNT(*) AS total FROM avaliacoes WHERE product_id = ?');
        $avgStmt->execute([$productId]);
        $stats = $avgStmt->fetch();

        return ['data' => $avaliacoes, 'stats' => $stats];
    }

    public function store(int $productId): array {
        $user = $this->auth->authenticate();
        $data = json_decode(file_get_contents('php://input'), true);

        $rating = (int) ($data['rating'] ?? 0);
        $comentario = trim($data['comentario'] ?? '');

        if ($rating < 1 || $rating > 5) {
            throw new RuntimeException('Avaliação deve ser entre 1 e 5 estrelas', 400);
        }

        if (empty($comentario)) {
            throw new RuntimeException('Comentário é obrigatório', 400);
        }

        $stmt = $this->db->prepare('SELECT id FROM orders o JOIN order_items oi ON o.id = oi.order_id WHERE o.user_id = ? AND oi.product_id = ? AND o.status = ? LIMIT 1');
        $stmt->execute([$user['id'], $productId, 'entregue']);
        if (!$stmt->fetch()) {
            throw new RuntimeException('Só pode avaliar produtos que já recebeu', 403);
        }

        $stmt = $this->db->prepare('
            INSERT INTO avaliacoes (product_id, user_id, rating, comentario)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE rating = VALUES(rating), comentario = VALUES(comentario)
        ');
        $stmt->execute([$productId, $user['id'], $rating, $comentario]);

        return $this->index($productId);
    }
}
