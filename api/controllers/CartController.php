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
            SELECT c.* FROM cart c WHERE c.user_id = ? ORDER BY c.created_at DESC
        ');
        $stmt->execute([$user['id']]);
        $items = $stmt->fetchAll();

        foreach ($items as &$item) {
            if ($item['origem'] === 'local' && $item['product_id']) {
                $prodStmt = $this->db->prepare('SELECT titulo, preco, stock, imagem_url FROM products WHERE id = ?');
                $prodStmt->execute([$item['product_id']]);
                $prod = $prodStmt->fetch();
                if ($prod) {
                    $item['product_nome'] = $prod['titulo'];
                    $item['preco'] = $prod['preco'];
                    $item['imagem_url'] = $prod['imagem_url'];
                    $item['stock'] = $prod['stock'];
                }
            }
        }

        return ['data' => $items];
    }

    public function store(): array {
        $user = $this->auth->authenticate();
        $data = json_decode(file_get_contents('php://input'), true);

        $productId = $data['product_id'] ?? null;
        $quantidade = max(1, (int) ($data['quantidade'] ?? 1));
        $origem = $data['origem'] ?? 'local';
        $productNome = $data['product_nome'] ?? '';
        $preco = (float) ($data['preco'] ?? 0);
        $imagemUrl = $data['imagem_url'] ?? null;

        if ($origem === 'local') {
            $prodStmt = $this->db->prepare('SELECT id FROM products WHERE id = ?');
            $prodStmt->execute([$productId]);
            if (!$prodStmt->fetch()) {
                throw new RuntimeException('Produto local não encontrado', 404);
            }
        }

        $stmt = $this->db->prepare('
            INSERT INTO cart (user_id, product_id, product_nome, preco, quantidade, origem, imagem_url)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE quantidade = quantidade + VALUES(quantidade)
        ');
        $stmt->execute([$user['id'], $productId, $productNome, $preco, $quantidade, $origem, $imagemUrl]);

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
