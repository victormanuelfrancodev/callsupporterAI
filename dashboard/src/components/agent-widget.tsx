"use client";

import Script from "next/script";
import { createElement, useState } from "react";
import { EnvelopeSimpleIcon, UserIcon } from "@phosphor-icons/react/ssr";
import { input } from "./ui";

/** ElevenLabs Conversational AI widget with test-customer dynamic variables. */
export function AgentWidget({ agentId }: { agentId: string }) {
  const [name, setName] = useState("Cliente de prueba");
  const [email, setEmail] = useState("prueba@example.com");
  const vars = JSON.stringify({ customer_name: name, customer_email: email, channel: "voz" });

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="relative">
          <UserIcon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
          <input value={name} onChange={(e) => setName(e.target.value)} className={`${input} pl-10`} aria-label="Nombre del cliente de prueba" />
        </label>
        <label className="relative">
          <EnvelopeSimpleIcon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} className={`${input} pl-10`} aria-label="Email del cliente de prueba" />
        </label>
      </div>
      {/* key re-mounts the widget when the test customer changes */}
      {createElement("elevenlabs-convai", { key: vars, "agent-id": agentId, "dynamic-variables": vars })}
      <Script src="https://unpkg.com/@elevenlabs/convai-widget-embed" strategy="afterInteractive" />
    </div>
  );
}
