"use client";

import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { CheckIcon, FloppyDiskIcon, SpinnerGapIcon } from "@phosphor-icons/react/ssr";
import { btn } from "../ui";

/** Submit button that shows a spinner while saving and a check once done. */
export function SaveButton({ label = "Guardar cambios", className }: { label?: string; className?: string }) {
  const { pending } = useFormStatus();
  const [saved, setSaved] = useState(false);
  const was = useRef(false);
  useEffect(() => {
    if (was.current && !pending) {
      setSaved(true);
      const t = setTimeout(() => setSaved(false), 2000);
      return () => clearTimeout(t);
    }
    was.current = pending;
  }, [pending]);

  return (
    <button disabled={pending} className={clsx(btn.primary, className)}>
      {pending ? (
        <SpinnerGapIcon className="size-4 animate-spin" />
      ) : saved ? (
        <CheckIcon className="size-4" weight="bold" />
      ) : (
        <FloppyDiskIcon className="size-4" weight="duotone" />
      )}
      {saved ? "Guardado" : label}
    </button>
  );
}
