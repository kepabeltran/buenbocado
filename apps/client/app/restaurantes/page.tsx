"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

function useScrollReveal() {
  const ref = { current: null as HTMLDivElement | null };
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
  return { ref: (node: HTMLDivElement | null) => { ref.current = node; }, visible };
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

export default function RestaurantesPage() {
  const [heroVisible, setHeroVisible] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    setHeroVisible(true);
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#fafdf7] text-slate-900 overflow-x-hidden" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,500;0,9..40,700;0,9..40,800;1,9..40,400&display=swap" rel="stylesheet" />

      {/* ─── NAV ──────────────────────────────────── */}
      <nav className={"fixed top-0 left-0 right-0 z-50 transition-all duration-300 " + (scrollY > 40 ? "bg-white/90 backdrop-blur-md shadow-sm border-b border-emerald-100" : "bg-transparent")}>
        <div className="mx-auto max-w-6xl flex items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-600 text-sm font-extrabold text-white">BB</span>
            <span className="text-lg font-extrabold tracking-tight">Buen<span className="text-emerald-600">Bocado</span></span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/offers" className="text-sm font-medium text-slate-500 hover:text-emerald-700 transition hidden md:inline">Ver ofertas</Link>
            <a href="#contacto" className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/20">Contactar</a>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─────────────────────────────────── */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 px-5">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-emerald-100/40 blur-3xl" />
          <div className="absolute top-40 -left-20 w-[300px] h-[300px] rounded-full bg-lime-100/30 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className={"transition-all duration-700 " + (heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6")}>
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-4 py-1.5 text-xs font-bold text-emerald-700 mb-6">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Para restaurantes
              </span>
            </div>
            <h1 className={"text-4xl sm:text-5xl md:text-6xl font-extrabold leading-[1.08] tracking-tight transition-all duration-700 delay-100 " + (heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6")}>
              Llena tus{" "}<span className="text-emerald-600">horas valle</span>{" "}sin esfuerzo
            </h1>
            <p className={"mt-5 text-base md:text-lg text-slate-500 max-w-md leading-relaxed transition-all duration-700 delay-200 " + (heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6")}>
              Publica ofertas de última hora, llega a nuevos clientes y reduce el desperdicio alimentario. Todo desde un panel sencillo.
            </p>
            <div className={"mt-8 flex flex-wrap gap-3 transition-all duration-700 delay-300 " + (heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6")}>
              <a href="#contacto" className="rounded-full bg-emerald-600 px-7 py-3.5 text-sm font-bold text-white hover:bg-emerald-700 transition shadow-xl shadow-emerald-600/20 hover:shadow-emerald-600/35 hover:-translate-y-0.5">Quiero saber más</a>
              <a href="#como-funciona" className="rounded-full border-2 border-slate-200 bg-white px-7 py-3.5 text-sm font-bold text-slate-600 hover:border-emerald-300 hover:text-emerald-700 transition">Cómo funciona</a>
            </div>
          </div>

          <div className={"hidden md:block transition-all duration-1000 delay-300 " + (heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
            <div className="relative">
              <div className="rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-600 p-8 text-white">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-xl bg-white/20 grid place-items-center">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold">+40%</p>
                    <p className="text-xs text-emerald-200">más clientes en horas valle</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 rounded-xl bg-white/10 p-3">
                    <svg className="w-5 h-5 text-emerald-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <div>
                      <p className="text-sm font-bold">Ingresos extra</p>
                      <p className="text-xs text-emerald-200">Monetiza comida que antes se perdía</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl bg-white/10 p-3">
                    <svg className="w-5 h-5 text-emerald-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <div>
                      <p className="text-sm font-bold">Nuevos clientes</p>
                      <p className="text-xs text-emerald-200">Que vuelven a precio completo</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl bg-white/10 p-3">
                    <svg className="w-5 h-5 text-emerald-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <div>
                      <p className="text-sm font-bold">Menos desperdicio</p>
                      <p className="text-xs text-emerald-200">Bueno para ti y para el planeta</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-3 -right-3 w-full h-full rounded-3xl bg-emerald-200/20 -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── CÓMO FUNCIONA ────────────────────────── */}
      <section id="como-funciona" className="py-20 md:py-28 px-5 bg-white">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <div className="text-center max-w-lg mx-auto">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">Así de fácil</span>
              <h2 className="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight">Cómo funciona para tu restaurante</h2>
            </div>
          </Reveal>
          <div className="mt-16 grid gap-6 md:grid-cols-4">
            {[
              { step: "01", title: "Te registras", desc: "Creamos tu cuenta en minutos. Sin permanencia ni costes de alta.",
                icon: <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg> },
              { step: "02", title: "Publicas ofertas", desc: "Cuando tengas excedente, publicas en segundos desde tu panel. Tú pones el precio.",
                icon: <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
              { step: "03", title: "Recibes pedidos", desc: "Te llega una alerta sonora al instante. El cliente ya ha pagado.",
                icon: <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg> },
              { step: "04", title: "El cliente recoge", desc: "Muestra su código QR, lo escaneas y listo. Sin esperas ni complicaciones.",
                icon: <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> },
            ].map((item, i) => (
              <Reveal key={item.step} delay={i * 150}>
                <div className="relative rounded-2xl bg-[#fafdf7] border border-emerald-100/60 p-6 hover:shadow-lg hover:shadow-emerald-50 transition-all duration-300 hover:-translate-y-0.5">
                  <span className="absolute top-4 right-5 text-4xl font-extrabold text-emerald-100">{item.step}</span>
                  <div className="h-11 w-11 rounded-xl bg-emerald-50 grid place-items-center">{item.icon}</div>
                  <h3 className="mt-4 text-sm font-extrabold">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── VENTAJAS ─────────────────────────────── */}
      <section className="py-20 md:py-28 px-5 bg-[#fafdf7]">
        <div className="mx-auto max-w-6xl grid gap-12 md:grid-cols-2 items-center">
          <Reveal>
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">Ventajas</span>
              <h2 className="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight">¿Por qué BuenBocado?</h2>
              <div className="mt-8 space-y-5">
                {[
                  { title: "Sin inversión inicial", desc: "Sin cuotas mensuales, sin permanencia. Solo pagas cuando vendes." },
                  { title: "Tú decides todo", desc: "Qué platos, a qué precio, cuántas unidades y durante cuánto tiempo." },
                  { title: "Panel en tiempo real", desc: "Gestiona ofertas, pedidos y liquidaciones desde un solo lugar." },
                  { title: "Alertas instantáneas", desc: "Notificación sonora y visual cuando llega un pedido. No te pierdes nada." },
                  { title: "Liquidaciones semanales", desc: "Cobros claros y transparentes cada semana. Sin sorpresas." },
                  { title: "Nuevos clientes recurrentes", desc: "Clientes que te descubren por el precio vuelven pagando el precio completo." },
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
            <div className="rounded-3xl bg-white border border-slate-200 p-8 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 rounded-xl bg-emerald-50 grid place-items-center">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                </div>
                <div>
                  <p className="text-sm font-extrabold text-slate-900">Tu panel de control</p>
                  <p className="text-xs text-slate-400">Todo lo que necesitas en un solo lugar</p>
                </div>
              </div>
              <div className="space-y-3">
                {["Publicar y gestionar ofertas", "Ver pedidos en tiempo real", "Escanear QR de recogida", "Consultar liquidaciones", "Recibir alertas de nuevos pedidos"].map((feat) => (
                  <div key={feat} className="flex items-center gap-2.5 rounded-xl bg-[#fafdf7] px-4 py-3">
                    <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    <p className="text-sm text-slate-700">{feat}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── CONTACTO ─────────────────────────────── */}
      <section id="contacto" className="py-20 md:py-28 px-5 bg-white">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <div className="text-center mb-12">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">Contacto</span>
              <h2 className="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight">¿Quieres unirte?</h2>
              <p className="mt-3 text-slate-500 max-w-md mx-auto text-sm">
                Te explicamos todo sin compromiso. Escríbenos y te contamos cómo empezar.
              </p>
            </div>
          </Reveal>

          <Reveal delay={200}>
            <div className="grid gap-5 md:grid-cols-2">
              {/* WhatsApp */}
              <a
                href="https://wa.me/34642757917?text=Hola%2C%20me%20interesa%20BuenBocado%20para%20mi%20restaurante"
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-2xl bg-[#fafdf7] border border-slate-200 p-6 hover:border-emerald-300 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
              >
                <div className="h-12 w-12 rounded-xl bg-green-100 grid place-items-center mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                </div>
                <p className="text-base font-extrabold text-slate-900 group-hover:text-emerald-700 transition">WhatsApp</p>
                <p className="text-sm text-slate-500 mt-1">Escríbenos y te respondemos al momento.</p>
                <p className="text-sm font-bold text-emerald-600 mt-3">+34 642 757 917</p>
              </a>

              {/* Email */}
              <a
                href="mailto:comercial@buenbocado.com?subject=Interesado%20en%20BuenBocado%20para%20mi%20restaurante"
                className="group rounded-2xl bg-[#fafdf7] border border-slate-200 p-6 hover:border-emerald-300 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
              >
                <div className="h-12 w-12 rounded-xl bg-emerald-100 grid place-items-center mb-4">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <p className="text-base font-extrabold text-slate-900 group-hover:text-emerald-700 transition">Email</p>
                <p className="text-sm text-slate-500 mt-1">Cuéntanos sobre tu restaurante y te llamamos.</p>
                <p className="text-sm font-bold text-emerald-600 mt-3">comercial@buenbocado.com</p>
              </a>
            </div>
          </Reveal>

          {/* Ya tienes cuenta */}
          <Reveal delay={300}>
            <div className="mt-8 rounded-2xl bg-slate-50 border border-slate-200 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-slate-900">¿Ya eres partner?</p>
                <p className="text-xs text-slate-400">Accede a tu panel de restaurante.</p>
              </div>
              <a href="http://localhost:3001/login" className="rounded-full bg-slate-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-slate-800 transition shrink-0">
                Acceder al panel
              </a>
            </div>
          </Reveal>
        </div>
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
            <Link href="/restaurantes" className="hover:text-emerald-600 transition">Restaurantes</Link>
            <Link href="/auth" className="hover:text-emerald-600 transition">Mi cuenta</Link>
          </div>
          <p className="text-xs text-slate-400">© 2026 BuenBocado</p>
        </div>
      </footer>
    </div>
  );
}
