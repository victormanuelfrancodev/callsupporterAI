# CallSupporter AI

Plataforma multi-cliente de agentes de soporte con IA. Cada cliente (workspace) tiene su propio agente de ElevenLabs, su clasificación configurable con Jev y su dashboard para el equipo de CX. Journey Japan es el primer cliente.

## Arranque rápido (modo demo)

```bash
cd dashboard
npm install
npm run dev        # http://localhost:3000
```

Sin variables de entorno arranca en **modo demo**: dos workspaces de ejemplo (Journey Japan y Tienda Kumo), sin login, datos en memoria.

## Producción

1. Crea un proyecto en Supabase y ejecuta [`supabase/schema.sql`](supabase/schema.sql).
2. Copia `dashboard/.env.example` a `.env.local` y rellena las claves de Supabase, `TYPESAFE_API_KEY` y `APP_URL`.
3. En Supabase → Auth → URL Configuration, añade `APP_URL/auth/callback` a las redirect URLs.
4. Crea tu usuario (Auth → Users → Invite) y hazte admin:
   ```sql
   insert into platform_admins (user_id) select id from auth.users where email = 'tu@email.com';
   ```
5. Entra en `/admin` y da de alta cada cliente con una plantilla.

## Conectar el agente de un cliente

En **Ajustes → Conexión** de cada workspace:

1. Pega el **Agent ID** de ElevenLabs.
2. Crea el **webhook post-llamada** en ElevenLabs con la URL y el secreto HMAC que aparecen ahí.
3. Añade las **tools** al agente copiando su JSON (`get_order`, `check_status`, `decide_next_step`, `escalate_to_human`).
4. Copia el **system prompt** de Ajustes → Agente.
5. Prueba desde **Probar agente**.

## Arquitectura

```
Cliente ──▶ ElevenLabs Agent (Claude Haiku 4.5)
               │ tools (Bearer por workspace)
               ▼
        /api/agents/:ws/tools/:tool ──▶ API de pedidos del cliente
                                    ──▶ feed de incidencias
                                    ──▶ Jev (decide_next_step)
                                    ──▶ Slack (escalate_to_human)
               │ webhook post-llamada (HMAC)
               ▼
        /api/webhooks/elevenlabs/:ws ──▶ Jev (clasificación) ──▶ Supabase ──▶ Dashboard
```

Todo vive en Next.js: no hace falta n8n.

| Carpeta | Qué hay |
|---|---|
| `dashboard/src/app/w/[slug]` | Dashboard por workspace: Inbox, Escalaciones, Métricas, Calidad, Probar agente, Ajustes |
| `dashboard/src/app/admin` | Alta y listado de clientes |
| `dashboard/src/app/api` | Tools del agente y webhook post-llamada |
| `dashboard/src/lib/jev.ts` | Preguntas a Jev generadas desde la configuración del workspace |
| `dashboard/src/lib/store` | Acceso a datos: Supabase o memoria (demo) |
| `dashboard/src/lib/templates.ts` | Plantillas por industria |
