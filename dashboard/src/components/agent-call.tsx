"use client";

import clsx from "clsx";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ConversationProvider, useConversation } from "@elevenlabs/react";
import {
  EnvelopeSimpleIcon,
  MicrophoneIcon,
  MicrophoneSlashIcon,
  PhoneCallIcon,
  PhoneDisconnectIcon,
  RobotIcon,
  SpinnerGapIcon,
  TrayIcon,
  UserIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react/ssr";
import { btn, input } from "./ui";

type Line = { id: number; role: "user" | "agent"; text: string };

// Expressive voice tags like [warmly] are for the TTS, not for reading.
const stripTags = (t: string) => t.replace(/\[[a-z ]+\]\s*/gi, "").trim();

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

function Call({ agentId, inboxHref }: { agentId: string; inboxHref: string }) {
  const [name, setName] = useState("Test customer");
  const [email, setEmail] = useState("test@example.com");
  const [lines, setLines] = useState<Line[]>([]);
  const [error, setError] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [ended, setEnded] = useState(false);
  const transcriptRef = useRef<HTMLDivElement>(null);

  const conv = useConversation({
    onMessage: (m) => setLines((l) => [...l, { id: m.event_id ?? l.length, role: m.role, text: stripTags(m.message) }]),
    onError: (message) => setError(String(message) || "The call failed. Try again."),
    onDisconnect: () => setEnded(true),
  });

  const live = conv.status === "connected";
  const connecting = conv.status === "connecting";

  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [live]);

  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: "smooth" });
  }, [lines]);

  async function start() {
    setError("");
    setLines([]);
    setSeconds(0);
    setEnded(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
    } catch {
      setError("Microphone blocked. Allow it in the browser's address bar and try again.");
      return;
    }
    conv.startSession({
      agentId,
      connectionType: "webrtc",
      dynamicVariables: { customer_name: name, customer_email: email, channel: "voice" },
    });
  }

  const label = connecting
    ? "Connecting…"
    : live
      ? conv.isSpeaking
        ? "Agent is speaking"
        : conv.isMuted
          ? "Muted"
          : "Listening…"
      : ended
        ? "Call ended"
        : "Ready to call";

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="relative">
          <UserIcon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
          <input value={name} disabled={live || connecting} onChange={(e) => setName(e.target.value)} className={`${input} pl-10 disabled:opacity-60`} aria-label="Test customer name" />
        </label>
        <label className="relative">
          <EnvelopeSimpleIcon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
          <input value={email} disabled={live || connecting} onChange={(e) => setEmail(e.target.value)} className={`${input} pl-10 disabled:opacity-60`} aria-label="Test customer email" />
        </label>
      </div>

      {/* Call stage */}
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-zinc-50 px-6 py-10">
        <div className="relative grid size-28 place-items-center">
          {live ? (
            <span
              className={clsx(
                "absolute inset-0 rounded-full",
                conv.isSpeaking ? "animate-ping bg-indigo-400/30" : "animate-pulse bg-emerald-400/25",
              )}
            />
          ) : null}
          {live ? (
            <span className={clsx("relative grid size-24 place-items-center rounded-full text-white shadow-lg", conv.isSpeaking ? "bg-indigo-600 shadow-indigo-200" : "bg-emerald-600 shadow-emerald-200")}>
              {conv.isSpeaking ? <RobotIcon className="size-10" weight="duotone" /> : <MicrophoneIcon className="size-10" weight="duotone" />}
            </span>
          ) : (
            <button
              onClick={start}
              disabled={connecting}
              title="Start call"
              className="relative grid size-24 place-items-center rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-200 transition hover:scale-105 hover:bg-indigo-700 disabled:scale-100 disabled:opacity-70"
            >
              {connecting ? <SpinnerGapIcon className="size-10 animate-spin" /> : <PhoneCallIcon className="size-10" weight="duotone" />}
            </button>
          )}
        </div>

        <div className="text-center">
          <p className="font-medium text-zinc-900">{label}</p>
          <p className="text-sm tabular-nums text-zinc-500">{live || ended ? mmss(seconds) : "Press the button and allow the microphone"}</p>
        </div>

        {live ? (
          <div className="flex gap-3">
            <button onClick={() => conv.setMuted(!conv.isMuted)} className={clsx(btn.secondary, conv.isMuted && "border-amber-300 bg-amber-50 text-amber-800")}>
              {conv.isMuted ? <MicrophoneSlashIcon className="size-4" weight="duotone" /> : <MicrophoneIcon className="size-4" weight="duotone" />}
              {conv.isMuted ? "Unmute" : "Mute"}
            </button>
            <button onClick={() => conv.endSession()} className={clsx(btn.primary, "bg-rose-600 hover:bg-rose-700")}>
              <PhoneDisconnectIcon className="size-4" weight="duotone" /> End call
            </button>
          </div>
        ) : null}

        {error ? (
          <p className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
            <WarningCircleIcon className="size-4 shrink-0" weight="duotone" /> {error}
          </p>
        ) : null}
      </div>

      {/* Live transcript */}
      {lines.length ? (
        <div ref={transcriptRef} className="max-h-80 space-y-2.5 overflow-y-auto">
          {lines.map((l) => (
            <div key={l.id} className={clsx("flex", l.role === "agent" ? "justify-start" : "justify-end")}>
              <p
                className={clsx(
                  "max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-relaxed",
                  l.role === "agent" ? "rounded-bl-md bg-zinc-100 text-zinc-800" : "rounded-br-md bg-indigo-600 text-white",
                )}
              >
                {l.text}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {ended && !live ? (
        <Link href={inboxHref} className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700">
          <TrayIcon className="size-4" weight="duotone" /> It will show up in the Inbox in a few seconds
        </Link>
      ) : null}
    </div>
  );
}

/** In-page voice call with the workspace's ElevenLabs agent. */
export function AgentCall(props: { agentId: string; inboxHref: string }) {
  return (
    <ConversationProvider>
      <Call {...props} />
    </ConversationProvider>
  );
}
