"use client";

import Link from "next/link";
import { useState } from "react";

export default function AdminPage() {
  const [key, setKey] = useState(typeof window !== "undefined" ? localStorage.getItem("vw_admin_key") || "" : "");
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [err, setErr] = useState("");

  const load = async () => {
    setErr("");
    localStorage.setItem("vw_admin_key", key);
    const r = await fetch("/api/admin/pilot-stats", { headers: { "X-Admin-Key": key } });
    if (!r.ok) { setErr("Geçersiz admin key"); setData(null); return; }
    setData(await r.json());
  };

  const cohort = data?.cohort as Record<string, number> | undefined;
  const energy = data?.energy as Record<string, number> | undefined;
  const profiles = (data?.profiles as Record<string, unknown>[]) || [];

  return (
    <div className="max-w-[1100px] mx-auto px-5 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-extrabold">Volt<span className="text-[var(--accent)]">wise</span> Pilot</h1>
          <p className="text-sm text-[var(--muted)]">Enerjisa cohort KPIs</p>
        </div>
        <Link href="/" className="text-sm border border-[var(--stroke)] text-[var(--muted)] rounded-lg px-4 py-2">← Uygulama</Link>
      </div>
      <div className="flex gap-2 mb-6">
        <input type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="ADMIN_API_KEY" className="flex-1 p-2.5 rounded-lg bg-[var(--panel2)] border border-[var(--stroke)]" />
        <button onClick={load} className="bg-[var(--accent)] text-[#151200] font-bold rounded-lg px-5">Yükle</button>
      </div>
      {err && <p className="text-red-400 text-sm mb-4">{err}</p>}
      {cohort && energy && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              ["Kullanıcı", cohort.registered_users],
              ["Profil", cohort.analyzed_profiles],
              ["Benimseme %", cohort.recommendation_adoption_pct],
              ["Tasarruf ₺", energy.aggregate_saved_tl],
            ].map(([l, n]) => (
              <div key={l as string} className="bg-[var(--panel)] border border-[var(--stroke)] rounded-xl p-4">
                <div className="text-2xl font-extrabold text-[var(--accent)]">{n}</div>
                <div className="text-[11px] text-[var(--muted)]">{l}</div>
              </div>
            ))}
          </div>
          <div className="bg-[var(--panel)] border border-[var(--stroke)] rounded-xl p-4 overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="text-[var(--muted)] uppercase"><th className="text-left p-2">ID</th><th>Ad</th><th>TL</th><th>Skor</th><th>Gece</th></tr></thead>
              <tbody>
                {profiles.map((p) => (
                  <tr key={p.id as number} className="border-t border-[var(--stroke)]">
                    <td className="p-2">{p.id as number}</td>
                    <td>{p.name as string}</td>
                    <td>{Math.round(p.total_tl as number)}</td>
                    <td>{p.score as number}</td>
                    <td>{p.shift_adopted ? "✓" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
