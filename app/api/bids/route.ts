import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  // 1. 사용자 인증 확인
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 }
    );
  }

  const { seatCode, roundNumber, bidPrice } = await request.json();

  // 2. 현재 최고 입찰가 검증 (0원 시작, 500원 단위)
  const { data: currentSeat, error: seatError } = await supabase
    .from("seat_allocations")
    .select("current_bid_price, is_closed")
    .eq("seat_code", seatCode)
    .eq("round_number", roundNumber)
    .single();

  if (seatError || !currentSeat) {
    return NextResponse.json(
      { error: "존재하지 않는 자리 항목입니다." },
      { status: 404 }
    );
  }

  if (currentSeat.is_closed) {
    return NextResponse.json(
      { error: "이미 마감된 경매입니다." },
      { status: 400 }
    );
  }

  // Minimum bid validation: 최소 500원 이상 차이
  const minRequiredBid =
    currentSeat.current_bid_price === 0
      ? 0
      : currentSeat.current_bid_price + 500;
  if (bidPrice < minRequiredBid || bidPrice % 500 !== 0) {
    return NextResponse.json(
      {
        error: `입찰가는 최소 ${minRequiredBid}원 이상이며 500원 단위여야 합니다.`
      },
      { status: 400 }
    );
  }

  // 3. 입찰 트랜잭션 수행 (bids 로그 추가 및 seat_allocations 업데이트)
  const { error: bidLogError } = await supabase.from("bids").insert({
    auction_type: "SEAT",
    round_number: roundNumber,
    target_id: seatCode,
    bidder_id: user.id,
    bid_price: bidPrice
  });

  if (bidLogError) {
    return NextResponse.json({ error: bidLogError.message }, { status: 500 });
  }

  const { error: updateError } = await supabase
    .from("seat_allocations")
    .update({
      current_bidder_id: user.id,
      current_bid_price: bidPrice,
      updated_at: new Date().toISOString()
    })
    .eq("seat_code", seatCode)
    .eq("round_number", roundNumber);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: "입찰이 성공적으로 완료되었습니다."
  });
}
