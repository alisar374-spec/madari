<?php
/**
 * MADARI — private configuration (TEMPLATE).
 *
 * Copy this file to:  <parent of public_html>/madari-private/config.php
 * (on Hostinger: /home/<user>/domains/madari.com.sa/madari-private/config.php)
 * and fill in the real values there. NEVER commit the real file.
 */
return [
    // Anthropic (console.anthropic.com → API keys)
    'anthropic_api_key' => '',
    'claude_model'      => 'claude-opus-5-5',
    'claude_effort'     => 'low',          // low | medium | high

    // WhatsApp Cloud API (developers.facebook.com → your app → WhatsApp → API setup)
    'wa_phone_number_id' => '',            // "Phone number ID", not the phone number itself
    'wa_access_token'    => '',            // permanent System User token
    'wa_app_secret'      => '',            // App settings → Basic → App secret (signs webhooks)
    'wa_verify_token'    => '',            // any long random string; type the same in Meta's webhook form
    'wa_graph_version'   => 'v23.0',

    // Supabase (Project settings → API)
    'supabase_url'         => 'https://xxxxxxxx.supabase.co',
    'supabase_service_key' => '',          // service_role key — server only

    // /admin login — generate the hash with:  php -r "echo password_hash('YOUR-PASSWORD', PASSWORD_DEFAULT);"
    'admin_user'          => 'admin',
    'admin_password_hash' => '',
];
