import { ArrowUpRight, CalendarClock, CreditCard, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { PROVIDER_LABEL, SITE_URL, SUBSCRIPTION_STATUS, briefLink } from "@/lib/account";
import { WHATSAPP_LINK } from "@/lib/brand";
import type { Subscription } from "@/types/database";

/** Tarjeta principal de la suscripción Todo Digital del cliente. */
export function SubscriptionCard({ subscription }: { subscription: Subscription }) {
  const status = SUBSCRIPTION_STATUS[subscription.status] ?? SUBSCRIPTION_STATUS.activa;
  const cancelled = subscription.status === "cancelada";
  const dueLabel = cancelled ? "Acceso hasta" : "Próximo cobro";
  const dueDate = cancelled ? subscription.ends_at : subscription.next_charge_at;

  return (
    <section
      aria-labelledby="subscription-title"
      className="relative overflow-hidden rounded-card border border-hairline bg-ink-raised shadow-soft"
    >
      <div className="mesh-glow pointer-events-none absolute inset-0 opacity-70" aria-hidden="true" />
      <div className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex size-9 items-center justify-center rounded-lg bg-lime/15 text-lime">
              <Sparkles className="size-4" aria-hidden="true" />
            </span>
            <p className="font-ledger text-xs uppercase tracking-[0.24em] text-lime">Tu suscripción</p>
            <Badge tone={status.tone}>{status.label}</Badge>
          </div>
          <h2 id="subscription-title" className="mt-4 font-display text-2xl font-semibold text-paper sm:text-3xl">
            {subscription.plan}
          </h2>
          <p className="mt-2 max-w-md text-sm text-paper-dim">{status.note}</p>

          <div className="mt-6 flex flex-wrap gap-2.5">
            {!cancelled && (
              <a
                href={`${WHATSAPP_LINK.split("?")[0]}?text=${encodeURIComponent("Hola Bryan, tengo una nueva solicitud: ")}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-lime px-5 text-sm font-semibold text-ink shadow-glow transition hover:bg-lime-deep"
              >
                Mandar una solicitud
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </a>
            )}
            <a
              href={briefLink({ provider: subscription.provider, providerRef: subscription.provider_ref, subscription: true })}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-hairline px-5 text-sm font-medium text-paper transition hover:border-lime hover:text-lime"
            >
              Mi brief
            </a>
            {cancelled ? (
              <a
                href={`${SITE_URL}/suscripcion`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center gap-2 rounded-lg border border-hairline px-5 text-sm font-medium text-paper transition hover:border-lime hover:text-lime"
              >
                Volver a suscribirme
              </a>
            ) : (
              subscription.manage_url && (
                <a
                  href={subscription.manage_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 items-center gap-2 rounded-lg border border-hairline px-5 text-sm font-medium text-paper transition hover:border-lime hover:text-lime"
                >
                  <CreditCard className="size-4" aria-hidden="true" />
                  {subscription.status === "pendiente_pago" ? "Actualizar mi tarjeta" : "Administrar pago"}
                </a>
              )
            )}
          </div>
        </div>

        <dl className="grid content-start gap-3 rounded-card border border-hairline bg-ink/60 p-5 text-sm">
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-paper-dim">Mensualidad</dt>
            <dd className="font-ledger text-xl font-medium tabular-nums text-paper">
              {formatCurrency(Number(subscription.amount), subscription.currency)}
            </dd>
          </div>
          <div className="h-px bg-hairline" />
          <div className="flex items-baseline justify-between gap-3">
            <dt className="flex items-center gap-1.5 text-paper-dim">
              <CalendarClock className="size-3.5" aria-hidden="true" />
              {dueLabel}
            </dt>
            <dd className="text-right text-paper">{dueDate ? formatDate(dueDate) : "—"}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-paper-dim">Método</dt>
            <dd className="text-right text-paper">{PROVIDER_LABEL[subscription.provider] ?? subscription.provider}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-paper-dim">Cliente desde</dt>
            <dd className="text-right text-paper">{formatDate(subscription.started_at)}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
