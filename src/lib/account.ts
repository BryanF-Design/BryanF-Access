import type { Payment, PaymentStatus, Subscription, SubscriptionStatus } from "@/types/database";

/** Sitio público (compras, brief, suscripción). */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.bryanfdesign.com").replace(/\/$/, "");

export const PROVIDER_LABEL: Record<string, string> = {
  stripe: "Tarjeta (Stripe)",
  mercadopago: "Mercado Pago",
  transfer: "Transferencia",
  manual: "Registro manual",
};

export const PAYMENT_STATUS: Record<PaymentStatus, { label: string; tone: "lime" | "amber" | "rose" | "neutral" }> = {
  aprobado: { label: "Pagado", tone: "lime" },
  pendiente: { label: "Pendiente", tone: "amber" },
  rechazado: { label: "Rechazado", tone: "rose" },
  reembolsado: { label: "Reembolsado", tone: "neutral" },
};

export const SUBSCRIPTION_STATUS: Record<
  SubscriptionStatus,
  { label: string; tone: "lime" | "amber" | "rose" | "neutral"; note: string }
> = {
  activa: { label: "Activa", tone: "lime", note: "Puedes mandar solicitudes cuando quieras." },
  pendiente_pago: {
    label: "Pago pendiente",
    tone: "amber",
    note: "No pasó el último cobro. Actualiza tu método de pago para no pausar tus solicitudes.",
  },
  pausada: { label: "Pausada", tone: "neutral", note: "Tus solicitudes están en pausa." },
  cancelada: { label: "Cancelada", tone: "rose", note: "Ya no se harán más cobros." },
};

/** Un pago sin estado (registros anteriores) cuenta como aprobado. */
export function isApproved(payment: Pick<Payment, "status">) {
  return !payment.status || payment.status === "aprobado";
}

/** Folio visible: el del pago o uno derivado de su referencia. */
export function paymentFolio(payment: Pick<Payment, "folio" | "provider_ref" | "id">) {
  if (payment.folio) return payment.folio;
  const tail = (payment.provider_ref || payment.id).replace(/[^a-zA-Z0-9]/g, "").slice(-8).toUpperCase();
  return `BF-${tail}`;
}

/**
 * Enlace a "Armar mi brief" del sitio, verificado con el pago o la suscripción
 * (mismo formato que lib/brief-access.ts del sitio). Sin referencia, cae a la
 * página general.
 */
export function briefLink(ref?: { provider?: string | null; providerRef?: string | null; subscription?: boolean }) {
  const base = `${SITE_URL}/armar-mi-brief`;
  if (!ref?.providerRef || !ref.provider) return base;
  const id = encodeURIComponent(ref.providerRef);
  if (ref.provider === "stripe") return `${base}?provider=stripe&session_id=${id}`;
  if (ref.provider === "mercadopago") {
    return ref.subscription ? `${base}?provider=mercadopago&preapproval_id=${id}` : `${base}?provider=mercadopago&payment_id=${id}`;
  }
  return base;
}

/** Tablas nuevas que pueden no existir aún: un error se trata como "sin datos". */
export function rowsOrEmpty<T>(result: { data: T[] | null; error: unknown }): T[] {
  return result.error ? [] : (result.data ?? []);
}

export type { Payment, Subscription };
