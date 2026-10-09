"use client";

import { useActionState } from "react";
import { ArrowRightIcon, EnvelopeSimpleIcon, PaperPlaneTiltIcon, SpinnerGapIcon } from "@phosphor-icons/react/ssr";
import { sendMagicLink, type LoginState } from "./actions";

export function LoginForm({ initialError }: { initialError?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(sendMagicLink, { error: initialError });

  if (state.sent) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-emerald-50 text-emerald-600">
          <PaperPlaneTiltIcon className="size-6" weight="duotone" />
        </span>
        <p className="font-medium text-zinc-900">Check your email</p>
        <p className="text-sm text-zinc-500">We sent a sign-in link to {state.sent}</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-3">
      <label className="relative block">
        <EnvelopeSimpleIcon className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-zinc-400" />
        <input
          name="email"
          type="email"
          required
          autoFocus
          placeholder="you@company.com"
          className="h-12 w-full rounded-xl border border-zinc-200 bg-white pl-11 pr-4 text-sm outline-none placeholder:text-zinc-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
        />
      </label>
      {state.error ? <p className="text-sm text-rose-600">{state.error}</p> : null}
      <button
        disabled={pending}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
      >
        {pending ? <SpinnerGapIcon className="size-5 animate-spin" /> : <>Email me a sign-in link <ArrowRightIcon className="size-4" weight="bold" /></>}
      </button>
    </form>
  );
}
