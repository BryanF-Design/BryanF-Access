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
  const [loginLoading, setLoginLoading] = useState(false);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [supabaseReady, setSupabaseReady] = useState(false);

  const [form, setForm] = useState({
    id: "",
    display_name: "",
    keywords: "",
    drive_link: "",
  });

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/clients");
      if (res.status === 401) {
        setView("login");
        return;
      }
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

  // Verify cookie-based session on mount
  useEffect(() => {
    fetch("/api/admin/clients")
      .then((r) => {
        if (r.ok) {
          r.json().then((data) => {
            setClients(data.clients ?? []);
            setSupabaseReady(data.supabaseReady ?? false);
            setView("dashboard");
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (view === "dashboard") fetchClients();
  }, [view, fetchClients]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.status === 429) {
        setLoginError(data.error ?? "Demasiados intentos. Espera 15 minutos.");
      } else if (data.ok) {
        setPassword("");
        setView("dashboard");
      } else {
        setLoginError("Contraseña incorrecta.");
      }
    } catch {
      setLoginError("Error de conexión.");
    } finally {
      setLoginLoading(false);
    }
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
        setMessage({
          text: "Agrega al menos un dominio o nombre clave.",
          type: "error",
        });
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
        setMessage({
          text: `Cliente ${form.id.toUpperCase()} agregado correctamente.`,
          type: "success",
        });
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
    const res = await fetch(
      `/api/admin/clients?id=${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );
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

  async function handleLogout() {
    // Clear the cookie by setting it expired
    await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "__logout__" }),
    }).catch(() => {});
    setView("login");
    setPassword("");
    setClients([]);
  }

  return (
    <div
      className="min-h-screen text-white"
      style={{
        background:
          "linear-gradient(160deg, #020e08 0%, #051208 40%, #020a04 100%)",
      }}
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
              <div
                className="relative w-40 h-14 mx-auto mb-8"
                style={{ filter: "brightness(0) invert(1)" }}
              >
                <Image
                  src="/logo.png"
                  alt="BryanF Design"
                  fill
                  className="object-contain"
                />
              </div>

              {/* Shield icon */}
              <div className="flex justify-center mb-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{
                    background: "rgba(153,215,66,0.08)",
                    border: "1px solid rgba(153,215,66,0.2)",
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="w-7 h-7"
                    fill="none"
                    stroke="#99D742"
                    strokeWidth={1.8}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12l2 2 4-4"
                    />
                  </svg>
                </div>
              </div>

              <h1 className="text-2xl font-bold text-center mb-1">
                Panel Admin
              </h1>
              <p className="text-white/40 text-sm text-center mb-8">
                BryanF Design · Gestión de clientes
              </p>

              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-1.5">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoFocus
                    autoComplete="current-password"
                    className="w-full bg-slate-800/80 border border-slate-600 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition"
                    style={
                      {
                        "--tw-ring-color": "#99D742",
                      } as React.CSSProperties
                    }
                  />
                  {loginError && (
                    <p className="mt-2 text-red-400 text-xs">{loginError}</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full disabled:opacity-60 text-white font-semibold rounded-xl py-3 text-sm transition-all"
                  style={{
                    background: "linear-gradient(135deg, #6b9e2a, #99D742)",
                  }}
                >
                  {loginLoading ? "Verificando..." : "Entrar →"}
                </button>
              </form>

              <p className="mt-6 text-center text-white/20 text-xs">
                Acceso protegido · Solo personal autorizado
              </p>
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
                <div
                  className="relative w-32 h-10"
                  style={{ filter: "brightness(0) invert(1)" }}
                >
                  <Image
                    src="/logo.png"
                    alt="BryanF Design"
                    fill
                    className="object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Panel de Clientes</h1>
                  <p className="text-white/40 text-xs">BryanF Design</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
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
                <strong>Supabase no configurado.</strong> Los cambios se
                mostrarán pero no se guardarán en base de datos. Configura las
                variables en{" "}
                <code className="text-yellow-300">.env.local</code> para activar
                la persistencia.
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
                      ? {
                          background: "rgba(153,215,66,0.1)",
                          border: "1px solid rgba(153,215,66,0.2)",
                          color: "#99D742",
                        }
                      : {
                          background: "rgba(239,68,68,0.1)",
                          border: "1px solid rgba(239,68,68,0.2)",
                          color: "#f87171",
                        }
                  }
                >
                  {message.text}
                  <button
                    onClick={() => setMessage(null)}
                    className="ml-3 opacity-60 hover:opacity-100"
                  >
                    ✕
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Add client form */}
            <div
              className="rounded-2xl p-6 mb-8"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <h2 className="text-base font-bold mb-4 flex items-center gap-2">
                <span
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-xs"
                  style={{ background: "#99D742", color: "#0a1505" }}
                >
                  +
                </span>
                Agregar nuevo cliente
              </h2>
              <form
                onSubmit={handleAddClient}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                <div>
                  <label className="block text-white/50 text-xs font-semibold mb-1.5 uppercase tracking-wider">
                    Código de proyecto *
                  </label>
                  <input
                    type="text"
                    value={form.id}
                    onChange={(e) =>
                      setForm({ ...form, id: e.target.value.toUpperCase() })
                    }
                    placeholder="Código único del proyecto"
                    required
                    maxLength={12}
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
                    onChange={(e) =>
                      setForm({ ...form, display_name: e.target.value })
                    }
                    placeholder="Nombre del cliente o empresa"
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
                    onChange={(e) =>
                      setForm({ ...form, keywords: e.target.value })
                    }
                    placeholder="dominio.com, nombre alternativo"
                    required
                    className="w-full bg-slate-800/60 border border-slate-600/60 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                  />
                  <p className="text-white/25 text-[10px] mt-1">
                    Separa con comas. El cliente usará esto para verificar su
                    acceso.
                  </p>
                </div>
                <div>
                  <label className="block text-white/50 text-xs font-semibold mb-1.5 uppercase tracking-wider">
                    Link de Google Drive *
                  </label>
                  <input
                    type="url"
                    value={form.drive_link}
                    onChange={(e) =>
                      setForm({ ...form, drive_link: e.target.value })
                    }
                    placeholder="https://drive.google.com/drive/folders/..."
                    required
                    className="w-full bg-slate-800/60 border border-slate-600/60 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                  />
                </div>
                <div className="sm:col-span-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 text-sm font-semibold rounded-xl disabled:opacity-50 transition-all"
                    style={{
                      background: "linear-gradient(135deg, #6b9e2a, #99D742)",
                      color: "#0a1505",
                    }}
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
                <span className="text-white/30 font-normal text-sm">
                  ({clients.length})
                </span>
              </h2>

              {loading ? (
                <div className="py-12 text-center">
                  <div
                    className="w-6 h-6 border-2 rounded-full animate-spin mx-auto"
                    style={{
                      borderColor: "#99D742",
                      borderTopColor: "transparent",
                    }}
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
                        border: `1px solid ${
                          c.active
                            ? "rgba(153,215,66,0.15)"
                            : "rgba(255,255,255,0.06)"
                        }`,
                        opacity: c.active ? 1 : 0.5,
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="text-xs font-bold tracking-widest px-2 py-0.5 rounded-full"
                            style={{
                              background: "rgba(153,215,66,0.12)",
                              color: "#99D742",
                            }}
                          >
                            {c.id}
                          </span>
                          <span className="text-white font-semibold text-sm">
                            {c.display_name}
                          </span>
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
                              ? {
                                  background: "rgba(255,255,255,0.06)",
                                  color: "rgba(255,255,255,0.4)",
                                }
                              : {
                                  background: "rgba(153,215,66,0.12)",
                                  color: "#99D742",
                                }
                          }
                        >
                          {c.active ? "Pausar" : "Activar"}
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="text-xs px-3 py-1.5 rounded-lg transition-all"
                          style={{
                            background: "rgba(239,68,68,0.1)",
                            color: "#f87171",
                          }}
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
