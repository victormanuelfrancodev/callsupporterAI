import "server-only";
import type { Classification, JevDecision, Judgment, Message, Option, Workspace } from "./types";

// TypeSafe System One API: typed questions in, typed answers + probabilities out.
// https://docs.typesafe.ai/api
const JEV_URL = "https://api.typesafe.ai/v1/systemone";

type Criteria = Record<string, string | null>;
interface ChoiceQuestion {
  type: "choice";
  instructions: string | Record<string, unknown>;
  criteria: Criteria;
}
interface ChoiceAnswer {
  type: "choice";
  choice: string;
  probabilities: Record<string, number>;
  confidence: number;
}

export const jevConfigured = () => Boolean(process.env.TYPESAFE_API_KEY);

async function evaluate(state: unknown, questions: Record<string, ChoiceQuestion>): Promise<Record<string, ChoiceAnswer>> {
  const key = process.env.TYPESAFE_API_KEY;
  if (!key) throw new Error("Falta TYPESAFE_API_KEY");

  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(JEV_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: process.env.JEV_MODEL ?? "jev-latest", state, questions }),
      signal: AbortSignal.timeout(15000),
    });
    if (res.status === 429 || res.status === 529) {
      await new Promise((r) => setTimeout(r, 400 * 2 ** attempt));
      continue;
    }
    if (!res.ok) throw new Error(`Jev ${res.status}: ${await res.text()}`);
    return ((await res.json()) as { answers: Record<string, ChoiceAnswer> }).answers;
  }
  throw new Error("Jev saturado, reintentos agotados");
}

const judgment = <T extends string>(a: ChoiceAnswer): Judgment<T> => ({
  value: a.choice as T,
  p: a.probabilities[a.choice] ?? a.confidence,
});

const optionCriteria = (options: Option[]): Criteria =>
  Object.fromEntries(options.map((o) => [o.value, o.description ? `${o.label}: ${o.description}` : o.label]));

function conversationState(ws: Workspace, messages: Pick<Message, "role" | "text" | "tool">[]) {
  return {
    business: ws.config.agent.businessContext,
    agent_rules: [
      "Only answer with information from the knowledge base or tool results",
      "Never mention products, companies or models that are not in the knowledge base",
      "Never promise refunds or compensation; a human always decides",
      ws.config.agent.extraRules,
    ].filter(Boolean),
    conversation: messages.map((m) => ({ from: m.role === "tool" ? `tool:${m.tool}` : m.role, text: m.text })),
  };
}

function topicQuestion(ws: Workspace, instructions: string): ChoiceQuestion {
  return { type: "choice", instructions, criteria: optionCriteria(ws.config.classification.topics) };
}

/** Post-call classification, one parallel request. */
export async function classifyConversation(ws: Workspace, messages: Pick<Message, "role" | "text" | "tool">[]): Promise<Classification> {
  const fieldQuestions = Object.fromEntries(
    ws.config.classification.fields.map((f) => [
      `field_${f.key}`,
      {
        type: "choice",
        instructions: `Based on the conversation, which ${f.label} does this customer's case involve?`,
        criteria: optionCriteria(f.options),
      } satisfies ChoiceQuestion,
    ]),
  );

  const answers = await evaluate(conversationState(ws, messages), {
    topic: topicQuestion(ws, "What is the main topic the customer contacted support about in `conversation`?"),
    resolved: {
      type: "choice",
      instructions: "How did the support conversation in `conversation` end for the customer?",
      criteria: {
        si: "The customer's question or problem was answered and nothing is left pending",
        no: "The customer's problem remained unsolved or the conversation ended without an answer",
        escalado: "The case was handed off to a human team member",
      },
    },
    sentiment: {
      type: "choice",
      instructions: "What is the customer's overall sentiment by the end of `conversation`?",
      criteria: {
        positivo: "Satisfied, thankful or relieved",
        neutral: "Neither clearly happy nor upset",
        negativo: "Frustrated, angry or disappointed",
      },
    },
    agent_issue: {
      type: "choice",
      instructions: "Did the agent's replies in `conversation` break any of the `agent_rules` or misunderstand the customer?",
      criteria: {
        ninguno: "The agent followed the rules and understood the customer",
        respuesta_inventada: "The agent stated facts, prices or promises not backed by tool results or the knowledge base",
        fuera_de_guion: "The agent went off-script, e.g. mentioned other companies or products, or discussed unrelated topics",
        no_entendio: "The agent misunderstood the customer or repeated questions the customer had already answered",
      },
    },
    ...fieldQuestions,
  });

  return {
    topic: judgment(answers.topic),
    resolved: judgment(answers.resolved),
    sentiment: judgment(answers.sentiment),
    agentIssue: judgment(answers.agent_issue),
    fields: Object.fromEntries(ws.config.classification.fields.map((f) => [f.key, judgment(answers[`field_${f.key}`])])),
  };
}

/** Live decision during the call. The escalation policy lives in code, not in the model. */
export async function decideNextStep(
  ws: Workspace,
  messages: Pick<Message, "role" | "text" | "tool">[],
): Promise<{ decision: JevDecision; reason: string }> {
  const answers = await evaluate(conversationState(ws, messages), {
    intent: topicQuestion(ws, "What does the customer want help with right now in `conversation`?"),
    urgency: {
      type: "choice",
      instructions: "How urgent is the customer's situation in `conversation`?",
      criteria: {
        baja: "A general question; nothing is blocked",
        media: "Something is not working but there is a workaround or it can wait a few hours",
        alta: "The customer is blocked right now or money is at stake",
      },
    },
    upset: {
      type: "choice",
      instructions: "How upset is the customer in their latest messages in `conversation`?",
      criteria: { no: "Calm", algo: "Somewhat frustrated", mucho: "Very angry, demanding, or threatening to complain" },
    },
    next_step: {
      type: "choice",
      instructions: "Given the `agent_rules`, what should the support agent do next in `conversation`?",
      criteria: {
        responder: "Answer the customer directly with known information",
        pedir_datos: "Ask for the order number, email or other missing details first",
        escalar: "Hand off to a human: refunds, compensation, angry customer, or anything outside the agent's knowledge",
        cerrar: "The customer's issue is solved and the conversation can end",
      },
    },
  });

  const d = {
    intent: judgment(answers.intent),
    urgency: judgment<JevDecision["urgency"]["value"]>(answers.urgency),
    upset: judgment<JevDecision["upset"]["value"]>(answers.upset),
    nextStep: judgment<JevDecision["nextStep"]["value"]>(answers.next_step),
  };

  const { minConfidence, alwaysEscalateTopics, escalateWhenVeryUpset } = ws.config.escalation;
  const sure = (j: Judgment) => j.p >= minConfidence;
  let reason = "";
  if (d.nextStep.value === "escalar" && sure(d.nextStep)) reason = "Jev recomienda escalar";
  else if (alwaysEscalateTopics.includes(d.intent.value) && sure(d.intent)) reason = `Tema "${d.intent.value}" siempre se escala`;
  else if (escalateWhenVeryUpset && d.upset.value === "mucho" && sure(d.upset)) reason = "Cliente muy molesto";

  return { decision: { ...d, at: new Date().toISOString(), action: reason ? "escalate" : "continue" }, reason };
}
