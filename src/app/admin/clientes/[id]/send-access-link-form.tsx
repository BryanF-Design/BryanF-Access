"use client";

import { useActionState } from "react";
import { Copy, Mail } from "lucide-react";
import { sendClientAccessLink, type ActionState } from "@/app/admin/actions";

const initialState: ActionState = { ok: true, message: "" };

export function SendAccessLinkForm({ clientId }: { clientId: string }) {
  const [state, formAction, pending] = useActionState(sendClientAccessLink, initialState);

  async function copyAccessLink() {
    if (!state.accessLink) return;
    await navigator.clipboard.writeText(state.accessLink);
  }

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
      {state.accessLink && (
        <div className="grid max-w-sm gap-2">
          <input
            readOnly
            value={state.accessLink}
            className="w-full rounded-lg border border-hairline bg-ink px-3 py-2 text-xs text-paper outline-none"
            onFocus={(event) => event.currentTarget.select()}
          />
          <button
            type="button"
            onClick={copyAccessLink}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-lime px-3 py-2 text-xs font-medium text-ink transition hover:bg-lime-deep"
          >
            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            Copiar enlace manual
          </button>
        </div>
      )}
    </form>
  );
}
