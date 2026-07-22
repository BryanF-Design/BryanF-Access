"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Copy, Eye, EyeOff, Trash2 } from "lucide-react";
import {
  createClientCredential,
  deleteClientCredential,
  revealClientCredentialSecret,
  updateClientProfile,
  type ActionState,
} from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { fieldStyles, fieldStylesSm, labelStyles } from "@/components/ui/field";
import type { Client, ClientCredential } from "@/types/database";

const initialState: ActionState = { ok: true, message: "" };

export type CredentialSummary = Pick<
  ClientCredential,
  "id" | "client_id" | "label" | "provider" | "login_url" | "username" | "notes" | "created_at"
> & {
  has_secret: boolean;
};

function FieldError({ state }: { state: ActionState }) {
  if (state.ok || !state.message) return null;
  return (
    <p role="alert" className="text-sm text-rose">
      {state.message}
    </p>
  );
}

function SuccessMessage({ state }: { state: ActionState }) {
  if (!state.ok || !state.message) return null;
  return <p className="text-sm text-lime">{state.message}</p>;
}

function useResetOnSuccess(state: ActionState, formRef: React.RefObject<HTMLFormElement | null>) {
  const submitted = useRef(false);
  useEffect(() => {
    if (submitted.current && state.ok) {
      formRef.current?.reset();
    }
    submitted.current = true;
  }, [state, formRef]);
}

export function EditClientForm({ client }: { client: Client }) {
  const [state, formAction, pending] = useActionState(updateClientProfile, initialState);

  return (
    <Card variant="surface" padding="lg" className="grid gap-4">
      <form action={formAction} className="grid gap-4">
        <input type="hidden" name="clientId" value={client.id} />

        <div>
          <p className="font-display text-lg font-semibold text-paper">Expediente del cliente</p>
          <p className="mt-1 text-sm text-paper-dim">Datos base para proyectos, contacto y entregas.</p>
        </div>

        <div>
          <label htmlFor="fullName" className={labelStyles}>
            Nombre del contacto
          </label>
          <input
            id="fullName"
            name="fullName"
            required
            defaultValue={client.full_name}
            className={fieldStyles}
          />
        </div>

        <div>
          <label htmlFor="company" className={labelStyles}>
            Empresa
          </label>
          <input id="company" name="company" defaultValue={client.company ?? ""} className={fieldStyles} />
        </div>

        <div>
          <label htmlFor="email" className={labelStyles}>
            Correo de acceso
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            defaultValue={client.email}
            className={fieldStyles}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="phone" className={labelStyles}>
              Telefono
            </label>
            <input id="phone" name="phone" type="tel" defaultValue={client.phone ?? ""} className={fieldStyles} />
          </div>
          <div>
            <label htmlFor="country" className={labelStyles}>
              Pais
            </label>
            <input id="country" name="country" defaultValue={client.country ?? ""} className={fieldStyles} />
          </div>
        </div>

        <div>
          <label htmlFor="industry" className={labelStyles}>
            Rubro o rama
          </label>
          <input
            id="industry"
            name="industry"
            defaultValue={client.industry ?? ""}
            placeholder="Arquitectura, salud, ecommerce..."
            className={fieldStyles}
          />
        </div>

        <div>
          <label htmlFor="driveUrl" className={labelStyles}>
            Drive principal
          </label>
          <input
            id="driveUrl"
            name="driveUrl"
            type="url"
            defaultValue={client.drive_url ?? ""}
            placeholder="https://drive.google.com/..."
            className={fieldStyles}
          />
        </div>

        <div>
          <label htmlFor="notes" className={labelStyles}>
            Notas internas
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            defaultValue={client.notes ?? ""}
            className={fieldStyles}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" variant="primary" size="md" disabled={pending}>
            {pending ? "Guardando..." : "Guardar cliente"}
          </Button>
          <SuccessMessage state={state} />
          <FieldError state={state} />
        </div>
      </form>
    </Card>
  );
}

export function NewClientCredentialForm({ clientId }: { clientId: string }) {
  const [state, formAction, pending] = useActionState(createClientCredential, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useResetOnSuccess(state, formRef);

  return (
    <Card variant="dashed" padding="sm">
      <form ref={formRef} action={formAction} className="grid gap-3">
        <input type="hidden" name="clientId" value={clientId} />
        <div className="grid gap-3 sm:grid-cols-2">
          <input name="label" required placeholder="Host, dominio, cPanel..." className={fieldStylesSm} />
          <input name="provider" placeholder="Proveedor" className={fieldStylesSm} />
        </div>
        <input name="loginUrl" type="url" placeholder="https://panel.host.com" className={fieldStylesSm} />
        <div className="grid gap-3 sm:grid-cols-2">
          <input name="username" placeholder="Usuario" autoComplete="off" className={fieldStylesSm} />
          <input
            name="secret"
            type="password"
            placeholder="Password o secreto"
            autoComplete="new-password"
            className={fieldStylesSm}
          />
        </div>
        <input name="notes" placeholder="Notas privadas" className={fieldStylesSm} />
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" variant="secondary" size="sm" disabled={pending}>
            {pending ? "Guardando..." : "Agregar acceso"}
          </Button>
          <SuccessMessage state={state} />
          <FieldError state={state} />
        </div>
      </form>
    </Card>
  );
}

function RevealSecretForm({ credential }: { credential: CredentialSummary }) {
  const [state, formAction, pending] = useActionState(revealClientCredentialSecret, initialState);
  const [copied, setCopied] = useState(false);

  async function copySecret() {
    if (!state.secret) return;
    await navigator.clipboard.writeText(state.secret);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  if (!credential.has_secret) {
    return <span className="font-ledger text-xs text-paper-dim">Sin secreto</span>;
  }

  return (
    <div className="grid gap-2">
      <form action={formAction} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="credentialId" value={credential.id} />
        <input type="hidden" name="clientId" value={credential.client_id} />
        <Button type="submit" variant="secondary" size="sm" disabled={pending}>
          {state.secret ? (
            <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {pending ? "Revisando..." : state.secret ? "Revelado" : "Revelar"}
        </Button>
      </form>
      {state.secret && (
        <div className="flex min-w-0 items-center gap-2 rounded-lg border border-hairline bg-ink px-2 py-2">
          <input
            readOnly
            value={state.secret}
            className="min-w-0 flex-1 bg-transparent font-ledger text-xs text-paper outline-none"
          />
          <button
            type="button"
            onClick={copySecret}
            className="inline-flex min-h-9 items-center gap-1 rounded-md px-2 text-xs text-lime transition hover:bg-lime-dim"
          >
            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            {copied ? "Copiado" : "Copiar"}
          </button>
        </div>
      )}
      <FieldError state={state} />
    </div>
  );
}

export function ClientCredentialList({
  clientId,
  credentials,
}: {
  clientId: string;
  credentials: CredentialSummary[];
}) {
  if (credentials.length === 0) {
    return <EmptyState title="Todavia no hay accesos privados guardados." className="px-6 py-8" />;
  }

  return (
    <div className="grid gap-3">
      {credentials.map((credential) => (
        <Card key={credential.id} variant="surface" padding="sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium text-paper">{credential.label}</p>
              {credential.provider && <p className="text-sm text-paper-dim">{credential.provider}</p>}
              {credential.username && (
                <p className="mt-1 font-ledger text-xs text-paper-dim">Usuario: {credential.username}</p>
              )}
            </div>
            <form action={deleteClientCredential}>
              <input type="hidden" name="credentialId" value={credential.id} />
              <input type="hidden" name="clientId" value={clientId} />
              <button
                type="submit"
                aria-label="Eliminar acceso"
                className="text-paper-dim transition hover:text-rose"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </form>
          </div>
          {credential.login_url && (
            <a
              href={credential.login_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block break-all font-ledger text-xs text-lime hover:text-lime-deep"
            >
              {credential.login_url}
            </a>
          )}
          {credential.notes && <p className="mt-3 text-sm text-paper-dim">{credential.notes}</p>}
          <div className="mt-4">
            <RevealSecretForm credential={credential} />
          </div>
        </Card>
      ))}
    </div>
  );
}
