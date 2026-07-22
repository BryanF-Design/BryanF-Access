import { Plus, TrendingUp, Users, Wallet } from "lucide-react";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { DashboardProjectsPanel, type DashboardProject } from "./dashboard-projects-panel";
import type { Client, Payment, Project } from "@/types/database";

function monthlyTotals(payments: Payment[]) {
  const now = new Date();
  const keys: string[] = [];
  const buckets = new Map<string, number>();

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    keys.push(key);
    buckets.set(key, 0);
  }

  for (const payment of payments) {
    const date = new Date(payment.paid_at);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + Number(payment.amount));
    }
  }

  return keys.map((key) => buckets.get(key) ?? 0);
}

export default async function AdminDashboard() {
  await requireAdmin();
  const service = createServiceRoleClient();

  const [{ data: projectsData }, { data: clientsData }, { data: paymentsData }] = await Promise.all([
    service.from("projects").select("*").order("target_end_date", { ascending: true }),
    service.from("clients").select("*"),
    service.from("payments").select("*"),
  ]);

  const projects = (projectsData ?? []) as Project[];
  const clients = (clientsData ?? []) as Client[];
  const payments = (paymentsData ?? []) as Payment[];

  const clientsById = new Map(clients.map((c) => [c.id, c]));
  const paidByProject = new Map<string, number>();
  for (const payment of payments) {
    paidByProject.set(
      payment.project_id,
      (paidByProject.get(payment.project_id) ?? 0) + Number(payment.amount),
    );
  }

  const activeProjects = projects.filter(
    (p) => p.status !== "completado" && p.status !== "pausado",
  );
  const totalPendiente = activeProjects.reduce((sum, p) => {
    const paid = paidByProject.get(p.id) ?? 0;
    return sum + Math.max(0, Number(p.total_price) - paid);
  }, 0);

  const monthly = monthlyTotals(payments);
  const totalCobrado = monthly.reduce((sum, value) => sum + value, 0);
  const lastMonth = monthly[monthly.length - 1] ?? 0;
  const prevMonth = monthly[monthly.length - 2] ?? 0;

  let cobradoDelta: { label: string; tone: "positive" | "negative" | "neutral" } = {
    label: "Sin cambios vs mes anterior",
    tone: "neutral",
  };
  if (prevMonth === 0 && lastMonth > 0) {
    cobradoDelta = { label: "Nuevo este mes", tone: "positive" };
  } else if (prevMonth > 0) {
    const pct = Math.round(((lastMonth - prevMonth) / prevMonth) * 100);
    if (pct !== 0) {
      cobradoDelta = {
        label: `${pct > 0 ? "+" : ""}${pct}% vs mes anterior`,
        tone: pct > 0 ? "positive" : "negative",
      };
    }
  }

  const dashboardProjects: DashboardProject[] = projects.map((project) => {
    const paid = paidByProject.get(project.id) ?? 0;
    const client = clientsById.get(project.client_id);
    return {
      id: project.id,
      name: project.name,
      status: project.status,
      currency: project.currency,
      totalPrice: Number(project.total_price),
      paid,
      remaining: Math.max(0, Number(project.total_price) - paid),
      targetEndDate: project.target_end_date,
      clientId: client?.id ?? null,
      clientName: client ? (client.company ?? client.full_name) : "Sin cliente",
    };
  });

  return (
    <div>
      <PageHeader
        eyebrow="Bitácora"
        title="Panel"
        description="Vista rápida de clientes, proyectos activos y cobranza."
        actions={
          <Link href="/admin/clientes/nuevo">
            <Button variant="primary" size="md">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Nuevo cliente
            </Button>
          </Link>
        }
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Clientes" value={String(clients.length)} accent="lime" />
        <StatCard
          icon={TrendingUp}
          label="Proyectos activos"
          value={String(activeProjects.length)}
          accent="sky"
        />
        <StatCard
          icon={Wallet}
          label="Pendiente de cobro"
          value={formatCurrency(totalPendiente, "MXN")}
          accent="amber"
        />
        <StatCard
          icon={Wallet}
          label="Cobrado (6 meses)"
          value={formatCurrency(totalCobrado, "MXN")}
          delta={cobradoDelta}
          sparkline={monthly}
          accent="lime"
        />
      </div>

      <h2 className="mb-4 mt-10 font-display text-lg font-semibold text-paper">
        Proyectos por entrega
      </h2>

      <DashboardProjectsPanel projects={dashboardProjects} />
    </div>
  );
}
