"use client";

import { useActionState } from "react";
import { Copy, Mail } from "lucide-react";
import { sendClientAccessLink, type ActionState } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";

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
      <div className="flex flex-wrap gap-2">
        <Button type="submit" name="mode" value="email" variant="secondary" size="md" disabled={pending}>
          <Mail className="h-4 w-4" aria-hidden="true" />
          {pending ? "Enviando..." : "Enviar correo"}
        </Button>
        <Button type="submit" name="mode" value="manual" variant="secondary" size="md" disabled={pending}>
          <Copy className="h-4 w-4" aria-hidden="true" />
          Generar enlace
        </Button>
      </div>
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
          <Button type="button" variant="primary" size="sm" onClick={copyAccessLink}>
            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            Copiar enlace manual
          </Button>
        </div>
      )}
    </form>
  );
}
