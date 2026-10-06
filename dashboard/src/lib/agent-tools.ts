import type { Workspace } from "./types";

type Prop = { type: "string"; description?: string; enum?: string[]; dynamic_variable?: string };

interface ToolSpec {
  name: string;
  summary: string;
  description: string;
  properties: Record<string, Prop>;
  required: string[];
  enabled: (ws: Workspace) => boolean;
}

// conversation_id is filled by ElevenLabs from a system dynamic variable, so
// tool calls and the post-call webhook land on the same conversation.
const conversationId: Prop = { type: "string", dynamic_variable: "system__conversation_id" };

export const TOOL_SPECS: ToolSpec[] = [
  {
    name: "get_order",
    summary: "Busca el pedido del cliente",
    description: "Look up the customer's order by order number or email. Call it as soon as the customer gives either.",
    properties: { conversation_id: conversationId, query: { type: "string", description: "Order number or email the customer gave" } },
    required: ["conversation_id", "query"],
    enabled: (ws) => Boolean(ws.config.integrations.orderLookupUrl),
  },
  {
    name: "check_status",
    summary: "Revisa incidencias activas",
    description: "Check for active or scheduled provider incidents. Call it when the customer reports something is not working.",
    properties: { conversation_id: conversationId },
    required: ["conversation_id"],
    enabled: (ws) => Boolean(ws.config.integrations.statusFeedUrl),
  },
  {
    name: "decide_next_step",
    summary: "Jev decide si seguir o escalar",
    description: "Ask whether to keep helping, ask for details, close, or hand off to a human. Follow the returned instruction.",
    properties: {
      conversation_id: conversationId,
      summary: { type: "string", description: "2–3 sentence summary of the conversation so far, including the customer's latest message verbatim" },
    },
    required: ["conversation_id", "summary"],
    enabled: () => true,
  },
  {
    name: "escalate_to_human",
    summary: "Avisa al equipo por Slack",
    description: "Hand the conversation off to a human team member. Call it only when decide_next_step says so.",
    properties: {
      conversation_id: conversationId,
      reason: { type: "string", description: "Why a human is needed, in one sentence" },
      urgency: { type: "string", enum: ["baja", "media", "alta"] },
      customer_name: { type: "string", description: "Customer name if known" },
      customer_email: { type: "string", description: "Customer email if known" },
    },
    required: ["conversation_id", "reason", "urgency"],
    enabled: () => true,
  },
];

export function toolUrl(base: string, ws: Workspace, tool: string) {
  return `${base}/api/agents/${ws.id}/tools/${tool}`;
}

/** Webhook tool definition in ElevenLabs' tool JSON format. */
export function toolConfig(base: string, ws: Workspace, spec: ToolSpec) {
  return {
    type: "webhook",
    name: spec.name,
    description: spec.description,
    api_schema: {
      url: toolUrl(base, ws, spec.name),
      method: "POST",
      request_headers: { Authorization: `Bearer ${ws.toolSecret}` },
      request_body_schema: { type: "object", properties: spec.properties, required: spec.required },
    },
  };
}
