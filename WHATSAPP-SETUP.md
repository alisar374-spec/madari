# MADARI — WhatsApp + Claude + Supabase setup

Flow: customer messages the MADARI WhatsApp number → Meta calls
`POST https://madari.com.sa/api/whatsapp/webhook` → message saved in Supabase →
Claude writes the reply and classifies the intent (purchase / inquiry / complaint / other)
→ reply sent on WhatsApp → everything visible at `https://madari.com.sa/admin/`.

Website WhatsApp buttons pre-fill a message ending in `(madari.com.sa/<page>)`, so
those chats are tagged **source = website** with the page they came from.
Website form requests (send.php) are also saved to the `leads` table.

## Files

| Path | Purpose |
|---|---|
| `api/whatsapp/webhook.php` | Webhook (GET verify + POST messages) |
| `lib/claude.php` | Claude call, system prompt, intent schema |
| `lib/supabase.php` | Supabase REST helpers |
| `lib/whatsapp.php` | WhatsApp Cloud API send / signature check |
| `lib/config.sample.php` | Template for the private config |
| `admin/index.php` | Dashboard |
| `supabase/schema.sql` | Tables |

## 1. Supabase
1. Create a project at supabase.com.
2. SQL Editor → paste `supabase/schema.sql` → Run.
3. Project settings → API: copy the Project URL and the `service_role` key.

## 2. WhatsApp Cloud API (Meta)
1. developers.facebook.com → Create app → Business → add **WhatsApp**.
2. Add the business phone number (it must be registered on the Cloud API).
3. Business settings → System users → create one → generate a **permanent token**
   with `whatsapp_business_messaging` + `whatsapp_business_management`.
4. Copy **Phone number ID** and **App secret** (App settings → Basic).

## 3. Server (Hostinger, via SSH)
```bash
cd ~/domains/madari.com.sa
mkdir -p madari-private && cd madari-private
composer require anthropic-ai/sdk
cp ../public_html/lib/config.sample.php config.php
nano config.php        # fill in every value
chmod 600 config.php
php -r "echo password_hash('CHOOSE-A-STRONG-PASSWORD', PASSWORD_DEFAULT), PHP_EOL;"   # paste into admin_password_hash
```
`madari-private` sits next to `public_html`, so it is never web-accessible and git
deployments do not touch it. PHP 8.1+ is required (hPanel → PHP Configuration).

## 4. Connect the webhook
Meta app → WhatsApp → Configuration → Webhook:
- Callback URL: `https://madari.com.sa/api/whatsapp/webhook`
- Verify token: the same `wa_verify_token` from config.php
- Subscribe to the **messages** field.

## 5. Test
Send a WhatsApp message to the number → reply arrives → open `/admin/`.
Errors are logged in `madari-private/logs/backend-YYYY-MM.log`.
