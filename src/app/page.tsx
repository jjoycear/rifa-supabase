
"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { RaffleEntry } from "@/lib/types";

export default function Home() {
  const [entries, setEntries] = useState<RaffleEntry[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  async function load() {
    try {
      const res = await fetch("/api/raffle");
      if (!res.ok) {
        console.error("Load error:", res.statusText);
        return;
      }
      const data = await res.json();
      setEntries((data ?? []) as RaffleEntry[]);
    } catch (err) {
      console.error("Load exception:", err);
    }
  }

  useEffect(() => {
    load();
    const ch = supabaseBrowser
      .channel("raffle")
      .on("postgres_changes", { event: "*", schema: "public", table: "raffle_entries" }, load)
      .subscribe();
    return () => { supabaseBrowser.removeChannel(ch); };
  }, []);

  async function reserve() {
    if (selectedSlots.length === 0 || !firstName || !lastName) {
      alert("Por favor, preencha nome, sobrenome e telefone");
      return;
    }

    const fullName = `${firstName} ${lastName}`;
    
    // Verificar se já existe alguém com o mesmo nome e sobrenome
    const nameExists = entries.some(e => e.buyer_name.toLowerCase() === fullName.toLowerCase());
    if (nameExists) {
      alert("Já existe uma reserva com este nome. Por favor, use um nome diferente ou adicione um apelido.");
      return;
    }

    try {
      for (const slot of selectedSlots) {
        const res = await fetch("/api/raffle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slot,
            buyer_name: fullName,
            phone
          })
        });
        
        const data = await res.json();
        if (!res.ok) {
          console.error("Reserve error:", data.error);
          alert("Erro ao reservar: " + data.error);
          return;
        }
      }
      
      setSelectedSlots([]); setFirstName(""); setLastName(""); setPhone("");
      load();
    } catch (err) {
      console.error("Reserve exception:", err);
      alert("Erro ao reservar");
    }
  }

  function toggleSlot(n: number) {
    setSelectedSlots(prev => 
      prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n]
    );
  }

  const totalPix = selectedSlots.length * 10;

  const generatePixLink = () => {
    if (totalPix === 0) return "#";
    const description = `Rifa ${selectedSlots.sort((a, b) => a - b).join(", ")}`;
    // Usando formato correto de PIX: chave (telefone), nome do recebedor e valor
    const pixLink = `https://nubank.com.br/pix/19991318550`;
    return pixLink;
  };

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-2">🎟️ Rifa Solidária</h1>
      <div className="mb-4 bg-white p-4 rounded shadow">
        <p className="mb-2"><b>Dados para PIX:</b></p>
        <p>Chave PIX: <b>19991318550</b></p>
        <p>Titular: <b>Juliet Joyce de Araujo</b></p>
        <p>Banco: <b>Nubank</b></p>
      </div>

      <div className="grid grid-cols-10 gap-2 mb-6">
        {Array.from({ length: 100 }, (_, i) => i + 1).map(n => {
          const e = entries.find(x => x.slot === n);
          const isSelected = selectedSlots.includes(n);
          const isReserved = e && e.status === "reserved";
          const isPaid = e && e.status === "paid";
          return (
            <button
              key={n}
              disabled={!!e}
              onClick={() => toggleSlot(n)}
              className={`p-2 rounded text-sm border font-bold transition ${
                isReserved ? "bg-gray-400 text-gray-600 cursor-not-allowed" :
                isPaid ? "bg-yellow-200 cursor-not-allowed" : 
                isSelected ? "bg-green-500 text-white" : 
                "bg-white hover:bg-gray-100"
              }`}
            >
              {n}
            </button>
          );
        })}
      </div>

      <div className="bg-white p-4 rounded shadow max-w-sm">
        <p>Números selecionados: <b>{selectedSlots.length > 0 ? selectedSlots.sort((a, b) => a - b).join(", ") : "-"}</b></p>
        <p className="mt-2 text-lg">Total de PIX: <b className="text-green-600">R$ {totalPix.toFixed(2).replace(".", ",")}</b></p>

        {selectedSlots.length > 0 && (
          <div className="mt-4 bg-blue-50 p-3 rounded border border-blue-200">
            <p className="mb-2 font-bold text-sm">💳 Dados para PIX:</p>
            <p className="text-sm">Chave PIX: <b>19991318550</b></p>
            <p className="text-sm">Titular: <b>Juliet Joyce de Araujo</b></p>
            <p className="text-sm">Banco: <b>Nubank</b></p>
            <p className="text-sm mt-2">Valor: <b className="text-green-600">R$ {totalPix.toFixed(2).replace(".", ",")}</b></p>
          </div>
        )}

        <p className="mt-4 mb-2 font-bold text-sm">Dados para confirmar:</p>
        <input placeholder="Nome" value={firstName} onChange={e => setFirstName(e.target.value)}
          className="border p-2 w-full mt-2"/>
        <input placeholder="Sobrenome" value={lastName} onChange={e => setLastName(e.target.value)}
          className="border p-2 w-full mt-2"/>
        <input placeholder="Telefone" value={phone} onChange={e => setPhone(e.target.value)}
          className="border p-2 w-full mt-2"/>
        <button onClick={reserve} disabled={selectedSlots.length === 0 || !firstName || !lastName} className="mt-3 w-full bg-black text-white p-2 rounded disabled:bg-gray-400 hover:bg-gray-800">
          ✓ Confirmar Reserva
        </button>
      </div>
    </main>
  );
}
