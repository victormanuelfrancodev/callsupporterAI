"use client";

import { useActionState } from "react";
import { WarningCircleIcon } from "@phosphor-icons/react/ssr";

type Result = { error?: string };

/** <form> for server actions that return { error } instead of throwing. */
export function ActionForm({ action, className, children }: {
  action: (form: FormData) => Promise<Result>;
  className?: string;
  children: React.ReactNode;
}) {
  const [state, formAction] = useActionState<Result, FormData>(async (_, form) => action(form), {});
  return (
    <form action={formAction} className={className}>
      {children}
      {state.error ? (
        <p className="flex items-center justify-end gap-1.5 text-sm text-rose-600">
          <WarningCircleIcon className="size-4" weight="duotone" /> {state.error}
        </p>
      ) : null}
    </form>
  );
}
