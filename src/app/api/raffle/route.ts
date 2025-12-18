import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from("raffle_entries")
      .select("*")
      .order("slot");
    
    if (error) {
      console.error("GET error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json(data);
  } catch (err) {
    console.error("GET exception:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { slot, buyer_name, phone } = body;
    
    if (!slot || !buyer_name || !phone) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log("Attempting to insert:", { slot, buyer_name, phone });
    console.log("Service Role Key exists:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    const { data, error } = await supabaseServer.from("raffle_entries").insert({
      slot,
      buyer_name,
      phone,
      status: "reserved"
    }).select();
    
    if (error) {
      console.error("POST error:", error);
      return NextResponse.json({ error: error.message, details: error }, { status: 400 });
    }

    console.log("Insert successful:", data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST exception:", err);
    return NextResponse.json({ error: "Internal server error", details: String(err) }, { status: 500 });
  }
}
