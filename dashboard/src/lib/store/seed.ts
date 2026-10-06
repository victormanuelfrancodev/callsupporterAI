import { TEMPLATES } from "../templates";
import type {
  Classification,
  Conversation,
  CustomerRecord,
  DailyPoint,
  Escalation,
  JevDecision,
  Member,
  Message,
  Workspace,
} from "../types";

// Demo data used when Supabase isn't configured. Timestamps are relative to
// "now" so the inbox always looks alive.
const minsAgo = (m: number) => new Date(Date.now() - m * 60000).toISOString();

export const DEMO_USER = { id: "demo-user", email: "demo@callsupporter.ai" };

type Line = [role: Message["role"], text: string, tool?: string];

function thread(id: string, startMin: number, lines: Line[]): Message[] {
  return lines.map(([role, text, tool], i) => ({ id: `${id}-m${i}`, role, text, tool, at: minsAgo(startMin - i * 0.6) }));
}

type J = [string, number];
function cls(c: { topic: J; resolved: J; sentiment: J; agentIssue: J; fields?: Record<string, J> }): Classification {
  const j = ([value, p]: J) => ({ value, p });
  return {
    topic: j(c.topic),
    resolved: j(c.resolved) as Classification["resolved"],
    sentiment: j(c.sentiment) as Classification["sentiment"],
    agentIssue: j(c.agentIssue) as Classification["agentIssue"],
    fields: Object.fromEntries(Object.entries(c.fields ?? {}).map(([k, v]) => [k, j(v)])),
  };
}

function decision(atMin: number, d: { intent: J; urgency: J; upset: J; nextStep: J }, action: JevDecision["action"] = "continue"): JevDecision {
  return {
    at: minsAgo(atMin),
    intent: { value: d.intent[0], p: d.intent[1] },
    urgency: { value: d.urgency[0] as JevDecision["urgency"]["value"], p: d.urgency[1] },
    upset: { value: d.upset[0] as JevDecision["upset"]["value"], p: d.upset[1] },
    nextStep: { value: d.nextStep[0] as JevDecision["nextStep"]["value"], p: d.nextStep[1] },
    action,
  };
}

function esc(e: Omit<Escalation, "createdAt"> & { min: number }): Escalation {
  const { min, ...rest } = e;
  return { ...rest, createdAt: minsAgo(min) };
}

function esimRecord(carrier: string, plan: string, status: "Activa" | "Lista para instalar" | "Pendiente", daysAgo: number, n: string): CustomerRecord {
  const tone = status === "Activa" ? "good" : status === "Pendiente" ? "warn" : "info";
  return {
    reference: `JJ-${n}`,
    status: { label: status, tone },
    fields: [
      { label: "Carrier", value: carrier },
      { label: "Plan", value: plan },
      { label: "Compra", value: new Date(Date.now() - daysAgo * 86400000).toLocaleDateString("es", { day: "numeric", month: "short" }) },
      { label: "ICCID", value: `8981 •••• •••• ${n.slice(-4)}` },
    ],
  };
}

const JJ_ID = "ws_journey_japan";
const KUMO_ID = "ws_tienda_kumo";

function conv(workspaceId: string, c: Omit<Conversation, "workspaceId" | "decisions"> & { decisions?: JevDecision[] }): Conversation {
  return { decisions: [], ...c, workspaceId };
}

const jjConversations: Conversation[] = [
  conv(JJ_ID, {
    id: "c_1042",
    customer: { name: "Emma Johansson", email: "emma.j@example.com", language: "EN" },
    channel: "chat",
    startedAt: minsAgo(6),
    durationSec: 312,
    summary: "No data since landing at Narita. IIJ maintenance tonight; agent walked through roaming + APN.",
    messages: thread("c_1042", 6, [
      ["user", "Hi, I just landed at Narita and my eSIM shows no internet at all."],
      ["tool", "JJ-88213 · IIJ · 15 días / 20 GB · lista para instalar", "get_order"],
      ["tool", "Mantención programada hoy 22:00 → 09:00 JST", "check_status"],
      ["agent", "Thanks Emma! Your IIJ eSIM is ready. Please turn on Data Roaming for the eSIM line and set it as your mobile data line."],
      ["user", "Roaming was off, it works now!"],
      ["agent", "Great! Heads up: IIJ has scheduled maintenance tonight 22:00–09:00 JST, data may pause briefly."],
    ]),
    record: esimRecord("IIJ", "15 días · 20 GB", "Lista para instalar", 2, "88213"),
    decisions: [decision(4, { intent: ["sin_conexion", 0.94], urgency: ["media", 0.71], upset: ["no", 0.82], nextStep: ["responder", 0.9] })],
    classification: cls({ topic: ["sin_conexion", 0.95], resolved: ["si", 0.93], sentiment: ["positivo", 0.88], agentIssue: ["ninguno", 0.97], fields: { carrier: ["IIJ", 0.99] } }),
  }),
  conv(JJ_ID, {
    id: "c_1041",
    customer: { name: "Marco Bianchi", email: "marco.b@example.com", language: "IT" },
    channel: "voz",
    startedAt: minsAgo(18),
    durationSec: 540,
    summary: "Wants a refund: bought the wrong plan, eSIM already installed. Very upset, escalated.",
    messages: thread("c_1041", 18, [
      ["user", "Ho comprato il piano sbagliato. Voglio un rimborso SUBITO."],
      ["tool", "JJ-88190 · KDDI · 7 días / 5 GB · activa", "get_order"],
      ["tool", "escalar · reembolso 97% · muy molesto 91%", "decide_next_step"],
      ["agent", "Capisco, Marco. I rimborsi li gestisce una persona del team: passo subito il tuo caso."],
      ["tool", "Enviado a Slack #cx-escalations", "escalate_to_human"],
      ["agent", "Una persona ti risponderà entro circa 30 minuti."],
    ]),
    record: esimRecord("KDDI", "7 días · 5 GB", "Activa", 1, "88190"),
    decisions: [decision(16, { intent: ["reembolso", 0.97], urgency: ["alta", 0.84], upset: ["mucho", 0.91], nextStep: ["escalar", 0.95] }, "escalate")],
    classification: cls({ topic: ["reembolso", 0.98], resolved: ["escalado", 0.99], sentiment: ["negativo", 0.94], agentIssue: ["ninguno", 0.9], fields: { carrier: ["KDDI", 0.97] } }),
    escalation: esc({ reason: "Solicitud de reembolso · cliente muy molesto", urgency: "alta", status: "pendiente", min: 15 }),
  }),
  conv(JJ_ID, {
    id: "c_1040",
    customer: { name: "Sarah Kim", email: "sarah.kim@example.com", language: "EN" },
    channel: "voz",
    startedAt: minsAgo(42),
    durationSec: 198,
    summary: "Asked when the 15-day validity starts. Answered: from first connection in Japan (IIJ).",
    messages: thread("c_1040", 42, [
      ["user", "Does my 15 days start when I install it or when I arrive?"],
      ["tool", "JJ-88177 · IIJ · 15 días / 20 GB · lista para instalar", "get_order"],
      ["agent", "Your validity starts the first time the eSIM connects to a network in Japan, not at installation."],
      ["user", "Perfect, thank you!"],
    ]),
    record: esimRecord("IIJ", "15 días · 20 GB", "Lista para instalar", 3, "88177"),
    classification: cls({ topic: ["validez", 0.96], resolved: ["si", 0.95], sentiment: ["positivo", 0.9], agentIssue: ["ninguno", 0.95], fields: { carrier: ["IIJ", 0.98] } }),
  }),
  conv(JJ_ID, {
    id: "c_1039",
    customer: { name: "Lucas Moreau", email: "lucas.m@example.com", language: "FR" },
    channel: "chat",
    startedAt: minsAgo(75),
    durationSec: 420,
    summary: "Asked about upgrading to a bigger plan. Agent promised a free upgrade — not in KB.",
    messages: thread("c_1039", 75, [
      ["user", "Je peux passer au forfait 20 Go ?"],
      ["tool", "JJ-88102 · KDDI · 7 días / 5 GB · activa", "get_order"],
      ["agent", "Oui, je peux vous offrir la mise à niveau gratuitement."],
      ["user", "Super, merci !"],
    ]),
    record: esimRecord("KDDI", "7 días · 5 GB", "Activa", 4, "88102"),
    decisions: [decision(73, { intent: ["cambio_plan", 0.89], urgency: ["baja", 0.77], upset: ["no", 0.93], nextStep: ["responder", 0.58] })],
    classification: cls({ topic: ["cambio_plan", 0.9], resolved: ["no", 0.62], sentiment: ["positivo", 0.8], agentIssue: ["respuesta_inventada", 0.86], fields: { carrier: ["KDDI", 0.96] } }),
  }),
  conv(JJ_ID, {
    id: "c_1038",
    customer: { name: "Wei Chen", email: "wei.chen@example.com", language: "ZH" },
    channel: "chat",
    startedAt: minsAgo(130),
    durationSec: 365,
    summary: "QR code not scanning on Android. Agent sent manual activation steps; resolved.",
    messages: thread("c_1038", 130, [
      ["user", "二维码扫不了，怎么办？"],
      ["tool", "JJ-88077 · IIJ · 30 días / 50 GB · lista para instalar", "get_order"],
      ["agent", "您可以手动输入激活码：设置 → 网络 → SIM 卡 → 添加 eSIM → 手动输入。"],
      ["user", "好了，谢谢！"],
    ]),
    record: esimRecord("IIJ", "30 días · 50 GB", "Lista para instalar", 5, "88077"),
    classification: cls({ topic: ["activacion", 0.93], resolved: ["si", 0.9], sentiment: ["positivo", 0.76], agentIssue: ["ninguno", 0.94], fields: { carrier: ["IIJ", 0.97] } }),
  }),
  conv(JJ_ID, {
    id: "c_1037",
    customer: { name: "Daniel Ortega", email: "daniel.o@example.com", language: "ES" },
    channel: "chat",
    startedAt: minsAgo(190),
    durationSec: 610,
    summary: "eSIM stuck in 'pendiente' 2 days after purchase. Needs manual check by CX.",
    messages: thread("c_1037", 190, [
      ["user", "Compré hace dos días y todavía no me llega el QR."],
      ["tool", "JJ-88011 · KDDI · 15 días / 20 GB · pendiente", "get_order"],
      ["agent", "Veo tu pedido, pero la eSIM todavía está en proceso. Lo paso a una persona del equipo para revisarlo."],
      ["tool", "Enviado a Slack #cx-escalations", "escalate_to_human"],
    ]),
    record: esimRecord("KDDI", "15 días · 20 GB", "Pendiente", 2, "88011"),
    decisions: [decision(186, { intent: ["activacion", 0.81], urgency: ["alta", 0.69], upset: ["algo", 0.74], nextStep: ["escalar", 0.88] }, "escalate")],
    classification: cls({ topic: ["activacion", 0.84], resolved: ["escalado", 0.98], sentiment: ["neutral", 0.66], agentIssue: ["ninguno", 0.92], fields: { carrier: ["KDDI", 0.95] } }),
    escalation: esc({ reason: "Provisión atascada > 48 h", urgency: "alta", status: "en_curso", assignee: "Aiko", min: 184 }),
  }),
  conv(JJ_ID, {
    id: "c_1036",
    customer: { name: "Olivia Brown", email: "olivia.b@example.com", language: "EN" },
    channel: "chat",
    startedAt: minsAgo(260),
    durationSec: 150,
    summary: "Asked difference between IIJ and KDDI plans. Agent mentioned a competitor not in KB.",
    messages: thread("c_1036", 260, [
      ["user", "What's the difference between IIJ and KDDI?"],
      ["agent", "IIJ runs on Docomo's network, KDDI on au. Both are great — some people also like Ubigi."],
    ]),
    classification: cls({ topic: ["otro", 0.71], resolved: ["si", 0.7], sentiment: ["neutral", 0.85], agentIssue: ["fuera_de_guion", 0.79], fields: { carrier: ["desconocido", 0.8] } }),
  }),
  conv(JJ_ID, {
    id: "c_1035",
    customer: { name: "Kenji Watanabe", email: "kenji.w@example.com", language: "EN" },
    channel: "voz",
    startedAt: minsAgo(400),
    durationSec: 480,
    summary: "No connection in Osaka. Agent kept asking for the order ID after it was given.",
    messages: thread("c_1035", 400, [
      ["user", "My internet stopped working in Osaka. Order JJ-87950."],
      ["agent", "Could you share your order ID or email?"],
      ["user", "I just said it. JJ-87950."],
      ["agent", "Sorry, could you share your order ID?"],
    ]),
    decisions: [decision(396, { intent: ["sin_conexion", 0.9], urgency: ["media", 0.62], upset: ["algo", 0.81], nextStep: ["pedir_datos", 0.54] })],
    classification: cls({ topic: ["sin_conexion", 0.92], resolved: ["no", 0.89], sentiment: ["negativo", 0.83], agentIssue: ["no_entendio", 0.91], fields: { carrier: ["desconocido", 0.6] } }),
  }),
  conv(JJ_ID, {
    id: "c_1034",
    customer: { name: "Ana Souza", email: "ana.s@example.com", language: "PT" },
    channel: "chat",
    startedAt: minsAgo(720),
    durationSec: 230,
    summary: "Wants to cancel before travelling. Refund requests always go to a human.",
    messages: thread("c_1034", 720, [
      ["user", "Minha viagem foi cancelada. Posso pedir reembolso?"],
      ["tool", "JJ-87911 · IIJ · 7 días / 5 GB · lista para instalar", "get_order"],
      ["agent", "Sinto muito, Ana. Os reembolsos são decididos por uma pessoa da equipe; vou encaminhar seu caso."],
      ["tool", "Enviado a Slack #cx-escalations", "escalate_to_human"],
    ]),
    record: esimRecord("IIJ", "7 días · 5 GB", "Lista para instalar", 6, "87911"),
    decisions: [decision(716, { intent: ["reembolso", 0.96], urgency: ["media", 0.7], upset: ["no", 0.68], nextStep: ["escalar", 0.92] }, "escalate")],
    classification: cls({ topic: ["reembolso", 0.97], resolved: ["escalado", 0.99], sentiment: ["neutral", 0.72], agentIssue: ["ninguno", 0.96], fields: { carrier: ["IIJ", 0.96] } }),
    escalation: esc({ reason: "Reembolso antes del viaje", urgency: "media", status: "pendiente", min: 715 }),
  }),
  conv(JJ_ID, {
    id: "c_1033",
    customer: { name: "Tom Becker", email: "tom.b@example.com", language: "DE" },
    channel: "chat",
    startedAt: minsAgo(1500),
    durationSec: 175,
    summary: "How to install on iPhone 15. Sent step-by-step guide; resolved.",
    messages: thread("c_1033", 1500, [
      ["user", "Wie installiere ich die eSIM auf meinem iPhone?"],
      ["agent", "Einstellungen → Mobilfunk → eSIM hinzufügen → QR-Code scannen. Danach Datenroaming aktivieren."],
      ["user", "Danke!"],
    ]),
    classification: cls({ topic: ["activacion", 0.95], resolved: ["si", 0.94], sentiment: ["positivo", 0.86], agentIssue: ["ninguno", 0.97], fields: { carrier: ["desconocido", 0.7] } }),
  }),
];

const kumoConversations: Conversation[] = [
  conv(KUMO_ID, {
    id: "k_210",
    customer: { name: "Lucía Fernández", email: "lucia.f@example.com", language: "ES" },
    channel: "chat",
    startedAt: minsAgo(25),
    durationSec: 140,
    summary: "Preguntó por el estado de su pedido; el agente dio el número de seguimiento.",
    messages: thread("k_210", 25, [
      ["user", "Hola, ¿dónde está mi pedido KM-5521?"],
      ["tool", "KM-5521 · Enviado · llega el jueves", "get_order"],
      ["agent", "Tu pedido salió ayer y llega el jueves. Tu número de seguimiento es 7781-2290."],
      ["user", "¡Genial, gracias!"],
    ]),
    record: { reference: "KM-5521", status: { label: "Enviado", tone: "info" }, fields: [{ label: "Total", value: "$48.900" }, { label: "Transportista", value: "Starken" }] },
    classification: cls({ topic: ["envio", 0.96], resolved: ["si", 0.94], sentiment: ["positivo", 0.9], agentIssue: ["ninguno", 0.96] }),
  }),
  conv(KUMO_ID, {
    id: "k_209",
    customer: { name: "Pedro Rojas", email: "pedro.r@example.com", language: "ES" },
    channel: "voz",
    startedAt: minsAgo(95),
    durationSec: 380,
    summary: "Quiere devolver unas zapatillas que llegaron con la talla equivocada.",
    messages: thread("k_209", 95, [
      ["user", "Me llegaron las zapatillas en otra talla, quiero devolverlas."],
      ["tool", "KM-5490 · Entregado", "get_order"],
      ["agent", "Lo siento, Pedro. Las devoluciones las gestiona el equipo: ya les pasé tu caso."],
      ["tool", "Enviado a Slack #soporte", "escalate_to_human"],
    ]),
    record: { reference: "KM-5490", status: { label: "Entregado", tone: "good" }, fields: [{ label: "Total", value: "$62.000" }] },
    decisions: [decision(92, { intent: ["devolucion", 0.95], urgency: ["media", 0.66], upset: ["algo", 0.7], nextStep: ["escalar", 0.9] }, "escalate")],
    classification: cls({ topic: ["devolucion", 0.97], resolved: ["escalado", 0.98], sentiment: ["neutral", 0.7], agentIssue: ["ninguno", 0.95] }),
    escalation: esc({ reason: "Devolución por talla equivocada", urgency: "media", status: "pendiente", min: 90 }),
  }),
  conv(KUMO_ID, {
    id: "k_208",
    customer: { name: "Camila Soto", email: "camila.s@example.com", language: "ES" },
    channel: "chat",
    startedAt: minsAgo(300),
    durationSec: 210,
    summary: "Tarjeta rechazada al pagar; el agente sugirió otro medio de pago.",
    messages: thread("k_208", 300, [
      ["user", "Me rechaza la tarjeta al pagar."],
      ["agent", "Puedes intentar con otra tarjeta o con transferencia. Si el cargo aparece igual, te ayudamos a revisarlo."],
    ]),
    classification: cls({ topic: ["pago", 0.92], resolved: ["si", 0.74], sentiment: ["neutral", 0.8], agentIssue: ["ninguno", 0.93] }),
  }),
];

const jjDaily: DailyPoint[] = Array.from({ length: 14 }, (_, i) => {
  const base = [38, 41, 35, 44, 52, 47, 40, 39, 96, 58, 45, 42, 49, 53][i];
  return {
    date: new Date(Date.now() - (13 - i) * 86400000).toISOString().slice(0, 10),
    total: base,
    resolved: Math.round(base * (i === 8 ? 0.58 : 0.74)),
    incident: i === 8,
  };
});

function workspace(id: string, slug: string, name: string, template: keyof typeof TEMPLATES, color: Workspace["color"], daysAgo: number): Workspace {
  const t = TEMPLATES[template];
  return {
    id,
    slug,
    name,
    industry: t.industry,
    color,
    createdAt: minsAgo(daysAgo * 1440),
    config: t.build(name),
    toolSecret: `tool_demo_${slug}`,
    webhookSecret: `whsec_demo_${slug}`,
  };
}

export function seed() {
  const jj = workspace(JJ_ID, "journey-japan", "Journey Japan", "esim", "brand", 30);
  jj.config.integrations.statusFeedUrl = "https://n8n.francodev.fit/webhook/iijmio-mantenimiento?format=json";
  const kumo = workspace(KUMO_ID, "tienda-kumo", "Tienda Kumo", "ecommerce", "good", 6);

  const member = (role: Member["role"]): Member => ({ userId: DEMO_USER.id, email: DEMO_USER.email, role, invitedAt: minsAgo(43200) });

  return {
    workspaces: [jj, kumo],
    members: new Map<string, Member[]>([
      [jj.id, [member("owner"), { userId: "u_aiko", email: "aiko@journeyjapan.example", role: "member", invitedAt: minsAgo(20000) }]],
      [kumo.id, [member("owner")]],
    ]),
    conversations: [...jjConversations, ...kumoConversations],
    daily: new Map<string, DailyPoint[]>([[jj.id, jjDaily]]),
  };
}
