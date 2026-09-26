<?php
/**
 * MADARI — service request handler.
 * Receives the website forms (POST) and emails them to the team.
 * Change $to / $from below if the mailbox changes.
 */
header('Content-Type: application/json; charset=utf-8');

$to   = 'info@madari.com.sa';
$from = 'no-reply@madari.com.sa';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method']);
    exit;
}

// Honeypot: bots fill the hidden "website" field.
if (!empty($_POST['website'])) {
    echo json_encode(['ok' => true]);
    exit;
}

function field($key, $max = 2000) {
    $v = isset($_POST[$key]) ? trim((string) $_POST[$key]) : '';
    $v = str_replace(["\r", "\0"], '', $v);
    return mb_substr($v, 0, $max);
}

$data = [
    'Name / الاسم'               => field('name', 200),
    'Company / الشركة'           => field('company', 200),
    'Country / الدولة'           => field('country', 120),
    'Email / البريد'             => field('email', 200),
    'Phone / الهاتف'             => field('phone', 60),
    'Sector / القطاع'            => field('sector', 200),
    'Service / الخدمة'           => field('service', 120),
    'Package / الباقة'           => field('package', 120),
    'Target market / السوق'      => field('target_market', 300),
    'Partner type / نوع الشريك'  => field('partner_type', 300),
    'Budget / الميزانية'         => field('budget', 120),
    'Timeline / المدة'           => field('timeline', 120),
    'Source / المصدر'            => field('source', 120),
    'Requirement / الاحتياج'     => field('description', 5000),
    'Form'                       => field('form', 60),
    'Language'                   => field('lang', 5),
    'Page'                       => field('page', 200),
];

$email = $data['Email / البريد'];
if ($data['Name / الاسم'] === '' || $data['Company / الشركة'] === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || $data['Requirement / الاحتياج'] === '') {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'validation']);
    exit;
}

$lines = [];
foreach ($data as $label => $value) {
    if ($value !== '') {
        $lines[] = $label . ': ' . $value;
    }
}
$lines[] = 'Received: ' . gmdate('Y-m-d H:i') . ' UTC';
$body = implode("\n", $lines);

$subject = 'MADARI — طلب خدمة جديد / New request: ' . $data['Company / الشركة'];
$encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';

$headers  = "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
$headers .= "From: MADARI Website <{$from}>\r\n";
$headers .= "Reply-To: {$email}\r\n";

$sent = @mail($to, $encodedSubject, $body, $headers, '-f' . $from);

if (!$sent) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'mail']);
    exit;
}

echo json_encode(['ok' => true]);
