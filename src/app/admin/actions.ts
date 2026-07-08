"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { decryptCredentialSecret, encryptCredentialSecret } from "@/lib/credentials";
import { checkRateLimit } from "@/lib/rate-limit";
import { createServiceRoleClient } from "@/lib/supabase/server";

export interface ActionState {
  ok: boolean;
  message: string;
  accessLink?: string;
  secret?: string;
}

const optionalUrlSchema = z
  .string()
  .trim()
  .optional()
  .refine((value) => {
    if (!value) return true;
    try {
      const protocol = new URL(value).protocol;
      return protocol === "https:" || protocol === "http:";
    } catch {
      return false;
    }
  }, "Escribe una URL valida.");

const newClientSchema = z.object({
  fullName: z.string().trim().min(1, "Escribe el nombre del contacto."),
  company: z.string().trim().optional(),
  email: z.string().trim().email("Escribe un correo valido."),
  phone: z.string().trim().optional(),
  country: z.string().trim().optional(),
  industry: z.string().trim().optional(),
  driveUrl: optionalUrlSchema,
});

const sendClientAccessSchema = z.object({
  clientId: z.string().uuid("Cliente inválido."),
  mode: z.enum(["email", "manual"]).default("email"),
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

function getAuthConfirmUrl(tokenHash: string, type = "magiclink") {
  const callback = new URL(getAuthCallbackUrl());
  callback.pathname = "/auth/confirm";
  callback.searchParams.set("token_hash", tokenHash);
  callback.searchParams.set("type", type);
  return callback.toString();
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

async function generateManualAccessLink(service: ReturnType<typeof createServiceRoleClient>, email: string) {
  const { data, error } = await service.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: {
      redirectTo: getAuthCallbackUrl(),
    },
  });

  return {
    error,
    link: data?.properties?.hashed_token
      ? getAuthConfirmUrl(data.properties.hashed_token, data.properties.verification_type ?? "magiclink")
      : null,
  };
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
    phone: formData.get("phone"),
    country: formData.get("country"),
    industry: formData.get("industry"),
    driveUrl: formData.get("driveUrl"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  }

  const { fullName, company, email, phone, country, industry, driveUrl } = parsed.data;
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
      phone: phone || null,
      country: country || null,
      industry: industry || null,
      drive_url: driveUrl || null,
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

const editClientSchema = z.object({
  clientId: z.string().uuid("Cliente invalido."),
  fullName: z.string().trim().min(1, "Escribe el nombre del contacto."),
  company: z.string().trim().optional(),
  email: z.string().trim().email("Escribe un correo valido."),
  phone: z.string().trim().optional(),
  country: z.string().trim().optional(),
  industry: z.string().trim().optional(),
  driveUrl: optionalUrlSchema,
  notes: z.string().trim().optional(),
});

export async function updateClientProfile(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();

  const parsed = editClientSchema.safeParse({
    clientId: formData.get("clientId"),
    fullName: formData.get("fullName"),
    company: formData.get("company"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    country: formData.get("country"),
    industry: formData.get("industry"),
    driveUrl: formData.get("driveUrl"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  }

  const service = createServiceRoleClient();
  const { data: existing } = await service
    .from("clients")
    .select("id, auth_user_id, email")
    .eq("id", parsed.data.clientId)
    .maybeSingle<{ id: string; auth_user_id: string | null; email: string }>();

  if (!existing) {
    return { ok: false, message: "No encontramos ese cliente." };
  }

  const nextEmail = parsed.data.email.toLowerCase();
  const currentEmail = existing.email.toLowerCase();

  if (existing.auth_user_id && nextEmail !== currentEmail) {
    const { error: authError } = await service.auth.admin.updateUserById(existing.auth_user_id, {
      email: nextEmail,
      email_confirm: true,
    });

    if (authError) {
      return {
        ok: false,
        message: "No se pudo actualizar el correo de acceso en Supabase Auth.",
      };
    }
  }

  const { error } = await service
    .from("clients")
    .update({
      full_name: parsed.data.fullName,
      company: parsed.data.company || null,
      email: nextEmail,
      phone: parsed.data.phone || null,
      country: parsed.data.country || null,
      industry: parsed.data.industry || null,
      drive_url: parsed.data.driveUrl || null,
      notes: parsed.data.notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.clientId);

  await service.from("audit_log").insert({
    actor_email: admin.email,
    event: error ? "admin_client_update_failed" : "admin_client_updated",
    metadata: {
      client_id: parsed.data.clientId,
      email: nextEmail,
      error: error?.message ?? null,
    },
  });

  if (error) {
    return { ok: false, message: "No se pudo guardar el cliente. Intenta de nuevo." };
  }

  revalidatePath(`/admin/clientes/${parsed.data.clientId}`);
  revalidatePath("/admin/clientes");
  revalidatePath("/admin");
  return { ok: true, message: "Cliente actualizado." };
}

const credentialSchema = z.object({
  clientId: z.string().uuid("Cliente invalido."),
  label: z.string().trim().min(1, "Escribe un nombre para el acceso."),
  provider: z.string().trim().optional(),
  loginUrl: optionalUrlSchema,
  username: z.string().trim().optional(),
  secret: z.string().optional(),
  notes: z.string().trim().optional(),
});

export async function createClientCredential(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();

  const parsed = credentialSchema.safeParse({
    clientId: formData.get("clientId"),
    label: formData.get("label"),
    provider: formData.get("provider"),
    loginUrl: formData.get("loginUrl"),
    username: formData.get("username"),
    secret: formData.get("secret"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  }

  const service = createServiceRoleClient();
  const secret = parsed.data.secret?.trim();
  const encrypted = secret ? encryptCredentialSecret(secret) : null;

  const { error } = await service.from("client_credentials").insert({
    client_id: parsed.data.clientId,
    label: parsed.data.label,
    provider: parsed.data.provider || null,
    login_url: parsed.data.loginUrl || null,
    username: parsed.data.username || null,
    secret_encrypted: encrypted?.secret_encrypted ?? null,
    secret_iv: encrypted?.secret_iv ?? null,
    secret_tag: encrypted?.secret_tag ?? null,
    notes: parsed.data.notes || null,
  });

  await service.from("audit_log").insert({
    actor_email: admin.email,
    event: error ? "admin_client_credential_create_failed" : "admin_client_credential_created",
    metadata: {
      client_id: parsed.data.clientId,
      label: parsed.data.label,
      error: error?.message ?? null,
    },
  });

  if (error) {
    return { ok: false, message: "No se pudo guardar el acceso privado." };
  }

  revalidatePath(`/admin/clientes/${parsed.data.clientId}`);
  return { ok: true, message: "Acceso privado guardado." };
}

export async function revealClientCredentialSecret(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();
  const credentialId = formData.get("credentialId");
  const clientId = formData.get("clientId");

  if (typeof credentialId !== "string" || typeof clientId !== "string") {
    return { ok: false, message: "Acceso invalido." };
  }

  const limit = await checkRateLimit(`credential-reveal:${admin.id}`, 20, 10 * 60_000);
  if (!limit.ok) {
    return { ok: false, message: "Demasiados intentos. Espera un minuto y vuelve a intentar." };
  }

  const service = createServiceRoleClient();
  const { data: credential } = await service
    .from("client_credentials")
    .select("id, client_id, label, secret_encrypted, secret_iv, secret_tag")
    .eq("id", credentialId)
    .eq("client_id", clientId)
    .maybeSingle<{
      id: string;
      client_id: string;
      label: string;
      secret_encrypted: string | null;
      secret_iv: string | null;
      secret_tag: string | null;
    }>();

  if (!credential) {
    return { ok: false, message: "No encontramos ese acceso." };
  }

  try {
    const secret = decryptCredentialSecret(credential);

    await service.from("audit_log").insert({
      actor_email: admin.email,
      event: "admin_client_credential_revealed",
      metadata: { client_id: clientId, credential_id: credentialId, label: credential.label },
    });

    if (!secret) {
      return { ok: false, message: "Este acceso no tiene secreto guardado." };
    }

    return { ok: true, message: "Secreto revelado.", secret };
  } catch {
    await service.from("audit_log").insert({
      actor_email: admin.email,
      event: "admin_client_credential_reveal_failed",
      metadata: { client_id: clientId, credential_id: credentialId },
    });

    return {
      ok: false,
      message: "No se pudo descifrar. Revisa que CREDENTIALS_ENCRYPTION_KEY no haya cambiado.",
    };
  }
}

export async function deleteClientCredential(formData: FormData) {
  const admin = await requireAdmin();
  const credentialId = formData.get("credentialId");
  const clientId = formData.get("clientId");
  if (typeof credentialId !== "string" || typeof clientId !== "string") return;

  const service = createServiceRoleClient();
  await service.from("client_credentials").delete().eq("id", credentialId).eq("client_id", clientId);
  await service.from("audit_log").insert({
    actor_email: admin.email,
    event: "admin_client_credential_deleted",
    metadata: { client_id: clientId, credential_id: credentialId },
  });
  revalidatePath(`/admin/clientes/${clientId}`);
}

export async function sendClientAccessLink(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();

  const parsed = sendClientAccessSchema.safeParse({
    clientId: formData.get("clientId"),
    mode: formData.get("mode") || "email",
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

  const [adminLimit, clientLimit] = await Promise.all([
    checkRateLimit(`admin-access-link:admin:${admin.id}`, 30, 10 * 60_000),
    checkRateLimit(`admin-access-link:client:${client.id}`, 10, 10 * 60_000),
  ]);

  if (!adminLimit.ok || !clientLimit.ok) {
    await service.from("audit_log").insert({
      actor_email: admin.email,
      event: "admin_access_link_rate_limited",
      metadata: {
        client_id: client.id,
        client_email: client.email,
        admin_remaining: adminLimit.remaining,
        client_remaining: clientLimit.remaining,
      },
    });

    return {
      ok: false,
      message: "Demasiados intentos. Espera 1 minuto y vuelve a intentar.",
    };
  }

  if (parsed.data.mode === "manual") {
    const manual = await generateManualAccessLink(service, client.email);

    await service.from("audit_log").insert({
      actor_email: admin.email,
      event: manual.link ? "admin_manual_access_link_generated" : "admin_manual_access_link_failed",
      metadata: {
        client_id: client.id,
        client_email: client.email,
        manual_error: manual.error?.message ?? null,
      },
    });

    if (!manual.link) {
      return {
        ok: false,
        message: "No se pudo generar el enlace manual. Revisa la service role key de Supabase.",
      };
    }

    return {
      ok: true,
      message: "Enlace manual generado. Copialo y envialo directo al cliente.",
      accessLink: manual.link,
    };
  }

  const { error } = await service.auth.signInWithOtp({
    email: client.email,
    options: {
      emailRedirectTo: getAuthCallbackUrl(),
      shouldCreateUser: false,
    },
  });

  await service.from("audit_log").insert({
    actor_email: admin.email,
    event: error ? "admin_access_link_failed" : "admin_access_link_sent",
    metadata: { client_id: client.id, client_email: client.email, error: error?.message ?? null },
  });

  if (error) {
    const manual = await generateManualAccessLink(service, client.email);

    await service.from("audit_log").insert({
      actor_email: admin.email,
      event: manual.link ? "admin_manual_access_link_generated" : "admin_manual_access_link_failed",
      metadata: {
        client_id: client.id,
        client_email: client.email,
        send_error: error.message,
        manual_error: manual.error?.message ?? null,
      },
    });

    return {
      ok: false,
      message: manual.link
        ? `${humanizeAuthEmailError(error.message)} Copia este enlace temporal y envíaselo directo al cliente.`
        : humanizeAuthEmailError(error.message),
      accessLink: manual.link ?? undefined,
    };
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

const projectEventTypeSchema = z.enum([
  "project",
  "payment",
  "milestone",
  "deliverable",
  "resource",
  "content",
  "meeting",
  "review",
  "other",
]);

const projectEventVisibilitySchema = z.enum(["client", "admin"]);

type ServiceRoleClient = ReturnType<typeof createServiceRoleClient>;

async function recordProjectEvent(
  service: ServiceRoleClient,
  input: {
    projectId: string;
    title: string;
    description?: string | null;
    eventType?: z.infer<typeof projectEventTypeSchema>;
    eventDate?: string | null;
    visibility?: z.infer<typeof projectEventVisibilitySchema>;
    createdBy?: string | null;
  },
) {
  await service.from("project_events").insert({
    project_id: input.projectId,
    title: input.title,
    description: input.description || null,
    event_type: input.eventType ?? "other",
    event_date: input.eventDate || new Date().toISOString().slice(0, 10),
    visibility: input.visibility ?? "client",
    created_by: input.createdBy || null,
  });
}

export async function createProject(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();

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

  const projectId = (project as { id: string }).id;
  await recordProjectEvent(service, {
    projectId,
    title: "Proyecto activado",
    description: summary || null,
    eventType: "project",
    eventDate: startDate || null,
    createdBy: admin.email,
  });

  redirect(`/admin/proyectos/${projectId}`);
}

const newProjectEventSchema = z.object({
  projectId: z.string().uuid("Proyecto invalido."),
  title: z.string().trim().min(1, "Escribe el titulo del evento."),
  description: z.string().trim().optional(),
  eventType: projectEventTypeSchema,
  eventDate: z.string().min(1, "Elige una fecha."),
  visibility: projectEventVisibilitySchema,
});

export async function createProjectEvent(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();

  const parsed = newProjectEventSchema.safeParse({
    projectId: formData.get("projectId"),
    title: formData.get("title"),
    description: formData.get("description"),
    eventType: formData.get("eventType"),
    eventDate: formData.get("eventDate"),
    visibility: formData.get("visibility"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  }

  const service = createServiceRoleClient();
  await recordProjectEvent(service, {
    projectId: parsed.data.projectId,
    title: parsed.data.title,
    description: parsed.data.description || null,
    eventType: parsed.data.eventType,
    eventDate: parsed.data.eventDate,
    visibility: parsed.data.visibility,
    createdBy: admin.email,
  });

  revalidatePath(`/admin/proyectos/${parsed.data.projectId}`);
  revalidatePath(`/proyecto/${parsed.data.projectId}`);
  return { ok: true, message: "Evento agregado al calendario." };
}

const projectStatusSchema = z.object({
  projectId: z.string().uuid(),
  status: z.enum(["planeacion", "en_progreso", "en_revision", "pausado", "completado"]),
});

export async function updateProjectStatus(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = projectStatusSchema.safeParse({
    projectId: formData.get("projectId"),
    status: formData.get("status"),
  });
  if (!parsed.success) return;

  const service = createServiceRoleClient();
  await service.from("projects").update({ status: parsed.data.status }).eq("id", parsed.data.projectId);
  await recordProjectEvent(service, {
    projectId: parsed.data.projectId,
    title: "Estatus actualizado",
    description: `El proyecto cambio a ${parsed.data.status}.`,
    eventType: "project",
    createdBy: admin.email,
  });
  revalidatePath(`/admin/proyectos/${parsed.data.projectId}`);
  revalidatePath(`/proyecto/${parsed.data.projectId}`);
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
  const admin = await requireAdmin();

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

  await recordProjectEvent(service, {
    projectId,
    title: "Datos del proyecto actualizados",
    description: summary || null,
    eventType: "project",
    eventDate: startDate || null,
    createdBy: admin.email,
  });

  revalidatePath(`/admin/proyectos/${projectId}`);
  revalidatePath(`/proyecto/${projectId}`);
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
  const admin = await requireAdmin();

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

  await recordProjectEvent(service, {
    projectId,
    title: `Etapa agregada: ${title}`,
    description: description || null,
    eventType: "milestone",
    eventDate: dueDate || null,
    createdBy: admin.email,
  });

  revalidatePath(`/admin/proyectos/${projectId}`);
  revalidatePath(`/proyecto/${projectId}`);
  return { ok: true, message: "" };
}

const milestoneStatusSchema = z.object({
  milestoneId: z.string().uuid(),
  projectId: z.string().uuid(),
  status: z.enum(["pendiente", "en_progreso", "completado"]),
});

export async function updateMilestoneStatus(formData: FormData) {
  const admin = await requireAdmin();
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

  const { data: milestone } = await service
    .from("milestones")
    .select("title")
    .eq("id", parsed.data.milestoneId)
    .maybeSingle<{ title: string }>();

  await recordProjectEvent(service, {
    projectId: parsed.data.projectId,
    title: `Etapa actualizada: ${milestone?.title ?? "Sin titulo"}`,
    description: `Estatus: ${parsed.data.status}.`,
    eventType: "milestone",
    createdBy: admin.email,
  });

  revalidatePath(`/admin/proyectos/${parsed.data.projectId}`);
  revalidatePath(`/proyecto/${parsed.data.projectId}`);
}

export async function deleteMilestone(formData: FormData) {
  await requireAdmin();
  const milestoneId = formData.get("milestoneId");
  const projectId = formData.get("projectId");
  if (typeof milestoneId !== "string" || typeof projectId !== "string") return;

  const service = createServiceRoleClient();
  await service.from("milestones").delete().eq("id", milestoneId);
  revalidatePath(`/admin/proyectos/${projectId}`);
  revalidatePath(`/proyecto/${projectId}`);
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
  revalidatePath(`/proyecto/${parsed.data.projectId}`);
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
  const admin = await requireAdmin();

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

  await recordProjectEvent(service, {
    projectId,
    title: `Entregable agregado: ${name}`,
    description: description || null,
    eventType: "deliverable",
    createdBy: admin.email,
  });

  revalidatePath(`/admin/proyectos/${projectId}`);
  revalidatePath(`/proyecto/${projectId}`);
  return { ok: true, message: "" };
}

const deliverableStatusSchema = z.object({
  deliverableId: z.string().uuid(),
  projectId: z.string().uuid(),
  status: z.enum(["en_progreso", "en_revision", "aprobado", "entregado"]),
});

export async function updateDeliverableStatus(formData: FormData) {
  const admin = await requireAdmin();
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

  const { data: deliverable } = await service
    .from("deliverables")
    .select("name")
    .eq("id", parsed.data.deliverableId)
    .maybeSingle<{ name: string }>();

  await recordProjectEvent(service, {
    projectId: parsed.data.projectId,
    title: `Entregable actualizado: ${deliverable?.name ?? "Sin nombre"}`,
    description: `Estatus: ${parsed.data.status}.`,
    eventType: "deliverable",
    createdBy: admin.email,
  });

  revalidatePath(`/admin/proyectos/${parsed.data.projectId}`);
  revalidatePath(`/proyecto/${parsed.data.projectId}`);
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
  revalidatePath(`/proyecto/${projectId}`);
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
  const admin = await requireAdmin();

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

  await recordProjectEvent(service, {
    projectId,
    title: `Recurso agregado: ${title}`,
    description: description || null,
    eventType: "resource",
    createdBy: admin.email,
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
  const admin = await requireAdmin();

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

  await recordProjectEvent(service, {
    projectId,
    title: "Pago registrado",
    description: note || method || null,
    eventType: "payment",
    eventDate: paidAt,
    createdBy: admin.email,
  });

  revalidatePath(`/admin/proyectos/${projectId}`);
  revalidatePath(`/proyecto/${projectId}`);
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
  revalidatePath(`/proyecto/${projectId}`);
}
