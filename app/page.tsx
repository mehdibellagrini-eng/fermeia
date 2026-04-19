"use client";

import { useEffect, useState, useCallback } from "react";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type Alerte = { niveau: "critical" | "warning"; message: string };
type Trade  = { ts: string; paire: string; direction: string; profit: string };
type Signal = { date: string; pair: string; direction: "BUY" | "SELL"; score: number; prix: number; rsi_1h: number; var_24h: number };
type Agent  = { nom: string; statut: string; derniere_action: string; score: number };
type Produit = { id: string; nom: string; prix: number; url: string | null; statut: string; payment_link: boolean };

type DashData = {
  ts: string;
  alertes: Alerte[];
  laHaut: {
    episodes_generes: number;
    dernier_episode: string;
    score_viral_moyen: number;
    prochain_prevu: string;
    statut: string;
    liste_episodes: string[];
    scripts_en_stock: number;
    dernier_sujet: string;
    statut_voix: string;
    statut_video: string;
  };
  trading: {
    capital_usdt: string;
    positions_ouvertes: number;
    pnl_jour: string;
    palier: number;
    statut: string;
    derniers_trades: Trade[];
    nb_trades: number;
    dernier_signal: Signal | null;
  };
  dropshipping: {
    produits: Produit[];
    ventes_stripe_jour: string;
    deploiements: number;
    statut: string;
    avec_stripe: number;
    landing_pages: number;
    derniere_sync: string;
  };
  agents: {
    agents: Agent[];
    actifs: number;
    erreurs: number;
    statut: string;
    erreurs_recentes: { date: string; agent: string }[];
  };
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const NEON = {
  red:    { border: "neon-red",    accent: "#FF003C", bg: "rgba(255,0,60,0.06)"    },
  green:  { border: "neon-green",  accent: "#00FF88", bg: "rgba(0,255,136,0.06)"   },
  blue:   { border: "neon-blue",   accent: "#00AAFF", bg: "rgba(0,170,255,0.06)"   },
  purple: { border: "neon-purple", accent: "#AA00FF", bg: "rgba(170,0,255,0.06)"   },
} as const;

function scoreColor(s: number) {
  return s >= 70 ? "#00FF88" : s >= 50 ? "#FFAA00" : "#FF003C";
}

// ─── PRIMITIVE COMPONENTS ─────────────────────────────────────────────────────

function Dot({ ok, pulse = true }: { ok: boolean; pulse?: boolean }) {
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${pulse ? "dot-pulse" : ""}`}
      style={{ backgroundColor: ok ? "#00FF88" : "#FF003C", boxShadow: `0 0 5px ${ok ? "#00FF88" : "#FF003C"}` }}
    />
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-[9px] uppercase tracking-widest text-gray-600 font-bold">{children}</span>;
}

function BigNum({ value, color, unit }: { value: string | number; color?: string; unit?: string }) {
  return (
    <div className="flex items-end gap-1 leading-none">
      <span className="stat-value text-5xl font-black" style={{ color: color ?? "white" }}>{value}</span>
      {unit && <span className="text-sm text-gray-500 pb-1">{unit}</span>}
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <Label>{label}</Label>
      <span className="stat-value text-xl font-bold" style={{ color: color ?? "white" }}>{value}</span>
    </div>
  );
}

function ScoreBar({ score }: { score: number }) {
  const c = scoreColor(score);
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="score-bar-track flex-1">
        <div className="score-bar-fill" style={{ width: `${score}%`, backgroundColor: c, boxShadow: `0 0 4px ${c}` }} />
      </div>
      <span className="text-[10px] font-mono w-6 text-right" style={{ color: c }}>{score}</span>
    </div>
  );
}

function StatusChip({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px]"
      style={{ background: ok ? "rgba(0,255,136,0.08)" : "rgba(255,170,0,0.08)", border: `1px solid ${ok ? "rgba(0,255,136,0.2)" : "rgba(255,170,0,0.2)"}` }}>
      <Dot ok={ok} pulse={false} />
      <span className="truncate" style={{ color: ok ? "#00FF88" : "#FFAA00" }}>{label}</span>
    </div>
  );
}

// ─── ZONE CARD WRAPPER ────────────────────────────────────────────────────────

function ZoneCard({
  title, icon, color, children,
}: {
  title: string; icon: string; color: keyof typeof NEON; children: React.ReactNode;
}) {
  const n = NEON[color];
  return (
    <div className={`zone-card scanline rounded-2xl border-2 ${n.border} bg-[#080810] flex flex-col gap-4 p-5`}>
      <div className="flex items-center gap-2">
        <span className="dot-pulse w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: n.accent, boxShadow: `0 0 6px ${n.accent}` }} />
        <span className="font-black text-[11px] tracking-[0.2em] uppercase" style={{ color: n.accent }}>
          {icon} {title}
        </span>
      </div>
      {children}
    </div>
  );
}

function Divider() {
  return <div className="border-t border-gray-900" />;
}

// ─── ZONE 1 — LÀ-HAUT ────────────────────────────────────────────────────────

function ZoneLaHaut({ d }: { d: DashData["laHaut"] }) {
  const voixOk  = !d.statut_voix.toLowerCase().includes("bloqué") && !d.statut_voix.toLowerCase().includes("hors");
  const videoOk = !d.statut_video.toLowerCase().includes("hors") && !d.statut_video.toLowerCase().includes("bloqué");

  return (
    <ZoneCard title="LÀ-HAUT" icon="📡" color="red">
      <div className="flex items-end justify-between">
        <BigNum value={d.episodes_generes} color="#FF003C" unit="épisodes" />
        <div className="text-right">
          <Label>Scripts en stock</Label>
          <div className="text-2xl font-bold text-white">{d.scripts_en_stock}</div>
        </div>
      </div>

      {d.dernier_sujet ? (
        <div className="rounded-lg p-3 text-[11px] leading-relaxed italic text-gray-400 border border-gray-800/60"
          style={{ background: "rgba(255,0,60,0.04)" }}>
          &ldquo;{d.dernier_sujet.slice(0, 120)}&rdquo;
        </div>
      ) : null}

      <Divider />

      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <StatusChip label={`Voix: ${d.statut_voix || "inconnue"}`} ok={voixOk} />
        <StatusChip label={`Vidéo: ${d.statut_video || "inconnue"}`} ok={videoOk} />
      </div>

      {d.liste_episodes.length > 0 && (
        <>
          <Divider />
          <div className="flex flex-col gap-1">
            <Label>Épisodes publiés</Label>
            {d.liste_episodes.slice(0, 4).map((ep, i) => (
              <div key={i} className="flex items-center gap-2 text-[10px] font-mono text-gray-500">
                <span style={{ color: "#FF003C" }}>▶</span>
                <span className="truncate">{ep.replace(/\.mp4$/, "")}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <Divider />
      <p className="text-[9px] text-gray-700 italic text-center tracking-wide">
        &ldquo;On te montre le sol. Nous on regarde LÀ-HAUT.&rdquo;
      </p>
    </ZoneCard>
  );
}

// ─── ZONE 2 — TRADING ─────────────────────────────────────────────────────────

function ZoneTrading({ d }: { d: DashData["trading"] }) {
  const sig = d.dernier_signal;
  const pnlPos = d.pnl_jour.startsWith("+") || (!d.pnl_jour.startsWith("-") && d.pnl_jour !== "—");

  return (
    <ZoneCard title="TRADER FANTÔME" icon="⚡" color="green">
      <div className="grid grid-cols-3 gap-3">
        <MiniStat label="Capital" value={d.capital_usdt} color="#00FF88" />
        <MiniStat label="P&L Jour" value={d.pnl_jour} color={pnlPos ? "#00FF88" : "#FF003C"} />
        <MiniStat label="Positions" value={d.positions_ouvertes} />
      </div>

      {sig ? (
        <>
          <Divider />
          <div className="rounded-xl p-3 border" style={{ background: "rgba(0,255,136,0.04)", borderColor: "rgba(0,255,136,0.15)" }}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <Label>Dernier signal</Label>
                <div className="text-lg font-black text-white mt-0.5">{sig.pair}</div>
                <div className="text-[10px] text-gray-600">{sig.date}</div>
              </div>
              <div>
                <span className={`px-2.5 py-1 rounded-lg text-sm font-black ${sig.direction === "BUY" ? "signal-buy" : "signal-sell"}`}>
                  {sig.direction}
                </span>
                <div className="text-right mt-1">
                  <span className="text-[10px] text-gray-600">score </span>
                  <span className="text-sm font-bold" style={{ color: scoreColor(sig.score) }}>{sig.score}/100</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[10px]">
              <div>
                <Label>Prix</Label>
                <div className="font-mono text-white">${sig.prix.toLocaleString("fr-FR")}</div>
              </div>
              <div>
                <Label>RSI 1h</Label>
                <div className="font-mono" style={{ color: sig.rsi_1h < 30 ? "#00FF88" : sig.rsi_1h > 70 ? "#FF003C" : "white" }}>
                  {sig.rsi_1h}
                </div>
              </div>
              <div>
                <Label>Var 24h</Label>
                <div className="font-mono" style={{ color: sig.var_24h >= 0 ? "#00FF88" : "#FF003C" }}>
                  {sig.var_24h >= 0 ? "+" : ""}{sig.var_24h}%
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {d.derniers_trades.length > 0 && (
        <>
          <Divider />
          <div className="flex flex-col gap-1">
            <Label>Historique trades ({d.nb_trades})</Label>
            {d.derniers_trades.slice(0, 4).map((t, i) => (
              <div key={i} className="flex items-center justify-between text-[10px] font-mono py-0.5">
                <span className="text-gray-600">{t.ts.slice(11, 16)}</span>
                <span className="text-gray-400">{t.paire}</span>
                <span className={["BUY","LONG"].includes(t.direction) ? "text-green-400" : "text-red-400"}>{t.direction}</span>
                <span className={parseFloat(t.profit) >= 0 ? "text-green-400" : "text-red-400"}>{t.profit}$</span>
              </div>
            ))}
          </div>
        </>
      )}

      <Divider />
      <p className="text-[8px] text-gray-800 uppercase tracking-widest text-center">
        ⚠ Ceci n&apos;est pas un conseil financier — Trading = risque de perte totale
      </p>
    </ZoneCard>
  );
}

// ─── ZONE 3 — DROPSHIPPING ────────────────────────────────────────────────────

function ZoneDropshipping({ d }: { d: DashData["dropshipping"] }) {
  const stripeRate = d.produits.length > 0
    ? Math.round((d.avec_stripe / d.produits.length) * 100)
    : 0;

  return (
    <ZoneCard title="DROPSHIPPING" icon="🛍️" color="blue">
      <div className="flex items-end justify-between">
        <BigNum value={d.produits.length} color="#00AAFF" unit="produits" />
        <div className="text-right">
          <Label>Landing pages</Label>
          <div className="text-2xl font-bold text-white">{d.landing_pages}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <MiniStat label="Stripe OK" value={`${d.avec_stripe}/${d.produits.length}`} color="#00FF88" />
        <MiniStat label="Déployés" value={d.deploiements} color="#00AAFF" />
        <MiniStat label="Ventes/j" value={d.ventes_stripe_jour} color="#00CCFF" />
      </div>

      <div>
        <div className="flex justify-between mb-1">
          <Label>Couverture Stripe</Label>
          <span className="text-[10px] font-mono" style={{ color: stripeRate === 100 ? "#00FF88" : "#FFAA00" }}>{stripeRate}%</span>
        </div>
        <div className="score-bar-track">
          <div className="score-bar-fill"
            style={{ width: `${stripeRate}%`, background: `linear-gradient(90deg, #00AAFF, #00FF88)`, boxShadow: "0 0 6px rgba(0,170,255,0.5)" }} />
        </div>
      </div>

      {d.produits.length > 0 && (
        <>
          <Divider />
          <div className="flex flex-col gap-1.5">
            <Label>Catalogue</Label>
            {d.produits.slice(0, 5).map((p, i) => (
              <div key={i} className="flex items-center gap-2">
                <Dot ok={p.statut === "en ligne" || p.payment_link} pulse={false} />
                <span className="text-[10px] text-gray-300 flex-1 truncate">{p.nom}</span>
                <span className="text-[10px] font-mono text-blue-300 flex-shrink-0">{p.prix}€</span>
                {p.url ? (
                  <a href={p.url} target="_blank" rel="noopener noreferrer"
                    className="text-[9px] text-blue-600 hover:text-blue-300 flex-shrink-0">↗</a>
                ) : null}
              </div>
            ))}
          </div>
        </>
      )}

      {d.derniere_sync && (
        <div className="text-[9px] text-gray-700 text-right font-mono">sync: {d.derniere_sync}</div>
      )}
    </ZoneCard>
  );
}

// ─── ZONE 4 — AGENTS ─────────────────────────────────────────────────────────

function ZoneAgents({ d }: { d: DashData["agents"] }) {
  return (
    <ZoneCard title="AGENTS IA" icon="🤖" color="purple">
      <div className="flex items-end justify-between">
        <BigNum value={`${d.actifs}/${d.agents.length}`} color="#AA00FF" unit="actifs" />
        <div className="text-right">
          <Label>En erreur</Label>
          <div className="text-2xl font-bold" style={{ color: d.erreurs > 0 ? "#FF003C" : "#00FF88" }}>{d.erreurs}</div>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <Label>Scores agents</Label>
        {d.agents.map((a, i) => (
          <div key={i} className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1.5">
                <Dot ok={a.statut !== "erreur"} pulse={false} />
                <span className="text-gray-300">{a.nom}</span>
              </div>
              <span className="text-gray-600 font-mono">{a.derniere_action !== "—" ? a.derniere_action : ""}</span>
            </div>
            <ScoreBar score={a.score} />
          </div>
        ))}
      </div>

      {d.erreurs_recentes.length > 0 && (
        <>
          <Divider />
          <div className="rounded-lg p-2.5 border border-red-900/30" style={{ background: "rgba(255,0,60,0.04)" }}>
            <Label>Erreurs récentes</Label>
            <div className="flex flex-col gap-0.5 mt-1">
              {d.erreurs_recentes.slice(0, 3).map((e, i) => (
                <div key={i} className="text-[9px] font-mono text-gray-600 truncate">
                  <span className="text-red-800">{e.date.slice(0, 10)}</span> — {e.agent}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </ZoneCard>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

const EMPTY: DashData = {
  ts: "",
  alertes: [],
  laHaut: { episodes_generes: 0, dernier_episode: "—", score_viral_moyen: 0, prochain_prevu: "—", statut: "pause", liste_episodes: [], scripts_en_stock: 0, dernier_sujet: "", statut_voix: "—", statut_video: "—" },
  trading: { capital_usdt: "—", positions_ouvertes: 0, pnl_jour: "—", palier: 1, statut: "pause", derniers_trades: [], nb_trades: 0, dernier_signal: null },
  dropshipping: { produits: [], ventes_stripe_jour: "—", deploiements: 0, statut: "pause", avec_stripe: 0, landing_pages: 0, derniere_sync: "" },
  agents: { agents: [], actifs: 0, erreurs: 0, statut: "pause", erreurs_recentes: [] },
};

export default function Dashboard() {
  const [data, setData]       = useState<DashData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(30);
  const [lastRefresh, setLastRefresh] = useState("—");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/data", { cache: "no-store" });
      if (res.ok) {
        setData(await res.json());
        setLastRefresh(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
        setCountdown(30);
      }
    } catch { /* silently ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchData();
    const iv = setInterval(fetchData, 30_000);
    return () => clearInterval(iv);
  }, [fetchData]);

  useEffect(() => {
    const tick = setInterval(() => setCountdown((c) => (c > 0 ? c - 1 : 30)), 1000);
    return () => clearInterval(tick);
  }, []);

  const dateStr = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center bg-grid">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-pulse">⬡</div>
          <div className="text-[11px] text-gray-600 uppercase tracking-[0.3em] font-bold animate-pulse">Chargement ferme ia...</div>
        </div>
      </div>
    );
  }

  const TICKER_TEXT = "FERME IA MEHDI  ◈  LÀ-HAUT · TRADING · DROPSHIPPING · AGENTS  ◈  claude-opus-4-7 + deepseek-chat + runway gen4.5 + elevenlabs paul k  ◈  AUTO-REFRESH 30s  ◈  ";

  return (
    <div className="min-h-screen bg-[#050508] bg-grid text-white flex flex-col">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[#050508]/95 backdrop-blur-sm border-b border-[#141424] px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xl sm:text-2xl font-black tracking-tight">
              <span className="text-white">⬡ FERME </span>
              <span style={{ color: "#AA00FF", textShadow: "0 0 20px #AA00FF88" }}>IA</span>
            </span>
            <span className="hidden md:block text-[9px] text-gray-700 uppercase tracking-[0.2em] border border-gray-800 rounded px-2 py-0.5">
              Système multi-agents autonomes
            </span>
          </div>

          <div className="flex items-center gap-3 text-[10px] font-mono">
            <span className="hidden sm:block text-gray-600">{dateStr}</span>
            <div className="flex items-center gap-1.5 border border-gray-800 rounded px-2 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 dot-pulse" />
              <span className="text-green-400 hidden xs:block">LIVE</span>
            </div>
            <span className="text-gray-600">
              <span className="text-gray-400">{lastRefresh}</span>
            </span>
            <div className="flex items-center gap-1 text-gray-700">
              <span>↺</span>
              <span className="text-gray-500 font-bold">{countdown}s</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── ALERTES ────────────────────────────────────────────────────────── */}
      {data.alertes.length > 0 && (
        <div className="px-4 sm:px-6 pt-3">
          <div className="max-w-7xl mx-auto flex flex-col gap-1.5">
            {data.alertes.map((a, i) => (
              <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                a.niveau === "critical"
                  ? "bg-red-950/40 text-red-400 border border-red-900/40"
                  : "bg-yellow-950/30 text-yellow-400 border border-yellow-900/30"
              }`}>
                <span>{a.niveau === "critical" ? "🔴" : "⚠️"}</span>
                <span>{a.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── GRID ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <ZoneLaHaut      d={data.laHaut}      />
        <ZoneTrading     d={data.trading}     />
        <ZoneDropshipping d={data.dropshipping} />
        <ZoneAgents      d={data.agents}      />
      </main>

      {/* ── FOOTER TICKER ──────────────────────────────────────────────────── */}
      <footer className="border-t border-[#141424] py-2 overflow-hidden">
        <div className="ticker-inner text-[9px] font-mono text-gray-700 uppercase tracking-widest">
          {[...Array(3)].map((_, i) => (
            <span key={i} className="flex gap-12 flex-shrink-0">
              {TICKER_TEXT.split("  ◈  ").map((part, j) => (
                <span key={j}>
                  {j > 0 && <span className="text-gray-800 mr-12">◈</span>}
                  {part}
                </span>
              ))}
            </span>
          ))}
        </div>
      </footer>
    </div>
  );
}
