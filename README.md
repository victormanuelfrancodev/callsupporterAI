# CallSupporter AI

Multi-tenant platform for AI support agents. Each client (workspace) gets its own ElevenLabs agent, a Jev classification it can configure, and a dashboard for its CX team. Journey Japan is the first client.

## Quick start (demo mode)

```bash
cd dashboard
npm install
npm run dev        # http://localhost:3000
```

With no environment variables it runs in **demo mode**: two sample workspaces (Journey Japan and Tienda Kumo), no sign-in, in-memory data.

## Production

1. Create a Supabase project and run [`supabase/schema.sql`](supabase/schema.sql).
2. Copy `dashboard/.env.example` to `.env.local` and fill in the Supabase keys, `TYPESAFE_API_KEY` and `APP_URL`.
3. In Supabase → Auth → URL Configuration, add `APP_URL/auth/callback` to the redirect URLs.
4. Create your user (Auth → Users → Invite) and make yourself an admin:
   ```sql
   insert into platform_admins (user_id) select id from auth.users where email = 'you@email.com';
   ```
5. Open `/admin` and onboard each client from a template.

## ElevenLabs accounts

Two models, mixable per client:

- **Your platform account** (default): every client gets its own agent inside your ElevenLabs account. Set `ELEVENLABS_API_KEY` and `ELEVENLABS_WEBHOOK_SECRET` once; one shared post-call webhook (`/api/webhooks/elevenlabs`) routes each call to its workspace by `agent_id`. You pay ElevenLabs and bill clients for usage.
- **Client-owned account**: paste the client's API key in Settings → Connection. They pay ElevenLabs directly; their webhook uses the per-workspace URL and secret.

## Connecting a client's agent

In each workspace's **Settings → Connection**:

1. Paste the ElevenLabs **Agent ID**.
2. Create the **post-call webhook** in ElevenLabs with the URL and HMAC secret shown there.
3. Add the **tools** to the agent by copying their JSON (`get_order`, `check_status`, `decide_next_step`, `escalate_to_human`).
4. Write the client's FAQ in **Settings → Knowledge** and press **Sync to ElevenLabs** (pushes the system prompt, greeting and knowledge to the agent).
5. Try it from **Test agent**.

## Architecture

```
Customer ──▶ ElevenLabs Agent (Claude Haiku 4.5)
               │ tools (Bearer token per workspace)
               ▼
        /api/agents/:ws/tools/:tool ──▶ client's orders API
                                    ──▶ incident feed
                                    ──▶ Jev (decide_next_step)
                                    ──▶ Slack (escalate_to_human)
               │ post-call webhook (HMAC)
               ▼
        /api/webhooks/elevenlabs/:ws ──▶ Jev (classification) ──▶ Supabase ──▶ Dashboard
```

Everything runs inside Next.js; no n8n needed.

| Folder | Contents |
|---|---|
| `dashboard/src/app/w/[slug]` | Per-workspace dashboard: Inbox, Escalations, Metrics, Quality, Test agent, Settings |
| `dashboard/src/app/admin` | Client onboarding and list |
| `dashboard/src/app/api` | Agent tools and post-call webhook |
| `dashboard/src/lib/jev.ts` | Jev questions generated from the workspace config |
| `dashboard/src/lib/store` | Data access: Supabase or in-memory (demo) |
| `dashboard/src/lib/templates.ts` | Industry templates |
