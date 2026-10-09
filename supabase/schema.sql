-- CallSupporter AI · multi-tenant schema.
-- The Next.js server uses the service role key and authorizes in code
-- (lib/auth.ts); RLS is enabled with no policies so the anon key gets nothing.

create extension if not exists pgcrypto;

-- Platform admins (you). Add your user_id after your first sign-in:
--   insert into platform_admins (user_id) select id from auth.users where email = 'you@email.com';
create table if not exists platform_admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

create table if not exists workspaces (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name           text not null,
  industry       text not null default 'General',
  color          text not null default 'brand',
  created_at     timestamptz not null default now(),
  -- { agent, classification: { topics, fields }, escalation, integrations }  (see lib/types.ts → WorkspaceConfig)
  config         jsonb not null,
  tool_secret    text not null,   -- Bearer token ElevenLabs sends to /api/agents/:id/tools/*
  webhook_secret text not null    -- HMAC secret for the post-call webhook
);

create table if not exists workspace_members (
  workspace_id uuid not null references workspaces (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  email        text not null,
  role         text not null default 'member' check (role in ('owner', 'member')),
  invited_at   timestamptz not null default now(),
  primary key (workspace_id, user_id)
);
create index if not exists workspace_members_user_idx on workspace_members (user_id);

create table if not exists conversations (
  workspace_id   uuid not null references workspaces (id) on delete cascade,
  id             text not null,                 -- ElevenLabs conversation_id
  customer       jsonb not null default '{"name":"Customer","email":"","language":"—"}',
  channel        text not null default 'voice' check (channel in ('chat', 'voice')),
  started_at     timestamptz not null default now(),
  duration_sec   integer not null default 0,
  summary        text not null default '',
  messages       jsonb not null default '[]',   -- [{ id, role, text, at, tool? }]
  record         jsonb,                         -- { reference, status?, fields[] }  (no payment data)
  decisions      jsonb not null default '[]',   -- live Jev decisions
  classification jsonb,                         -- { topic, resolved, sentiment, agentIssue, fields } as { value, p }
  escalation     jsonb,                         -- { reason, urgency, status, createdAt, assignee? }
  primary key (workspace_id, id)
);
create index if not exists conversations_ws_started_idx on conversations (workspace_id, started_at desc);

alter table platform_admins   enable row level security;
alter table workspaces        enable row level security;
alter table workspace_members enable row level security;
alter table conversations     enable row level security;
