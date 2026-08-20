"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";

function getVirtualEmail(name: string) {
  const hexName = Buffer.from(name.trim()).toString("hex");
  return `ssafy16_${hexName}@ssafy.local`;
}

// 1. Comma-separated 회원 일괄 등록
export async function bulkRegisterUsers(
  commaSeparatedNames: string,
  className: string,
) {
  // 💡 세션을 변경하지 않는 Admin 전용 클라이언트 사용
  const supabaseAdmin = createAdminClient();

  const names = commaSeparatedNames
    .split(/[\s,]+/) // 공백(스페이스, 엔터, 탭) 및 쉼표를 기준으로 자름
    .map((name) => name.trim())
    .filter(Boolean);

  const results = { successCount: 0, failCount: 0, errors: [] as string[] };

  for (const name of names) {
    const virtualEmail = getVirtualEmail(className + name);

    // signUp 대신 admin.createUser 사용
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: virtualEmail,
      password: "ssafy16",
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
        .update({ email: virtualEmail})
        .eq("id", data.user.id);
      results.successCount++;
    }
  }

  revalidatePath("/admin/users");
  return results;
}
export async function getAllUsers() {
  const supabase = createAdminClient();

  // 1. 공통 기본 쿼리 작성 (전체 조회 기준)
  let query = supabase
    .from("profiles")
    .select("id, name, email, role, status, created_at, class_id")
    .order("name", { ascending: true });
 

  // 3. 쿼리 실행
  const { data: users, error } = await query;

  if (error) {
    throw new Error(`유저 목록 조회 실패: ${error.message}`);
  }

  return users || [];
}
// 2. 유저 권한 및 상태 변경 (Admin 전용)
export async function updateUserStatus(
  userId: string,
  role: "class_admin" | "user" | "song_admin",
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

export async function resetUserPassword(userId: string, newPassword: string) {
  if (!newPassword || newPassword.length < 6) {
    throw new Error("비밀번호는 최소 6자리 이상이어야 합니다.");
  }

  // Supabase Auth Admin API로 해당 유저의 비밀번호 변경
  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
    userId,
    { password: newPassword }
  );

  if (error) {
    throw new Error(`비밀번호 초기화 실패: ${error.message}`);
  }

  return { success: true };
}

export async function getClasses() {
  const supabase = createAdminClient();
  const { data: classes, error } = await supabase
    .from("classes")
    .select("id, name")
    .order("name", { ascending: true });
  if (error) {
    throw new Error(`반 목록 조회 실패: ${error.message}`);
  }
  return classes || [];
}

