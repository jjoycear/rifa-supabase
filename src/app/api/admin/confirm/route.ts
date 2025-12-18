import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  const { slot, pin } = await req.json();

  if (!slot || !pin) {
    return NextResponse.json({ error: "Requisição inválida" }, { status: 400 });
  }

  if (pin !== process.env.ADMIN_PIN) {
    return NextResponse.json({ error: "PIN inválido" }, { status: 401 });
  }

  const { error } = await supabaseServer
    .from("raffle_entries")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("slot", slot);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
