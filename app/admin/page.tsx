"use client";
import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface ClientRow {
  id: string;
  display_name: string;
  keywords: string[];
  drive_link: string;
  active: boolean;
  created_at: string;
}

type View = "login" | "dashboard";

export default function AdminPage() {
  const [view, setView] = useState<View>("login");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [supabaseReady, setSupabaseReady] = useState(false);

  // New client form
  const [form, setForm] = useState({
    id: "",
    display_name: "",
    keywords: "",
    drive_link: "",
  });

  // Check session on mount
  useEffect(() => {
    const session = sessionStorage.getItem("bryanf_admin");
    if (session === "true") setView("dashboard");
  }, []);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/clients");
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients ?? []);
        setSupabaseReady(data.supabaseReady ?? false);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (view === "dashboard") fetchClients();
  }, [view, fetchClients]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (password === process.env.NEXT_PUBLIC_ADMIN_HINT || password.length < 4) {
      setLoginError("Contraseña incorrecta.");
      return;
    }
    // Validate via API
    fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          sessionStorage.setItem("bryanf_admin", "true");
          setView("dashboard");
        } else {
          setLoginError("Contraseña incorrecta.");
        }
      })
      .catch(() => setLoginError("Error de conexión."));
  }

  async function handleAddClient(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const keywords = form.keywords
        .split(",")
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean);

      if (keywords.length === 0) {
        setMessage({ text: "Agrega al menos un dominio o nombre clave.", type: "error" });
        setSaving(false);
        return;
      }

      const res = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: form.id.trim().toUpperCase(),
          display_name: form.display_name.trim(),
          keywords,
          drive_link: form.drive_link.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ text: `Cliente ${form.id.toUpperCase()} agregado correctamente.`, type: "success" });
        setForm({ id: "", display_name: "", keywords: "", drive_link: "" });
        fetchClients();
      } else {
        setMessage({ text: data.error ?? "Error al guardar.", type: "error" });
      }
    } catch {
      setMessage({ text: "Error de conexión.", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(`¿Eliminar cliente ${id}?`)) return;
    const res = await fetch(`/api/admin/clients?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (res.ok) {
      setMessage({ text: `Cliente ${id} eliminado.`, type: "success" });
      fetchClients();
    } else {
      setMessage({ text: "Error al eliminar.", type: "error" });
    }
  }

  async function handleToggle(id: string, active: boolean) {
    const res = await fetch("/api/admin/clients", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, active: !active }),
    });
    if (res.ok) fetchClients();
  }

  return (
    <div
      className="min-h-screen text-white"
      style={{ background: "linear-gradient(160deg, #020e08 0%, #051208 40%, #020a04 100%)" }}
    >
      <AnimatePresence mode="wait">
        {view === "login" ? (
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="min-h-screen flex flex-col items-center justify-center px-4"
          >
            <div className="w-full max-w-sm">
              <div className="relative w-40 h-14 mx-auto mb-8">
                <Image src="/logo.png" alt="BryanF Design" fill className="object-contain" />
              </div>
              <h1 className="text-2xl font-bold text-center mb-1">Panel Admin</h1>
              <p className="text-white/40 text-sm text-center mb-8">BryanF Design · Gestión de clientes</p>

              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-1.5">Contraseña</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoFocus
                    className="w-full bg-slate-800/80 border border-slate-600 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                  />
                  {loginError && <p className="mt-2 text-red-400 text-xs">{loginError}</p>}
                </div>
                <button
                  type="submit"
                  className="w-full text-white font-semibold rounded-xl py-3 text-sm transition-all"
                  style={{ background: "linear-gradient(135deg, #15803d, #22c55e)" }}
                >
                  Entrar →
                </button>
              </form>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-4xl mx-auto px-4 py-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="relative w-32 h-10">
                  <Image src="/logo.png" alt="BryanF Design" fill className="object-contain" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Panel de Clientes</h1>
                  <p className="text-white/40 text-xs">BryanF Design</p>
                </div>
              </div>
              <button
                onClick={() => { sessionStorage.removeItem("bryanf_admin"); setView("login"); }}
                className="text-white/30 hover:text-white/60 text-xs transition-colors"
              >
                Cerrar sesión
              </button>
            </div>

            {/* Supabase status banner */}
            {!supabaseReady && (
              <div
                className="mb-6 rounded-xl px-4 py-3 text-sm"
                style={{
                  background: "rgba(234,179,8,0.1)",
                  border: "1px solid rgba(234,179,8,0.2)",
                  color: "#fde047",
                }}
              >
                <strong>Supabase no configurado.</strong> Los cambios se mostrarán pero no se guardarán en base de datos.
                Configura las variables en <code className="text-yellow-300">.env.local</code> para activar la persistencia.
              </div>
            )}

            {/* Message */}
            <AnimatePresence>
              {message && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mb-6 rounded-xl px-4 py-3 text-sm"
                  style={
                    message.type === "success"
                      ? { background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "#4ade80" }
                      : { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }
                  }
                >
                  {message.text}
                  <button onClick={() => setMessage(null)} className="ml-3 opacity-60 hover:opacity-100">✕</button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Add client form */}
            <div
              className="rounded-2xl p-6 mb-8"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <h2 className="text-base font-bold mb-4 flex items-center gap-2">
                <span
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-xs"
                  style={{ background: "#22c55e", color: "white" }}
                >
                  +
                </span>
                Agregar nuevo cliente
              </h2>
              <form onSubmit={handleAddClient} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/50 text-xs font-semibold mb-1.5 uppercase tracking-wider">
                    Código de proyecto *
                  </label>
                  <input
                    type="text"
                    value={form.id}
                    onChange={(e) => setForm({ ...form, id: e.target.value.toUpperCase() })}
                    placeholder="Ej: KD0626A"
                    required
                    className="w-full bg-slate-800/60 border border-slate-600/60 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition uppercase tracking-widest"
                  />
                </div>
                <div>
                  <label className="block text-white/50 text-xs font-semibold mb-1.5 uppercase tracking-wider">
                    Nombre del proyecto / empresa *
                  </label>
                  <input
                    type="text"
                    value={form.display_name}
                    onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                    placeholder="Ej: Koi Arquitectura"
                    required
                    className="w-full bg-slate-800/60 border border-slate-600/60 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-white/50 text-xs font-semibold mb-1.5 uppercase tracking-wider">
                    Dominio / palabras clave *
                  </label>
                  <input
                    type="text"
                    value={form.keywords}
                    onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                    placeholder="koiarquitectura.com, koi arquitectura"
                    required
                    className="w-full bg-slate-800/60 border border-slate-600/60 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                  />
                  <p className="text-white/25 text-[10px] mt-1">Separa con comas. El cliente usará esto para verificar su acceso.</p>
                </div>
                <div>
                  <label className="block text-white/50 text-xs font-semibold mb-1.5 uppercase tracking-wider">
                    Link de Google Drive *
                  </label>
                  <input
                    type="url"
                    value={form.drive_link}
                    onChange={(e) => setForm({ ...form, drive_link: e.target.value })}
                    placeholder="https://drive.google.com/drive/folders/..."
                    required
                    className="w-full bg-slate-800/60 border border-slate-600/60 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                  />
                </div>
                <div className="sm:col-span-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 text-sm font-semibold text-white rounded-xl disabled:opacity-50 transition-all"
                    style={{ background: "linear-gradient(135deg, #15803d, #22c55e)" }}
                  >
                    {saving ? "Guardando..." : "Guardar cliente →"}
                  </button>
                </div>
              </form>
            </div>

            {/* Clients list */}
            <div>
              <h2 className="text-base font-bold mb-4 text-white/70">
                Clientes activos{" "}
                <span className="text-white/30 font-normal text-sm">({clients.length})</span>
              </h2>

              {loading ? (
                <div className="py-12 text-center">
                  <div
                    className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin mx-auto"
                    style={{ borderColor: "#22c55e", borderTopColor: "transparent" }}
                  />
                </div>
              ) : clients.length === 0 ? (
                <div className="py-12 text-center text-white/20 text-sm">
                  Sin clientes registrados. Agrega el primero arriba.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {clients.map((c) => (
                    <div
                      key={c.id}
                      className="rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: `1px solid ${c.active ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.06)"}`,
                        opacity: c.active ? 1 : 0.5,
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="text-xs font-bold tracking-widest px-2 py-0.5 rounded-full"
                            style={{ background: "rgba(34,197,94,0.15)", color: "#4ade80" }}
                          >
                            {c.id}
                          </span>
                          <span className="text-white font-semibold text-sm">{c.display_name}</span>
                        </div>
                        <p className="text-white/30 text-xs truncate">
                          Acceso: {c.keywords.join(", ")}
                        </p>
                        <p className="text-white/20 text-xs truncate mt-0.5">
                          Drive: {c.drive_link}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleToggle(c.id, c.active)}
                          className="text-xs px-3 py-1.5 rounded-lg transition-all"
                          style={
                            c.active
                              ? { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }
                              : { background: "rgba(34,197,94,0.15)", color: "#4ade80" }
                          }
                        >
                          {c.active ? "Pausar" : "Activar"}
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="text-xs px-3 py-1.5 rounded-lg transition-all"
                          style={{ background: "rgba(239,68,68,0.1)", color: "#f87171" }}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
