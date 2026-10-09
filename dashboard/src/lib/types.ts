// ── Fixed vocabularies (same for every workspace) ────────────────────────────
export type Resolved = "resolved" | "unresolved" | "escalated";
export type Sentiment = "positive" | "neutral" | "negative";
export type AgentIssue = "none" | "hallucination" | "off_script" | "misunderstood";
export type Urgency = "low" | "medium" | "high";
export type Upset = "calm" | "somewhat" | "very";
export type NextStep = "answer" | "ask_details" | "escalate" | "close";
export type EscalationStatus = "pending" | "in_progress" | "resolved";
export type Tone = "neutral" | "brand" | "good" | "warn" | "bad" | "info";
export type Role = "owner" | "member";

/** A Jev answer: the chosen option plus its probability (0–1). */
export interface Judgment<T extends string = string> {
  value: T;
  p: number;
}

// ── Workspace configuration ─────────────────────────────────────────────────
export interface Option {
  value: string;
  label: string;
  /** Sent to Jev as the option's rubric. */
  description?: string;
  icon?: string;
  tone: Tone;
}

/** A configurable classification dimension, e.g. "carrier" for an eSIM shop. */
export interface CustomField {
  key: string;
  label: string;
  icon?: string;
  options: Option[];
}

export interface WorkspaceConfig {
  agent: {
    elevenlabsAgentId: string;
    /** Client-owned ElevenLabs account key. Empty → platform key (ELEVENLABS_API_KEY). */
    elevenlabsApiKey?: string;
    lastSync?: { at: string; error?: string };
    /** Business description the agent and Jev get as context. */
    businessContext: string;
    languages: string;
    greeting: string;
    extraRules: string;
  };
  classification: {
    topics: Option[];
    fields: CustomField[];
  };
  escalation: {
    slackWebhookUrl: string;
    /** Minimum Jev probability before acting on its answer. */
    minConfidence: number;
    alwaysEscalateTopics: string[];
    escalateWhenVeryUpset: boolean;
    responseTime: string;
  };
  integrations: {
    /** POST {query} → { reference, status?, fields } */
    orderLookupUrl: string;
    orderLookupToken: string;
    /** GET → { today: Incident[], tomorrow: Incident[] } */
    statusFeedUrl: string;
    statusFeedLabel: string;
  };
  /** FAQ the agent answers from; inlined into the system prompt. */
  knowledge?: { items: KnowledgeItem[] };
}

export interface KnowledgeItem {
  id: string;
  question: string;
  answer: string;
}

export interface Workspace {
  id: string;
  slug: string;
  name: string;
  industry: string;
  color: Tone;
  createdAt: string;
  config: WorkspaceConfig;
  /** Bearer token ElevenLabs sends to our tool endpoints. */
  toolSecret: string;
  /** HMAC secret for ElevenLabs post-call webhooks. */
  webhookSecret: string;
}

export interface Member {
  userId: string;
  email: string;
  role: Role;
  invitedAt: string;
}

// ── Conversations ───────────────────────────────────────────────────────────
export interface Message {
  id: string;
  role: "user" | "agent" | "tool";
  text: string;
  at: string;
  tool?: string;
}

/** Whatever the client's order/account API returned, normalised for display. */
export interface CustomerRecord {
  reference: string;
  status?: { label: string; tone: Tone };
  fields: { label: string; value: string }[];
}

export interface JevDecision {
  at: string;
  intent: Judgment;
  urgency: Judgment<Urgency>;
  upset: Judgment<Upset>;
  nextStep: Judgment<NextStep>;
  action: "continue" | "escalate";
}

export interface Classification {
  topic: Judgment;
  resolved: Judgment<Resolved>;
  sentiment: Judgment<Sentiment>;
  agentIssue: Judgment<AgentIssue>;
  /** Keyed by CustomField.key */
  fields: Record<string, Judgment>;
}

export interface Escalation {
  reason: string;
  urgency: Urgency;
  status: EscalationStatus;
  createdAt: string;
  assignee?: string;
}

export interface Conversation {
  id: string;
  workspaceId: string;
  customer: { name: string; email: string; language: string };
  channel: "chat" | "voice";
  startedAt: string;
  durationSec: number;
  summary: string;
  messages: Message[];
  record?: CustomerRecord;
  decisions: JevDecision[];
  /** Missing while the call is in progress (tools may create the row first). */
  classification?: Classification;
  escalation?: Escalation;
}

export interface Incident {
  start: string;
  end: string;
  status: string;
  reason: string;
}

export interface DailyPoint {
  date: string;
  total: number;
  resolved: number;
  incident: boolean;
}
