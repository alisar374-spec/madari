<?php
/**
 * MADARI — shared bootstrap for the WhatsApp / Claude / Supabase backend.
 *
 * Secrets never live in the repository. They are read from
 *   <parent of public_html>/madari-private/config.php
 * (see lib/config.sample.php), and the Anthropic SDK is installed with
 * Composer in that same private folder.
 */
declare(strict_types=1);

if (!defined('MADARI_PRIVATE')) {
    define('MADARI_PRIVATE', dirname(__DIR__, 2) . '/madari-private');
}

function cfg(string $key, $default = null)
{
    static $config = null;
    if ($config === null) {
        $file = MADARI_PRIVATE . '/config.php';
        $config = is_file($file) ? (array) require $file : [];
    }
    if (array_key_exists($key, $config) && $config[$key] !== '') {
        return $config[$key];
    }
    $env = getenv('MADARI_' . strtoupper($key));
    return $env !== false && $env !== '' ? $env : $default;
}

function madari_log(string $msg): void
{
    $dir = MADARI_PRIVATE . '/logs';
    if (!is_dir($dir)) {
        @mkdir($dir, 0700, true);
    }
    @file_put_contents($dir . '/backend-' . gmdate('Y-m') . '.log', gmdate('c') . ' ' . $msg . "\n", FILE_APPEND);
}

$autoload = MADARI_PRIVATE . '/vendor/autoload.php';
if (is_file($autoload)) {
    require_once $autoload;
}

require_once __DIR__ . '/supabase.php';
require_once __DIR__ . '/whatsapp.php';
require_once __DIR__ . '/claude.php';
