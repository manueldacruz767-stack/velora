<?php

class ProductController {
    private Product $productModel;
    private AuthMiddleware $auth;

    public function __construct(PDO $db) {
        $this->productModel = new Product($db);
        $this->auth = new AuthMiddleware($db);
    }

    public function index(): array {
        $categoria = $_GET['categoria'] ?? null;
        $search = $_GET['search'] ?? null;
        return ['data' => $this->productModel->findAll($categoria, $search)];
    }

    public function show(int $id): array {
        $product = $this->productModel->findById($id);
        if (!$product) {
            throw new RuntimeException('Produto não encontrado', 404);
        }
        return ['data' => $product];
    }

    public function store(): array {
        $this->auth->authenticate();
        $data = json_decode(file_get_contents('php://input'), true);

        if (empty($data['nome']) || empty($data['preco'])) {
            throw new RuntimeException('Nome e preço são obrigatórios', 400);
        }

        $id = $this->productModel->create($data);
        return ['data' => $this->productModel->findById($id), 'message' => 'Produto criado com sucesso'];
    }

    public function update(int $id): array {
        $this->auth->authenticate();
        $data = json_decode(file_get_contents('php://input'), true);

        $this->productModel->update($id, $data);
        return ['data' => $this->productModel->findById($id), 'message' => 'Produto actualizado com sucesso'];
    }

    public function destroy(int $id): array {
        $this->auth->authenticate();
        $this->productModel->delete($id);
        return ['message' => 'Produto removido com sucesso'];
    }
}
