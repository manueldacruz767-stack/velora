<?php

class AuthMiddleware {
    private PDO $db;
    private static string $algorithm = 'sha256';

    public function __construct(PDO $db) {
        $this->db = $db;
    }

    private static function getSecret(): string {
        return $_ENV['JWT_SECRET'] ?? 'velora_jwt_secret_2026';
    }

    private static function base64urlEncode(string $data): string {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64urlDecode(string $data): string {
        return base64_decode(strtr($data, '-_', '+/'));
    }

    public static function generateToken(int $userId): string {
        $header = self::base64urlEncode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
        $payload = self::base64urlEncode(json_encode([
            'user_id' => $userId,
            'iat' => time(),
            'exp' => time() + 86400 * 7,
        ]));
        $signature = self::base64urlEncode(
            hash_hmac(self::$algorithm, "$header.$payload", self::getSecret(), true)
        );
        return "$header.$payload.$signature";
    }

    public function authenticate(): array {
        $headers = getallheaders();
        $token = $headers['Authorization'] ?? $headers['authorization'] ?? '';

        if (!preg_match('/^Bearer\s+(.+)$/', $token, $matches)) {
            throw new RuntimeException('Token não fornecido', 401);
        }

        $parts = explode('.', $matches[1]);
        if (count($parts) !== 3) {
            throw new RuntimeException('Token inválido', 401);
        }

        [$header, $payload, $signature] = $parts;

        $expectedSig = self::base64urlEncode(
            hash_hmac(self::$algorithm, "$header.$payload", self::getSecret(), true)
        );

        if (!hash_equals($expectedSig, $signature)) {
            throw new RuntimeException('Token inválido', 401);
        }

        $data = json_decode(self::base64urlDecode($payload), true);

        if (!$data || !isset($data['user_id'])) {
            throw new RuntimeException('Token inválido', 401);
        }

        if (isset($data['exp']) && $data['exp'] < time()) {
            throw new RuntimeException('Token expirado', 401);
        }

        $stmt = $this->db->prepare('SELECT id, nome, email, tipo FROM users WHERE id = ?');
        $stmt->execute([$data['user_id']]);
        $user = $stmt->fetch();

        if (!$user) {
            throw new RuntimeException('Utilizador não encontrado', 401);
        }

        return $user;
    }
}
