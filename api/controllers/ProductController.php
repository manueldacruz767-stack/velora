<?php

class ProductController {
    private Product $productModel;
    private AuthMiddleware $auth;
    private array $allowedMimes = ['image/jpeg', 'image/png', 'image/jpg'];
    private int $maxFileSize = 5 * 1024 * 1024; // 5MB

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
        $user = $this->auth->authenticate();

        $titulo = $_POST['titulo'] ?? '';
        $preco = $_POST['preco'] ?? '';
        $descricao = $_POST['descricao'] ?? '';
        $categoria = $_POST['categoria'] ?? '';
        $stock = (int) ($_POST['stock'] ?? 0);

        if (empty($titulo) || empty($preco)) {
            throw new RuntimeException('Título e preço são obrigatórios', 400);
        }

        $imagemUrl = null;
        if (isset($_FILES['imagem']) && $_FILES['imagem']['error'] === UPLOAD_ERR_OK) {
            $imagemUrl = $this->processUpload($_FILES['imagem']);
        }

        $id = $this->productModel->create([
            'vendedor_id' => (int) $user['id'],
            'titulo' => $titulo,
            'descricao' => $descricao,
            'preco' => $preco,
            'stock' => $stock,
            'imagem_url' => $imagemUrl,
            'categoria' => $categoria,
        ]);

        return [
            'data' => $this->productModel->findById($id),
            'message' => 'Produto criado com sucesso',
        ];
    }

    public function update(int $id): array {
        $user = $this->auth->authenticate();
        $existing = $this->productModel->findById($id);

        if (!$existing) {
            throw new RuntimeException('Produto não encontrado', 404);
        }

        if ((int) $existing['vendedor_id'] !== (int) $user['id']) {
            throw new RuntimeException('Apenas o vendedor pode editar este produto', 403);
        }

        $data = [];

        if (isset($_POST['titulo'])) $data['titulo'] = $_POST['titulo'];
        if (isset($_POST['preco'])) $data['preco'] = $_POST['preco'];
        if (isset($_POST['descricao'])) $data['descricao'] = $_POST['descricao'];
        if (isset($_POST['categoria'])) $data['categoria'] = $_POST['categoria'];
        if (isset($_POST['stock'])) $data['stock'] = (int) $_POST['stock'];

        if (isset($_FILES['imagem']) && $_FILES['imagem']['error'] === UPLOAD_ERR_OK) {
            if ($existing['imagem_url']) {
                $oldFile = __DIR__ . '/../../' . ltrim($existing['imagem_url'], '/');
                if (file_exists($oldFile)) unlink($oldFile);
            }
            $data['imagem_url'] = $this->processUpload($_FILES['imagem']);
        }

        $this->productModel->update($id, $data);
        return ['data' => $this->productModel->findById($id), 'message' => 'Produto actualizado com sucesso'];
    }

    public function destroy(int $id): array {
        $user = $this->auth->authenticate();
        $existing = $this->productModel->findById($id);

        if (!$existing) {
            throw new RuntimeException('Produto não encontrado', 404);
        }

        if ((int) $existing['vendedor_id'] !== (int) $user['id']) {
            throw new RuntimeException('Apenas o vendedor pode remover este produto', 403);
        }

        $this->productModel->delete($id);
        return ['message' => 'Produto removido com sucesso'];
    }

    private function processUpload(array $file): string {
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);

        if (!in_array($mime, $this->allowedMimes, true)) {
            throw new RuntimeException('Apenas imagens PNG, JPG ou JPEG são permitidas', 400);
        }

        if ($file['size'] > $this->maxFileSize) {
            throw new RuntimeException('A imagem não pode exceder 5MB', 400);
        }

        $ext = match ($mime) {
            'image/png' => 'png',
            'image/jpeg', 'image/jpg' => 'jpg',
            default => 'jpg',
        };

        $filename = uniqid('prod_', true) . '.' . $ext;
        $destDir = $this->productModel->getImagemPath();

        if (!is_dir($destDir)) {
            mkdir($destDir, 0755, true);
        }

        if (!move_uploaded_file($file['tmp_name'], $destDir . $filename)) {
            throw new RuntimeException('Erro ao salvar a imagem', 500);
        }

        return $this->productModel->getImagemUrlBase() . $filename;
    }
}
