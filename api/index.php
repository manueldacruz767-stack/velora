<?php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Polyfill for getallheaders() in CGI/FastCGI mode
if (!function_exists('getallheaders')) {
    function getallheaders(): array {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (strpos($name, 'HTTP_') === 0) {
                $headers[str_replace('_', '-', substr($name, 5))] = $value;
            }
        }
        return $headers;
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/middleware/AuthMiddleware.php';

spl_autoload_register(function (string $class) {
    $paths = [
        __DIR__ . '/controllers/',
        __DIR__ . '/models/',
        __DIR__ . '/services/',
        __DIR__ . '/middleware/',
    ];
    foreach ($paths as $path) {
        $file = $path . $class . '.php';
        if (file_exists($file)) {
            require_once $file;
            return;
        }
    }
});

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = rtrim($uri, '/');
$method = $_SERVER['REQUEST_METHOD'];

$basePath = dirname($_SERVER['SCRIPT_NAME']);
$route = substr($uri, strlen($basePath));
$route = '/' . trim($route, '/');

$db = Database::getInstance()->getConnection();

try {
    $response = null;

    if ($route === '/' || $route === '') {
        $response = ['status' => 'ok', 'message' => 'VELORA API'];
    }

    // Auth routes
    elseif ($route === '/auth/register' && $method === 'POST') {
        $response = (new AuthController($db))->register();
    }
    elseif ($route === '/auth/login' && $method === 'POST') {
        $response = (new AuthController($db))->login();
    }

    // Product routes
    elseif ($route === '/products' && $method === 'GET') {
        $response = (new ProductController($db))->index();
    }
    elseif (preg_match('#^/products/(\d+)$#', $route, $m) && $method === 'GET') {
        $response = (new ProductController($db))->show((int) $m[1]);
    }
    elseif ($route === '/products' && $method === 'POST') {
        $response = (new ProductController($db))->store();
    }
    elseif (preg_match('#^/products/(\d+)$#', $route, $m) && $method === 'PUT') {
        $response = (new ProductController($db))->update((int) $m[1]);
    }
    elseif (preg_match('#^/products/(\d+)$#', $route, $m) && $method === 'DELETE') {
        $response = (new ProductController($db))->destroy((int) $m[1]);
    }

    // Cart routes
    elseif ($route === '/cart' && $method === 'GET') {
        $response = (new CartController($db))->index();
    }
    elseif ($route === '/cart' && $method === 'POST') {
        $response = (new CartController($db))->store();
    }
    elseif (preg_match('#^/cart/(\d+)$#', $route, $m) && $method === 'PUT') {
        $response = (new CartController($db))->update((int) $m[1]);
    }
    elseif (preg_match('#^/cart/(\d+)$#', $route, $m) && $method === 'DELETE') {
        $response = (new CartController($db))->destroy((int) $m[1]);
    }

    // Order routes
    elseif ($route === '/orders' && $method === 'GET') {
        $response = (new OrderController($db))->index();
    }
    elseif ($route === '/orders' && $method === 'POST') {
        $response = (new OrderController($db))->store();
    }
    elseif (preg_match('#^/orders/(\d+)$#', $route, $m) && $method === 'GET') {
        $response = (new OrderController($db))->show((int) $m[1]);
    }
    elseif (preg_match('#^/orders/(\d+)/confirm$#', $route, $m) && $method === 'POST') {
        $response = (new OrderController($db))->confirm((int) $m[1]);
    }

    // Rastreio routes
    elseif (preg_match('#^/rastreio/(\d+)$#', $route, $m) && $method === 'GET') {
        $response = (new RastreioController($db))->show((int) $m[1]);
    }

    // Review routes
    elseif (preg_match('#^/avaliacoes/(\d+)$#', $route, $m) && $method === 'GET') {
        $response = (new AvaliacaoController($db))->index((int) $m[1]);
    }
    elseif (preg_match('#^/avaliacoes/(\d+)$#', $route, $m) && $method === 'POST') {
        $response = (new AvaliacaoController($db))->store((int) $m[1]);
    }

    // Seller routes
    elseif ($route === '/seller/wallet' && $method === 'GET') {
        $response = (new SellerController($db))->wallet();
    }
    elseif ($route === '/seller/products' && $method === 'GET') {
        $response = (new SellerController($db))->products();
    }
    elseif (preg_match('#^/seller/products/(\d+)/stock$#', $route, $m) && $method === 'PUT') {
        $response = (new SellerController($db))->updateStock((int) $m[1]);
    }
    elseif (preg_match('#^/seller/products/(\d+)/image$#', $route, $m) && $method === 'POST') {
        $response = (new SellerController($db))->uploadImage((int) $m[1]);
    }

    // Admin routes
    elseif ($route === '/admin/users' && $method === 'GET') {
        $response = (new AdminController($db))->allUsers();
    }
    elseif ($route === '/admin/users/pendentes' && $method === 'GET') {
        $response = (new AdminController($db))->pendingUsers();
    }
    elseif (preg_match('#^/admin/users/(\d+)/aprovar$#', $route, $m) && $method === 'POST') {
        $response = (new AdminController($db))->approveUser((int) $m[1]);
    }
    elseif (preg_match('#^/admin/users/(\d+)/rejeitar$#', $route, $m) && $method === 'POST') {
        $response = (new AdminController($db))->rejectUser((int) $m[1]);
    }
    elseif ($route === '/admin/metrics' && $method === 'GET') {
        $response = (new AdminController($db))->metrics();
    }

    // Payment routes - ProxyPay
    elseif ($route === '/payment/reference' && $method === 'POST') {
        $response = (new PaymentController($db))->generateReference();
    }
    elseif ($route === '/payment/create' && $method === 'POST') {
        $response = (new PaymentController($db))->createReference();
    }
    elseif ($route === '/payment/status' && $method === 'GET') {
        $response = (new PaymentController($db))->paymentStatus();
    }
    elseif (preg_match('#^/payment/confirm/(\d+)$#', $route, $m) && $method === 'DELETE') {
        $response = (new PaymentController($db))->confirmPayment($m[1]);
    }
    elseif ($route === '/payment/webhook' && $method === 'POST') {
        $response = (new PaymentController($db))->webhook();
    }

    // Payment routes - PayPal
    elseif ($route === '/payment/paypal/token' && $method === 'POST') {
        $response = (new PaymentController($db))->paypalToken();
    }
    elseif ($route === '/payment/paypal/create' && $method === 'POST') {
        $response = (new PaymentController($db))->paypalCreate();
    }
    elseif ($route === '/payment/paypal/capture' && $method === 'POST') {
        $response = (new PaymentController($db))->paypalCapture();
    }

    else {
        throw new RuntimeException('Rota não encontrada', 404);
    }

    echo json_encode($response);
} catch (RuntimeException $e) {
    http_response_code($e->getCode() ?: 500);
    echo json_encode(['error' => $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro interno do servidor']);
}
