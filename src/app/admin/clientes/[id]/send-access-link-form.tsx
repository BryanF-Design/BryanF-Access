"use client";

import { useActionState } from "react";
import { Mail } from "lucide-react";
import { sendClientAccessLink, type ActionState } from "@/app/admin/actions";

const initialState: ActionState = { ok: true, message: "" };

export function SendAccessLinkForm({ clientId }: { clientId: string }) {
  const [state, formAction, pending] = useActionState(sendClientAccessLink, initialState);

  return (
    <form action={formAction} className="grid gap-2">
      <input type="hidden" name="clientId" value={clientId} />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-hairline px-4 py-2 text-sm font-medium text-paper transition hover:border-lime hover:text-lime disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Mail className="h-4 w-4" aria-hidden="true" />
        {pending ? "Enviando..." : "Enviar acceso"}
      </button>
      {state.message && (
        <p
          role={state.ok ? "status" : "alert"}
          className={`max-w-64 text-xs ${state.ok ? "text-lime" : "text-rose"}`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
