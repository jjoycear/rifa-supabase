"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import type { RaffleEntry } from "@/lib/types";

export default function Admin() {
  const [entries, setEntries] = useState<RaffleEntry[]>([]);
  const [pin, setPin] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [busy, setBusy] = useState(false);

  async function load() {
    const { data } = await supabaseBrowser
      .from("raffle_entries")
      .select("*")
      .order("slot");
    setEntries((data ?? []) as RaffleEntry[]);
  }

  useEffect(() => {
    load();
    const ch = supabaseBrowser
      .channel("raffle-admin")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "raffle_entries" },
        () => load()
      )
      .subscribe();

    return () => {
      supabaseBrowser.removeChannel(ch);
    };
  }, []);

  async function callApi(path: string, body: any) {
    setBusy(true);
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);

    const json = await res.json().catch(() => ({} as any));

    if (!res.ok) {
      alert(json?.error || "Erro ao executar ação");
      return false;
    }

    return true;
  }

  async function confirmPayment(slot: number) {
    const ok = await callApi("/api/admin/confirm", { slot, pin });
    if (ok) load();
  }

  async function unreserve(slot: number) {
    const ok = await callApi("/api/admin/unreserve", { slot, pin });
    if (ok) load();
  }

  async function resetAll() {
    if (!confirm("Tem certeza que quer zerar toda a rifa?")) return;
    const ok = await callApi("/api/admin/reset", { pin });
    if (ok) load();
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="bg-white p-4 rounded-2xl shadow-sm flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Admin — Rifa</h1>
            <p className="text-sm text-gray-600">
              Aqui você confirma Pix, libera números e pode zerar a rifa.
            </p>
            <a href="/" className="text-xs text-gray-500 underline">
              ← Voltar para rifa pública
            </a>
          </div>

          <div className="text-right">
            <label className="text-xs text-gray-600 block mb-1">
              PIN do admin
            </label>
            <input
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="border rounded-xl px-3 py-1 text-sm w-28"
              placeholder="PIN"
              type="password"
            />
            <button
              onClick={() => setUnlocked(pin.length >= 3)}
              className="mt-2 w-full rounded-xl bg-black text-white text-xs py-1.5 disabled:opacity-40"
              disabled={!pin}
            >
              Entrar
            </button>
          </div>
        </header>

        {!unlocked ? (
          <div className="bg-white p-4 rounded-2xl shadow-sm text-sm text-gray-600">
            Digite seu PIN e clique em <b>Entrar</b> para ver os controles da rifa.
          </div>
        ) : (
          <section className="bg-white p-4 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Números reservados</h2>
              <button
                onClick={resetAll}
                disabled={busy}
                className="text-xs border px-3 py-1.5 rounded-xl hover:bg-gray-50 disabled:opacity-40"
              >
                Zerar tudo
              </button>
            </div>

            {entries.length === 0 ? (
              <p className="text-sm text-gray-500">
                Ainda não há nenhum número reservado.
              </p>
            ) : (
              <div className="space-y-2 max-h-[70vh] overflow-y-auto">
                {entries.map((e) => (
                  <div
                    key={e.slot}
                    className="flex flex-wrap items-center justify-between gap-3 border rounded-xl px-3 py-2"
                  >
                    <div>
                      <div className="font-semibold">
                        Nº {e.slot} — {e.buyer_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        Tel: {e.phone}
                      </div>
                      <div className="text-xs mt-1">
                        Status:{" "}
                        <span
                          className={
                            e.status === "paid"
                              ? "text-green-700 font-semibold"
                              : "text-yellow-700 font-semibold"
                          }
                        >
                          {e.status === "paid"
                            ? "Pix confirmado"
                            : "Aguardando Pix"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {e.status !== "paid" && (
                        <button
                          onClick={() => confirmPayment(e.slot)}
                          disabled={busy}
                          className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-xl disabled:opacity-40"
                        >
                          Confirmar Pix
                        </button>
                      )}
                      <button
                        onClick={() => unreserve(e.slot)}
                        disabled={busy}
                        className="text-xs border px-3 py-1.5 rounded-xl hover:bg-gray-50 disabled:opacity-40"
                      >
                        Liberar número
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
