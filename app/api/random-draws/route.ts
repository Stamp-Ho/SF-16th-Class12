import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// 1. 과거 저장된 추첨 결과 전체 조회 (GET /api/random-draws)
export async function GET() {
  const supabase = await createClient();

  const { data: draws, error } = await supabase
    .from("random_draws")
    .select(
      `
      id,
      title,
      description,
      result_data,
      created_at,
      creator:profiles!random_draws_created_by_fkey(name)
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ draws });
}

// 2. 랜덤 추첨 결과 저장 (POST /api/random-draws)
// Body: { "title": "1차시 발표순서", "description": "메모", "resultData": [{"order": 1, "name": "홍길동"}, ...] }
export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }

  const { title, description, resultData } = await request.json();

  if (!title || !Array.isArray(resultData)) {
    return NextResponse.json(
      { error: "올바르지 않은 데이터 형식입니다." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("random_draws")
    .insert({
      title,
      description: description || "",
      result_data: resultData, // JSONB 객체 배열 저장
      created_by: user.id
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, draw: data });
}
