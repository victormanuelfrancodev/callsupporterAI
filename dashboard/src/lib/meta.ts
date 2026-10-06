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
  si: { label: "Resuelta", icon: CheckCircleIcon, tone: "good" },
  no: { label: "Sin resolver", icon: CircleDashedIcon, tone: "warn" },
  escalado: { label: "Escalada", icon: UserSwitchIcon, tone: "bad" },
};

export const SENTIMENT: Record<Sentiment, Meta> = {
  positivo: { label: "Positivo", icon: ThumbsUpIcon, tone: "good" },
  neutral: { label: "Neutral", icon: MinusCircleIcon, tone: "neutral" },
  negativo: { label: "Negativo", icon: ThumbsDownIcon, tone: "bad" },
};

export const AGENT_ISSUE: Record<AgentIssue, Meta> = {
  ninguno: { label: "Sin problemas", tone: "good" },
  respuesta_inventada: { label: "Respuesta inventada", icon: SealWarningIcon, tone: "bad" },
  fuera_de_guion: { label: "Fuera de guion", icon: HandPalmIcon, tone: "warn" },
  no_entendio: { label: "No entendió", icon: QuestionIcon, tone: "warn" },
};

export const URGENCY: Record<Urgency, Meta> = {
  baja: { label: "Baja", tone: "neutral" },
  media: { label: "Media", tone: "warn" },
  alta: { label: "Alta", tone: "bad" },
};

export const UPSET: Record<Upset, Meta> = {
  no: { label: "Tranquilo", tone: "good" },
  algo: { label: "Algo molesto", tone: "warn" },
  mucho: { label: "Muy molesto", tone: "bad" },
};

export const NEXT_STEP: Record<NextStep, Meta> = {
  responder: { label: "Responder", tone: "good" },
  pedir_datos: { label: "Pedir datos", tone: "info" },
  escalar: { label: "Escalar a humano", tone: "bad" },
  cerrar: { label: "Cerrar", tone: "neutral" },
};

export const ESCALATION_STATUS: Record<EscalationStatus, Meta> = {
  pendiente: { label: "Pendiente", tone: "bad" },
  en_curso: { label: "En curso", tone: "warn" },
  resuelta: { label: "Resuelta", tone: "good" },
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
