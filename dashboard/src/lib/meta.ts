import {
  CheckCircleIcon,
  CircleDashedIcon,
  HandPalmIcon,
  MinusCircleIcon,
  QuestionIcon,
  SealWarningIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
  UserSwitchIcon,
} from "@phosphor-icons/react/ssr";
import type { Icon as PhIcon } from "@phosphor-icons/react";
import { iconFor } from "./icons";
import type {
  AgentIssue,
  EscalationStatus,
  NextStep,
  Option,
  Resolved,
  Sentiment,
  Tone,
  Upset,
  Urgency,
  Workspace,
} from "./types";

export interface Meta {
  label: string;
  icon?: PhIcon;
  tone: Tone;
}

export const RESOLVED: Record<Resolved, Meta> = {
  resolved: { label: "Resolved", icon: CheckCircleIcon, tone: "good" },
  unresolved: { label: "Unresolved", icon: CircleDashedIcon, tone: "warn" },
  escalated: { label: "Escalated", icon: UserSwitchIcon, tone: "bad" },
};

export const SENTIMENT: Record<Sentiment, Meta> = {
  positive: { label: "Positive", icon: ThumbsUpIcon, tone: "good" },
  neutral: { label: "Neutral", icon: MinusCircleIcon, tone: "neutral" },
  negative: { label: "Negative", icon: ThumbsDownIcon, tone: "bad" },
};

export const AGENT_ISSUE: Record<AgentIssue, Meta> = {
  none: { label: "No issues", tone: "good" },
  hallucination: { label: "Made-up answer", icon: SealWarningIcon, tone: "bad" },
  off_script: { label: "Off script", icon: HandPalmIcon, tone: "warn" },
  misunderstood: { label: "Misunderstood", icon: QuestionIcon, tone: "warn" },
};

export const URGENCY: Record<Urgency, Meta> = {
  low: { label: "Low", tone: "neutral" },
  medium: { label: "Medium", tone: "warn" },
  high: { label: "High", tone: "bad" },
};

export const UPSET: Record<Upset, Meta> = {
  calm: { label: "Calm", tone: "good" },
  somewhat: { label: "Somewhat upset", tone: "warn" },
  very: { label: "Very upset", tone: "bad" },
};

export const NEXT_STEP: Record<NextStep, Meta> = {
  answer: { label: "Answer", tone: "good" },
  ask_details: { label: "Ask for details", tone: "info" },
  escalate: { label: "Escalate to human", tone: "bad" },
  close: { label: "Close", tone: "neutral" },
};

export const ESCALATION_STATUS: Record<EscalationStatus, Meta> = {
  pending: { label: "Pending", tone: "bad" },
  in_progress: { label: "In progress", tone: "warn" },
  resolved: { label: "Resolved", tone: "good" },
};

const UNKNOWN: Meta = { label: "—", tone: "neutral" };

export function optionMeta(o: Option | undefined): Meta {
  if (!o) return UNKNOWN;
  return { label: o.label, icon: iconFor(o.icon), tone: o.tone };
}

export function topicMeta(ws: Workspace, value: string | undefined): Meta {
  return optionMeta(ws.config.classification.topics.find((t) => t.value === value));
}

export function fieldMeta(ws: Workspace, key: string, value: string | undefined): Meta {
  const f = ws.config.classification.fields.find((x) => x.key === key);
  return optionMeta(f?.options.find((o) => o.value === value));
}

export const TONES: Tone[] = ["neutral", "brand", "info", "good", "warn", "bad"];

export const TONE_CLASSES: Record<Tone, { chip: string; dot: string; text: string; bar: string; solid: string }> = {
  neutral: { chip: "bg-zinc-100 text-zinc-700", dot: "bg-zinc-400", text: "text-zinc-500", bar: "bg-zinc-400", solid: "bg-zinc-700 text-white" },
  brand: { chip: "bg-indigo-50 text-indigo-700", dot: "bg-indigo-500", text: "text-indigo-600", bar: "bg-indigo-500", solid: "bg-indigo-600 text-white" },
  good: { chip: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500", text: "text-emerald-600", bar: "bg-emerald-500", solid: "bg-emerald-600 text-white" },
  warn: { chip: "bg-amber-50 text-amber-800", dot: "bg-amber-500", text: "text-amber-600", bar: "bg-amber-500", solid: "bg-amber-500 text-white" },
  bad: { chip: "bg-rose-50 text-rose-700", dot: "bg-rose-500", text: "text-rose-600", bar: "bg-rose-500", solid: "bg-rose-600 text-white" },
  info: { chip: "bg-sky-50 text-sky-700", dot: "bg-sky-500", text: "text-sky-600", bar: "bg-sky-500", solid: "bg-sky-600 text-white" },
};
