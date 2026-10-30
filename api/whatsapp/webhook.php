<?php
/**
 * MADARI — WhatsApp Cloud API webhook.
 *   GET  /api/whatsapp/webhook  → Meta verification handshake
 *   POST /api/whatsapp/webhook  → incoming messages → Supabase → Claude → WhatsApp reply
 */
declare(strict_types=1);

require __DIR__ . '/../../lib/bootstrap.php';

// --- 1. Verification handshake (done once when you save the webhook in Meta) ---
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $token = (string) cfg('wa_verify_token');
    if (($_GET['hub_mode'] ?? '') === 'subscribe' && $token !== '' && hash_equals($token, (string) ($_GET['hub_verify_token'] ?? ''))) {
        header('Content-Type: text/plain');
        echo (string) ($_GET['hub_challenge'] ?? '');
    } else {
        http_response_code(403);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit;
}

// --- 2. Only accept payloads signed by Meta ---
$raw = (string) file_get_contents('php://input');
if (!wa_signature_valid($raw, (string) ($_SERVER['HTTP_X_HUB_SIGNATURE_256'] ?? ''))) {
    madari_log('webhook: bad signature');
    http_response_code(401);
    exit;
}

// --- 3. Acknowledge immediately; Meta retries if we take too long ---
http_response_code(200);
header('Content-Type: application/json');
echo '{"ok":true}';
ignore_user_abort(true);
set_time_limit(120);
if (function_exists('litespeed_finish_request')) {
    litespeed_finish_request();
} elseif (function_exists('fastcgi_finish_request')) {
    fastcgi_finish_request();
} else {
    @ob_end_flush();
    flush();
}

// --- 4. Process every message in the payload ---
$payload = json_decode($raw, true);
foreach (($payload['entry'] ?? []) as $entry) {
    foreach (($entry['changes'] ?? []) as $change) {
        $value = $change['value'] ?? [];
        $names = [];
        foreach (($value['contacts'] ?? []) as $c) {
            $names[$c['wa_id'] ?? ''] = (string) ($c['profile']['name'] ?? '');
        }
        foreach (($value['messages'] ?? []) as $m) {
            try {
                madari_handle_message($m, $names[$m['from'] ?? ''] ?? '');
            } catch (\Throwable $e) {
                madari_log('webhook: ' . $e->getMessage());
            }
        }
        // $value['statuses'] (sent / delivered / read receipts) are ignored.
    }
}

function madari_handle_message(array $m, string $name): void
{
    $waId = (string) ($m['from'] ?? '');
    $msgId = (string) ($m['id'] ?? '');
    $text = trim(wa_message_text($m));
    if ($waId === '' || $msgId === '') {
        return;
    }

    // Messages sent from the website buttons carry "madari.com.sa" (see assets/js/main.js).
    $source = 'whatsapp';
    $page = '';
    if (stripos($text, 'madari.com.sa') !== false) {
        $source = 'website';
        if (preg_match('~madari\.com\.sa(/[^\s)]*)?~i', $text, $mm)) {
            $page = $mm[1] ?? '/';
        }
    }

    $contact = sb_contact($waId, $name, $source, $page);
    if (!$contact) {
        return;
    }

    // Unique wa_message_id: a retried webhook fails here and is skipped.
    $in = sb_insert('messages', [
        'contact_id'    => $contact['id'],
        'wa_message_id' => $msgId,
        'direction'     => 'in',
        'author'        => 'customer',
        'body'          => $text,
    ]);
    if (!$in) {
        return;
    }
    wa_mark_read($msgId);

    // Human takeover: the team switched Claude off for this customer in /admin.
    if (empty($contact['ai_enabled'])) {
        sb_update('contacts', 'id=eq.' . $contact['id'], [
            'last_message' => mb_substr($text, 0, 500),
            'status'       => 'needs_human',
        ]);
        return;
    }

    $rows = sb_select('messages', 'contact_id=eq.' . $contact['id'] . '&select=direction,body&order=created_at.desc&limit=30');
    $history = madari_history(array_reverse($rows));
    if (!$history || end($history)['role'] !== 'user') {
        return;
    }

    $ai = madari_ai_reply($history, $contact);
    if (!$ai['ok']) {
        madari_log('claude: ' . ($ai['error'] ?? 'failed') . ' for contact ' . $contact['id']);
    }

    $outId = wa_send_text($waId, $ai['reply']);

    sb_update('messages', 'id=eq.' . $in['id'], ['intent' => $ai['intent']]);
    sb_insert('messages', [
        'contact_id'    => $contact['id'],
        'wa_message_id' => $outId,
        'direction'     => 'out',
        'author'        => 'claude',
        'body'          => $ai['reply'],
        'meta'          => ['ok' => $ai['ok'], 'handoff' => $ai['handoff'], 'sent' => $outId !== null, 'error' => $ai['error'] ?? null],
    ]);

    $fields = [
        'intent'       => $ai['intent'],
        'last_message' => mb_substr($text, 0, 500),
        'last_reply'   => mb_substr($ai['reply'], 0, 500),
        'status'       => ($ai['handoff'] || $ai['intent'] === 'complaint') ? 'needs_human' : 'open',
    ];
    if ($ai['summary'] !== '') {
        $fields['summary'] = $ai['summary'];
    }
    // Keep a complaint or handoff flagged until the team clears it in /admin.
    if (($contact['status'] ?? '') === 'needs_human') {
        $fields['status'] = 'needs_human';
    }
    sb_update('contacts', 'id=eq.' . $contact['id'], $fields);
}
