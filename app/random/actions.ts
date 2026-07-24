// app/random/actions.ts
"use server";

import { createClient } from "@/utils/supabase/server";

export async function saveRandomDraw(
  title: string,
  resultList: { order: number; name: string }[]
) {
  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("random_draws").insert({
    title,
    result_data: resultList, // JSONB 컬럼에 객체 배열 그대로 전달
    created_by: user?.id
  });

  if (error) throw new Error(error.message);
  return { success: true };
}
