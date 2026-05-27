<?php

class OrderService {
    private PDO $db;

    public function __construct(PDO $db) {
        $this->db = $db;
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
                $orderModel->addItem(
                    $orderId,
                    $item['product_id'],
                    $item['product_nome'],
                    $item['quantidade'],
                    $item['preco']
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
}
