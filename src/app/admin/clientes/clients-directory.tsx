"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BriefcaseBusiness, Globe2, Phone, Search, Users, type LucideIcon } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export interface ClientDirectoryEntry {
  id: string;
  name: string;
  fullName: string;
  email: string;
  industry: string | null;
  country: string | null;
  phone: string | null;
  projectCount: number;
}

function Tag({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-pill border border-hairline px-2 py-1 text-[11px] text-paper-dim">
      <Icon className="h-3 w-3 text-lime" aria-hidden="true" />
      {children}
    </span>
  );
}

export function ClientsDirectory({ clients }: { clients: ClientDirectoryEntry[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((client) =>
      [client.name, client.fullName, client.email, client.industry, client.country]
        .filter((field): field is string => Boolean(field))
        .some((field) => field.toLowerCase().includes(q)),
    );
  }, [clients, query]);

  if (clients.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Todavía no has dado de alta ningún cliente"
        description="Da de alta tu primer cliente para empezar a organizar sus proyectos."
      />
    );
  }

  return (
    <div>
      <div className="relative max-w-sm">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-paper-dim"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por nombre, empresa o correo..."
          className="w-full rounded-lg border border-hairline bg-ink-raised px-4 py-2.5 pl-10 text-sm text-paper outline-none transition placeholder:text-paper-dim/60 focus:border-lime focus:ring-2 focus:ring-lime/30"
        />
      </div>
      <p className="mt-3 text-xs text-paper-dim">
        {filtered.length} de {clients.length} cliente{clients.length === 1 ? "" : "s"}
      </p>

      {filtered.length === 0 ? (
        <EmptyState
          title="Sin resultados"
          description={`No encontramos clientes que coincidan con "${query}".`}
          className="mt-4"
        />
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {filtered.map((client) => (
            <Link key={client.id} href={`/admin/clientes/${client.id}`} className="group block">
              <Card
                variant="surface"
                padding="lg"
                className="h-full transition group-hover:border-lime group-hover:shadow-soft"
              >
                <div className="flex items-start gap-3">
                  <Avatar name={client.name} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-paper">{client.name}</p>
                    {client.name !== client.fullName && (
                      <p className="truncate text-sm text-paper-dim">{client.fullName}</p>
                    )}
                    <p className="mt-0.5 truncate font-ledger text-xs text-paper-dim">
                      {client.email}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {client.industry && <Tag icon={BriefcaseBusiness}>{client.industry}</Tag>}
                  {client.country && <Tag icon={Globe2}>{client.country}</Tag>}
                  {client.phone && <Tag icon={Phone}>{client.phone}</Tag>}
                </div>

                <p className="mt-3 font-ledger text-xs text-lime">
                  {client.projectCount} proyecto{client.projectCount === 1 ? "" : "s"}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
