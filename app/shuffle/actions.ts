"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// 1. 추첨 대상이 될 전체 유저 이름 목록 조회
export async function getTargetUsers(classId: string) {
  const supabase = await createClient();

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, name")
    .eq("status", "active")
    .eq("class_id", classId || "")
    .order("name", { ascending: true });

  if (error) throw new Error(`유저 목록 조회 실패: ${error.message}`);
  return profiles || [];
}

// 2. 추첨 결과 DB 저장 (JSONB 통째 저장)
export async function saveRandomDraw(
  title: string,
  description: string,
  resultData: { order: number; name: string }[],
  classId: string
) {
  const supabase = await createClient();

  // 현재 접속한 Admin 유저 확인
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) throw new Error("인증이 필요합니다.");

  const { error } = await supabase.from("random_draws").insert({
    title: title.trim(),
    description: description.trim(),
    result_data: resultData, // JSONB 객체 배열 저장
    created_by: user.id,
    class_id: classId
  });

  if (error) throw new Error(`저장 실패: ${error.message}`);

  revalidatePath("/random");
  return { success: true };
}

// 3. 과거 저장된 추첨 히스토리 목록 조회
export async function getRandomDrawHistory(classId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
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
    .eq("class_id", classId || "")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`히스토리 조회 실패: ${error.message}`);
  return data || [];
}
