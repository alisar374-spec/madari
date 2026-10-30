<?php
/**
 * MADARI — WhatsApp Cloud API (Meta Graph API) helpers.
 */
declare(strict_types=1);

/** Checks the X-Hub-Signature-256 header Meta adds to every webhook POST. */
function wa_signature_valid(string $rawBody, string $header): bool
{
    $secret = (string) cfg('wa_app_secret');
    if ($secret === '' || strpos($header, 'sha256=') !== 0) {
        return false;
    }
    return hash_equals('sha256=' . hash_hmac('sha256', $rawBody, $secret), $header);
}

function wa_graph(string $path, array $payload): array
{
    $url = 'https://graph.facebook.com/' . cfg('wa_graph_version', 'v23.0') . '/' . cfg('wa_phone_number_id') . '/' . $path;
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => [
            'Authorization: Bearer ' . cfg('wa_access_token'),
            'Content-Type: application/json',
        ],
        CURLOPT_POSTFIELDS     => json_encode($payload, JSON_UNESCAPED_UNICODE),
        CURLOPT_TIMEOUT        => 15,
    ]);
    $raw = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    $data = is_string($raw) ? json_decode($raw, true) : null;
    if ($status >= 400 || !is_array($data)) {
        madari_log("whatsapp $path HTTP $status: " . substr((string) $raw, 0, 500));
    }
    return ['status' => $status, 'data' => $data];
}

/** Sends a text reply. Returns the WhatsApp message id, or null on failure. */
function wa_send_text(string $to, string $text): ?string
{
    $r = wa_graph('messages', [
        'messaging_product' => 'whatsapp',
        'recipient_type'    => 'individual',
        'to'                => $to,
        'type'              => 'text',
        'text'              => ['preview_url' => false, 'body' => mb_substr($text, 0, 4000)],
    ]);
    return $r['data']['messages'][0]['id'] ?? null;
}

/** Blue ticks on the customer's message. */
function wa_mark_read(string $messageId): void
{
    wa_graph('messages', [
        'messaging_product' => 'whatsapp',
        'status'            => 'read',
        'message_id'        => $messageId,
    ]);
}

/** Turns any incoming message type into text we can store and show to Claude. */
function wa_message_text(array $m): string
{
    switch ($m['type'] ?? '') {
        case 'text':
            return (string) ($m['text']['body'] ?? '');
        case 'button':
            return (string) ($m['button']['text'] ?? '');
        case 'interactive':
            return (string) ($m['interactive']['button_reply']['title'] ?? $m['interactive']['list_reply']['title'] ?? '');
        case 'image':
        case 'video':
        case 'document':
            $caption = (string) ($m[$m['type']]['caption'] ?? '');
            return '[' . $m['type'] . ']' . ($caption !== '' ? ' ' . $caption : '');
        case 'audio':
            return '[voice note]';
        case 'location':
            return '[location]';
        default:
            return '[' . ($m['type'] ?? 'unknown') . ']';
    }
}
