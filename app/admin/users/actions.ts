"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";

function getVirtualEmail(name: string) {
  const hexName = Buffer.from(name.trim()).toString("hex");
  return `ssafy504_${hexName}@ssafy.local`;
}

// 1. Comma-separated 회원 일괄 등록
export async function bulkRegisterUsers(commaSeparatedNames: string) {
  // 💡 세션을 변경하지 않는 Admin 전용 클라이언트 사용
  const supabaseAdmin = createAdminClient();

  const names = commaSeparatedNames
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);

  const results = { successCount: 0, failCount: 0, errors: [] as string[] };

  for (const name of names) {
    const virtualEmail = getVirtualEmail(name);

    // signUp 대신 admin.createUser 사용
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: virtualEmail,
      password: "ssafy504",
      email_confirm: true, // 이메일 인증 완료 상태로 설정 (메일 미발송)
      user_metadata: { name, email: virtualEmail } // Supabase Trigger(handle_new_user)로 profiles에 name 자동 삽입
    });
    console.log(data, error);

    if (error || !data.user) {
      results.failCount++;
      results.errors.push(`${name}: ${error?.message ?? "Unknown error"}`);
    } else {
      // 2. 트리거로 생성된 profiles 레코드에 email 수동 업데이트
      await supabaseAdmin
        .from("profiles")
        .update({ email: virtualEmail })
        .eq("id", data.user.id);
      results.successCount++;
    }
  }

  revalidatePath("/admin/users");
  return results;
}
export async function getAllUsers() {
  const supabase = createAdminClient();

  const { data: users, error } = await supabase
    .from("profiles")
    .select("id, name, email, role, status, created_at")
    .order("name", { ascending: true });
  console.log("getAllUsers:", users, error);

  if (error) {
    throw new Error(`유저 목록 조회 실패: ${error.message}`);
  }

  return users || [];
}

// 2. 유저 권한 및 상태 변경 (Admin 전용)
export async function updateUserStatus(
  userId: string,
  role: "admin" | "user",
  status: "active" | "blocked"
) {
  const supabaseAdmin = createAdminClient();

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ role, status })
    .eq("id", userId);

  if (error) {
    throw new Error(`상태 업데이트 실패: ${error.message}`);
  }

  revalidatePath("/admin");
  return { success: true };
}
