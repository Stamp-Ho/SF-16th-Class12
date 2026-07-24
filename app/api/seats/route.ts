import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const round = searchParams.get("round") || "1";

  const supabase = await createClient();

  const { data: seats, error } = await supabase
    .from("seat_allocations")
    .select(
      `
      id,
      round_number,
      seat_code,
      current_bid_price,
      is_closed,
      updated_at,
      current_bidder:profiles!seat_allocations_current_bidder_id_fkey(id, name)
    `
    )
    .eq("round_number", parseInt(round, 10))
    .order("seat_code", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ seats });
}
