<?php
// נקודות קצה למורה: הרשמה, התחברות, כיתות, מפת חום.

require __DIR__ . '/db.php';

$a = $_GET['a'] ?? '';

// קוד כיתה = 6 ספרות (קל לילדים; בלי אפס בהתחלה כדי שלא ייעלם בהעתקה)
function gen_code(PDO $db): string {
    for ($i = 0; $i < 40; $i++) {
        $code = (string)random_int(100000, 999999);
        $st = $db->prepare('SELECT 1 FROM classes WHERE code = ?');
        $st->execute([$code]);
        if (!$st->fetch()) return $code;
    }
    json_err('לא הצלחנו ליצור קוד ייחודי', 500);
    exit;
}

switch ($a) {

case 'register': {
    $b = body();
    $name = trim((string)($b['name'] ?? ''));
    $email = strtolower(trim((string)($b['email'] ?? '')));
    $pass = (string)($b['password'] ?? '');
    if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) json_err('שם ואימייל תקין נדרשים');
    if (strlen($pass) < 6) json_err('סיסמה קצרה מדי (לפחות 6 תווים)');
    $db = db();
    $st = $db->prepare('SELECT id FROM teachers WHERE email = ?');
    $st->execute([$email]);
    if ($st->fetch()) json_err('כתובת האימייל כבר רשומה — נסו להתחבר');
    $ins = $db->prepare('INSERT INTO teachers (name, email, pass_hash) VALUES (?, ?, ?)');
    $ins->execute([$name, $email, password_hash($pass, PASSWORD_DEFAULT)]);
    $id = (int)$db->lastInsertId();
    json_out(['token' => make_token('t', $id), 'name' => $name, 'email' => $email]);
}

case 'login': {
    $b = body();
    $email = strtolower(trim((string)($b['email'] ?? '')));
    $pass = (string)($b['password'] ?? '');
    $db = db();
    $st = $db->prepare('SELECT id, name, pass_hash FROM teachers WHERE email = ?');
    $st->execute([$email]);
    $t = $st->fetch(PDO::FETCH_ASSOC);
    if (!$t || !$t['pass_hash'] || !password_verify($pass, $t['pass_hash'])) {
        json_err('אימייל או סיסמה שגויים', 401);
    }
    json_out(['token' => make_token('t', (int)$t['id']), 'name' => $t['name'], 'email' => $email]);
}

case 'google': {
    // כניסה עם גוגל — דורשת הגדרת GOOGLE_CLIENT_ID בקובץ config.php
    $cfg = @include __DIR__ . '/config.php';
    $clientId = is_array($cfg) ? ($cfg['GOOGLE_CLIENT_ID'] ?? '') : '';
    if ($clientId === '') json_err('כניסת גוגל עדיין לא הופעלה באתר זה');
    $b = body();
    $idToken = (string)($b['idToken'] ?? '');
    if ($idToken === '') json_err('חסר טוקן');
    $info = @file_get_contents('https://oauth2.googleapis.com/tokeninfo?id_token=' . urlencode($idToken));
    $data = json_decode((string)$info, true);
    if (!is_array($data) || ($data['aud'] ?? '') !== $clientId || empty($data['sub']) || empty($data['email'])) {
        json_err('אימות גוגל נכשל', 401);
    }
    $db = db();
    $st = $db->prepare('SELECT id, name FROM teachers WHERE google_sub = ? OR email = ?');
    $st->execute([$data['sub'], strtolower($data['email'])]);
    $t = $st->fetch(PDO::FETCH_ASSOC);
    if ($t) {
        $db->prepare('UPDATE teachers SET google_sub = ? WHERE id = ?')->execute([$data['sub'], $t['id']]);
        json_out(['token' => make_token('t', (int)$t['id']), 'name' => $t['name'], 'email' => strtolower($data['email'])]);
    }
    $name = trim((string)($data['name'] ?? $data['email']));
    $ins = $db->prepare('INSERT INTO teachers (name, email, google_sub) VALUES (?, ?, ?)');
    $ins->execute([$name, strtolower($data['email']), $data['sub']]);
    json_out(['token' => make_token('t', (int)$db->lastInsertId()), 'name' => $name, 'email' => strtolower($data['email'])]);
}

case 'classes': {
    $tid = require_teacher();
    $db = db();
    $st = $db->prepare('SELECT c.id, c.name, c.code, c.free_nav,
            (SELECT COUNT(*) FROM students s WHERE s.class_id = c.id) AS students
        FROM classes c WHERE c.teacher_id = ? ORDER BY c.id DESC');
    $st->execute([$tid]);
    $rows = array_map(fn($r) => [
        'id' => (int)$r['id'],
        'name' => $r['name'],
        'code' => $r['code'],
        'freeNav' => (bool)$r['free_nav'],
        'students' => (int)$r['students'],
    ], $st->fetchAll(PDO::FETCH_ASSOC));
    json_out(['classes' => $rows]);
}

case 'set_free': {
    $tid = require_teacher();
    $b = body();
    $classId = (int)($b['classId'] ?? 0);
    $free = !empty($b['free']) ? 1 : 0;
    $db = db();
    $st = $db->prepare('UPDATE classes SET free_nav = ? WHERE id = ? AND teacher_id = ?');
    $st->execute([$free, $classId, $tid]);
    if ($st->rowCount() === 0) json_err('כיתה לא נמצאה', 404);
    json_out(['ok' => true, 'freeNav' => (bool)$free]);
}

case 'create_class': {
    $tid = require_teacher();
    $b = body();
    $name = trim((string)($b['name'] ?? ''));
    if ($name === '') json_err('חסר שם כיתה');
    $db = db();
    $code = gen_code($db);
    $ins = $db->prepare('INSERT INTO classes (teacher_id, name, code) VALUES (?, ?, ?)');
    $ins->execute([$tid, $name, $code]);
    json_out([
        'id' => (int)$db->lastInsertId(),
        'name' => $name,
        'code' => $code,
        'freeNav' => false,
        'students' => 0,
    ]);
}

case 'heatmap': {
    $tid = require_teacher();
    $classId = (int)($_GET['class'] ?? 0);
    $db = db();
    $st = $db->prepare('SELECT id FROM classes WHERE id = ? AND teacher_id = ?');
    $st->execute([$classId, $tid]);
    if (!$st->fetch()) json_err('כיתה לא נמצאה', 404);

    $st = $db->prepare('SELECT id, nickname, emoji, last_seen FROM students WHERE class_id = ? ORDER BY nickname');
    $st->execute([$classId]);
    $students = $st->fetchAll(PDO::FETCH_ASSOC);

    $out = [];
    foreach ($students as $s) {
        $sid = (int)$s['id'];
        $ls = $db->prepare('SELECT letter, correct, wrong FROM letter_stats WHERE student_id = ?');
        $ls->execute([$sid]);
        $letters = [];
        foreach ($ls->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $letters[$row['letter']] = ['c' => (int)$row['correct'], 'w' => (int)$row['wrong']];
        }
        $ac = $db->prepare('SELECT COUNT(DISTINCT activity_id) AS n FROM attempts WHERE student_id = ?');
        $ac->execute([$sid]);
        $out[] = [
            'id' => $sid,
            'nickname' => $s['nickname'],
            'emoji' => $s['emoji'],
            'lastSeen' => $s['last_seen'],
            'activitiesDone' => (int)$ac->fetch(PDO::FETCH_ASSOC)['n'],
            'letters' => $letters ?: new stdClass(),
        ];
    }
    json_out(['students' => $out]);
}

default:
    json_err('פעולה לא מוכרת', 404);
}
