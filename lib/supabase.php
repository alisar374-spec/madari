<?php
/**
 * MADARI — minimal Supabase (PostgREST) client using the service_role key.
 * Tables are defined in supabase/schema.sql.
 */
declare(strict_types=1);

function sb_request(string $method, string $path, ?array $body = null, array $headers = []): array
{
    $url = rtrim((string) cfg('supabase_url'), '/') . '/rest/v1/' . ltrim($path, '/');
    $key = (string) cfg('supabase_service_key');
    $h = array_merge([
        'apikey: ' . $key,
        'Authorization: Bearer ' . $key,
        'Content-Type: application/json',
        'Accept: application/json',
    ], $headers);

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST  => $method,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => $h,
        CURLOPT_TIMEOUT        => 15,
    ]);
    if ($body !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body, JSON_UNESCAPED_UNICODE));
    }
    $raw = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);

    if ($raw === false) {
        madari_log("supabase $method $path curl error: $err");
        return ['status' => 0, 'data' => null];
    }
    if ($status >= 400 && $status !== 409) {
        madari_log("supabase $method $path HTTP $status: " . substr((string) $raw, 0, 500));
    }
    return ['status' => $status, 'data' => $raw === '' ? null : json_decode((string) $raw, true)];
}

function sb_select(string $table, string $query): array
{
    $r = sb_request('GET', $table . '?' . $query);
    return is_array($r['data']) ? $r['data'] : [];
}

function sb_insert(string $table, array $row): ?array
{
    $r = sb_request('POST', $table, $row, ['Prefer: return=representation']);
    return ($r['status'] >= 200 && $r['status'] < 300 && isset($r['data'][0])) ? $r['data'][0] : null;
}

function sb_update(string $table, string $filter, array $fields): bool
{
    $r = sb_request('PATCH', $table . '?' . $filter, $fields, ['Prefer: return=minimal']);
    return $r['status'] >= 200 && $r['status'] < 300;
}

/** Returns the contact row for a WhatsApp ID, creating it on first contact. */
function sb_contact(string $waId, string $name, string $source, string $sourcePage): ?array
{
    $rows = sb_select('contacts', 'wa_id=eq.' . rawurlencode($waId) . '&limit=1');
    if ($rows) {
        $c = $rows[0];
        $patch = ['last_message_at' => gmdate('c')];
        if ($name !== '' && $name !== ($c['name'] ?? '')) {
            $patch['name'] = $name;
        }
        if (($c['status'] ?? '') === 'closed') {
            $patch['status'] = 'open';   // customer came back
        }
        sb_update('contacts', 'id=eq.' . $c['id'], $patch);
        return array_merge($c, $patch);
    }
    return sb_insert('contacts', [
        'wa_id'           => $waId,
        'name'            => $name,
        'source'          => $source,
        'source_page'     => $sourcePage,
        'status'          => 'new',
        'last_message_at' => gmdate('c'),
    ]);
}
