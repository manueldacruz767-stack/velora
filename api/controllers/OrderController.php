<?php

class OrderController {
    private OrderService $orderService;
    private AuthMiddleware $auth;
    private PDO $db;

    public function __construct(PDO $db) {
        $this->db = $db;
        $this->orderService = new OrderService($db);
        $this->auth = new AuthMiddleware($db);
    }

    public function index(): array {
        $user = $this->auth->authenticate();
        $orders = $this->orderService->getOrderHistory($user['id']);
        return ['data' => $orders];
    }

    public function store(): array {
        $user = $this->auth->authenticate();
        $data = json_decode(file_get_contents('php://input'), true);

        $orderId = $this->orderService->placeOrder(
            $user['id'],
            $data['items'] ?? [],
            (float) ($data['total'] ?? 0)
        );

        $clearStmt = $this->db->prepare('DELETE FROM cart WHERE user_id = ?');
        $clearStmt->execute([$user['id']]);

        $orderModel = new Order($this->db);
        return ['data' => $orderModel->findById($orderId), 'message' => 'Pedido realizado com sucesso'];
    }

    public function show(int $id): array {
        $user = $this->auth->authenticate();
        $order = $this->orderService->getOrderDetail($id, $user['id']);
        return ['data' => $order];
    }
}
