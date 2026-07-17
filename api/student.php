<?php
// נקודות קצה לתלמיד: הצטרפות בקוד, דיווח פעילות, שליפת התקדמות.

require __DIR__ . '/db.php';

$a = $_GET['a'] ?? '';

switch ($a) {

case 'join': {
    $b = body();
    $raw = preg_replace('/\s+/', '', trim((string)($b['code'] ?? '')));
    $code = strtoupper(is_string($raw) ? $raw : '');
    $nick = trim((string)($b['nickname'] ?? ''));
    $emoji = trim((string)($b['emoji'] ?? ''));
    if ($code === '' || $nick === '') json_err('חסר קוד כיתה או כינוי');
    if ($emoji === '') json_err('בחרו אימוג\'י — הוא הסיסמה הקטנה שלכם');
    if (mb_strlen($nick) > 30) json_err('הכינוי ארוך מדי');
    $db = db();
    $st = $db->prepare('SELECT id, name, free_nav FROM classes WHERE code = ?');
    $st->execute([$code]);
    $cls = $st->fetch(PDO::FETCH_ASSOC);
    if (!$cls) json_err('קוד הכיתה לא נמצא — בדקו עם המורה');

    $classId = (int)$cls['id'];
    // אם הכינוי כבר קיים בכיתה — כניסה חוזרת, בתנאי שהאימוג\'י תואם
    $st = $db->prepare('SELECT id, emoji FROM students WHERE class_id = ? AND nickname = ?');
    $st->execute([$classId, $nick]);
    $existing = $st->fetch(PDO::FETCH_ASSOC);
    if ($existing) {
        if ($existing['emoji'] !== '' && $existing['emoji'] !== $emoji) {
            json_err('השם הזה כבר קיים בכיתה עם אימוג\'י אחר. אם זה אתם — בחרו את האימוג\'י שבחרתם בפעם הראשונה, ואם לא — בחרו שם אחר', 409);
        }
        $sid = (int)$existing['id'];
        if ($existing['emoji'] === '') {
            $db->prepare('UPDATE students SET emoji = ? WHERE id = ?')->execute([$emoji, $sid]);
        }
    } else {
        $ins = $db->prepare('INSERT INTO students (class_id, nickname, emoji, last_seen) VALUES (?, ?, ?, datetime(\'now\'))');
        $ins->execute([$classId, $nick, $emoji]);
        $sid = (int)$db->lastInsertId();
    }
    json_out([
        'token' => make_token('s', $sid),
        'classId' => $classId,
        'className' => $cls['name'],
        'freeNav' => (bool)$cls['free_nav'],
    ]);
}

case 'attempt': {
    $sid = require_student();
    $b = body();
    $activityId = (string)($b['activityId'] ?? '');
    $unitId = (string)($b['unitId'] ?? '');
    $score = (int)($b['score'] ?? 0);
    $max = (int)($b['max'] ?? 0);
    $letters = $b['letters'] ?? [];
    if ($activityId === '' || $max <= 0) json_err('דיווח לא תקין');

    $db = db();
    $db->prepare('INSERT INTO attempts (student_id, activity_id, unit_id, score, max_score) VALUES (?, ?, ?, ?, ?)')
       ->execute([$sid, $activityId, $unitId, $score, $max]);

    if (is_array($letters)) {
        $up = $db->prepare('INSERT INTO letter_stats (student_id, letter, correct, wrong, updated_at)
            VALUES (?, ?, ?, ?, datetime(\'now\'))
            ON CONFLICT(student_id, letter) DO UPDATE SET
                correct = correct + excluded.correct,
                wrong = wrong + excluded.wrong,
                updated_at = datetime(\'now\')');
        foreach ($letters as $letter => $e) {
            if (!is_string($letter) || mb_strlen($letter) !== 1) continue;
            $c = max(0, min(200, (int)($e['c'] ?? 0)));
            $w = max(0, min(200, (int)($e['w'] ?? 0)));
            if ($c === 0 && $w === 0) continue;
            $up->execute([$sid, $letter, $c, $w]);
        }
    }
    $db->prepare('UPDATE students SET last_seen = datetime(\'now\') WHERE id = ?')->execute([$sid]);
    json_out(['ok' => true]);
}

case 'progress': {
    $sid = require_student();
    $db = db();
    $ls = $db->prepare('SELECT letter, correct, wrong FROM letter_stats WHERE student_id = ?');
    $ls->execute([$sid]);
    $letters = [];
    foreach ($ls->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $letters[$row['letter']] = ['c' => (int)$row['correct'], 'w' => (int)$row['wrong']];
    }
    // לכל פעילות — הניסיון הטוב ביותר
    $at = $db->prepare('SELECT activity_id, MAX(CAST(score AS REAL) / max_score) AS ratio,
            MAX(score) AS score, MAX(max_score) AS max
        FROM attempts WHERE student_id = ? GROUP BY activity_id');
    $at->execute([$sid]);
    $completed = [];
    foreach ($at->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $completed[$row['activity_id']] = ['score' => (int)$row['score'], 'max' => (int)$row['max']];
    }
    $db->prepare('UPDATE students SET last_seen = datetime(\'now\') WHERE id = ?')->execute([$sid]);
    $fn = $db->prepare('SELECT c.free_nav FROM classes c JOIN students s ON s.class_id = c.id WHERE s.id = ?');
    $fn->execute([$sid]);
    $freeNav = (bool)($fn->fetchColumn() ?: 0);
    json_out([
        'letters' => $letters ?: new stdClass(),
        'completed' => $completed ?: new stdClass(),
        'freeNav' => $freeNav,
    ]);
}

default:
    json_err('פעולה לא מוכרת', 404);
}
