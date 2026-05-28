<?php

class RastreioController {
    private PDO $db;
    private AuthMiddleware $auth;

    public function __construct(PDO $db) {
        $this->db = $db;
        $this->auth = new AuthMiddleware($db);
    }

    public function show(int $orderId): array {
        $user = $this->auth->authenticate();
        $orderModel = new Order($this->db);
        $order = $orderModel->findById($orderId);

        if (!$order) {
            throw new RuntimeException('Pedido não encontrado', 404);
        }

        if ($order['user_id'] !== $user['id'] && $user['tipo'] !== 'admin') {
            throw new RuntimeException('Acesso não autorizado', 403);
        }

        $rastreio = new Rastreio($this->db);
        return ['data' => $rastreio->getByOrderId($orderId)];
    }
}
