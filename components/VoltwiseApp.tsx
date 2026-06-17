"use client";

import { useCallback, useEffect, useState } from "react";
import type { AnalysisResult } from "@/lib/calculator";
import type { DEVICE_CATALOG } from "@/lib/catalog";

type CatalogDevice = (typeof DEVICE_CATALOG)[number] & { h: number };
type SelectedDevice = CatalogDevice;

async function api<T>(path: string, opts?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("vw_token") : null;
  const headers: Record<string, string> = { "Content-Type": "application/json", ...(opts?.headers as Record<string, string>) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(path, { ...opts, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Request failed");
  }
  return res.json();
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function VoltwiseApp() {
  const [catalog, setCatalog] = useState<CatalogDevice[]>([]);
  const [selected, setSelected] = useState<Map<string, SelectedDevice>>(new Map());
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [phase, setPhase] = useState(1);
  const [apiOk, setApiOk] = useState(false);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPass, setAuthPass] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2800);
  };

  const devicePayload = useCallback(
    () => [...selected.entries()].map(([id, d]) => ({ device_id: id, hours: d.h })),
    [selected]
  );

  const costPreview = (d: SelectedDevice) => ((d.w / 1000) * d.h * 30 * 2.4).toFixed(0);

  const fetchAnalysis = useCallback(
    async (appliedIds: string[]) => {
      return api<AnalysisResult>("/api/analyze", {
        method: "POST",
        body: JSON.stringify({ devices: devicePayload(), applied_reco_ids: appliedIds }),
      });
    },
    [devicePayload]
  );

  const resetAll = () => {
    setSelected(new Map());
    setApplied(new Set());
    setAnalysis(null);
    setPhase(1);
  };

  const togglePick = (id: string) => {
    const c = catalog.find((x) => x.id === id);
    if (!c) return;
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(id)) next.delete(id);
      else next.set(id, { ...c, h: c.h });
      return next;
    });
  };

  const setHours = (id: string, val: number) => {
    setSelected((prev) => {
      const next = new Map(prev);
      const d = next.get(id);
      if (d) next.set(id, { ...d, h: val });
      return next;
    });
  };

  const goAnalyze = async () => {
    setLoading(true);
    setApplied(new Set());
    try {
      setPhase(3);
      const data = await fetchAnalysis([]);
      setAnalysis(data);
    } catch (e) {
      showToast("Analiz hatası: " + (e as Error).message);
      setPhase(2);
    } finally {
      setLoading(false);
    }
  };

  const toggleReco = async (id: string) => {
    const next = new Set(applied);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setApplied(next);
    const data = await fetchAnalysis([...next]);
    setAnalysis(data);
  };

  const saveProfile = async () => {
    try {
      await api("/api/profiles", {
        method: "POST",
        body: JSON.stringify({ name: "Evim", devices: devicePayload(), applied_reco_ids: [...applied] }),
      });
      showToast("Profil kaydedildi");
    } catch (e) {
      showToast((e as Error).message);
    }
  };

  const executiveTour = async () => {
    resetAll();
    await sleep(300);
    const ids = ["ac", "water", "tv", "light"];
    for (const id of ids) {
      const c = catalog.find((x) => x.id === id);
      if (!c) continue;
      setSelected((prev) => new Map(prev).set(id, { ...c, h: id === "ac" ? 6 : c.h }));
      await sleep(300);
    }
    setPhase(2);
    await sleep(500);
    setHours("ac", 6);
    await sleep(600);
    setLoading(true);
    setPhase(3);
    const data = await fetchAnalysis([]);
    setAnalysis(data);
    setLoading(false);
    await sleep(800);
    const water = data.recommendations.find((r) => r.id === "sh-water");
    if (water) {
      const next = new Set(["sh-water"]);
      setApplied(next);
      setAnalysis(await fetchAnalysis([...next]));
    }
  };

  useEffect(() => {
    api<{ devices: CatalogDevice[] }>("/api/catalog")
      .then((c) => {
        setCatalog(c.devices.map((d) => ({ ...d, h: d.h })));
        setApiOk(true);
      })
      .catch(() => setApiOk(false));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).matches("input")) return;
      if (e.key === "e" || e.key === "E") { e.preventDefault(); executiveTour(); }
      if (e.key === "r" || e.key === "R") { e.preventDefault(); resetAll(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const s = analysis?.summary;
  const sim = analysis?.simulation;

  return (
    <div className={`max-w-[1180px] mx-auto px-5 py-6 pb-12 ${loading ? "opacity-60 pointer-events-none" : ""}`}>
      <div className="flex justify-between items-center flex-wrap gap-3 mb-4">
        <div>
          <div className="text-2xl font-extrabold">Volt<span className="text-[var(--accent)]">wise</span></div>
          <span className={`text-[10px] px-2 py-1 rounded-full border ${apiOk ? "text-[var(--green)] border-[#1f3a28]" : "text-red-400 border-red-900"}`}>
            {apiOk ? "Vercel API" : "API offline"}
          </span>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowAuth(true)} className="text-xs border border-[var(--stroke)] text-[var(--muted)] rounded-lg px-3 py-1.5">Giriş</button>
          <button onClick={saveProfile} className="text-xs border border-[var(--stroke)] text-[var(--muted)] rounded-lg px-3 py-1.5">Kaydet</button>
          <button onClick={executiveTour} className="text-xs bg-[#1a1808] border border-[#3a3520] text-[var(--accent)] font-bold rounded-lg px-3 py-1.5">▶ Sunum turu</button>
          <button onClick={resetAll} className="text-xs border border-[var(--stroke)] text-[var(--muted)] rounded-lg px-3 py-1.5">↺ Başa dön</button>
        </div>
      </div>

      <p className="text-[13px] text-[var(--muted)] mb-5">
        Evini kur → kullanımını ayarla → tasarrufunu gör · <span className="text-[var(--accent)]">Enerjisa · Vercel</span>
      </p>

      <div className="flex gap-2 mb-5 flex-wrap text-[11px]">
        {["1 Cihaz seç", "2 Kullanımı ayarla", "3 Analiz & tasarruf"].map((label, i) => (
          <span key={i} className={`px-3 py-1.5 rounded-full border ${phase > i + 1 ? "text-[var(--green)] border-[#1f3a28]" : phase === i + 1 ? "text-[var(--accent)] border-[#4a4020] bg-[#1a1808]" : "text-[var(--muted)] border-[var(--stroke)]"}`}>
            {label}
          </span>
        ))}
      </div>

      {phase === 1 && (
        <div>
          <h2 className="text-[11px] uppercase tracking-wide text-[var(--muted)] mb-3">Evinde hangi cihazlar var?</h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-2.5 mb-5">
            {catalog.map((c) => (
              <button key={c.id} onClick={() => togglePick(c.id)} className={`rounded-xl p-4 text-center border-2 transition ${selected.has(c.id) ? "border-[var(--accent)] bg-[#1a1808]" : "border-[var(--stroke)] bg-[var(--panel)]"}`}>
                <div className="text-2xl">{c.icon}</div>
                <div className="text-[11px] font-semibold mt-1.5">{c.name}</div>
                <div className="text-[10px] text-[var(--muted)]">{c.w}W</div>
              </button>
            ))}
          </div>
          <button disabled={!selected.size} onClick={() => setPhase(2)} className="bg-[var(--accent)] text-[#151200] font-extrabold rounded-xl px-6 py-3 text-sm disabled:opacity-35">
            Devam → Kullanımı ayarla
          </button>
        </div>
      )}

      {phase === 2 && (
        <div>
          <h2 className="text-[11px] uppercase tracking-wide text-[var(--muted)] mb-3">Günde kaç saat kullanıyorsun?</h2>
          <div className="flex flex-col gap-2.5">
            {[...selected.entries()].map(([id, d]) => (
              <div key={id} className="bg-[var(--panel)] border border-[var(--stroke)] rounded-xl p-3.5 grid grid-cols-[auto_1fr_auto] gap-3 items-center">
                <span className="text-2xl">{d.icon}</span>
                <div>
                  <div className="font-bold text-sm">{d.name}</div>
                  <div className="text-[11px] text-[var(--muted)]">{d.w}W · günde <b>{d.h}</b> saat</div>
                  <input type="range" min={0.5} max={d.maxHours} step={0.5} value={d.h} onChange={(e) => setHours(id, parseFloat(e.target.value))} className="w-full mt-2 accent-[var(--accent)]" />
                </div>
                <div className="text-right">
                  <b className="text-lg text-[var(--accent)]">{costPreview(d)}</b>
                  <div className="text-[10px] text-[var(--muted)]">TL/ay</div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2.5 mt-5">
            <button onClick={() => setPhase(1)} className="border border-[var(--stroke)] text-[var(--muted)] rounded-xl px-5 py-3 text-sm">← Geri</button>
            <button onClick={goAnalyze} className="bg-[var(--accent)] text-[#151200] font-extrabold rounded-xl px-6 py-3 text-sm">Analiz et →</button>
          </div>
        </div>
      )}

      {phase === 3 && analysis && s && sim && (
        <div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
            {[
              { v: Math.round(s.total_tl), l: "TL / ay", c: "text-[var(--accent)]" },
              { v: Math.round(s.total_kwh), l: "kWh / ay", c: "" },
              { v: Math.round(s.potential_tl), l: "tasarruf pot.", c: "text-[var(--green)]" },
              { v: Math.round(s.co2_kg), l: "kg CO₂", c: "text-[var(--blue)]" },
              { v: s.score, l: "enerji skoru", c: "" },
              { v: Math.round(s.annual_potential_tl), l: "TL / yıl", c: "text-[var(--green)]" },
            ].map((x, i) => (
              <div key={i} className="bg-[var(--panel)] border border-[var(--stroke)] rounded-xl p-3">
                <div className={`text-xl font-extrabold ${x.c}`}>{x.v}</div>
                <div className="text-[10px] text-[var(--muted)]">{x.l}</div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-3.5">
            <div className="bg-[var(--panel)] border border-[var(--stroke)] rounded-xl p-4 lg:col-span-2">
              <h3 className="text-[11px] uppercase text-[var(--muted)] mb-3">Akıllı öneriler</h3>
              {analysis.recommendations.map((r) => {
                const on = applied.has(r.id);
                const m = r.meta;
                return (
                  <button key={r.id} onClick={() => toggleReco(r.id)} className={`w-full text-left grid grid-cols-[auto_1fr_auto] gap-3 p-3.5 mb-2 rounded-xl border ${on ? "border-[var(--green)] bg-[#0f1a14]" : "border-[var(--stroke)]"}`}>
                    <span className={`w-5 h-5 rounded border flex items-center justify-center text-xs ${on ? "bg-[var(--green)] border-[var(--green)]" : "border-[var(--stroke)]"}`}>{on ? "✓" : ""}</span>
                    <div>
                      <div className="font-bold text-sm">{r.title}</div>
                      <div className="text-[11px] text-[var(--muted)]">{m.desc}</div>
                    </div>
                    <div className="text-right">
                      <b className="text-lg text-[var(--green)]">{Math.round(r.save)}</b>
                      <div className="text-[10px] text-[var(--muted)]">TL/ay</div>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="bg-[var(--panel)] border border-[var(--stroke)] rounded-xl p-4">
              <h3 className="text-[11px] uppercase text-[var(--muted)] mb-3">Simülasyon</h3>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="text-center p-3 rounded-lg bg-[var(--panel2)]">
                  <div className="text-[10px] text-[var(--muted)]">Mevcut</div>
                  <div className="text-2xl font-extrabold text-[var(--accent)]">{Math.round(sim.before_tl)}</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-[#0a120e] border border-[#1f3a28]">
                  <div className="text-[10px] text-[var(--muted)]">Uygulayınca</div>
                  <div className="text-2xl font-extrabold text-[var(--green)]">{Math.round(sim.after_tl)}</div>
                </div>
              </div>
              {sim.saved_tl > 0 ? (
                <p className="text-center text-sm bg-[#0f1a14] border border-[#1f3a28] rounded-lg p-2.5">
                  <b className="text-[var(--green)]">{Math.round(sim.saved_tl)} TL/ay</b> · %{Math.round(sim.pct_reduction)} düştü
                </p>
              ) : (
                <p className="text-center text-sm text-[var(--muted)]">Öneri seç — fark burada görünür</p>
              )}
            </div>
          </div>
          <button onClick={() => setPhase(2)} className="mt-4 border border-[var(--stroke)] text-[var(--muted)] rounded-xl px-5 py-3 text-sm">← Kullanımı değiştir</button>
        </div>
      )}

      {showAuth && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-5">
          <div className="bg-[var(--panel)] border border-[var(--stroke)] rounded-xl p-6 max-w-sm w-full">
            <h3 className="font-bold mb-3">Hesap</h3>
            <input value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="E-posta" className="w-full mb-2 p-2.5 rounded-lg bg-[var(--panel2)] border border-[var(--stroke)]" />
            <input type="password" value={authPass} onChange={(e) => setAuthPass(e.target.value)} placeholder="Şifre" className="w-full mb-3 p-2.5 rounded-lg bg-[var(--panel2)] border border-[var(--stroke)]" />
            <div className="flex gap-2">
              <button onClick={async () => {
                try {
                  const r = await api<{ access_token: string }>("/api/auth/login", { method: "POST", body: JSON.stringify({ email: authEmail, password: authPass }) });
                  localStorage.setItem("vw_token", r.access_token);
                  setShowAuth(false);
                  showToast("Giriş başarılı");
                } catch (e) { showToast((e as Error).message); }
              }} className="bg-[var(--accent)] text-[#151200] font-bold rounded-lg px-4 py-2 text-sm">Giriş</button>
              <button onClick={async () => {
                try {
                  const r = await api<{ access_token: string }>("/api/auth/register", { method: "POST", body: JSON.stringify({ email: authEmail, password: authPass, name: "Kullanıcı" }) });
                  localStorage.setItem("vw_token", r.access_token);
                  setShowAuth(false);
                  showToast("Hesap oluşturuldu");
                } catch (e) { showToast((e as Error).message); }
              }} className="border border-[var(--stroke)] text-[var(--muted)] rounded-lg px-4 py-2 text-sm">Kayıt</button>
              <button onClick={() => setShowAuth(false)} className="border border-[var(--stroke)] text-[var(--muted)] rounded-lg px-4 py-2 text-sm">Kapat</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="fixed bottom-5 right-5 bg-[#1a1808] border border-[#3a3520] text-[var(--accent)] px-4 py-2.5 rounded-xl text-sm z-50">{toast}</div>}
    </div>
  );
}
