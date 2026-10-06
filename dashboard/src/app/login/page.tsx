import { redirect } from "next/navigation";
import { HeadsetIcon } from "@phosphor-icons/react/ssr";
import { demoMode } from "@/lib/store";
import { LoginForm } from "./login-form";

const ERRORS: Record<string, string> = {
  enlace: "El enlace expiró o ya se usó. Pide uno nuevo.",
  "sin-acceso": "Tu cuenta aún no tiene ningún workspace asignado.",
};

export default async function LoginPage(props: PageProps<"/login">) {
  if (demoMode) redirect("/");
  const { error } = await props.searchParams;

  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-indigo-600 text-white">
            <HeadsetIcon className="size-6" weight="fill" />
          </span>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">CallSupporter AI</h1>
          <p className="text-sm text-zinc-500">Entra con el email con el que te invitaron</p>
        </div>
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-6">
          <LoginForm initialError={typeof error === "string" ? ERRORS[error] : undefined} />
        </div>
      </div>
    </main>
  );
}
