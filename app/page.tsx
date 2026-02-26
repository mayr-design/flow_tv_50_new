"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import Script from "next/script";
import {
  ChevronDown,
  ArrowRight,
  Plus,
  X as CloseIcon,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence, type Variants } from "framer-motion";

type Post = {
  platform: string;
  url: string;
  media?: string[];
  category?: string;
  account?: string;
  caption?: string;
};

const SMOOTH_TRANSITION = { duration: 0.8, ease: [0.4, 0, 0.2, 1] as const };

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15, filter: "blur(10px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: SMOOTH_TRANSITION },
};

const isVideoFile = (src?: string) => {
  const s = (src ?? "").toLowerCase();
  return s.endsWith(".mp4") || s.endsWith(".webm") || s.endsWith(".mov") || s.endsWith(".m4v");
};

const isTouchDevice = () =>
  typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0);

function useStableHover(delay = 600) {
  const [hovered, setHovered] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isTouchDevice()) { setIsTouch(true); setHovered(true); }
  }, []);

  const clear = useCallback(() => { if (timer.current) clearTimeout(timer.current); }, []);
  const onEnter = useCallback(() => { if (isTouch) return; clear(); setHovered(true); }, [clear, isTouch]);
  const onLeave = useCallback(() => { if (isTouch) return; clear(); timer.current = setTimeout(() => setHovered(false), delay); }, [clear, delay, isTouch]);
  const onMove  = useCallback(() => { if (isTouch) return; clear(); setHovered(true); }, [clear, isTouch]);
  useEffect(() => () => clear(), [clear]);
  return { hovered, onEnter, onLeave, onMove };
}

// ── Logos ─────────────────────────────────────────────────────────────────────
const FlowTVLogo = ({ className = "", onClick, size = "md" }: { className?: string; onClick?: () => void; size?: "md" | "lg" }) => (
  <div onClick={onClick} className={`cursor-pointer select-none active:scale-[0.98] transition-transform ${className}`}>
    <img
      src="/flow-tv-logo.png"
      alt="Flow TV"
      className={size === "lg" ? "h-10 md:h-16 lg:h-20 w-auto" : "h-6 md:h-7 w-auto"}
    />
  </div>
);

const SGXLogo = ({ className = "" }: { className?: string }) => (
  <div className={className}>
    <img src="/sgx-logo.png" alt="SGX" className="h-5 md:h-6 w-auto opacity-90" />
  </div>
);

// ── Dropdown ──────────────────────────────────────────────────────────────────
const Dropdown = ({
  label,
  options,
  values,
  onChange,
}: {
  label: string;
  options: string[];
  values: string[];
  onChange: (v: string[]) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setMenuStyle({
      position: "fixed",
      top: rect.bottom + 8,
      left: rect.left,
      zIndex: 99999,
      minWidth: rect.width,
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    return () => window.removeEventListener("scroll", updatePosition, true);
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Node;
      if (buttonRef.current && buttonRef.current.contains(t)) return;
      const menus = document.querySelectorAll("[data-dropdown-menu]");
      for (const m of menus) { if (m.contains(t)) return; }
      setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [isOpen]);

  const toggle = (raw: string) => {
    if (raw === "all") return onChange(["all"]);
    let next = [...values];
    if (next.includes("all")) next = [raw];
    else if (next.includes(raw)) {
      next = next.filter((v) => v !== raw);
      if (next.length === 0) next = ["all"];
    } else next = [...next, raw];
    onChange(next);
  };

  const buttonLabel = useMemo(() => {
    if (values.includes("all")) return label;
    if (values.length === 1) return values[0];
    return `${values.length} Selected`;
  }, [values, label]);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen((o) => !o)}
        style={{ background: "linear-gradient(to top, #141414, #101010)" }}
        className="flex items-center gap-1.5 border border-[#373737] pl-3 pr-2 py-1.5 rounded-full text-white text-[11px] md:text-xs font-medium active:scale-[0.98] w-max flex-shrink-0 transition-all"
      >
        <span className="max-w-[80px] md:max-w-none truncate">{buttonLabel}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }} className="flex items-center justify-center flex-shrink-0">
          <ChevronDown size={12} className="text-white/80" />
        </motion.div>
      </button>

      {mounted && isOpen && createPortal(
        <AnimatePresence>
          <motion.div
            key="dropdown"
            data-dropdown-menu
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
            style={{
              ...menuStyle,
              backgroundColor: "rgba(16,16,16,0.75)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
            }}
            className="w-max border border-[#373737] rounded-[1.25rem] overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)]"
          >
            <div className="py-2 px-2">
              {/* All option */}
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { toggle("all"); setIsOpen(false); }}
                className="w-full text-left text-[13px] text-white flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/10 active:bg-white/10 transition-colors"
              >
                <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${values.includes("all") ? "border-white" : "border-white/40"}`}>
                  {values.includes("all") && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                </div>
                <span className="whitespace-nowrap">All {label.replace("All ", "")}</span>
              </button>

              {/* Individual options */}
              {options.map((raw) => {
                const isActive = values.includes(raw);
                return (
                  <button
                    key={raw}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => toggle(raw)}
                    className="w-full text-left text-[13px] text-white flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/10 active:bg-white/10 transition-colors"
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${isActive ? "border-white" : "border-white/40"}`}>
                      {isActive && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                    </div>
                    <span className="whitespace-nowrap">{raw}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

// ── Tag ───────────────────────────────────────────────────────────────────────
const Tag = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[#101010] border border-[#373737] px-2.5 py-1 rounded-full text-[10px] md:text-[11px] text-white font-medium flex items-center gap-1.5 whitespace-nowrap">
    {children}
  </div>
);

// ── Aspect ratio detector ─────────────────────────────────────────────────────
function useAspectRatio(src?: string) {
  const [ratio, setRatio] = useState<number | null>(null);
  useEffect(() => {
    if (!src) return;
    if (isVideoFile(src)) {
      const el = document.createElement("video");
      el.preload = "metadata";
      el.src = src;
      el.muted = true;
      el.playsInline = true;
      const onLoaded = () => { if (el.videoWidth && el.videoHeight) setRatio(el.videoWidth / el.videoHeight); };
      el.addEventListener("loadedmetadata", onLoaded);
      el.load();
      return () => el.removeEventListener("loadedmetadata", onLoaded);
    } else {
      const img = new Image();
      img.src = src;
      img.onload = () => { if (img.naturalWidth && img.naturalHeight) setRatio(img.naturalWidth / img.naturalHeight); };
    }
  }, [src]);
  return ratio;
}

// ── Media Carousel ────────────────────────────────────────────────────────────
function MediaCarousel({ media, href, showMadeWithFlow }: { media: string[]; href: string; showMadeWithFlow?: boolean }) {
  const [active, setActive] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { hovered, onEnter, onLeave, onMove } = useStableHover(600);

  const safeMedia = (media ?? []).filter(Boolean);
  const total = safeMedia.length;
  const src = safeMedia[active] ?? "";
  const ratio = useAspectRatio(src);
  const isVideo = isVideoFile(src);

  useEffect(() => { setActive(0); setIsPlaying(false); }, [media?.join("|")]);
  useEffect(() => { setIsPlaying(false); }, [active]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !isVideo) return;
    if (isPlaying) { v.muted = isMuted; v.playsInline = true; v.play().catch(() => {}); }
    else { v.pause(); }
  }, [isPlaying, isVideo, src]);

  useEffect(() => { if (videoRef.current) videoRef.current.muted = isMuted; }, [isMuted]);

  const goPrev = (e: React.MouseEvent) => { e.stopPropagation(); if (total > 1) setActive((i) => (i - 1 + total) % total); };
  const goNext = (e: React.MouseEvent) => { e.stopPropagation(); if (total > 1) setActive((i) => (i + 1) % total); };

  return (
    <div
      className="relative w-full overflow-hidden rounded-[1rem] md:rounded-[1.25rem] bg-[#0A0A0A] shadow-[0_30px_70px_-40px_rgba(0,0,0,0.9)]"
      onMouseEnter={onEnter} onMouseLeave={onLeave} onMouseMove={onMove}
      style={{ aspectRatio: ratio ?? 16 / 9 }}
    >
      <div
        className="absolute inset-0 bg-black z-[5]"
        onClick={(e) => { e.stopPropagation(); if (isVideo) setIsPlaying((p) => !p); }}
        style={{ cursor: isVideo ? "pointer" : "default" }}
      >
        {isVideo ? (
          <video ref={videoRef} src={`${src}#t=0.001`} className="w-full h-full object-contain" muted={isMuted} playsInline preload="metadata" loop onEnded={() => setIsPlaying(false)} />
        ) : src ? (
          <img src={src} alt="" className="w-full h-full object-contain" draggable={false} />
        ) : (
          <div className="w-full h-full bg-[#0A0A0A]" />
        )}
      </div>

      <div className={`absolute inset-0 z-[10] pointer-events-none transition-opacity duration-300 ${hovered ? "opacity-100" : "opacity-0"}`}>
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/50 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      {showMadeWithFlow && (
        <div className="absolute top-3 left-3 z-[20] bg-white/10 backdrop-blur-md px-2 py-0.5 rounded-md text-[9px] text-white font-medium border border-white/10 pointer-events-none">
          Made with Flow
        </div>
      )}

      <a
        href={href} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
        className={`absolute top-3 right-3 z-[30] w-9 h-9 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white transition-opacity duration-300 ${hovered ? "opacity-100" : "opacity-0"}`}
      >
        <ExternalLink size={16} />
      </a>

      {isVideo && (
        <div className={`absolute bottom-3 left-3 z-[30] flex gap-2 transition-opacity duration-300 ${hovered ? "opacity-100" : "opacity-0"}`}>
          <button onClick={(e) => { e.stopPropagation(); setIsPlaying((p) => !p); }} className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-black/70 transition-colors">
            {isPlaying
              ? <svg width="12" height="12" viewBox="0 0 12 12" fill="white"><rect x="1" y="1" width="3.5" height="10" rx="1"/><rect x="7.5" y="1" width="3.5" height="10" rx="1"/></svg>
              : <svg width="12" height="12" viewBox="0 0 12 12" fill="white"><polygon points="2,1 11,6 2,11"/></svg>
            }
          </button>
          <button onClick={(e) => { e.stopPropagation(); setIsMuted((m) => !m); }} className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-black/70 transition-colors">
            {isMuted
              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
            }
          </button>
        </div>
      )}

      {total > 1 && (
        <>
          <button onClick={goPrev} className={`absolute left-3 top-1/2 -translate-y-1/2 z-[30] w-10 h-10 rounded-full bg-black/35 border border-white/10 backdrop-blur-md flex items-center justify-center text-white transition-opacity duration-300 ${hovered ? "opacity-100" : "opacity-0"}`}><ChevronLeft size={18} /></button>
          <button onClick={goNext} className={`absolute right-3 top-1/2 -translate-y-1/2 z-[30] w-10 h-10 rounded-full bg-black/35 border border-white/10 backdrop-blur-md flex items-center justify-center text-white transition-opacity duration-300 ${hovered ? "opacity-100" : "opacity-0"}`}><ChevronRight size={18} /></button>
          <div className={`absolute bottom-3 left-1/2 -translate-x-1/2 z-[30] flex gap-1.5 transition-opacity duration-300 ${hovered ? "opacity-100" : "opacity-0"}`}>
            {safeMedia.map((_, i) => (
              <button key={i} onClick={(e) => { e.stopPropagation(); setActive(i); }} className={`w-1.5 h-1.5 rounded-full transition-all ${i === active ? "bg-white" : "bg-white/35 hover:bg-white/60"}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Post Card ─────────────────────────────────────────────────────────────────
const PostCard = ({ post }: { post: Post }) => {
  const [showCaption, setShowCaption] = useState(false);
  const media = (post.media ?? []).filter(Boolean);

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <AnimatePresence>
          {showCaption && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
              className="absolute inset-0 z-[40] bg-black/85 backdrop-blur-xl p-5 md:p-8 flex flex-col justify-center rounded-[1rem] md:rounded-[1.25rem]"
            >
              <button onClick={() => setShowCaption(false)} className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors">
                <CloseIcon size={20} />
              </button>
              <p className="text-white text-[12px] md:text-[14px] leading-relaxed whitespace-pre-wrap">{post.caption ?? ""}</p>
            </motion.div>
          )}
        </AnimatePresence>
        <MediaCarousel media={media} href={post.url} showMadeWithFlow={post.platform === "IG"} />
      </div>

      <div className="flex items-center gap-1 flex-nowrap overflow-x-auto no-scrollbar px-1">
        <Tag>{post.platform}</Tag>
        {!!post.account && <Tag>{post.account}</Tag>}
        {!!post.category && <Tag>{post.category}</Tag>}
        <button
          onClick={() => setShowCaption((s) => !s)}
          className="ml-auto flex items-center gap-1 text-[9px] md:text-[10px] text-zinc-500 hover:text-white transition-colors px-1 whitespace-nowrap flex-shrink-0"
        >
          {showCaption ? <CloseIcon size={10} /> : <Plus size={10} />}
          {showCaption ? "Hide" : "Caption"}
        </button>
      </div>
    </div>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Page() {
  const [view, setView] = useState<"landing" | "catalog">("landing");
  const [typedText, setTypedText] = useState("");
  const fullText = "50+ Flow TV posts created in Flow. Would you like to take a look?";

  const [posts, setPosts] = useState<Post[]>([]);
  const [filterPlatform, setFilterPlatform] = useState<string[]>(["all"]);
  const [filterAccount,  setFilterAccount]  = useState<string[]>(["all"]);
  const [filterContent,  setFilterContent]  = useState<string[]>(["all"]);

  useEffect(() => {
    fetch("/posts.json", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setPosts(Array.isArray(data) ? data : []))
      .catch(() => setPosts([]));
  }, []);

  useEffect(() => {
    if (view !== "landing") return;
    setTypedText("");
    let i = 0;
    const id = setInterval(() => { setTypedText(fullText.slice(0, i)); i++; if (i > fullText.length) clearInterval(id); }, 40);
    return () => clearInterval(id);
  }, [view]);

  const platformOptions = useMemo(() =>
    Array.from(new Set(posts.map((p) => p.platform))).sort()
  , [posts]);

  const accountOptions = useMemo(() =>
    Array.from(new Set(posts.map((p) => p.account).filter((a): a is string => !!a))).sort()
  , [posts]);

  const categoryOptions = useMemo(() =>
    Array.from(new Set(posts.map((p) => p.category).filter((c): c is string => !!c))).sort()
  , [posts]);

  const filteredPosts = useMemo(() => posts.filter((p) => {
    const matchPlat = filterPlatform.includes("all") || filterPlatform.includes(p.platform);
    const matchAcc  = filterAccount.includes("all")  || filterAccount.includes(p.account ?? "");
    const matchCat  = filterContent.includes("all")  || filterContent.includes(p.category ?? "");
    return matchPlat && matchAcc && matchCat;
  }), [posts, filterPlatform, filterAccount, filterContent]);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/20 overflow-x-hidden">
      <Script src="https://platform.twitter.com/widgets.js" strategy="afterInteractive" />

      <AnimatePresence mode="wait">
        {view === "landing" ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -15, filter: "blur(15px)", transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] } }}
            className="h-screen flex flex-col items-center justify-center px-5 md:px-6 relative"
          >
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, ...SMOOTH_TRANSITION }} className="mb-6 md:mb-10">
              <FlowTVLogo size="lg" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, ...SMOOTH_TRANSITION }}
              className="w-full max-w-xl border border-[#3B3B3B] rounded-[2rem] pt-5 pb-[10px] pr-[10px] pl-7 relative overflow-hidden flex flex-col items-start justify-start"
              style={{ background: "linear-gradient(to top, #191919, #000000)" }}
            >
              <div className="relative w-full">
                <p className="invisible text-base md:text-xl font-normal leading-relaxed text-left w-full select-none pr-6" aria-hidden="true">{fullText}</p>
                <p className="absolute inset-0 text-white text-base md:text-xl font-normal leading-relaxed text-left w-full pr-6">
                  {typedText}
                  <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="inline-block w-0.5 h-5 bg-white/60 ml-1 translate-y-1" />
                </p>
              </div>
              <div className="mt-1 flex w-full justify-end">
                <button
                  onClick={() => setView("catalog")}
                  className="w-10 h-10 rounded-full border border-[#3D3D3D] flex items-center justify-center transition-all duration-300 bg-[#1A1A1A] shadow-lg active:scale-95 group hover:border-[#666]"
                >
                  <ArrowRight size={18} className="text-[#525252] group-hover:text-white transition-colors duration-300" />
                </button>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 1 }} className="absolute bottom-10 left-1/2 -translate-x-1/2">
              <SGXLogo />
            </motion.div>
          </motion.div>
        ) : (
          <motion.div key="catalog" variants={containerVariants} initial="hidden" animate="visible" className="p-4 md:p-10 relative">

            <motion.header variants={itemVariants} className="mb-6 md:mb-12 z-[100] relative">
              {/* Mobile */}
              <div className="md:hidden">
                <div className="flex items-center justify-between mb-4">
                  <FlowTVLogo onClick={() => setView("landing")} className="hover:opacity-70 transition-opacity" />
                  <SGXLogo />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Dropdown label="All Platforms" options={platformOptions} values={filterPlatform} onChange={setFilterPlatform} />
                  <Dropdown label="All Accounts"  options={accountOptions}  values={filterAccount}  onChange={setFilterAccount}  />
                  <Dropdown label="All Contents"  options={categoryOptions}  values={filterContent}  onChange={setFilterContent}  />
                </div>
              </div>

              {/* Desktop */}
              <div className="hidden md:flex items-center justify-between relative">
                <FlowTVLogo onClick={() => setView("landing")} className="hover:opacity-70 transition-opacity flex-shrink-0" />
                <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3">
                  <Dropdown label="All Platforms" options={platformOptions} values={filterPlatform} onChange={setFilterPlatform} />
                  <Dropdown label="All Accounts"  options={accountOptions}  values={filterAccount}  onChange={setFilterAccount}  />
                  <Dropdown label="All Contents"  options={categoryOptions}  values={filterContent}  onChange={setFilterContent}  />
                </div>
                <SGXLogo className="flex-shrink-0" />
              </div>
            </motion.header>

            <main className="relative z-10">
              <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 [column-fill:_balance]">
                {filteredPosts.map((post, idx) => (
                  <motion.div
                    key={`${post.url}-${idx}`}
                    initial={{ opacity: 0, y: 15, filter: "blur(10px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1], delay: idx * 0.05 }}
                    className="mb-6 md:mb-10 break-inside-avoid"
                  >
                    <PostCard post={post} />
                  </motion.div>
                ))}
              </div>

              {filteredPosts.length === 0 && (
                <motion.div variants={itemVariants} className="h-[50vh] flex flex-col items-center justify-center">
                  <p className="text-lg font-medium text-zinc-400">No matches found.</p>
                  <button
                    onClick={() => { setFilterPlatform(["all"]); setFilterAccount(["all"]); setFilterContent(["all"]); }}
                    className="mt-4 text-white hover:underline font-medium"
                  >
                    Clear All Filters
                  </button>
                </motion.div>
              )}
            </main>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
