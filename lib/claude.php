<?php
/**
 * MADARI — Claude (Anthropic API) WhatsApp assistant.
 * One call per incoming message: writes the reply and classifies the intent.
 */
declare(strict_types=1);

use Anthropic\Client;
use Anthropic\Core\Exceptions\APIStatusException;
use Anthropic\Core\Exceptions\AuthenticationException;
use Anthropic\Core\Exceptions\RateLimitException;

const MADARI_INTENTS = ['purchase', 'inquiry', 'complaint', 'other'];

function madari_system_prompt(): string
{
    return <<<'TXT'
You are the WhatsApp assistant of MADARI (مداري) – International Business Linkage, a division of Abdulrahman Al-Ghamdi Public Relations Est. in Saudi Arabia. Website: www.madari.com.sa. Email: info@madari.com.sa. Phone/WhatsApp: +966 56 556 3222.

What MADARI does (only describe these; never invent others):
- Foreign companies entering the Saudi market: market entry guidance, finding Saudi partners, distributors and agents, qualified B2B meetings, representation and business development.
- Saudi companies expanding abroad: international outreach and finding partners in target markets.
- Exhibitions and conferences: B2B linkage around events, pre-arranged meetings with relevant visitors and exhibitors.
- Trade public relations.
- Interactive experiences for events and exhibition booths: interactive screens, kiosks, games and quizzes.
- Packages: Basic Business Linkage, Outreach & Meetings, Saudi Market Entry, Representation & Business Development, and a custom quote. Prices are given only by the team in a custom proposal.

How to reply:
- Reply in the customer's language. For Arabic, use clear, warm, professional Arabic that suits Saudi business customers.
- This is WhatsApp: keep replies short (2-5 lines), friendly and natural. No markdown headings or tables. At most one emoji, only if the customer uses them.
- Understand the need, then ask one or two helpful questions at a time (company name, country, sector, target market, timeline, or which service fits).
- Never invent prices, clients, case studies, numbers, results or deadlines. Never promise guaranteed outcomes or say MADARI is "the best" or "#1".
- For prices, contracts, a meeting request, or anything you cannot answer from the facts above, say a MADARI team member will follow up, and set handoff to true.
- If the customer is unhappy or complaining, apologise sincerely, acknowledge the issue, say the team will contact them personally, and set handoff to true.
- If the customer asks for a human, set handoff to true.
- Messages in brackets such as [voice note] or [image] are attachments you cannot see; politely ask the customer to write the details as text.

Classify the customer's latest message with intent:
- purchase: wants to buy, start a service, get a quote or proposal, or book.
- inquiry: asking questions or exploring.
- complaint: unhappy, reporting a problem, or complaining.
- other: greetings, thanks, spam or anything else.
Also write summary: one short line in Arabic about who the customer is and what they need so far, for the MADARI team dashboard.
TXT;
}

function madari_reply_schema(): array
{
    return [
        'type' => 'json_schema',
        'schema' => [
            'type' => 'object',
            'properties' => [
                'reply'   => ['type' => 'string', 'description' => 'The WhatsApp message to send to the customer'],
                'intent'  => ['type' => 'string', 'enum' => MADARI_INTENTS],
                'handoff' => ['type' => 'boolean', 'description' => 'True when a human from the MADARI team must follow up'],
                'summary' => ['type' => 'string', 'description' => 'One short Arabic line for the team dashboard'],
            ],
            'required' => ['reply', 'intent', 'handoff', 'summary'],
            'additionalProperties' => false,
        ],
    ];
}

/**
 * Turns stored messages (oldest first) into a valid Messages API history:
 * customer → user, Claude/staff → assistant, same-role turns merged,
 * starting with a user turn.
 */
function madari_history(array $rows): array
{
    $out = [];
    foreach ($rows as $r) {
        $role = ($r['direction'] ?? '') === 'in' ? 'user' : 'assistant';
        $text = trim((string) ($r['body'] ?? ''));
        if ($text === '') {
            continue;
        }
        if (!$out && $role === 'assistant') {
            continue;
        }
        $last = count($out) - 1;
        if ($last >= 0 && $out[$last]['role'] === $role) {
            $out[$last]['content'] .= "\n" . $text;
        } else {
            $out[] = ['role' => $role, 'content' => $text];
        }
    }
    return $out;
}

/**
 * @return array{ok: bool, reply: string, intent: string, handoff: bool, summary: string, error?: string}
 */
function madari_ai_reply(array $history, array $contact): array
{
    $isArabic = (bool) preg_match('/\p{Arabic}/u', (string) end($history)['content']);
    $fallback = [
        'ok'      => false,
        'reply'   => $isArabic
            ? 'شكراً لتواصلك مع مداري. استلمنا رسالتك وسيتواصل معك أحد أعضاء فريقنا قريباً.'
            : 'Thank you for contacting MADARI. We have received your message and a member of our team will get back to you shortly.',
        'intent'  => 'other',
        'handoff' => true,
        'summary' => '',
    ];

    if (!class_exists(Client::class) || (string) cfg('anthropic_api_key') === '') {
        return $fallback + ['error' => 'Anthropic SDK or API key missing'];
    }

    $context = "Customer WhatsApp name: " . ($contact['name'] ?: 'unknown')
        . "\nCame from: " . ($contact['source'] === 'website' ? 'the MADARI website' . ($contact['source_page'] ? ' (' . $contact['source_page'] . ')' : '') : 'WhatsApp directly');

    try {
        $client = new Client(apiKey: (string) cfg('anthropic_api_key'));
        $message = $client->beta->messages->create(
            model: (string) cfg('claude_model', 'claude-opus-5-5'),
            maxTokens: 4000,
            system: madari_system_prompt() . "\n\n" . $context,
            messages: $history,
            outputConfig: [
                'effort' => (string) cfg('claude_effort', 'low'),
                'format' => madari_reply_schema(),
            ],
            fallbacks: 'default',
            betas: ['server-side-fallback-2026-07-01'],
        );
    } catch (AuthenticationException $e) {
        return $fallback + ['error' => 'Anthropic API key rejected'];
    } catch (RateLimitException $e) {
        return $fallback + ['error' => 'Anthropic rate limit'];
    } catch (APIStatusException $e) {
        return $fallback + ['error' => 'Anthropic API error: ' . ($e->type?->value ?? $e->getMessage())];
    } catch (\Throwable $e) {
        return $fallback + ['error' => 'Anthropic call failed: ' . $e->getMessage()];
    }

    if ($message->stopReason === 'refusal') {
        return $fallback + ['error' => 'refusal'];
    }

    foreach ($message->content as $block) {
        if ($block->type !== 'text') {
            continue;
        }
        $data = json_decode($block->text, true);
        if (is_array($data) && trim((string) ($data['reply'] ?? '')) !== '') {
            return [
                'ok'      => true,
                'reply'   => trim((string) $data['reply']),
                'intent'  => in_array($data['intent'] ?? '', MADARI_INTENTS, true) ? $data['intent'] : 'other',
                'handoff' => (bool) ($data['handoff'] ?? false),
                'summary' => trim((string) ($data['summary'] ?? '')),
            ];
        }
    }

    return $fallback + ['error' => 'unparseable response (stop: ' . $message->stopReason . ')'];
}
