<?php

class SellerController {
    private PDO $db;
    private AuthMiddleware $auth;

    public function __construct(PDO $db) {
        $this->db = $db;
        $this->auth = new AuthMiddleware($db);
    }

    private function requireSeller(): array {
        $user = $this->auth->authenticate();
        if (!in_array($user['tipo'], ['vendedor', 'admin'], true)) {
            throw new RuntimeException('Acesso restrito a vendedores', 403);
        }
        return $user;
    }

    public function wallet(): array {
        $user = $this->requireSeller();
        $stmt = $this->db->prepare('SELECT * FROM wallet WHERE user_id = ?');
        $stmt->execute([$user['id']]);
        $wallet = $stmt->fetch();

        if (!$wallet) {
            $stmt = $this->db->prepare('INSERT INTO wallet (user_id, saldo, saldo_bloqueado) VALUES (?, 0, 0)');
            $stmt->execute([$user['id']]);
            $wallet = ['user_id' => $user['id'], 'saldo' => 0, 'saldo_bloqueado' => 0];
        }

        $stmt = $this->db->prepare('SELECT COUNT(*) AS total FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE oi.vendedor_id = ? AND o.status = ?');
        $stmt->execute([$user['id'], 'entregue']);
        $vendasEntregues = (int) $stmt->fetchColumn();

        return ['data' => $wallet, 'vendas_entregues' => $vendasEntregues];
    }

    public function products(): array {
        $user = $this->requireSeller();
        $model = new Product($this->db);
        return ['data' => $model->findByVendedor((int) $user['id'])];
    }

    public function updateStock(int $productId): array {
        $user = $this->requireSeller();
        $model = new Product($this->db);
        $product = $model->findById($productId);

        if (!$product) {
            throw new RuntimeException('Produto não encontrado', 404);
        }
        if ((int) $product['vendedor_id'] !== (int) $user['id']) {
            throw new RuntimeException('Apenas o vendedor pode alterar este produto', 403);
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $stock = (int) ($data['stock'] ?? -1);

        if ($stock < 0) {
            throw new RuntimeException('Stock inválido', 400);
        }

        $model->update($productId, ['stock' => $stock]);
        return ['data' => $model->findById($productId), 'message' => 'Stock actualizado com sucesso'];
    }

    public function uploadImage(int $productId): array {
        $user = $this->requireSeller();
        $model = new Product($this->db);
        $product = $model->findById($productId);

        if (!$product) {
            throw new RuntimeException('Produto não encontrado', 404);
        }
        if ((int) $product['vendedor_id'] !== (int) $user['id']) {
            throw new RuntimeException('Apenas o vendedor pode alterar este produto', 403);
        }

        if (!isset($_FILES['imagem']) || $_FILES['imagem']['error'] !== UPLOAD_ERR_OK) {
            throw new RuntimeException('Nenhuma imagem enviada', 400);
        }

        $allowedMimes = ['image/jpeg', 'image/png', 'image/jpg'];
        $maxSize = 5 * 1024 * 1024;

        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime = finfo_file($finfo, $_FILES['imagem']['tmp_name']);
        finfo_close($finfo);

        if (!in_array($mime, $allowedMimes, true)) {
            throw new RuntimeException('Apenas imagens PNG, JPG ou JPEG são permitidas', 400);
        }
        if ($_FILES['imagem']['size'] > $maxSize) {
            throw new RuntimeException('A imagem não pode exceder 5MB', 400);
        }

        $ext = match ($mime) {
            'image/png' => 'png',
            default => 'jpg',
        };

        $filename = uniqid('prod_', true) . '.' . $ext;
        $destDir = $model->getImagemPath();

        if (!is_dir($destDir)) {
            mkdir($destDir, 0755, true);
        }

        if ($product['imagem_url']) {
            $oldFile = $model->getImagemPath() . basename($product['imagem_url']);
            if (file_exists($oldFile)) unlink($oldFile);
        }

        if (!move_uploaded_file($_FILES['imagem']['tmp_name'], $destDir . $filename)) {
            throw new RuntimeException('Erro ao salvar a imagem', 500);
        }

        $imagemUrl = $model->getImagemUrlBase() . $filename;
        $model->update($productId, ['imagem_url' => $imagemUrl]);

        return ['data' => $model->findById($productId), 'message' => 'Imagem actualizada com sucesso'];
    }
}
