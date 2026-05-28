<?php

class OrderService {
    private PDO $db;
    private Product $productModel;

    public function __construct(PDO $db) {
        $this->db = $db;
        $this->productModel = new Product($db);
    }

    public function placeOrder(int $userId, array $cartItems, float $total): int {
        if (empty($cartItems)) {
            throw new RuntimeException('Carrinho vazio', 400);
        }

        $orderModel = new Order($this->db);
        $this->db->beginTransaction();

        try {
            $orderId = $orderModel->create($userId, $total);

            foreach ($cartItems as $item) {
                $productId = $item['product_id'] ?? null;
                $origem = $item['origem'] ?? 'api';
                $quantidade = (int) ($item['quantidade'] ?? 1);
                $preco = (float) ($item['preco'] ?? 0);
                $productNome = $item['product_nome'] ?? '';

                $vendedorId = null;

                if ($origem === 'local') {
                    $localProduct = $this->productModel->findById((int) $productId);
                    if (!$localProduct) {
                        throw new RuntimeException("Produto local #{$productId} não encontrado", 404);
                    }

                    $vendedorId = $localProduct['vendedor_id'] ?? null;

                    $this->productModel->decreaseStock((int) $productId, $quantidade);

                    $valorVendedor = $preco * $quantidade;
                    if ($vendedorId) {
                        $this->creditWallet($vendedorId, $valorVendedor);
                    } else {
                        $this->creditWallet($this->getAdminId(), $valorVendedor);
                    }
                } else {
                    $valorPlataforma = $preco * $quantidade;
                    $this->creditWallet($this->getAdminId(), $valorPlataforma);
                }

                $orderModel->addItemWithOrigin(
                    $orderId,
                    $origem === 'local' ? (int) $productId : null,
                    $productNome,
                    $quantidade,
                    $preco,
                    $origem,
                    $vendedorId
                );
            }

            $this->db->commit();
            return $orderId;
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function getOrderHistory(int $userId): array {
        $orderModel = new Order($this->db);
        $orders = $orderModel->getByUserId($userId);

        foreach ($orders as &$order) {
            $order['items'] = $orderModel->getItemsByOrderId($order['id']);
        }

        return $orders;
    }

    public function getOrderDetail(int $orderId, int $userId): array {
        $orderModel = new Order($this->db);
        $order = $orderModel->findById($orderId);

        if (!$order) {
            throw new RuntimeException('Pedido não encontrado', 404);
        }

        if ($order['user_id'] !== $userId) {
            throw new RuntimeException('Acesso não autorizado', 403);
        }

        $order['items'] = $orderModel->getItemsByOrderId($orderId);
        return $order;
    }

    private function creditWallet(int $userId, float $valor): void {
        $stmt = $this->db->prepare('
            INSERT INTO wallet (user_id, saldo, saldo_bloqueado) VALUES (?, 0, ?)
            ON DUPLICATE KEY UPDATE saldo_bloqueado = saldo_bloqueado + VALUES(saldo_bloqueado)
        ');
        $stmt->execute([$userId, $valor]);
    }

    private function getAdminId(): int {
        $stmt = $this->db->prepare("SELECT id FROM users WHERE tipo = 'admin' ORDER BY id LIMIT 1");
        $stmt->execute();
        $admin = $stmt->fetch();
        return $admin ? (int) $admin['id'] : 1;
    }

    public function confirmPayment(int $orderId): array {
        $orderModel = new Order($this->db);
        $order = $orderModel->findById($orderId);

        if (!$order) {
            throw new RuntimeException('Pedido não encontrado', 404);
        }

        if ($order['status'] !== 'pendente') {
            throw new RuntimeException('Pedido já foi processado', 400);
        }

        $this->db->beginTransaction();
        try {
            $orderModel->updateStatus($orderId, 'pago');

            $rastreio = new Rastreio($this->db);
            $rastreio->create(
                $orderId,
                'pago',
                'Pagamento confirmado. O seu pedido está a ser preparado.'
            );

            $this->db->commit();

            return [
                'order' => $orderModel->findById($orderId),
                'rastreio' => $rastreio->getByOrderId($orderId)
            ];
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }
}
