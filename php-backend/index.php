<?php
// api.php - Single Entry Point for the API

// 1. Configuration & Headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// DB Credentials
$host = getenv('DB_HOST') ?: 'localhost';
$db_name = getenv('DB_NAME') ?: 'partes_app_db';
$username = getenv('DB_USER') ?: 'root';
$password = getenv('DB_PASS') ?: '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db_name;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    http_response_code(500);
    echo JSON_encode(["error" => "Database connection failed: " . $e->getMessage()]);
    exit();
}

// 2. Routing Helper
$request_uri = $_SERVER['REQUEST_URI'];
$method = $_SERVER['REQUEST_METHOD'];

// Parse URL to get endpoint
// Assumes URL structure: .../api.php/{resource}/{id?}
// OR via query param ?resource=users
// Let's support the pathinfo approach if possible, or query param as fallback.
// Current localClient calls: /api/partes, /api/auth/login, etc.
// If we run this file as index.php in an /api folder, URI might be /api/partes

// Normalize path
$script_name = dirname($_SERVER['SCRIPT_NAME']);
// If running at root, script_name is / or \
if ($script_name === '/' || $script_name === '\\') $script_name = '';

$path = str_replace($script_name, '', $request_uri);
// Remove query string
$path = strtok($path, '?');
// Trim slashes
$path = trim($path, '/');
$segments = explode('/', $path);

// Log for debug (viewable in docker logs)
error_log("Request URI: $request_uri");
error_log("Parsed Path: $path");
error_log("Segments: " . json_encode($segments));

// Resource serves as the "table" or "auth"
if (empty($segments[0])) {
    echo json_encode(["status" => "API Running"]);
    exit();
}

$resource = $segments[0];
$subResource = isset($segments[1]) ? $segments[1] : null;

// Get Body
$inputJSON = file_get_contents('php://input');
$body = json_decode($inputJSON, true);

// 3. Handlers

// --- AUTH ---
if ($resource === 'auth') {
    if ($subResource === 'login' && $method === 'POST') {
        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ? AND password = ?");
        $stmt->execute([$body['email'], $body['password']]);
        $user = $stmt->fetch();
        
        if ($user) {
            // Parse metadata back to object
            $user['user_metadata'] = json_decode($user['user_metadata'], true);
            echo json_encode(["user" => $user, "session" => ["access_token" => "php-token", "user" => $user]]);
        } else {
            http_response_code(401);
            echo json_encode(["error" => "Invalid credentials"]);
        }
        exit();
    }
    
    if ($subResource === 'register' && $method === 'POST') {
        $check = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $check->execute([$body['email']]);
        if ($check->fetch()) {
            http_response_code(400);
            echo json_encode(["error" => "User already exists"]);
            exit();
        }

        $newUser = [
            'id' => 'user-' . round(microtime(true) * 1000),
            'email' => $body['email'],
            'password' => $body['password'],
            'role' => $body['options']['data']['role'] ?? 'user',
            'user_metadata' => json_encode($body['options']['data'] ?? new stdClass()),
            'created_at' => date('Y-m-d H:i:s')
        ];

        $sql = "INSERT INTO users (id, email, password, role, user_metadata, created_at) VALUES (:id, :email, :password, :role, :user_metadata, :created_at)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($newUser);

        // Return object with parsed metadata
        $newUser['user_metadata'] = json_decode($newUser['user_metadata'], true);
        echo json_encode(["user" => $newUser, "session" => ["access_token" => "php-token", "user" => $newUser]]);
        exit();
    }

    if ($subResource === 'update' && $method === 'POST') {
        // Body: { email, data }
        $email = $body['email'];
        $newData = $body['data'];

        // Get current metadata
        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user) {
            http_response_code(404);
            echo json_encode(["error" => "User not found"]);
            exit();
        }

        $currentMeta = json_decode($user['user_metadata'], true) ?? [];
        $mergedMeta = array_merge($currentMeta, $newData);
        
        $updateStmt = $pdo->prepare("UPDATE users SET user_metadata = ? WHERE email = ?");
        $updateStmt->execute([json_encode($mergedMeta), $email]);

        $user['user_metadata'] = $mergedMeta;
        echo json_encode(["user" => $user]);
        exit();
    }
}

// --- UPLOADS ---
if ($resource === 'upload' && $subResource === 'avatar' && $method === 'POST') {
    // Expect body: { image: "base64...", userId }
    $base64Str = $body['image'];
    $userId = $body['userId'];
    
    if (preg_match('/^data:image\/(\w+);base64,/', $base64Str, $type)) {
        $data = substr($base64Str, strpos($base64Str, ',') + 1);
        $data = base64_decode($data);
        $extension = strtolower($type[1]);
        
        $fileName = "avatar_{$userId}_" . time() . ".{$extension}";
        $uploadDir = __DIR__ . '/uploads/';
        if (!file_exists($uploadDir)) mkdir($uploadDir, 0777, true);
        
        file_put_contents($uploadDir . $fileName, $data);
        $publicUrl = "/api/uploads/" . $fileName; // Adjust based on where this script lives
        
        // Update user
        $stmt = $pdo->prepare("UPDATE users SET avatar_url = ? WHERE id = ?");
        $stmt->execute([$publicUrl, $userId]);
        
        echo json_encode(["success" => true, "avatarUrl" => $publicUrl]);
    } else {
        http_response_code(400);
        echo json_encode(["error" => "Invalid image data"]);
    }
    exit();
}

// --- GENERIC CRUD ---
// Map allowed tables
$allowedTables = ['users', 'partes', 'actuaciones', 'clients'];
$table = $resource;

if (!in_array($table, $allowedTables)) {
    http_response_code(404);
    echo json_encode(["error" => "Endpoint not found"]);
    exit();
}

// Helper to save generic base64 file
function saveFileIfNeeded(&$row) {
    global $script_name; // To build path
    $fields = ['pdf_file', 'pdf_file_signed'];
    
    foreach ($fields as $field) {
        if (isset($row[$field]) && strpos($row[$field], 'data:') === 0) {
            $base64Str = $row[$field];
            $matches = [];
            if (preg_match('/^data:([A-Za-z-+\/]+);base64,(.+)$/', $base64Str, $matches)) {
                $extMap = ['application/pdf' => 'pdf', 'image/jpeg' => 'jpg', 'image/png' => 'png'];
                $mime = $matches[1];
                $extension = isset($extMap[$mime]) ? $extMap[$mime] : 'bin';
                $data = base64_decode($matches[2]);
                
                $fileName = "file_" . time() . "_" . uniqid() . "." . $extension;
                $uploadDir = __DIR__ . '/uploads/';
                if (!file_exists($uploadDir)) mkdir($uploadDir, 0777, true);
                
                file_put_contents($uploadDir . $fileName, $data);
                $row[$field] = "/api/uploads/" . $fileName; // Simple relative path
            }
        }
    }
}

if ($method === 'GET') {
    // Select *
    $sql = "SELECT * FROM $table";
    $params = [];
    
    // Simple filter support via query params
    // Exclude special params
    $filters = [];
    foreach ($_GET as $key => $val) {
        // Map frontend camelCase to snake_case if needed? 
        // For now, frontend sends what DB expects usually (created_at vs createdAt is handled in frontend adapter)
        // But localClient might send filters.
        if (in_array($key, ['order', 'select', 'limit'])) continue;
        
        // Security: validate key is simple alphanumeric
        if (preg_match('/^[a-zA-Z0-9_]+$/', $key)) {
            $filters[] = "$key = ?";
            $params[] = $val;
        }
    }
    
    if (!empty($filters)) {
        $sql .= " WHERE " . implode(" AND ", $filters);
    }
    
    if ($table === 'partes') $sql .= " ORDER BY created_at DESC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $results = $stmt->fetchAll();
    
    // Decode JSON fields if any
    if ($table === 'users') {
        foreach ($results as &$row) {
            if (isset($row['user_metadata'])) $row['user_metadata'] = json_decode($row['user_metadata'], true);
        }
    }
    
    echo json_encode($results);
}

elseif ($method === 'POST') {
    saveFileIfNeeded($body);
    
    if (isset($body['actuaciones'])) unset($body['actuaciones']); // Don't insert relations directly
    
    // Generate ID if missing (for partes/actuaciones)
    if (!isset($body['id'])) {
        $body['id'] = round(microtime(true) * 1000);
    }
    
    // Handle specific conversions for FKs - convert empty strings to NULL
    if (isset($body['user_id']) && $body['user_id'] === '') $body['user_id'] = null;
    if (isset($body['client_id']) && $body['client_id'] === '') $body['client_id'] = null;

    // Helper to format ISO dates to MySQL format
    foreach ($body as $key => $value) {
        // Simple check for ISO date string like 2026-02-06T12:51:00.000Z
        if (is_string($value) && preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/', $value)) {
            $timestamp = strtotime($value);
            if ($timestamp) {
                $body[$key] = date('Y-m-d H:i:s', $timestamp);
            }
        }
    }

    // Map array keys to columns
    $columns = array_keys($body);
    $placeholders = array_map(function($c) { return ":$c"; }, $columns);
    
    $sql = "INSERT INTO $table (" . implode(", ", $columns) . ") VALUES (" . implode(", ", $placeholders) . ")";
    $stmt = $pdo->prepare($sql);
    
    // Handle specific field conversions
    if (isset($body['user_metadata'])) $body['user_metadata'] = json_encode($body['user_metadata']);
    
    try {
        $stmt->execute($body);
        // Supabase returns array of inserted
        // Re-fetch or just echo body
        if (isset($body['user_metadata'])) $body['user_metadata'] = json_decode($body['user_metadata'], true);
        echo json_encode([$body]); 
    } catch (Exception $e) {
        http_response_code(500);
        error_log("SQL Error: " . $e->getMessage()); // Log to docker output
        echo json_encode(["error" => $e->getMessage()]);
    }
}

elseif ($method === 'PATCH') {
    $id = $subResource; 
    // Or from query string if localClient sends query params eq
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(["error" => "Missing ID"]);
        exit();
    }
    
    saveFileIfNeeded($body);
    
    $sets = [];
    foreach ($body as $key => $val) {
        $sets[] = "$key = :$key";
    }
    
    $sql = "UPDATE $table SET " . implode(", ", $sets) . " WHERE id = :_id";
    $body['_id'] = $id;
    
    $stmt = $pdo->prepare($sql);
    
    if (isset($body['user_metadata'])) $body['user_metadata'] = json_encode($body['user_metadata']);

    try {
        $stmt->execute($body);
        echo json_encode(["success" => true]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
}

elseif ($method === 'DELETE') {
    $id = $subResource;
    if (!$id) {
        http_response_code(400);
        exit();
    }
    
    $stmt = $pdo->prepare("DELETE FROM $table WHERE id = ?");
    $stmt->execute([$id]);
    http_response_code(204);
}

?>
