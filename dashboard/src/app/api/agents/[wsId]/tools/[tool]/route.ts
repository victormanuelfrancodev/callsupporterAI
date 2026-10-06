import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { decideNextStep, jevConfigured } from "@/lib/jev";
import { getIncidents } from "@/lib/status-feed";
import { store } from "@/lib/store";
import type { CustomerRecord, Urgency, Workspace } from "@/lib/types";

// Server tools called by the ElevenLabs agent during a conversation.
// Each workspace authenticates with its own bearer token (Ajustes → Agente).

type Body = Record<string, string | undefined>;

function authorized(req: NextRequest, ws: Workspace) {
  const got = Buffer.from(req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "");
  const want = Buffer.from(ws.toolSecret);
  return got.length === want.length && timingSafeEqual(got, want);
}

async function getOrder(ws: Workspace, body: Body) {
  const { orderLookupUrl, orderLookupToken } = ws.config.integrations;
  if (!orderLookupUrl) return { found: false, message: "Order lookup is not configured." };
  const res = await fetch(orderLookupUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(orderLookupToken ? { Authorization: `Bearer ${orderLookupToken}` } : {}) },
    body: JSON.stringify({ query: body.query }),
    signal: AbortSignal.timeout(8000),
  });
  if (res.status === 404) return { found: false, message: "No order matches that reference." };
  if (!res.ok) return { found: false, message: "The order system is not responding. Offer to escalate." };

  // Expected: { reference, status?: { label, tone }, fields: { [label]: value } }
  const raw = (await res.json()) as { reference: string; status?: CustomerRecord["status"]; fields?: Record<string, string> };
  const record: CustomerRecord = {
    reference: raw.reference,
    status: raw.status,
    fields: Object.entries(raw.fields ?? {}).map(([label, value]) => ({ label, value: String(value) })),
  };
  if (body.conversation_id) await store.upsertConversation(ws.id, body.conversation_id, { record });
  return { found: true, order: { reference: record.reference, status: record.status?.label, ...raw.fields } };
}

async function checkStatus(ws: Workspace) {
  const incidents = await getIncidents(ws.config.integrations.statusFeedUrl);
  return incidents.length
    ? { active: true, label: ws.config.integrations.statusFeedLabel, incidents: incidents.map(({ start, end, status, reason }) => ({ start, end, status, reason })) }
    : { active: false };
}

async function nextStep(ws: Workspace, body: Body) {
  if (!jevConfigured()) return { action: "continue", instruction: "Keep helping the customer." };
  const { decision, reason } = await decideNextStep(ws, [{ role: "user", text: body.summary ?? body.last_message ?? "" }]);
  if (body.conversation_id) {
    const current = await store.getConversation(ws.id, body.conversation_id);
    await store.upsertConversation(ws.id, body.conversation_id, { decisions: [...(current?.decisions ?? []), decision] });
  }
  const instruction =
    decision.action === "escalate"
      ? `Call escalate_to_human now. Reason: ${reason}.`
      : decision.nextStep.p < ws.config.escalation.minConfidence
        ? "You're not sure yet: ask one short clarifying question."
        : { responder: "Answer the customer.", pedir_datos: "Ask for the order number or email.", escalar: "Ask one clarifying question before escalating.", cerrar: "Confirm everything is solved and close politely." }[decision.nextStep.value];
  return { action: decision.action, intent: decision.intent.value, instruction };
}

async function escalate(ws: Workspace, body: Body) {
  const urgency = (["baja", "media", "alta"].includes(body.urgency ?? "") ? body.urgency : "media") as Urgency;
  const reason = body.reason ?? "El cliente necesita una persona";
  if (body.conversation_id) {
    await store.upsertConversation(ws.id, body.conversation_id, {
      escalation: { reason, urgency, status: "pendiente", createdAt: new Date().toISOString() },
      ...(body.customer_name || body.customer_email
        ? { customer: { name: body.customer_name ?? "Cliente", email: body.customer_email ?? "", language: "—" } }
        : {}),
    });
  }
  const hook = ws.config.escalation.slackWebhookUrl;
  if (hook) {
    const link = `${process.env.APP_URL ?? ""}/w/${ws.slug}/c/${body.conversation_id ?? ""}`;
    await fetch(hook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: `:rotating_light: *${ws.name}* · urgencia ${urgency}\n${reason}\n${body.customer_name ?? ""} ${body.customer_email ?? ""}\n<${link}|Abrir conversación>` }),
      signal: AbortSignal.timeout(5000),
    }).catch(() => undefined);
  }
  return { ok: true, instruction: `Tell the customer, in their language, that a team member will reply in ${ws.config.escalation.responseTime}.` };
}

const TOOLS: Record<string, (ws: Workspace, body: Body) => Promise<unknown>> = {
  get_order: getOrder,
  check_status: checkStatus,
  decide_next_step: nextStep,
  escalate_to_human: escalate,
};

export async function POST(req: NextRequest, ctx: RouteContext<"/api/agents/[wsId]/tools/[tool]">) {
  const { wsId, tool } = await ctx.params;
  const ws = await store.getWorkspaceById(wsId);
  if (!ws || !authorized(req, ws)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const handler = TOOLS[tool];
  if (!handler) return Response.json({ error: "unknown tool" }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as Body;
  try {
    return Response.json(await handler(ws, body));
  } catch (e) {
    console.error(`[tool ${tool}]`, e);
    return Response.json({ error: "tool failed", instruction: "Apologise and offer to escalate to a human." }, { status: 200 });
  }
}
