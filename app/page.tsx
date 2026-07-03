"use client";
import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { LampContainer } from "@/components/ui/lamp";
import { WHATSAPP_LINK } from "@/lib/clients";
import { useRouter } from "next/navigation";
import type { Client } from "@/lib/clients";

type Step = "id" | "verify" | "error";

export default function Home() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("id");
  const [idInput, setIdInput] = useState("");
  const [verifyInput, setVerifyInput] = useState("");
  const [clientId, setClientId] = useState("");
  const [foundClient, setFoundClient] = useState<Client | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleIdSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/client/${encodeURIComponent(idInput.trim().toUpperCase())}`);
      if (!res.ok) {
        setError("No encontramos un proyecto con ese código. Verifica e intenta de nuevo.");
        setLoading(false);
        return;
      }
      const client: Client = await res.json();
      setFoundClient(client);
      setClientId(client.id);
      setStep("verify");
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifySubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    if (!foundClient) { setStep("error"); setLoading(false); return; }

    function normalize(s: string) {
      return s.toLowerCase().trim()
        .replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
    }
    const input = normalize(verifyInput);
    const valid = foundClient.keywords.some((k) => normalize(k) === input);

    if (valid) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          "bryanf_auth",
          JSON.stringify({ clientId: foundClient.id, ts: Date.now() })
        );
      }
      router.push(`/tutorial/${foundClient.id}`);
    } else {
      setStep("error");
      setLoading(false);
    }
  }

  return (
    <LampContainer>
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
        className="flex flex-col items-center gap-6 w-full max-w-sm"
      >
        {/* Logo */}
        <div
          className="relative w-52 h-24 md:w-72 md:h-32"
          style={{ filter: "brightness(0) invert(1) drop-shadow(0 0 30px rgba(153,215,66,0.4))" }}
        >
          <Image
            src="/logo.png"
            alt="BryanF Design"
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* Title */}
        <div className="text-center">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
            BryanF{" "}
            <span
              className="text-transparent bg-clip-text"
              style={{ backgroundImage: "linear-gradient(to right, #99D742, #6b9e2a)" }}
            >
              Access
            </span>
          </h1>
          <p className="mt-2 text-slate-400 text-sm md:text-base">
            Tu guía paso a paso para dominar tu proyecto
          </p>
        </div>

        {/* Auth card */}
        <div className="w-full mt-2 bg-slate-900/80 backdrop-blur border border-slate-700/60 rounded-2xl p-6 shadow-xl shadow-green-900/20">
          <AnimatePresence mode="wait">
            {step === "id" && (
              <motion.form
                key="id-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleIdSubmit}
                className="flex flex-col gap-4"
              >
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-1.5">
                    Código de proyecto
                  </label>
                  <input
                    type="text"
                    value={idInput}
                    onChange={(e) => setIdInput(e.target.value.toUpperCase())}
                    placeholder="Ej: KD0626A"
                    required
                    autoFocus
                    className="w-full bg-slate-800 border border-slate-600 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition uppercase tracking-widest"
                  />
                  {error && (
                    <p className="mt-2 text-red-400 text-xs">{error}</p>
                  )}
                </div>
                <button
                  type="submit"
                  className="w-full text-white font-semibold rounded-xl py-3 text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-400"
                  style={{ background: "linear-gradient(135deg, #6b9e2a, #99D742)" }}
                >
                  Continuar →
                </button>
                <div className="text-center">
                  <a
                    href={WHATSAPP_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-500 hover:text-green-400 text-xs underline-offset-2 hover:underline transition-colors"
                  >
                    ¿No tienes tu código de proyecto? Contáctanos
                  </a>
                </div>
              </motion.form>
            )}

            {step === "verify" && (
              <motion.form
                key="verify-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleVerifySubmit}
                className="flex flex-col gap-4"
              >
                <div className="text-center mb-1">
                  <span
                    className="inline-flex items-center gap-1.5 text-xs rounded-full px-3 py-1"
                    style={{
                      color: "#99D742",
                      background: "rgba(153,215,66,0.1)",
                      border: "1px solid rgba(153,215,66,0.2)",
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full inline-block"
                      style={{ background: "#99D742" }}
                    />
                    Código {clientId} verificado
                  </span>
                </div>
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-1.5">
                    Tu página web o nombre de empresa
                  </label>
                  <input
                    type="text"
                    value={verifyInput}
                    onChange={(e) => setVerifyInput(e.target.value)}
                    placeholder="Ej: koiarquitectura.com o Mi Empresa"
                    required
                    autoFocus
                    className="w-full bg-slate-800 border border-slate-600 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                  />
                  {error && (
                    <p className="mt-2 text-red-400 text-xs">{error}</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full disabled:opacity-60 text-white font-semibold rounded-xl py-3 text-sm transition-colors duration-200"
                  style={{ background: "linear-gradient(135deg, #6b9e2a, #99D742)" }}
                >
                  {loading ? "Verificando..." : "Acceder a mis tutoriales →"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep("id");
                    setError("");
                    setVerifyInput("");
                  }}
                  className="text-slate-500 hover:text-slate-300 text-xs transition-colors"
                >
                  ← Cambiar código
                </button>
              </motion.form>
            )}

            {step === "error" && (
              <motion.div
                key="error-state"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center gap-4 text-center py-2"
              >
                <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-2xl">
                  🔒
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">
                    No pudimos verificarte
                  </p>
                  <p className="text-slate-400 text-xs mt-1">
                    Los datos no coinciden con nuestro registro. ¿Necesitas
                    ayuda?
                  </p>
                </div>
                <a
                  href={WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-xl py-3 text-sm transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Contactar soporte
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setStep("id");
                    setError("");
                    setIdInput("");
                    setVerifyInput("");
                  }}
                  className="text-slate-500 hover:text-slate-300 text-xs transition-colors"
                >
                  ← Intentar de nuevo
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <p className="text-slate-600 text-xs text-center pb-4">
          © {new Date().getFullYear()} BryanF Design · Todos los derechos
          reservados
        </p>
      </motion.div>
    </LampContainer>
  );
}
