<?php

class PaymentController {
    private PDO $db;
    private AuthMiddleware $auth;
    private string $proxypayUrl;
    private string $proxypayKey;
    private string $paypalUrl;
    private string $paypalClientId;
    private string $paypalSecret;

    public function __construct(PDO $db) {
        $this->db = $db;
        $this->auth = new AuthMiddleware($db);
        $this->proxypayUrl = $_ENV['PROXYPAY_URL'] ?? 'https://api.sandbox.proxypay.co.ao';
        $this->proxypayKey = $_ENV['PROXYPAY_API_KEY'] ?? '';
        $this->paypalUrl = $_ENV['PAYPAL_URL'] ?? 'https://api-m.sandbox.paypal.com';
        $this->paypalClientId = $_ENV['PAYPAL_CLIENT_ID'] ?? '';
        $this->paypalSecret = $_ENV['PAYPAL_SECRET'] ?? '';
    }

    // ─── ProxyPay: Generate Reference ID ──────────────────────────
    public function generateReference(): array {
        $response = $this->proxypayRequest('POST', '/reference_ids');
        $body = json_decode($response['body'], true);
        return ['id' => $body['id'] ?? null];
    }

    // ─── ProxyPay: Create Payment Reference ────────────────────────
    public function createReference(): array {
        $data = json_decode(file_get_contents('php://input'), true);
        $referenceId = $data['reference_id'] ?? 0;
        $amount = $data['amount'] ?? '0.00';
        $description = $data['description'] ?? 'VELORA - Compra online';
        $orderId = $data['order_id'] ?? '';

        $body = json_encode([
            'amount' => $amount,
            'end_datetime' => '2026-12-31T23:59:59Z',
            'custom_fields' => [
                'order_id' => (string) $orderId,
                'callback_url' => 'https://velora.ao/api/payment/webhook'
            ]
        ]);

        $response = $this->proxypayRequest('PUT', "/references/$referenceId", $body);

        return [
            'reference_id' => $referenceId,
            'amount' => $amount,
            'expires_at' => '2026-12-31T23:59:59Z'
        ];
    }

    // ─── ProxyPay: Check Payment Status ────────────────────────────
    public function paymentStatus(): array {
        $response = $this->proxypayRequest('GET', '/payments');
        $body = json_decode($response['body'], true);
        return ['data' => $body ?? []];
    }

    // ─── ProxyPay: Confirm Payment ─────────────────────────────────
    public function confirmPayment(string $paymentId): array {
        $user = $this->auth->authenticate();
        $this->proxypayRequest('DELETE', "/payments/$paymentId");

        $orderId = $this->createOrderFromCart($user['id']);

        $orderService = new OrderService($this->db);
        $result = $orderService->confirmPayment($orderId);

        return ['success' => true, 'order_id' => $orderId] + $result;
    }

    // ─── ProxyPay: Webhook ─────────────────────────────────────────
    public function webhook(): array {
        $headers = getallheaders();
        $signature = $headers['X-Signature'] ?? '';
        $payload = file_get_contents('php://input');

        $expected = hash_hmac('sha256', $payload, $this->proxypayKey);
        if (!hash_equals($expected, $signature)) {
            throw new RuntimeException('Assinatura inválida', 401);
        }

        $event = json_decode($payload, true);
        $orderId = $event['custom_fields']['order_id'] ?? 0;

        if ($orderId) {
            $orderService = new OrderService($this->db);
            $orderService->confirmPayment((int) $orderId);
        }

        return ['status' => 'ok'];
    }

    // ─── PayPal: Get Access Token ──────────────────────────────────
    public function paypalToken(): array {
        $token = $this->getPaypalAccessToken();
        return ['access_token' => $token];
    }

    // ─── PayPal: Create Order ──────────────────────────────────────
    public function paypalCreate(): array {
        $data = json_decode(file_get_contents('php://input'), true);
        $amountUsd = $data['amount_usd'] ?? '0.00';
        $amountKz = $data['amount_kz'] ?? '0.00';
        $orderId = $data['order_id'] ?? '';

        $token = $this->getPaypalAccessToken();

        $body = json_encode([
            'intent' => 'CAPTURE',
            'purchase_units' => [[
                'reference_id' => (string) $orderId,
                'description' => 'VELORA - Compra online',
                'amount' => [
                    'currency_code' => 'USD',
                    'value' => $amountUsd,
                    'breakdown' => [
                        'item_total' => [
                            'currency_code' => 'USD',
                            'value' => $amountUsd
                        ]
                    ]
                ]
            ]],
            'application_context' => [
                'brand_name' => 'VELORA',
                'landing_page' => 'LOGIN',
                'user_action' => 'PAY_NOW',
                'return_url' => "https://velora.ao/checkout?paypal_success=1&order_id=$orderId",
                'cancel_url' => 'https://velora.ao/checkout?paypal_cancel=1'
            ]
        ]);

        $response = $this->paypalRequest('POST', '/v2/checkout/orders', $body, $token);
        $result = json_decode($response['body'], true);

        $approveUrl = '';
        foreach ($result['links'] ?? [] as $link) {
            if ($link['rel'] === 'approve') {
                $approveUrl = $link['href'];
                break;
            }
        }

        return [
            'paypal_order_id' => $result['id'] ?? '',
            'approve_url' => $approveUrl,
            'status' => $result['status'] ?? ''
        ];
    }

    // ─── PayPal: Capture Payment ───────────────────────────────────
    public function paypalCapture(): array {
        $user = $this->auth->authenticate();
        $data = json_decode(file_get_contents('php://input'), true);
        $paypalOrderId = $data['paypal_order_id'] ?? '';

        $token = $this->getPaypalAccessToken();
        $response = $this->paypalRequest('POST', "/v2/checkout/orders/$paypalOrderId/capture", null, $token);
        $result = json_decode($response['body'], true);

        $status = $result['status'] ?? '';
        if ($status !== 'COMPLETED') {
            throw new RuntimeException('Pagamento não completado', 400);
        }

        $orderId = $this->createOrderFromCart($user['id']);

        $orderService = new OrderService($this->db);
        $result = $orderService->confirmPayment($orderId);

        return ['success' => true, 'order_id' => $orderId, 'paypal_status' => $status] + $result;
    }

    // ─── Helpers ───────────────────────────────────────────────────

    private function proxypayRequest(string $method, string $path, ?string $body = null): array {
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $this->proxypayUrl . $path,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_HTTPHEADER => [
                'Authorization: Token ' . $this->proxypayKey,
                'Accept: application/vnd.proxypay.v2+json',
                'Content-Type: application/json',
            ],
            CURLOPT_TIMEOUT => 30,
        ]);

        if ($body) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
        }

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new RuntimeException('ProxyPay: ' . $error, 502);
        }

        return ['body' => $response, 'http_code' => $httpCode];
    }

    private function getPaypalAccessToken(): string {
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $this->paypalUrl . '/v1/oauth2/token',
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => 'grant_type=client_credentials',
            CURLOPT_HTTPHEADER => [
                'Accept: application/json',
                'Accept-Language: en_US',
            ],
            CURLOPT_USERPWD => $this->paypalClientId . ':' . $this->paypalSecret,
            CURLOPT_TIMEOUT => 30,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new RuntimeException('PayPal Auth: ' . $error, 502);
        }

        $data = json_decode($response, true);

        if ($httpCode !== 200 || !isset($data['access_token'])) {
            throw new RuntimeException('PayPal: falha na autenticação', 502);
        }

        return $data['access_token'];
    }

    private function paypalRequest(string $method, string $path, ?string $body, string $token): array {
        $ch = curl_init();
        $headers = [
            'Authorization: Bearer ' . $token,
            'Content-Type: application/json',
        ];

        curl_setopt_array($ch, [
            CURLOPT_URL => $this->paypalUrl . $path,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_TIMEOUT => 30,
        ]);

        if ($body) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
        }

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new RuntimeException('PayPal: ' . $error, 502);
        }

        return ['body' => $response, 'http_code' => $httpCode];
    }

    private function createOrderFromCart(int $userId): int {
        $stmt = $this->db->prepare('
            SELECT * FROM cart WHERE user_id = ?
        ');
        $stmt->execute([$userId]);
        $cartItems = $stmt->fetchAll();

        if (empty($cartItems)) {
            throw new RuntimeException('Carrinho vazio', 400);
        }

        $total = 0;
        foreach ($cartItems as $item) {
            $total += $item['preco'] * $item['quantidade'];
        }

        $orderService = new OrderService($this->db);
        $orderId = $orderService->placeOrder($userId, $cartItems, $total);

        $clearStmt = $this->db->prepare('DELETE FROM cart WHERE user_id = ?');
        $clearStmt->execute([$userId]);

        return $orderId;
    }
}
