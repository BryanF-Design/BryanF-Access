import Link from "next/link";
import { ArrowRight, FileText, FolderKanban, FolderOpen, MessageCircle, Receipt, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StatusPill } from "@/components/status-pill";
import { PaymentHistory } from "@/components/payment-history";
import { SubscriptionCard } from "@/components/subscription-card";
import { formatCurrency } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { WHATSAPP_LINK } from "@/lib/brand";
import { briefLink, isApproved, rowsOrEmpty } from "@/lib/account";
import type { Client, Payment, Project, Subscription } from "@/types/database";

/**
 * Inicio de la cuenta del cliente: su suscripción (si tiene), sus proyectos,
 * sus últimos pagos y accesos rápidos. La cuenta se crea sola al comprar o
 * suscribirse en bryanfdesign.com.
 */
export default async function AccountHomePage() {
  const supabase = await createClient();

  const [{ data: client }, { data: projects }, subscriptionsResult, paymentsResult] = await Promise.all([
    supabase.from("clients").select("*").maybeSingle<Client>(),
    supabase.from("projects").select("*").order("created_at", { ascending: false }).returns<Project[]>(),
    supabase.from("subscriptions").select("*").order("created_at", { ascending: false }).returns<Subscription[]>(),
    supabase.from("payments").select("*").order("paid_at", { ascending: false }).returns<Payment[]>(),
  ]);

  const projectList = projects ?? [];
  const subscriptions = rowsOrEmpty(subscriptionsResult);
  const payments = rowsOrEmpty(paymentsResult);
  const subscription = subscriptions.find((s) => s.status !== "cancelada") ?? subscriptions[0] ?? null;

  const paidByProject = new Map<string, number>();
  for (const payment of payments) {
    if (!payment.project_id || !isApproved(payment)) continue;
    paidByProject.set(payment.project_id, (paidByProject.get(payment.project_id) ?? 0) + Number(payment.amount));
  }
  const projectNames = new Map(projectList.map((p) => [p.id, p.name]));
  const totalPaid = payments.filter(isApproved).reduce((sum, p) => sum + Number(p.amount), 0);
  const pending = payments.filter((p) => p.status === "pendiente");
  const lastPayment = payments.find((p) => isApproved(p) && p.provider_ref);

  const firstName = (client?.full_name ?? "").trim().split(/\s+/)[0];
  const hasAnything = projectList.length > 0 || subscription !== null || payments.length > 0;

  return (
    <div className="space-y-10">
      {/* Saludo */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="font-ledger text-xs uppercase tracking-[0.24em] text-lime">Tu cuenta</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-paper sm:text-4xl">
            {firstName ? `Hola, ${firstName}` : "Hola"}
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-paper-dim">
            {client?.company ? `${client.company} · ` : ""}
            Aquí ves tus proyectos, tu suscripción y tus pagos con BryanF Design.
          </p>
        </div>
        {payments.length > 0 && (
          <div className="flex gap-3">
            <Card variant="surface" padding="sm" className="min-w-36">
              <p className="flex items-center gap-1.5 text-xs text-paper-dim">
                <Wallet className="size-3.5" aria-hidden="true" />
                Pagado a la fecha
              </p>
              <p className="mt-1 font-ledger text-lg tabular-nums text-paper">{formatCurrency(totalPaid)}</p>
            </Card>
            {pending.length > 0 && (
              <Card variant="surface" padding="sm" className="min-w-36 border-amber/40">
                <p className="text-xs text-amber">Pagos pendientes</p>
                <p className="mt-1 font-ledger text-lg tabular-nums text-paper">{pending.length}</p>
              </Card>
            )}
          </div>
        )}
      </header>

      {!hasAnything && (
        <EmptyState
          icon={FolderKanban}
          title="Estamos preparando tu cuenta"
          description="En cuanto se confirme tu pago o arranque tu proyecto, aparecerá aquí. Si ya pagaste, puede tardar unos minutos."
          action={
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg border border-hairline px-4 text-sm text-paper transition hover:border-lime hover:text-lime"
            >
              <MessageCircle className="size-4" aria-hidden="true" />
              Escribir por WhatsApp
            </a>
          }
        />
      )}

      {subscription && <SubscriptionCard subscription={subscription} />}

      {/* Proyectos */}
      {projectList.length > 0 && (
        <section aria-labelledby="projects-title">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="projects-title" className="font-display text-xl font-semibold text-paper">
              {projectList.length === 1 ? "Tu proyecto" : "Tus proyectos"}
            </h2>
            <p className="text-xs text-paper-dim">Cronograma, entregables y saldo</p>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {projectList.map((project) => {
              const paid = paidByProject.get(project.id) ?? 0;
              const total = Number(project.total_price);
              const pct = total > 0 ? Math.min(100, (paid / total) * 100) : 0;
              return (
                <Link key={project.id} href={`/proyecto/${project.id}`} className="group block">
                  <Card
                    variant="surface"
                    padding="lg"
                    className="h-full transition group-hover:border-lime group-hover:shadow-soft"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-display text-lg font-semibold text-paper group-hover:text-lime">
                        {project.name}
                      </h3>
                      <StatusPill status={project.status} />
                    </div>
                    {project.summary && <p className="mt-2 line-clamp-2 text-sm text-paper-dim">{project.summary}</p>}
                    <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-ink">
                      <div className="h-full rounded-full bg-lime" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <p className="font-ledger text-xs text-paper-dim">
                        {formatCurrency(paid, project.currency)} de {formatCurrency(total, project.currency)}
                      </p>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-lime">
                        Ver proyecto <ArrowRight className="size-3.5" aria-hidden="true" />
                      </span>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Pagos recientes */}
      {payments.length > 0 && (
        <section aria-labelledby="payments-title">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="payments-title" className="font-display text-xl font-semibold text-paper">
              Pagos recientes
            </h2>
            <Link href="/pagos" className="inline-flex items-center gap-1 text-sm text-lime hover:text-lime-deep">
              Ver todos <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-4">
            <PaymentHistory payments={payments} projectNames={projectNames} limit={5} />
          </div>
        </section>
      )}

      {/* Accesos rápidos */}
      {hasAnything && (
        <section aria-labelledby="shortcuts-title">
          <h2 id="shortcuts-title" className="sr-only">
            Accesos rápidos
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <QuickLink
              href={briefLink({ provider: lastPayment?.provider, providerRef: lastPayment?.provider_ref })}
              icon={FileText}
              title="Mi brief"
              text="Cuéntanos de tu negocio o actualízalo."
              external
            />
            <QuickLink
              href={client?.drive_url || WHATSAPP_LINK}
              icon={client?.drive_url ? FolderOpen : MessageCircle}
              title={client?.drive_url ? "Mi carpeta en Drive" : "Hablar con Bryan"}
              text={client?.drive_url ? "Materiales y archivos del proyecto." : "Dudas, cambios o nuevas ideas."}
              external
            />
            <QuickLink href="/pagos" icon={Receipt} title="Mis pagos" text="Historial y comprobantes." />
          </div>
        </section>
      )}
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  title,
  text,
  external,
}: {
  href: string;
  icon: typeof FileText;
  title: string;
  text: string;
  external?: boolean;
}) {
  const content = (
    <Card variant="surface" padding="md" className="flex h-full items-start gap-3 transition group-hover:border-lime">
      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-lime/15 text-lime">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <span>
        <span className="block text-sm font-medium text-paper group-hover:text-lime">{title}</span>
        <span className="mt-0.5 block text-xs text-paper-dim">{text}</span>
      </span>
    </Card>
  );
  return external ? (
    <a href={href} target="_blank" rel="noreferrer" className="group block">
      {content}
    </a>
  ) : (
    <Link href={href} className="group block">
      {content}
    </Link>
  );
}
