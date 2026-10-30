-- MADARI — Supabase schema for WhatsApp + Claude + website leads.
-- Run once in Supabase → SQL Editor → New query → Run.

create table if not exists public.contacts (
  id               bigint generated always as identity primary key,
  wa_id            text not null unique,                 -- customer's WhatsApp number (e.g. 9665xxxxxxxx)
  name             text,
  source           text not null default 'whatsapp',     -- 'website' when the chat started from a site button
  source_page      text,
  status           text not null default 'new'
                   check (status in ('new', 'open', 'needs_human', 'closed')),
  intent           text check (intent in ('purchase', 'inquiry', 'complaint', 'other')),
  summary          text,                                 -- Claude's one-line summary for the team
  last_message     text,
  last_reply       text,
  ai_enabled       boolean not null default true,        -- false = human takeover, Claude stays silent
  first_seen_at    timestamptz not null default now(),
  last_message_at  timestamptz not null default now()
);

create table if not exists public.messages (
  id             bigint generated always as identity primary key,
  contact_id     bigint not null references public.contacts(id) on delete cascade,
  wa_message_id  text unique,                            -- dedupes Meta webhook retries
  direction      text not null check (direction in ('in', 'out')),
  author         text not null check (author in ('customer', 'claude', 'staff')),
  body           text,
  intent         text,
  meta           jsonb,
  created_at     timestamptz not null default now()
);
create index if not exists messages_contact_idx on public.messages (contact_id, created_at desc);

create table if not exists public.leads (
  id          bigint generated always as identity primary key,
  form        text,
  name        text,
  company     text,
  email       text,
  phone       text,
  country     text,
  service     text,
  page        text,
  lang        text,
  details     jsonb,
  created_at  timestamptz not null default now()
);

-- Lock everything down: no public (anon) access. The PHP backend uses the
-- service_role key, which bypasses RLS.
alter table public.contacts enable row level security;
alter table public.messages enable row level security;
alter table public.leads    enable row level security;
