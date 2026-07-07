export type ProjectStatus =
  | "planeacion"
  | "en_progreso"
  | "en_revision"
  | "pausado"
  | "completado";

export type MilestoneStatus = "pendiente" | "en_progreso" | "completado";

export type DeliverableStatus =
  | "en_progreso"
  | "en_revision"
  | "aprobado"
  | "entregado";

export type ProjectResourceType = "drive" | "url" | "tutorial" | "credential" | "other";

export interface Admin {
  id: string;
  auth_user_id: string;
  full_name: string;
  email: string;
  created_at: string;
}

export interface Client {
  id: string;
  auth_user_id: string;
  full_name: string;
  company: string | null;
  email: string;
  avatar_url: string | null;
  created_at: string;
}

export interface Project {
  id: string;
  client_id: string;
  name: string;
  summary: string | null;
  status: ProjectStatus;
  total_price: number;
  currency: string;
  start_date: string | null;
  target_end_date: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  project_id: string;
  amount: number;
  paid_at: string;
  method: string | null;
  note: string | null;
  created_at: string;
}

export interface Milestone {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  position: number;
  due_date: string | null;
  completed_at: string | null;
  status: MilestoneStatus;
  created_at: string;
}

export interface Deliverable {
  id: string;
  project_id: string;
  milestone_id: string | null;
  name: string;
  description: string | null;
  version: string | null;
  storage_path: string | null;
  status: DeliverableStatus;
  delivered_at: string | null;
  created_at: string;
}

export interface ProjectResource {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  resource_type: ProjectResourceType;
  url: string;
  position: number;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  actor_email: string | null;
  event: string;
  metadata: Record<string, unknown>;
  ip: string | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      admins: {
        Row: Admin;
        Insert: Partial<Admin>;
        Update: Partial<Admin>;
        Relationships: [];
      };
      clients: {
        Row: Client;
        Insert: Partial<Client>;
        Update: Partial<Client>;
        Relationships: [];
      };
      projects: {
        Row: Project;
        Insert: Partial<Project>;
        Update: Partial<Project>;
        Relationships: [];
      };
      payments: {
        Row: Payment;
        Insert: Partial<Payment>;
        Update: Partial<Payment>;
        Relationships: [];
      };
      milestones: {
        Row: Milestone;
        Insert: Partial<Milestone>;
        Update: Partial<Milestone>;
        Relationships: [];
      };
      deliverables: {
        Row: Deliverable;
        Insert: Partial<Deliverable>;
        Update: Partial<Deliverable>;
        Relationships: [];
      };
      project_resources: {
        Row: ProjectResource;
        Insert: Partial<ProjectResource>;
        Update: Partial<ProjectResource>;
        Relationships: [];
      };
      audit_log: {
        Row: AuditLogEntry;
        Insert: Partial<AuditLogEntry>;
        Update: Partial<AuditLogEntry>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
