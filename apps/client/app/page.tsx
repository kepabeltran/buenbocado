"use client";

import Link from "next/link";
import { useAuth } from "./_auth/AuthProvider";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://127.0.0.1:4000"
).replace(/\/$/, "");

type Offer = {
  id: string;
  restaurant: string;
  title: string;
  description?: string | null;
  priceCents: number;
  timeRemaining: string;
  distanceKm: number;
  imageUrl?: string | null;
};

function fixImg(u: string | null | undefined) {
  if (!u) return null;
  if (u.startsWith("/uploads/")) return `${API_BASE}${u}`;
  return u.replace("http://127.0.0.1:4000", API_BASE).replace("http://localhost:4000", API_BASE);
}

function formatEuros(cents: number) {
  return (cents / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

/* ─── Scroll animation hook ──────────────────────── */
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useScrollReveal();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ─── Ticker de reservas recientes ───────────────── */
function RecentTicker({ offers }: { offers: Offer[] }) {
  const [idx, setIdx] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    if (offers.length === 0) return;
    const timer = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIdx((i) => (i + 1) % offers.length);
        setFade(true);
      }, 300);
    }, 3500);
    return () => clearInterval(timer);
  }, [offers.length]);

  if (offers.length === 0) return null;
  const o = offers[idx];
  const img = fixImg(o.imageUrl);
  const timeAgo = Math.floor(Math.random() * 12) + 1;

  return (
    <div className="overflow-hidden">
      <div className={`flex items-center gap-3 transition-all duration-300 ${fade ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}>
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100">
          {img ? <img src={img} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full bg-emerald-50" />}
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900">{o.title}</p>
          <p className="text-xs text-white/80">Reservado hace {timeAgo} min en {o.restaurant}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Carrusel de ofertas reales ─────────────────── */
function OfferCarousel({ offers }: { offers: Offer[] }) {
  const [idx, setIdx] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    if (offers.length <= 1) return;
    const timer = setInterval(() => {
      setFade(false);
      setTimeout(() => { setIdx((i) => (i + 1) % offers.length); setFade(true); }, 300);
    }, 4000);
    return () => clearInterval(timer);
  }, [offers.length]);

  const o = offers[idx];
  if (!o) return null;
  const img = fixImg(o.imageUrl);

  return (
    <div className="relative mx-auto max-w-[320px]">
      <Link href={`/offers/${o.id}`} className="block">
        <div className={`rounded-3xl bg-white p-4 shadow-2xl shadow-slate-900/8 border border-slate-100/80 transition-all duration-300 hover:shadow-3xl hover:-translate-y-1 ${fade ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"}`}>
          <div className="h-44 rounded-2xl overflow-hidden bg-slate-100">
            {img ? <img src={img} alt={o.title} className="h-full w-full object-cover" /> : (
              <div className="h-full w-full grid place-items-center bg-gradient-to-br from-emerald-50 to-lime-50">
                <span className="text-emerald-600 font-extrabold">BB</span>
              </div>
            )}
          </div>
          <div className="mt-3">
            <p className="text-xs font-bold text-emerald-600">{o.restaurant}</p>
            <p className="text-base font-extrabold mt-0.5">{o.title}</p>
            {o.description && <p className="text-xs text-slate-400 mt-0.5 truncate">{o.description}</p>}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">{o.timeRemaining}</span>
            <span className="text-lg font-extrabold text-emerald-600">{formatEuros(o.priceCents)}</span>
          </div>
          <div className="mt-3 rounded-xl bg-emerald-600 py-2.5 text-center text-sm font-bold text-white hover:bg-emerald-700 transition">Ver oferta</div>
        </div>
      </Link>
      {offers.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-4">
          {offers.map((_, i) => (
            <button
              key={i}
              onClick={() => { setFade(false); setTimeout(() => { setIdx(i); setFade(true); }, 200); }}
              className={"h-1.5 rounded-full transition-all duration-300 " + (i === idx ? "w-6 bg-emerald-600" : "w-1.5 bg-slate-300 hover:bg-slate-400")}
            />
          ))}
        </div>
      )}
    </div>
  );
}



/* ─── Contador animado ────────────────────────── */
function AnimatedCounter({ end, suffix = "", duration = 2000, repeatInterval = 20000 }: { end: number; suffix?: string; duration?: number; repeatInterval?: number }) {
  const [count, setCount] = useState(0);
  const [visible, setVisible] = useState(false);
  const [cycle, setCycle] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => { setVisible(entry.isIntersecting); },
      { threshold: 0.3 }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  // Repeat cycle while visible
  useEffect(() => {
    if (!visible) return;
    setCycle((c) => c + 1);
    const timer = setInterval(() => setCycle((c) => c + 1), repeatInterval);
    return () => clearInterval(timer);
  }, [visible, repeatInterval]);

  // Animate count on each cycle
  useEffect(() => {
    if (cycle === 0) return;
    setCount(0);
    let startTime: number;
    let raf: number;
    function step(ts: number) {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * end));
      if (progress < 1) raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [cycle, end, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
}

/* ─── Confeti con Canvas ─────────────────────── */
function ConfettiCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const parent = canvas.parentElement;
    if (!parent) return;
    canvas.width = parent.offsetWidth;
    canvas.height = parent.offsetHeight;

    const colors = [
      "#059669", "#10b981", "#34d399", "#6ee7b7",
      "#a7f3d0", "#fbbf24", "#f59e0b", "#ffffff"
    ];

    type Particle = {
      x: number; y: number;
      w: number; h: number;
      vx: number; vy: number;
      rot: number; rotSpeed: number;
      color: string;
      opacity: number;
      shape: "rect" | "circle" | "star";
      wobble: number; wobbleSpeed: number;
      gravity: number;
      drag: number;
    };

    const particles: Particle[] = [];
    const COUNT = 80;

    for (let i = 0; i < COUNT; i++) {
      const shape = Math.random() > 0.6 ? "circle" : Math.random() > 0.3 ? "rect" : "star";
      particles.push({
        x: canvas.width * 0.1 + Math.random() * canvas.width * 0.8,
        y: -10 - Math.random() * canvas.height * 0.3,
        w: 4 + Math.random() * 6,
        h: shape === "rect" ? 6 + Math.random() * 10 : 4 + Math.random() * 6,
        vx: (Math.random() - 0.5) * 4,
        vy: 1 + Math.random() * 3,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.15,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: 0.8 + Math.random() * 0.2,
        shape,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.03 + Math.random() * 0.06,
        gravity: 0.06 + Math.random() * 0.08,
        drag: 0.98 + Math.random() * 0.015,
      });
    }

    let frame = 0;
    let raf: number;
    const maxFrames = 180; // ~3 seconds at 60fps

    function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const method = i === 0 ? "moveTo" : "lineTo";
        ctx[method](cx + r * Math.cos(angle), cy + r * Math.sin(angle));
      }
      ctx.closePath();
      ctx.fill();
    }

    function animate() {
      frame++;
      if (frame > maxFrames) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const fadeOut = frame > maxFrames * 0.7 ? 1 - (frame - maxFrames * 0.7) / (maxFrames * 0.3) : 1;

      for (const p of particles) {
        p.wobble += p.wobbleSpeed;
        p.vx += Math.sin(p.wobble) * 0.12;
        p.vy += p.gravity;
        p.vx *= p.drag;
        p.vy *= p.drag;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.rotSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = p.opacity * fadeOut;
        ctx.fillStyle = p.color;

        if (p.shape === "rect") {
          // 3D ribbon effect - scale width based on rotation
          const scaleX = Math.abs(Math.cos(p.rot * 2));
          ctx.fillRect(-p.w / 2 * scaleX, -p.h / 2, p.w * scaleX, p.h);
        } else if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          drawStar(ctx, 0, 0, p.w / 2);
        }

        ctx.restore();
      }

      raf = requestAnimationFrame(animate);
    }

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-10"
      style={{ width: "100%", height: "100%" }}
    />
  );
}

/* ─── Página principal ───────────────────────────── */
export default function LandingPage() {
  const [heroVisible, setHeroVisible] = useState(false);
  const { user, isLoggedIn } = useAuth();

  // Greeting
  const greeting = useMemo(() => {
    if (!isLoggedIn || !user?.name) return null;
    const h = new Date().getHours();
    const firstName = user.name.split(" ")[0];
    if (h < 13) return { text: "Buenos días", emoji: "☀️", name: firstName };
    if (h < 20) return { text: "Buenas tardes", emoji: "🌤️", name: firstName };
    return { text: "Buenas noches", emoji: "🌙", name: firstName };
  }, [isLoggedIn, user]);

  // Typewriter
  const [typedText, setTypedText] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const fullGreeting = greeting ? `${greeting.text}, ${greeting.name} ${greeting.emoji}` : "";

  // Weather
  const [weatherLine, setWeatherLine] = useState<string | null>(null);
  const [weatherEmoji, setWeatherEmoji] = useState("");

  useEffect(() => {
    if (!isLoggedIn) return;
    async function fetchWeather() {
      try {
        const token = localStorage.getItem("bb_access_token");
        if (!token) return;
        const meRes = await fetch(API_BASE + "/api/auth/me", {
          headers: { Authorization: "Bearer " + token },
        });
        const meJson = await meRes.json().catch(() => ({}));
        const lat = meJson?.user?.lat;
        const lng = meJson?.user?.lng;
        const city = meJson?.user?.city || "";
        if (!lat || !lng) return;

        const wRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code&timezone=auto`
        );
        const wJson = await wRes.json().catch(() => ({}));
        const temp = wJson?.current?.temperature_2m;
        const code = wJson?.current?.weather_code;
        if (temp == null) return;

        const h = new Date().getHours();
        const round = Math.round(temp);

        // Weather codes: 0-1 clear, 2-3 cloudy, 45-48 fog, 51-67 rain, 71-77 snow, 80-82 showers, 95-99 storm
        const isRain = (code >= 51 && code <= 67) || (code >= 80 && code <= 82);
        const isStorm = code >= 95;
        const isSnow = code >= 71 && code <= 77;
        const isCloudy = code >= 2 && code <= 3;
        const isFog = code >= 45 && code <= 48;
        const isClear = code <= 1;

        const cold = round < 12;
        const warm = round >= 12 && round < 25;
        const hot = round >= 25;

        const isMorning = h >= 6 && h < 13;
        const isLunch = h >= 13 && h < 16;
        const isAfternoon = h >= 16 && h < 20;
        const isNight = h >= 20 || h < 6;

        let line = "";
        let emoji = "";

        if (isStorm) {
          emoji = "⛈️";
          line = isMorning
            ? `${round}°C y tormenta${city ? " en " + city : ""}. Pide algo calentito y quédate a cubierto`
            : isLunch
            ? `${round}°C con tormenta. Perfecto para comer sin salir de casa`
            : `${round}°C y tormenta${city ? " en " + city : ""}. Recoge tu pedido rápido y a disfrutar`;
        } else if (isSnow) {
          emoji = "🌨️";
          line = `${round}°C y nieve${city ? " en " + city : ""}. Día de plato caliente y manta`;
        } else if (isRain && cold) {
          emoji = "🌧️";
          line = isMorning
            ? `${round}°C y lluvia${city ? " en " + city : ""}. Empieza el día con algo que reconforte`
            : isLunch
            ? `${round}°C y lluvia. Día perfecto para una comida casera sin cocinar`
            : isNight
            ? `${round}°C y lluvia. Cena lista para recoger sin mojarte mucho`
            : `${round}°C y lluvia${city ? " en " + city : ""}. Sal, recoge y vuelve al calorcito`;
        } else if (isRain && !cold) {
          emoji = "🌦️";
          line = isLunch
            ? `${round}°C con algo de lluvia. Ahorra tiempo y recoge tu comida lista`
            : `${round}°C y lluvia suave${city ? " en " + city : ""}. Un paseo rápido y comes de restaurante`;
        } else if (isFog) {
          emoji = "🌫️";
          line = `${round}°C con niebla${city ? " en " + city : ""}. Algo calentito te sentará genial`;
        } else if (cold && isClear) {
          emoji = "❄️";
          line = isMorning
            ? `${round}°C y cielos despejados${city ? " en " + city : ""}. Arranca el día con energía`
            : isLunch
            ? `Solo ${round}°C pero sol. Recoge tu plato y come como un rey`
            : isNight
            ? `${round}°C esta noche. Cena de restaurante a precio reducido, ¿quién dice que no?`
            : `${round}°C pero con sol${city ? " en " + city : ""}. Un paseo y a comer bien`;
        } else if (cold && isCloudy) {
          emoji = "☁️";
          line = isLunch
            ? `${round}°C y nublado. Día de comfort food sin complicarte`
            : `${round}°C y gris${city ? " en " + city : ""}. Anímate con un buen plato a mitad de precio`;
        } else if (hot && isClear) {
          emoji = "☀️";
          line = isMorning
            ? `${round}°C y sol${city ? " en " + city : ""}. Pide algo fresquito para el mediodía`
            : isLunch
            ? `${round}°C al sol. Algo ligero y fresco te viene perfecto`
            : isAfternoon
            ? `${round}°C todavía${city ? " en " + city : ""}. Merienda o cena temprana a buen precio`
            : `${round}°C esta noche. Cena ligera de restaurante sin encender el horno`;
        } else if (hot) {
          emoji = "🌡️";
          line = `${round}°C${city ? " en " + city : ""}. Demasiado calor para cocinar, ¿no crees?`;
        } else if (warm && isClear) {
          emoji = "🌤️";
          line = isMorning
            ? `${round}°C con sol${city ? " en " + city : ""}. Buen día para recoger tu pedido paseando`
            : isLunch
            ? `${round}°C y buen tiempo. Come de restaurante pagando menos`
            : isNight
            ? `${round}°C esta noche${city ? " en " + city : ""}. Sal a dar un paseo y vuelve con cena`
            : `${round}°C y sol. El tiempo perfecto para un capricho gastronómico`;
        } else {
          emoji = "🍽️";
          line = isLunch
            ? `${round}°C${city ? " en " + city : ""}. Hora de comer bien sin gastar de más`
            : isMorning
            ? `${round}°C${city ? " en " + city : ""}. Las mejores ofertas del día te esperan`
            : `${round}°C${city ? " en " + city : ""}. Comida de restaurante a precio reducido`;
        }

        setWeatherLine(line);
        setWeatherEmoji(emoji);
      } catch (e) {
        // silently fail
      }
    }
    fetchWeather();
  }, [isLoggedIn]);

    useEffect(() => {
    if (!greeting || !heroVisible) return;
    let i = 0;
    setTypedText("");
    const timer = setInterval(() => {
      i++;
      setTypedText(fullGreeting.slice(0, i));
      if (i >= fullGreeting.length) {
        clearInterval(timer);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 2000);
      }
    }, 45);
    return () => clearInterval(timer);
  }, [greeting, heroVisible, fullGreeting]);
  const [scrollY, setScrollY] = useState(0);
  const [offers, setOffers] = useState<Offer[]>([]);

  useEffect(() => {
    setHeroVisible(true);
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const loadOffers = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/menus/active?lat=36.72&lng=-4.42`, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (Array.isArray(json?.data)) setOffers(json.data.slice(0, 4));
    } catch {}
  }, []);

  useEffect(() => { loadOffers(); }, [loadOffers]);

  return (
    <div className="min-h-screen bg-[#fafdf7] text-slate-900 overflow-x-hidden" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,500;0,9..40,700;0,9..40,800;1,9..40,400&display=swap" rel="stylesheet" />

      {/* ─── NAV ──────────────────────────────────── */}
      <nav className={"fixed top-0 left-0 right-0 z-50 transition-all duration-300 " + (scrollY > 40 ? "bg-white/90 backdrop-blur-md shadow-sm border-b border-emerald-100" : "bg-transparent")}>
        <div className="mx-auto max-w-6xl flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-600 text-sm font-extrabold text-white">BB</span>
            <span className="text-lg font-extrabold tracking-tight">Buen<span className="text-emerald-600">Bocado</span></span>
          </div>
          <div className="flex items-center gap-5">
            <a href="#como-funciona" className="text-sm font-medium text-slate-500 hover:text-emerald-700 transition hidden md:inline">Cómo funciona</a>
            <a href="/restaurantes" className="text-sm font-medium text-slate-500 hover:text-emerald-700 transition hidden md:inline">Restaurantes</a>
            <Link href="/offers" className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/20">Ver ofertas</Link>
            {isLoggedIn ? (
              <Link href="/orders" className="text-sm font-bold text-emerald-600 hover:text-emerald-800 transition hidden md:inline">{user?.name?.split(" ")[0]}</Link>
            ) : (
              <Link href="/auth" className="text-sm font-medium text-slate-500 hover:text-emerald-700 transition hidden md:inline">Acceder</Link>
            )}
          </div>
        </div>
      </nav>

      {/* ─── HERO ─────────────────────────────────── */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 px-5">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-emerald-100/40 blur-3xl" />
          <div className="absolute top-40 -left-20 w-[300px] h-[300px] rounded-full bg-lime-100/30 blur-3xl" />
{showConfetti && <ConfettiCanvas />}
        </div>
        <div className="relative mx-auto max-w-6xl grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className={"transition-all duration-700 " + (heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6")}>
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-4 py-1.5 text-xs font-bold text-emerald-700 mb-6">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {offers.length > 0 ? `${offers.length} ofertas disponibles ahora` : "Ofertas en tiempo real"}
              </span>
            </div>
            {greeting ? (
              <>
                <h1 className={"text-4xl sm:text-5xl md:text-6xl font-extrabold leading-[1.08] tracking-tight transition-all duration-700 delay-100 " + (heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6")}>
                  <span className="relative">
                    {typedText}
                    <span className="animate-pulse text-emerald-400">|</span>
                  </span>
                </h1>
                <p className={"mt-5 text-base md:text-lg text-slate-500 max-w-md leading-relaxed transition-all duration-700 delay-200 " + (heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6")}>
                  {offers.length > 0 ? (
                    <><span className="text-emerald-600 font-extrabold text-xl">{offers.length} ofertas</span> te esperan cerca</>
                  ) : "Descubre ofertas de restaurantes a precio reducido"}
                </p>
                {weatherLine && (
                  <div className={"mt-4 inline-flex items-center gap-2 rounded-2xl bg-white/80 backdrop-blur border border-emerald-100 px-4 py-2.5 shadow-sm transition-all duration-1000 delay-700 " + (heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
                    <span className="text-lg">{weatherEmoji}</span>
                    <span className="text-sm text-slate-600 leading-snug">{weatherLine}</span>
                  </div>
                )}
              </>
            ) : (
              <>
                <h1 className={"text-4xl sm:text-5xl md:text-6xl font-extrabold leading-[1.08] tracking-tight transition-all duration-700 delay-100 " + (heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6")}>
                  Comida de{" "}<span className="text-emerald-600">restaurante</span>{" "}a precio reducido
                </h1>
                <p className={"mt-5 text-base md:text-lg text-slate-500 max-w-md leading-relaxed transition-all duration-700 delay-200 " + (heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6")}>
                  Reserva platos con descuento de restaurantes cerca de ti. Recoge en minutos con tu código QR.
                </p>
              </>
            )}
            <div className={"mt-8 flex flex-wrap gap-3 transition-all duration-700 delay-300 " + (heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6")}>
              <Link href="/offers" className="rounded-full bg-emerald-600 px-7 py-3.5 text-sm font-bold text-white hover:bg-emerald-700 transition shadow-xl shadow-emerald-600/20 hover:shadow-emerald-600/35 hover:-translate-y-0.5">
                {isLoggedIn ? "Ver mis ofertas" : "Explorar ofertas"}
              </Link>
              {isLoggedIn ? (
                <Link href="/orders" className="rounded-full border-2 border-slate-200 bg-white px-7 py-3.5 text-sm font-bold text-slate-600 hover:border-emerald-300 hover:text-emerald-700 transition">Mis pedidos</Link>
              ) : (
                <a href="#como-funciona" className="rounded-full border-2 border-slate-200 bg-white px-7 py-3.5 text-sm font-bold text-slate-600 hover:border-emerald-300 hover:text-emerald-700 transition">Cómo funciona</a>
              )}
            </div>


          </div>

          <div className={"hidden md:block transition-all duration-1000 delay-300 " + (heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
            {offers.length > 0 ? <OfferCarousel offers={offers} /> : (
              <div className="mx-auto max-w-[320px] rounded-3xl bg-white p-5 shadow-2xl shadow-slate-900/8 border border-slate-100/80">
                <div className="h-44 rounded-2xl bg-gradient-to-br from-emerald-50 to-lime-50 grid place-items-center">
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Cargando ofertas</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── CÓMO FUNCIONA ────────────────────────── */}
      <section id="como-funciona" className="py-20 md:py-28 px-5 bg-white">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <div className="text-center max-w-lg mx-auto">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">Cómo funciona</span>
              <h2 className="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight">En 3 pasos tienes tu comida</h2>
            </div>
          </Reveal>
          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {[
              { step: "01", title: "Elige tu oferta", desc: "Explora los platos disponibles cerca de ti con descuentos exclusivos de última hora.",
                icon: <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg> },
              { step: "02", title: "Reserva al instante", desc: "Confirma en segundos. Recibirás un código QR y un código de recogida único.",
                icon: <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg> },
              { step: "03", title: "Recoge y disfruta", desc: "Ve al restaurante, muestra tu código y llévate tu comida. Sin esperas.",
                icon: <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> },
            ].map((item, i) => (
              <Reveal key={item.step} delay={i * 150}>
                <div className="relative rounded-2xl bg-[#fafdf7] border border-emerald-100/60 p-7 hover:shadow-lg hover:shadow-emerald-50 transition-all duration-300 hover:-translate-y-0.5">
                  <span className="absolute top-5 right-6 text-5xl font-extrabold text-emerald-100">{item.step}</span>
                  <div className="h-11 w-11 rounded-xl bg-emerald-50 grid place-items-center">{item.icon}</div>
                  <h3 className="mt-4 text-base font-extrabold">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── BENEFICIOS ───────────────────────────── */}
      <section className="py-20 md:py-28 px-5 bg-[#fafdf7]">
        <div className="mx-auto max-w-6xl grid gap-12 md:grid-cols-2 items-center">
          <Reveal>
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">Ventajas</span>
              <h2 className="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight">Ahorra sin renunciar a la calidad</h2>
              <div className="mt-8 space-y-5">
                {[
                  { title: "Hasta 50% de descuento", desc: "Platos de restaurante a precios que no encontrarás en ningún otro sitio." },
                  { title: "Ofertas cerca de ti", desc: "Ordenadas por distancia real gracias al GPS de tu dispositivo." },
                  { title: "Reserva en 10 segundos", desc: "Selecciona, confirma y recibe tu código QR al instante." },
                  { title: "Menos desperdicio", desc: "Cada reserva es comida que no se tira. Bueno para ti, bueno para todos." },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3">
                    <div className="mt-1 h-5 w-5 shrink-0 rounded-full bg-emerald-100 grid place-items-center">
                      <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{item.title}</p>
                      <p className="text-sm text-slate-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
          <Reveal delay={200}>
            <div className="relative">
              <style>{`
                @keyframes gradientShift {
                  0% { background-position: 0% 50%; }
                  25% { background-position: 100% 50%; }
                  50% { background-position: 100% 0%; }
                  75% { background-position: 0% 100%; }
                  100% { background-position: 0% 50%; }
                }
                .animated-gradient {
                  background: linear-gradient(-45deg, #059669, #10b981, #0d9488, #14b8a6, #047857, #34d399);
                  background-size: 300% 300%;
                  animation: gradientShift 8s ease infinite;
                }
                @keyframes floatBubble {
                  0%, 100% { transform: translateY(0) scale(1); opacity: 0.08; }
                  50% { transform: translateY(-20px) scale(1.1); opacity: 0.15; }
                }
              `}</style>
              <div className="animated-gradient rounded-3xl p-8 md:p-10 text-white relative overflow-hidden">
                {/* Floating decorative circles */}
                <div className="absolute top-6 right-8 w-32 h-32 rounded-full bg-white/5" style={{ animation: "floatBubble 6s ease-in-out infinite" }} />
                <div className="absolute bottom-10 left-6 w-20 h-20 rounded-full bg-white/5" style={{ animation: "floatBubble 8s ease-in-out 1s infinite" }} />
                <div className="absolute top-1/2 right-1/3 w-14 h-14 rounded-full bg-white/5" style={{ animation: "floatBubble 7s ease-in-out 2s infinite" }} />

                <div className="relative z-10">
                  <p className="text-xs font-bold text-white/70 uppercase tracking-wider">Ahorro medio por pedido</p>
                  <p className="mt-2 text-5xl font-extrabold"><AnimatedCounter end={35} suffix="%" duration={1800} /></p>
                  <p className="mt-1 text-white/70 text-sm">respecto al precio original del plato</p>
                  <div className="mt-8 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/10 hover:bg-white/15 transition-colors duration-300">
                      <p className="text-xl font-extrabold"><AnimatedCounter end={2} suffix=" min" duration={1200} /></p>
                      <p className="text-xs text-white/60 mt-0.5">tiempo medio de reserva</p>
                    </div>
                    <div className="rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/10 hover:bg-white/15 transition-colors duration-300">
                      <p className="text-lg font-extrabold leading-tight">Sin comisiones</p>
                      <p className="text-xs text-white/60 mt-0.5">Lo que ves es lo que pagas</p>
                    </div>
                  </div>
                  {offers.length > 0 && (
                    <div className="mt-6 rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/10">
                      <p className="text-[10px] font-bold text-white/60 uppercase tracking-wider mb-2">Última actividad</p>
                      <RecentTicker offers={offers} />
                    </div>
                  )}
                </div>
              </div>
              <div className="absolute -bottom-3 -right-3 w-full h-full rounded-3xl bg-emerald-200/20 -z-10" />
            </div>
          </Reveal>
        </div>
      </section>



      {/* ─── PARA RESTAURANTES ────────────────────── */}
      <section id="restaurantes" className="py-20 md:py-28 px-5 bg-[#fafdf7]">
        <div className="mx-auto max-w-6xl text-center">
          <Reveal>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">Para restaurantes</span>
            <h2 className="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight">Llena tus horas valle sin esfuerzo</h2>
            <p className="mt-3 text-slate-500 max-w-md mx-auto text-sm">Publica ofertas de última hora y llega a nuevos clientes al instante.</p>
          </Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-3 text-left">
            {[
              { title: "Panel en tiempo real", desc: "Gestiona ofertas, pedidos y liquidaciones desde un solo lugar.",
                icon: <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
              { title: "Alertas instantáneas", desc: "Notificación sonora y visual cuando llega un pedido nuevo.",
                icon: <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg> },
              { title: "Liquidaciones claras", desc: "Transparencia total. Comisiones y cobros detallados cada semana.",
                icon: <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg> },
            ].map((item, i) => (
              <Reveal key={item.title} delay={i * 150}>
                <div className="rounded-2xl border border-slate-200 p-6 hover:border-emerald-200 hover:shadow-md transition-all duration-300 bg-white">
                  <div className="h-10 w-10 rounded-xl bg-emerald-50 grid place-items-center">{item.icon}</div>
                  <h3 className="mt-3 text-sm font-extrabold">{item.title}</h3>
                  <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={300}>
            <div className="mt-10">
              <a href="/restaurantes" className="inline-flex rounded-full bg-slate-900 px-7 py-3 text-sm font-bold text-white hover:bg-slate-800 transition">Únete como restaurante</a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── CTA FINAL ────────────────────────────── */}
      <section className="py-20 md:py-28 px-5">
        <Reveal>
          <div className="mx-auto max-w-3xl">
            <div className="animated-gradient rounded-3xl p-10 md:p-16 text-center text-white relative overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-8 -left-8 w-40 h-40 rounded-full bg-white/5" style={{ animation: "floatBubble 7s ease-in-out infinite" }} />
                <div className="absolute -bottom-6 -right-6 w-52 h-52 rounded-full bg-white/5" style={{ animation: "floatBubble 9s ease-in-out 1.5s infinite" }} />
                <div className="absolute top-1/3 right-10 w-16 h-16 rounded-full bg-white/5" style={{ animation: "floatBubble 5s ease-in-out 0.5s infinite" }} />
                {/* Utensil decorations */}
                <div className="absolute top-8 right-12 text-4xl opacity-10 select-none" style={{ animation: "floatBubble 8s ease-in-out 2s infinite" }}>🍽️</div>
                <div className="absolute bottom-10 left-10 text-3xl opacity-10 select-none" style={{ animation: "floatBubble 6s ease-in-out 1s infinite" }}>🥘</div>
                <div className="absolute top-1/2 left-1/4 text-2xl opacity-10 select-none" style={{ animation: "floatBubble 7s ease-in-out 3s infinite" }}>🔥</div>
              </div>

              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 px-4 py-1.5 mb-6">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-300 animate-pulse" />
                  <span className="text-xs font-bold text-white/90">{offers.length > 0 ? `${offers.length} ofertas activas ahora` : "Ofertas en tiempo real"}</span>
                </div>

                <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
                  Tu próxima comida<br />
                  <span className="relative">
                    te está esperando
                    <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 8" preserveAspectRatio="none">
                      <path d="M0 7 Q50 0 100 5 Q150 0 200 7" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                    </svg>
                  </span>
                </h2>

                <p className="mt-5 text-white/70 text-sm md:text-base max-w-lg mx-auto leading-relaxed">
                  Platos de restaurante a precio reducido. Reserva en segundos, recoge con tu QR y disfruta.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link href="/offers" className="group inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-bold text-emerald-700 hover:bg-emerald-50 transition shadow-xl shadow-black/15 hover:-translate-y-0.5 hover:shadow-2xl">
                    Explorar ofertas
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                  </Link>
                  <a href="#como-funciona" className="inline-flex items-center gap-2 rounded-full border-2 border-white/30 px-7 py-3.5 text-sm font-bold text-white hover:bg-white/10 transition">
                    Cómo funciona
                  </a>
                </div>

                {/* Trust badges */}
                <div className="mt-10 flex items-center justify-center gap-6 text-white/50">
                  <div className="flex items-center gap-1.5 text-xs font-medium">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    Pago seguro
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-medium">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Reserva en 2 min
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-medium">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    Sin comisiones
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ─── FOOTER ───────────────────────────────── */}
      <footer className="py-8 px-5 border-t border-slate-100">
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-600 text-[10px] font-extrabold text-white">BB</span>
            <span className="text-sm font-bold">BuenBocado</span>
          </div>
          <div className="flex gap-6 text-xs text-slate-400">
            <Link href="/offers" className="hover:text-emerald-600 transition">Ofertas</Link>
            <a href="/restaurantes" className="hover:text-emerald-600 transition">Restaurantes</a>
            <Link href="/auth" className="hover:text-emerald-600 transition">Mi cuenta</Link>
          </div>
          <p className="text-xs text-slate-400">© 2026 BuenBocado</p>
        </div>
      </footer>
    </div>
  );
}
