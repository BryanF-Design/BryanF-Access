"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { createServiceRoleClient } from "@/lib/supabase/server";

export interface ActionState {
  ok: boolean;
  message: string;
}

const newClientSchema = z.object({
  fullName: z.string().trim().min(1, "Escribe el nombre del contacto."),
  company: z.string().trim().optional(),
  email: z.string().trim().email("Escribe un correo válido."),
});

const sendClientAccessSchema = z.object({
  clientId: z.string().uuid("Cliente inválido."),
});

function toOrigin(value: string | null) {
  if (!value) return null;

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function getAuthCallbackUrl() {
  const origin =
    toOrigin(process.env.NEXT_PUBLIC_SITE_URL ?? null) ??
    toOrigin(
      process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : null,
    ) ??
    toOrigin(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ??
    "http://localhost:3001";

  return `${origin}/auth/callback`;
}

function humanizeAuthEmailError(message: string) {
  const lower = message.toLowerCase();

  if (lower.includes("email address not authorized")) {
    return "Supabase no está enviando a correos externos. Configura SMTP personalizado en Supabase Auth.";
  }

  if (lower.includes("rate limit") || lower.includes("too many")) {
    return "Supabase limitó el envío. Espera un minuto e intenta de nuevo.";
  }

  return "No se pudo enviar el enlace. Revisa la configuración de Auth/SMTP en Supabase.";
}

export async function createClientAccount(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = newClientSchema.safeParse({
    fullName: formData.get("fullName"),
    company: formData.get("company"),
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  }

  const { fullName, company, email } = parsed.data;
  const service = createServiceRoleClient();

  // Creates the auth identity only — no email is sent from here. The client
  // requests their own access link from /login once they have an account.
  const { data: created, error: createError } = await service.auth.admin.createUser({
    email,
    email_confirm: true,
  });

  if (createError || !created.user) {
    const alreadyExists = createError?.message?.toLowerCase().includes("already");
    return {
      ok: false,
      message: alreadyExists
        ? "Ya existe una cuenta con ese correo."
        : "No se pudo crear la cuenta. Intenta de nuevo.",
    };
  }

  const { data: client, error: insertError } = await service
    .from("clients")
    .insert({
      auth_user_id: created.user.id,
      full_name: fullName,
      company: company || null,
      email,
    })
    .select("id")
    .single();

  if (insertError || !client) {
    // Roll back the orphaned auth user so retrying doesn't hit "already registered".
    await service.auth.admin.deleteUser(created.user.id);
    return { ok: false, message: "No se pudo guardar el cliente. Intenta de nuevo." };
  }

  redirect(`/admin/clientes/${(client as { id: string }).id}`);
}

export async function sendClientAccessLink(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = sendClientAccessSchema.safeParse({
    clientId: formData.get("clientId"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Cliente inválido." };
  }

  const service = createServiceRoleClient();
  const { data: client } = await service
    .from("clients")
    .select("id, email")
    .eq("id", parsed.data.clientId)
    .maybeSingle<{ id: string; email: string }>();

  if (!client) {
    return { ok: false, message: "No encontramos ese cliente." };
  }

  const { error } = await service.auth.signInWithOtp({
    email: client.email,
    options: {
      emailRedirectTo: getAuthCallbackUrl(),
      shouldCreateUser: false,
    },
  });

  await service.from("audit_log").insert({
    actor_email: null,
    event: error ? "admin_access_link_failed" : "admin_access_link_sent",
    metadata: { client_id: client.id, client_email: client.email, error: error?.message ?? null },
  });

  if (error) {
    return { ok: false, message: humanizeAuthEmailError(error.message) };
  }

  return { ok: true, message: `Enlace enviado a ${client.email}.` };
}

const newProjectSchema = z.object({
  clientId: z.string().uuid("Selecciona un cliente."),
  name: z.string().trim().min(1, "Escribe el nombre del proyecto."),
  summary: z.string().trim().optional(),
  totalPrice: z.coerce.number().min(0, "El total debe ser positivo."),
  currency: z.string().trim().min(1).default("MXN"),
  startDate: z.string().optional(),
  targetEndDate: z.string().optional(),
});

export async function createProject(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const parsed = newProjectSchema.safeParse({
    clientId: formData.get("clientId"),
    name: formData.get("name"),
    summary: formData.get("summary"),
    totalPrice: formData.get("totalPrice"),
    currency: formData.get("currency"),
    startDate: formData.get("startDate"),
    targetEndDate: formData.get("targetEndDate"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  }

  const { clientId, name, summary, totalPrice, currency, startDate, targetEndDate } = parsed.data;
  const service = createServiceRoleClient();

  const { data: project, error } = await service
    .from("projects")
    .insert({
      client_id: clientId,
      name,
      summary: summary || null,
      total_price: totalPrice,
      currency,
      start_date: startDate || null,
      target_end_date: targetEndDate || null,
    })
    .select("id")
    .single();

  if (error || !project) {
    return { ok: false, message: "No se pudo crear el proyecto. Intenta de nuevo." };
  }

  redirect(`/admin/proyectos/${(project as { id: string }).id}`);
}

const projectStatusSchema = z.object({
  projectId: z.string().uuid(),
  status: z.enum(["planeacion", "en_progreso", "en_revision", "pausado", "completado"]),
});

export async function updateProjectStatus(formData: FormData) {
  await requireAdmin();
  const parsed = projectStatusSchema.safeParse({
    projectId: formData.get("projectId"),
    status: formData.get("status"),
  });
  if (!parsed.success) return;

  const service = createServiceRoleClient();
  await service.from("projects").update({ status: parsed.data.status }).eq("id", parsed.data.projectId);
  revalidatePath(`/admin/proyectos/${parsed.data.projectId}`);
  revalidatePath("/admin");
}

const editProjectSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().trim().min(1, "Escribe el nombre del proyecto."),
  summary: z.string().trim().optional(),
  totalPrice: z.coerce.number().min(0, "El total debe ser positivo."),
  currency: z.string().trim().min(1),
  startDate: z.string().optional(),
  targetEndDate: z.string().optional(),
});

export async function updateProject(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const parsed = editProjectSchema.safeParse({
    projectId: formData.get("projectId"),
    name: formData.get("name"),
    summary: formData.get("summary"),
    totalPrice: formData.get("totalPrice"),
    currency: formData.get("currency"),
    startDate: formData.get("startDate"),
    targetEndDate: formData.get("targetEndDate"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  }

  const { projectId, name, summary, totalPrice, currency, startDate, targetEndDate } = parsed.data;
  const service = createServiceRoleClient();

  await service
    .from("projects")
    .update({
      name,
      summary: summary || null,
      total_price: totalPrice,
      currency,
      start_date: startDate || null,
      target_end_date: targetEndDate || null,
    })
    .eq("id", projectId);

  revalidatePath(`/admin/proyectos/${projectId}`);
  revalidatePath("/admin");
  return { ok: true, message: "Cambios guardados." };
}

// ---------------------------------------------------------------------------
// Milestones
// ---------------------------------------------------------------------------

const newMilestoneSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().trim().min(1, "Escribe un título."),
  description: z.string().trim().optional(),
  dueDate: z.string().optional(),
});

export async function createMilestone(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const parsed = newMilestoneSchema.safeParse({
    projectId: formData.get("projectId"),
    title: formData.get("title"),
    description: formData.get("description"),
    dueDate: formData.get("dueDate"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  }

  const service = createServiceRoleClient();
  const { projectId, title, description, dueDate } = parsed.data;

  const { count } = await service
    .from("milestones")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);

  await service.from("milestones").insert({
    project_id: projectId,
    title,
    description: description || null,
    due_date: dueDate || null,
    position: (count ?? 0) + 1,
  });

  revalidatePath(`/admin/proyectos/${projectId}`);
  return { ok: true, message: "" };
}

const milestoneStatusSchema = z.object({
  milestoneId: z.string().uuid(),
  projectId: z.string().uuid(),
  status: z.enum(["pendiente", "en_progreso", "completado"]),
});

export async function updateMilestoneStatus(formData: FormData) {
  await requireAdmin();
  const parsed = milestoneStatusSchema.safeParse({
    milestoneId: formData.get("milestoneId"),
    projectId: formData.get("projectId"),
    status: formData.get("status"),
  });
  if (!parsed.success) return;

  const service = createServiceRoleClient();
  await service
    .from("milestones")
    .update({
      status: parsed.data.status,
      completed_at: parsed.data.status === "completado" ? new Date().toISOString() : null,
    })
    .eq("id", parsed.data.milestoneId);

  revalidatePath(`/admin/proyectos/${parsed.data.projectId}`);
}

export async function deleteMilestone(formData: FormData) {
  await requireAdmin();
  const milestoneId = formData.get("milestoneId");
  const projectId = formData.get("projectId");
  if (typeof milestoneId !== "string" || typeof projectId !== "string") return;

  const service = createServiceRoleClient();
  await service.from("milestones").delete().eq("id", milestoneId);
  revalidatePath(`/admin/proyectos/${projectId}`);
}

const reorderSchema = z.object({
  milestoneId: z.string().uuid(),
  projectId: z.string().uuid(),
  direction: z.enum(["up", "down"]),
});

export async function moveMilestone(formData: FormData) {
  await requireAdmin();
  const parsed = reorderSchema.safeParse({
    milestoneId: formData.get("milestoneId"),
    projectId: formData.get("projectId"),
    direction: formData.get("direction"),
  });
  if (!parsed.success) return;

  const service = createServiceRoleClient();
  const { data: current } = await service
    .from("milestones")
    .select("id, project_id, position")
    .eq("id", parsed.data.milestoneId)
    .single();
  if (!current) return;

  const { project_id, position } = current as { project_id: string; position: number };

  // "up" wants the closest milestone with a smaller position (order desc,
  // then take the first one below current); "down" wants the closest one
  // with a larger position (order asc, take the first one above current).
  const base = service.from("milestones").select("id, position").eq("project_id", project_id);
  const { data: neighbor } =
    parsed.data.direction === "up"
      ? await base.lt("position", position).order("position", { ascending: false }).limit(1).maybeSingle()
      : await base.gt("position", position).order("position", { ascending: true }).limit(1).maybeSingle();

  if (!neighbor) return;
  const other = neighbor as { id: string; position: number };

  await service.from("milestones").update({ position: other.position }).eq("id", current.id);
  await service.from("milestones").update({ position }).eq("id", other.id);
  revalidatePath(`/admin/proyectos/${parsed.data.projectId}`);
}

// ---------------------------------------------------------------------------
// Deliverables
// ---------------------------------------------------------------------------

const newDeliverableSchema = z.object({
  projectId: z.string().uuid(),
  milestoneId: z.string().optional(),
  name: z.string().trim().min(1, "Escribe un nombre."),
  description: z.string().trim().optional(),
  version: z.string().trim().optional(),
  status: z.enum(["en_progreso", "en_revision", "aprobado", "entregado"]),
});

const MAX_FILE_BYTES = 50 * 1024 * 1024;
const BLOCKED_FILE_EXTENSIONS = new Set([".html", ".htm", ".js", ".mjs", ".cjs", ".svg", ".xml", ".xhtml", ".wasm"]);
const BLOCKED_MIME_TYPES = new Set([
  "image/svg+xml",
  "text/html",
  "text/javascript",
  "application/javascript",
  "application/x-javascript",
  "application/xml",
  "text/xml",
  "application/xhtml+xml",
  "application/wasm",
]);

function isBlockedUpload(file: File) {
  const lowerName = file.name.toLowerCase();
  const extension = lowerName.includes(".") ? `.${lowerName.split(".").pop()}` : "";
  return BLOCKED_FILE_EXTENSIONS.has(extension) || BLOCKED_MIME_TYPES.has(file.type.toLowerCase());
}

export async function createDeliverable(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const parsed = newDeliverableSchema.safeParse({
    projectId: formData.get("projectId"),
    milestoneId: formData.get("milestoneId") || undefined,
    name: formData.get("name"),
    description: formData.get("description"),
    version: formData.get("version"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  }

  const file = formData.get("file");
  const service = createServiceRoleClient();
  const { projectId, milestoneId, name, description, version, status } = parsed.data;

  let storagePath: string | null = null;

  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_FILE_BYTES) {
      return { ok: false, message: "El archivo supera el límite de 50 MB." };
    }
    if (isBlockedUpload(file)) {
      return { ok: false, message: "Ese tipo de archivo no esta permitido por seguridad." };
    }
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    storagePath = `${projectId}/${crypto.randomUUID()}-${safeName}`;

    const { error: uploadError } = await service.storage
      .from("deliverables")
      .upload(storagePath, file, { contentType: file.type || undefined });

    if (uploadError) {
      return { ok: false, message: "No se pudo subir el archivo. Intenta de nuevo." };
    }
  }

  const isDelivered = status === "entregado";

  await service.from("deliverables").insert({
    project_id: projectId,
    milestone_id: milestoneId || null,
    name,
    description: description || null,
    version: version || null,
    status,
    storage_path: storagePath,
    delivered_at: isDelivered ? new Date().toISOString() : null,
  });

  revalidatePath(`/admin/proyectos/${projectId}`);
  return { ok: true, message: "" };
}

const deliverableStatusSchema = z.object({
  deliverableId: z.string().uuid(),
  projectId: z.string().uuid(),
  status: z.enum(["en_progreso", "en_revision", "aprobado", "entregado"]),
});

export async function updateDeliverableStatus(formData: FormData) {
  await requireAdmin();
  const parsed = deliverableStatusSchema.safeParse({
    deliverableId: formData.get("deliverableId"),
    projectId: formData.get("projectId"),
    status: formData.get("status"),
  });
  if (!parsed.success) return;

  const service = createServiceRoleClient();
  await service
    .from("deliverables")
    .update({
      status: parsed.data.status,
      delivered_at: parsed.data.status === "entregado" ? new Date().toISOString() : null,
    })
    .eq("id", parsed.data.deliverableId);

  revalidatePath(`/admin/proyectos/${parsed.data.projectId}`);
}

export async function deleteDeliverable(formData: FormData) {
  await requireAdmin();
  const deliverableId = formData.get("deliverableId");
  const projectId = formData.get("projectId");
  if (typeof deliverableId !== "string" || typeof projectId !== "string") return;

  const service = createServiceRoleClient();
  const { data: deliverable } = await service
    .from("deliverables")
    .select("storage_path")
    .eq("id", deliverableId)
    .maybeSingle();

  if (deliverable && (deliverable as { storage_path: string | null }).storage_path) {
    await service.storage
      .from("deliverables")
      .remove([(deliverable as { storage_path: string }).storage_path]);
  }

  await service.from("deliverables").delete().eq("id", deliverableId);
  revalidatePath(`/admin/proyectos/${projectId}`);
}

// ---------------------------------------------------------------------------
// Resources
// ---------------------------------------------------------------------------

const newResourceSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().trim().min(1, "Escribe un titulo."),
  description: z.string().trim().optional(),
  resourceType: z.enum(["drive", "url", "tutorial", "credential", "other"]),
  url: z
    .string()
    .trim()
    .url("Escribe una URL valida.")
    .refine((value) => {
      const protocol = new URL(value).protocol;
      return protocol === "https:" || protocol === "http:";
    }, "Solo se permiten URLs http o https."),
});

export async function createProjectResource(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = newResourceSchema.safeParse({
    projectId: formData.get("projectId"),
    title: formData.get("title"),
    description: formData.get("description"),
    resourceType: formData.get("resourceType"),
    url: formData.get("url"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  }

  const service = createServiceRoleClient();
  const { projectId, title, description, resourceType, url } = parsed.data;

  const { count } = await service
    .from("project_resources")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);

  await service.from("project_resources").insert({
    project_id: projectId,
    title,
    description: description || null,
    resource_type: resourceType,
    url,
    position: (count ?? 0) + 1,
  });

  revalidatePath(`/admin/proyectos/${projectId}`);
  revalidatePath(`/proyecto/${projectId}`);
  return { ok: true, message: "" };
}

export async function deleteProjectResource(formData: FormData) {
  await requireAdmin();
  const resourceId = formData.get("resourceId");
  const projectId = formData.get("projectId");
  if (typeof resourceId !== "string" || typeof projectId !== "string") return;

  const service = createServiceRoleClient();
  await service.from("project_resources").delete().eq("id", resourceId);
  revalidatePath(`/admin/proyectos/${projectId}`);
  revalidatePath(`/proyecto/${projectId}`);
}

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

const newPaymentSchema = z.object({
  projectId: z.string().uuid(),
  amount: z.coerce.number().positive("El monto debe ser mayor a cero."),
  paidAt: z.string().min(1, "Elige una fecha."),
  method: z.string().trim().optional(),
  note: z.string().trim().optional(),
});

export async function createPayment(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const parsed = newPaymentSchema.safeParse({
    projectId: formData.get("projectId"),
    amount: formData.get("amount"),
    paidAt: formData.get("paidAt"),
    method: formData.get("method"),
    note: formData.get("note"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  }

  const { projectId, amount, paidAt, method, note } = parsed.data;
  const service = createServiceRoleClient();

  await service.from("payments").insert({
    project_id: projectId,
    amount,
    paid_at: paidAt,
    method: method || null,
    note: note || null,
  });

  revalidatePath(`/admin/proyectos/${projectId}`);
  return { ok: true, message: "" };
}

export async function deletePayment(formData: FormData) {
  await requireAdmin();
  const paymentId = formData.get("paymentId");
  const projectId = formData.get("projectId");
  if (typeof paymentId !== "string" || typeof projectId !== "string") return;

  const service = createServiceRoleClient();
  await service.from("payments").delete().eq("id", paymentId);
  revalidatePath(`/admin/proyectos/${projectId}`);
}
