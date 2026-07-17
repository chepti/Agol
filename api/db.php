<?php
// תשתית משותפת: SQLite, סכימה, טוקנים, עזרי JSON.

declare(strict_types=1);

error_reporting(E_ALL);
ini_set('display_errors', '0');

header('Content-Type: application/json; charset=utf-8');

function json_out(array $data, int $status = 200): void {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function json_err(string $msg, int $status = 400): void {
    json_out(['error' => $msg], $status);
}

function body(): array {
    $raw = file_get_contents('php://input');
    $d = json_decode($raw ?: '', true);
    return is_array($d) ? $d : [];
}

/** תיקיית נתונים: מחוץ ל-public_html אם אפשר, אחרת תת-תיקייה חסומה */
function data_dir(): string {
    $outside = realpath(__DIR__ . '/../../..');
    $candidates = [];
    if ($outside && is_writable($outside)) {
        $candidates[] = $outside . '/agol_data';
    }
    $candidates[] = __DIR__ . '/data';
    foreach ($candidates as $dir) {
        if (!is_dir($dir)) {
            @mkdir($dir, 0755, true);
        }
        if (is_dir($dir) && is_writable($dir)) {
            // חסימת גישה ישירה אם התיקייה בתוך ה-web root
            $ht = $dir . '/.htaccess';
            if (!file_exists($ht)) {
                @file_put_contents($ht, "Require all denied\n");
            }
            return $dir;
        }
    }
    json_err('אין תיקיית נתונים זמינה בשרת', 500);
    exit;
}

function db(): PDO {
    static $pdo = null;
    if ($pdo !== null) return $pdo;
    $pdo = new PDO('sqlite:' . data_dir() . '/agol.db');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec('PRAGMA journal_mode = WAL');
    $pdo->exec('PRAGMA foreign_keys = ON');
    $pdo->exec('CREATE TABLE IF NOT EXISTS teachers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        pass_hash TEXT,
        google_sub TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime(\'now\'))
    )');
    $pdo->exec('CREATE TABLE IF NOT EXISTS classes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        teacher_id INTEGER NOT NULL REFERENCES teachers(id),
        name TEXT NOT NULL,
        code TEXT NOT NULL UNIQUE,
        free_nav INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime(\'now\'))
    )');
    $pdo->exec('CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        class_id INTEGER NOT NULL REFERENCES classes(id),
        nickname TEXT NOT NULL,
        emoji TEXT NOT NULL DEFAULT "",
        created_at TEXT NOT NULL DEFAULT (datetime(\'now\')),
        last_seen TEXT,
        UNIQUE(class_id, nickname)
    )');
    $pdo->exec('CREATE TABLE IF NOT EXISTS attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL REFERENCES students(id),
        activity_id TEXT NOT NULL,
        unit_id TEXT NOT NULL,
        score INTEGER NOT NULL,
        max_score INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime(\'now\'))
    )');
    $pdo->exec('CREATE TABLE IF NOT EXISTS letter_stats (
        student_id INTEGER NOT NULL REFERENCES students(id),
        letter TEXT NOT NULL,
        correct INTEGER NOT NULL DEFAULT 0,
        wrong INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL DEFAULT (datetime(\'now\')),
        PRIMARY KEY (student_id, letter)
    )');
    return $pdo;
}

function secret(): string {
    $f = data_dir() . '/secret.key';
    if (!file_exists($f)) {
        file_put_contents($f, bin2hex(random_bytes(32)));
        @chmod($f, 0600);
    }
    return trim((string)file_get_contents($f));
}

/** טוקן חתום: role:id:expiry:hmac */
function make_token(string $role, int $id, int $days = 365): string {
    $exp = time() + $days * 86400;
    $payload = "$role:$id:$exp";
    return $payload . ':' . hash_hmac('sha256', $payload, secret());
}

function parse_token(?string $token, string $expectRole): ?int {
    if (!$token) return null;
    $parts = explode(':', $token);
    if (count($parts) !== 4) return null;
    [$role, $id, $exp, $sig] = $parts;
    if ($role !== $expectRole) return null;
    if ((int)$exp < time()) return null;
    $payload = "$role:$id:$exp";
    if (!hash_equals(hash_hmac('sha256', $payload, secret()), $sig)) return null;
    return (int)$id;
}

function bearer(): ?string {
    $h = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if ($h === '' && function_exists('getallheaders')) {
        foreach (getallheaders() as $k => $v) {
            if (strtolower($k) === 'authorization') { $h = $v; break; }
        }
    }
    if (preg_match('/Bearer\s+(.+)/i', $h, $m)) return trim($m[1]);
    return null;
}

function require_teacher(): int {
    $id = parse_token(bearer(), 't');
    if ($id === null) json_err('יש להתחבר מחדש', 401);
    return $id;
}

function require_student(): int {
    $id = parse_token(bearer(), 's');
    if ($id === null) json_err('החיבור פג — היכנסו שוב עם קוד הכיתה', 401);
    return $id;
}
