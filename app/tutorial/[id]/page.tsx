"use client";
import React, { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { WHATSAPP_LINK, type Client } from "@/lib/clients";
import { tutorialSteps, type TutorialStep, type StepImage } from "@/lib/steps";
import GradientMenu, { type GradientMenuItem } from "@/components/ui/gradient-menu";
import {
  IoHomeOutline,
  IoPlayCircleOutline,
  IoCloudOutline,
  IoLogoWhatsapp,
  IoServerOutline,
  IoKeyOutline,
  IoFolderOpenOutline,
  IoMailOutline,
  IoLogInOutline,
  IoChevronBackOutline,
  IoChevronForwardOutline,
  IoChevronDownOutline,
  IoSearchOutline,
  IoCloseOutline,
  IoExpandOutline,
} from "react-icons/io5";

const stepIcons: Record<string, React.ReactNode> = {
  server: <IoServerOutline className="w-5 h-5" />,
  key: <IoKeyOutline className="w-5 h-5" />,
  folder: <IoFolderOpenOutline className="w-5 h-5" />,
  "mail-plus": <IoMailOutline className="w-5 h-5" />,
  inbox: <IoLogInOutline className="w-5 h-5" />,
};

const URL_REGEX = /((https?:\/\/)?[a-zA-Z0-9][\w-]*(?:\.[a-zA-Z]{2,}){1,}(?:\/[\w./?=%&+-]*)?)/g;

function renderWithLinks(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  URL_REGEX.lastIndex = 0;
  while ((match = URL_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    const url = match[0];
    const href = url.startsWith("http") ? url : `https://${url}`;
    parts.push(
      <a
        key={match.index}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-green-400 underline underline-offset-2 hover:text-green-300 transition-colors font-semibold break-all"
        onClick={(e) => e.stopPropagation()}
      >
        {url}
      </a>
    );
    lastIndex = URL_REGEX.lastIndex;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts.length > 1 ? <>{parts}</> : text;
}

// ─── Lightbox ────────────────────────────────────────────────────────────────

function Lightbox({
  images,
  startIndex,
  onClose,
}: {
  images: StepImage[];
  startIndex: number;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(startIndex);

  const prev = useCallback(
    () => setCurrent((c) => (c - 1 + images.length) % images.length),
    [images.length]
  );
  const next = useCallback(
    () => setCurrent((c) => (c + 1) % images.length),
    [images.length]
  );

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", handle);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handle);
      document.body.style.overflow = "";
    };
  }, [onClose, prev, next]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: "rgba(2,8,23,0.97)" }}
      onClick={onClose}
    >
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 z-10">
        <span className="text-white/30 text-xs font-medium tabular-nums">
          {current + 1} / {images.length}
        </span>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition active:scale-95"
        >
          <IoCloseOutline className="w-5 h-5" />
        </button>
      </div>

      <div
        className="relative w-full h-full px-12 md:px-20 py-16"
        onClick={(e) => e.stopPropagation()}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="relative w-full h-full"
          >
            <Image
              src={images[current].src}
              alt={images[current].alt}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/25 text-xs text-center max-w-xs px-4 leading-relaxed">
        {images[current].alt}
      </div>

      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/8 hover:bg-white/16 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition active:scale-95"
          >
            <IoChevronBackOutline className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/8 hover:bg-white/16 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition active:scale-95"
          >
            <IoChevronForwardOutline className="w-5 h-5" />
          </button>

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === current ? "w-5" : "bg-white/20 w-1.5"
                }`}
                style={i === current ? { background: "#99D742" } : {}}
              />
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
}

// ─── Image Gallery ────────────────────────────────────────────────────────────

function ImageGallery({
  step,
  onOpenLightbox,
}: {
  step: TutorialStep;
  onOpenLightbox: (index: number) => void;
}) {
  const [current, setCurrent] = useState(0);
  const images = step.images ?? [];
  const prev = () => setCurrent((c) => (c - 1 + images.length) % images.length);
  const next = () => setCurrent((c) => (c + 1) % images.length);

  if (images.length === 0) return null;

  return (
    <div className="flex flex-col gap-5">
      <div className="relative rounded-xl md:rounded-2xl overflow-hidden bg-black/40 aspect-video border border-white/8 shadow-lg shadow-black/30 group/img">
        <Image
          key={current}
          src={images[current].src}
          alt={images[current].alt}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, 700px"
        />

        <button
          onClick={() => onOpenLightbox(current)}
          className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white transition opacity-100 md:opacity-0 md:group-hover/img:opacity-100 active:scale-95"
          title="Ver en pantalla completa"
        >
          <IoExpandOutline className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => onOpenLightbox(current)}
          className="absolute inset-0 z-[5] cursor-zoom-in"
          aria-label="Ampliar imagen"
        />

        {images.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm flex items-center justify-center text-white transition active:scale-95"
            >
              <IoChevronBackOutline className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm flex items-center justify-center text-white transition active:scale-95"
            >
              <IoChevronForwardOutline className="w-4 h-4" />
            </button>
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === current ? "w-5" : "bg-white/30 w-1.5"
                  }`}
                  style={i === current ? { background: "#99D742" } : {}}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {step.instructions && step.instructions.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] mb-3" style={{ color: "rgba(74,222,128,0.6)" }}>
            Pasos a seguir
          </p>
          <ol className="flex flex-col gap-3">
            {step.instructions.map((inst, i) => (
              <li key={i} className="flex gap-3 text-sm text-white/55 leading-relaxed">
                <span
                  className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] mt-0.5"
                  style={{
                    background: "rgba(153,215,66,0.15)",
                    border: "1px solid rgba(153,215,66,0.2)",
                    color: "#99D742",
                  }}
                >
                  {i + 1}
                </span>
                <span>{renderWithLinks(inst)}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

// ─── Video Player ─────────────────────────────────────────────────────────────

function VideoPlayer({ step }: { step: TutorialStep }) {
  const [hasError, setHasError] = useState(false);
  const videoPath = `/pasos/${step.videoFolder}/video.mp4`;

  return (
    <div className="relative rounded-xl md:rounded-2xl overflow-hidden bg-black/40 aspect-video border border-white/8 shadow-lg shadow-black/30">
      {!hasError ? (
        <video
          src={videoPath}
          controls
          preload="metadata"
          playsInline
          className="w-full h-full object-contain"
          onError={() => setHasError(true)}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{
              background: "rgba(153,215,66,0.1)",
              border: "1px solid rgba(153,215,66,0.2)",
              color: "#99D742",
            }}
          >
            <IoPlayCircleOutline className="w-6 h-6" />
          </div>
          <p className="text-white/30 text-xs text-center px-4">
            Video próximamente disponible
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Step Accordion ───────────────────────────────────────────────────────────

function StepAccordion({
  step,
  isOpen,
  onToggle,
  onOpenLightbox,
}: {
  step: TutorialStep;
  isOpen: boolean;
  onToggle: () => void;
  onOpenLightbox: (images: StepImage[], index: number) => void;
}) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="w-full py-5 md:py-7 flex items-start gap-3 md:gap-5 text-left active:opacity-80"
      >
        {/* Ghost number — desktop */}
        <span
          className="hidden md:block text-6xl lg:text-8xl font-black leading-none shrink-0 w-20 text-right tabular-nums select-none transition-colors duration-300 pt-1"
          style={{ color: isOpen ? "rgba(153,215,66,0.09)" : "rgba(255,255,255,0.03)" }}
        >
          {String(step.order).padStart(2, "0")}
        </span>

        {/* Mobile badge */}
        <span
          className="md:hidden text-[11px] font-bold shrink-0 w-6 tabular-nums pt-1"
          style={{ color: "rgba(74,222,128,0.4)" }}
        >
          {String(step.order).padStart(2, "0")}
        </span>

        {/* Icon */}
        <div
          className={`shrink-0 w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-all duration-200 mt-0.5`}
          style={
            isOpen
              ? {
                  background: "#99D742",
                  color: "white",
                  boxShadow: "0 8px 24px rgba(153,215,66,0.3)",
                }
              : { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)" }
          }
        >
          {stepIcons[step.icon]}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0 pr-2">
          <p
            className="text-[10px] font-bold uppercase tracking-[0.14em] mb-0.5"
            style={{ color: "rgba(74,222,128,0.5)" }}
          >
            Paso {step.order}
          </p>
          <h3
            className={`font-bold text-[15px] md:text-lg leading-snug transition-colors duration-200 ${
              isOpen ? "text-white" : "text-white/65"
            }`}
          >
            {step.title}
          </h3>
          <p
            className={`mt-1 text-white/40 text-xs md:text-sm leading-relaxed transition-all duration-300 ${
              isOpen ? "" : "line-clamp-2"
            }`}
          >
            {step.description}
          </p>
        </div>

        {/* Chevron */}
        <div
          className="shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center transition-all duration-200 mt-1"
          style={{
            background: isOpen ? "rgba(153,215,66,0.2)" : "rgba(255,255,255,0.05)",
            color: isOpen ? "#99D742" : "rgba(255,255,255,0.2)",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          <IoChevronDownOutline className="w-3.5 h-3.5 md:w-4 md:h-4" />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="step-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="pb-7 md:pl-[112px]">
              {step.type === "video" ? (
                <VideoPlayer step={step} />
              ) : (
                <ImageGallery
                  step={step}
                  onOpenLightbox={(index) =>
                    onOpenLightbox(step.images ?? [], index)
                  }
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-white/5" />
    </div>
  );
}

// ─── Floating Nav ─────────────────────────────────────────────────────────────

function FloatingNav({
  menuItems,
  searchQuery,
  onSearch,
}: {
  menuItems: GradientMenuItem[];
  searchQuery: string;
  onSearch: (q: string) => void;
}) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut", delay: 0.4 }}
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50"
    >
      <div
        className="flex items-center gap-1.5 backdrop-blur-2xl border border-white/10 rounded-full px-2 py-1.5 shadow-2xl shadow-black/60"
        style={{ background: "rgba(4,14,8,0.90)" }}
      >
        <AnimatePresence>
          {searchOpen && (
            <motion.input
              key="search-input"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 150, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-transparent text-white placeholder-white/25 text-sm focus:outline-none pl-2 pr-1 min-w-0"
              style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
              placeholder="Buscar paso..."
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              autoFocus
            />
          )}
        </AnimatePresence>

        <button
          onClick={() => {
            if (searchOpen) { setSearchOpen(false); onSearch(""); }
            else setSearchOpen(true);
          }}
          className="w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/8 transition-all duration-150 shrink-0"
        >
          {searchOpen
            ? <IoCloseOutline className="w-4 h-4 md:w-5 md:h-5" />
            : <IoSearchOutline className="w-4 h-4 md:w-5 md:h-5" />}
        </button>

        <div className="w-px h-5 bg-white/10 shrink-0" />
        <GradientMenu items={menuItems} />
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TutorialPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [isAuth, setIsAuth] = useState(false);
  const [client, setClient] = useState<Client | null>(null);
  const [openStep, setOpenStep] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [lightbox, setLightbox] = useState<{ images: StepImage[]; index: number } | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("bryanf_auth");
    if (!raw) { router.replace("/"); return; }
    try {
      const auth = JSON.parse(raw);
      if (auth.clientId !== id) { router.replace("/"); return; }
    } catch {
      router.replace("/");
      return;
    }
    // Fetch client data from API (handles both Supabase and static)
    fetch(`/api/client/${encodeURIComponent(id)}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data) { router.replace("/"); return; }
        setClient(data);
        setIsAuth(true);
      })
      .catch(() => router.replace("/"));
  }, [id, router]);

  if (!isAuth || !client) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #020c05 0%, #051208 40%, #020a04 100%)" }}
      >
        <div
          className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: "#99D742", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  const menuItems: GradientMenuItem[] = [
    {
      title: "Inicio",
      icon: <IoHomeOutline />,
      gradientFrom: "#6b9e2a",
      gradientTo: "#99D742",
      onClick: () => { sessionStorage.removeItem("bryanf_auth"); router.push("/"); },
    },
    {
      title: "Pasos",
      icon: <IoPlayCircleOutline />,
      gradientFrom: "#7ab831",
      gradientTo: "#c5e87a",
      onClick: () => document.getElementById("steps")?.scrollIntoView({ behavior: "smooth" }),
    },
    {
      title: "Drive",
      icon: <IoCloudOutline />,
      gradientFrom: "#0ea5e9",
      gradientTo: "#99D742",
      href: client.driveLink,
      external: true,
    },
    {
      title: "Ayuda",
      icon: <IoLogoWhatsapp />,
      gradientFrom: "#7ab831",
      gradientTo: "#22d3ee",
      href: WHATSAPP_LINK,
      external: true,
    },
  ];

  const filteredSteps = tutorialSteps
    .sort((a, b) => a.order - b.order)
    .filter((step) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return step.title.toLowerCase().includes(q) || step.description.toLowerCase().includes(q);
    });

  return (
    <>
      <div
        className="min-h-screen text-white"
        style={{
          background: "linear-gradient(160deg, #020e08 0%, #061a0c 20%, #0a1f10 40%, #071508 60%, #040e06 80%, #020a04 100%)",
        }}
      >
        {/* Decorative blobs */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
          <div
            className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] md:w-[900px] h-[400px] md:h-[500px] rounded-full"
            style={{
              background: "radial-gradient(ellipse, rgba(21,128,61,0.12) 0%, rgba(14,165,89,0.06) 40%, transparent 70%)",
              filter: "blur(60px)",
              willChange: "transform",
            }}
          />
          <div
            className="absolute bottom-1/3 -right-32 w-[400px] h-[400px] rounded-full"
            style={{
              background: "radial-gradient(ellipse, rgba(22,163,74,0.07) 0%, transparent 70%)",
              filter: "blur(80px)",
              willChange: "transform",
            }}
          />
        </div>

        {/* Header */}
        <header
          className="sticky top-0 z-40 border-b border-white/5 backdrop-blur-xl"
          style={{ background: "rgba(2,10,4,0.15)" }}
        >
          <div className="max-w-5xl mx-auto px-4 h-14 md:h-16 flex items-center justify-center">
            <div className="relative w-28 h-8 md:w-36 md:h-10" style={{ filter: "brightness(0) invert(1)" }}>
              <Image
                src="/logo.png"
                alt="BryanF Design"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="relative pt-7 pb-6 px-4" style={{ zIndex: 1 }}>
          <div className="max-w-5xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <span
                className="inline-flex items-center gap-2 text-[10px] md:text-xs font-bold rounded-full px-3 py-1 mb-4 tracking-widest uppercase"
                style={{
                  color: "rgba(74,222,128,0.6)",
                  background: "rgba(153,215,66,0.08)",
                  border: "1px solid rgba(153,215,66,0.12)",
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full inline-block animate-pulse" style={{ background: "#99D742" }} />
                Proyecto activo · {client.displayName}
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-white tracking-tight leading-[1.05]">
                Tus{" "}
                <span
                  className="text-transparent bg-clip-text"
                  style={{ backgroundImage: "linear-gradient(135deg, #99D742 0%, #99D742 50%, #c5e87a 100%)" }}
                >
                  tutoriales
                </span>
              </h1>
              <p className="mt-3 text-white/35 text-sm md:text-base max-w-sm mx-auto font-medium">
                Todo lo que necesitas, paso a paso.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.35, ease: "easeOut" }}
              className="mt-6 flex flex-col sm:flex-row gap-2.5 justify-center"
            >
              <a
                href={client.driveLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 font-semibold rounded-full px-6 py-2.5 text-sm transition-all duration-150 active:scale-95"
                style={{ background: "linear-gradient(135deg, #6b9e2a, #99D742)", color: "white" }}
              >
                <IoCloudOutline className="w-4 h-4" />
                Abrir carpeta en Drive
              </a>
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/8 border border-white/8 text-white/60 hover:text-white font-semibold rounded-full px-6 py-2.5 text-sm transition-all duration-150 active:scale-95"
              >
                <IoLogoWhatsapp className="w-4 h-4 text-green-400" />
                ¿Necesito ayuda?
              </a>
            </motion.div>
          </div>
        </section>

        {/* Steps */}
        <section id="steps" className="relative max-w-5xl mx-auto px-4 pb-28" style={{ zIndex: 1 }}>
          <div className="mb-5">
            <h2 className="text-base md:text-lg font-bold text-white/70 tracking-tight">
              Pasos del proyecto
            </h2>
            <p className="text-white/20 text-xs mt-0.5 font-medium">
              {filteredSteps.length === tutorialSteps.length
                ? `${tutorialSteps.length} tutoriales · Aprende a tu ritmo`
                : `${filteredSteps.length} resultado${filteredSteps.length !== 1 ? "s" : ""} para "${searchQuery}"`}
            </p>
          </div>

          {filteredSteps.length === 0 ? (
            <div className="py-16 text-center text-white/20 text-sm">
              Sin resultados para{" "}
              <span style={{ color: "rgba(74,222,128,0.5)" }}>"{searchQuery}"</span>
            </div>
          ) : (
            filteredSteps.map((step) => (
              <StepAccordion
                key={step.slug}
                step={step}
                isOpen={openStep === step.slug}
                onToggle={() => setOpenStep(openStep === step.slug ? null : step.slug)}
                onOpenLightbox={(images, index) => setLightbox({ images, index })}
              />
            ))
          )}
        </section>

        {/* Footer */}
        <footer className="relative border-t border-white/5 py-6 px-4 text-center" style={{ zIndex: 1 }}>
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-16 h-6">
              <Image src="/logo.png" alt="BryanF Design" fill className="object-contain opacity-20" />
            </div>
            <p className="text-white/12 text-xs font-medium">
              © {new Date().getFullYear()} BryanF Design · Todos los derechos reservados
            </p>
          </div>
        </footer>

        <FloatingNav
          menuItems={menuItems}
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
        />
      </div>

      <AnimatePresence>
        {lightbox && (
          <Lightbox
            images={lightbox.images}
            startIndex={lightbox.index}
            onClose={() => setLightbox(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
