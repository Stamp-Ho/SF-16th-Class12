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
  classId: string
) {
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
        .update({ email: virtualEmail, class_id: classId })
        .eq("id", data.user.id);
      results.successCount++;
    }
  }

  revalidatePath("/admin/users");
  return results;
}
export async function getAllUsers(classId?: string | null) {
  const supabase = createAdminClient();

  // 1. 공통 기본 쿼리 작성 (전체 조회 기준)
  let query = supabase
    .from("profiles")
    .select("id, name, email, role, status, created_at, class_id")
    .order("name", { ascending: true });

  // 2. classId가 있을 때만 반별 필터링 조건 추가
  if (classId) {
    query = query.eq("class_id", classId);
  }

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
  role: "class_admin" | "user",
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

export async function getClasses(classId?: string | null) {
  const supabase = createAdminClient();
  const { data: classes, error } = await supabase
    .from("classes")
    .select("id, name")
    .order("name", { ascending: true });
  if (error) {
    throw new Error(`반 목록 조회 실패: ${error.message}`);
  }
  if (classId) {
    return classes?.filter((cls) => cls.id === classId) || [];
  }
  return classes || [];
}

// Class 생성 및 Class Admin 계정 생성 (Admin 전용)
export async function registerClassAdmin(className: string, userName: string) {
  const supabaseAdmin = createAdminClient();
  const virtualEmail = getVirtualEmail(className + userName);

  // 1. Auth 계정 생성
  const { data: authData, error: authError } =
    await supabaseAdmin.auth.admin.createUser({
      email: virtualEmail,
      password: "ssafy16",
      email_confirm: true,
      user_metadata: { name: userName, email: virtualEmail }
    });

  if (authError || !authData.user) {
    throw new Error(`클래스 관리자 계정 생성 실패: ${authError?.message}`);
  }

  const userId = authData.user.id;

  try {
    // 2. Class 존재 여부 확인 (single 또는 maybeSingle 활용)
    let classId: string | null = null;

    const { data: existingClass, error: selectError } = await supabaseAdmin
      .from("classes")
      .select("id")
      .eq("name", className)
      .maybeSingle(); // 0개면 null 반환, DB 에러일 때만 error 발생

    if (selectError) {
      throw new Error(`클래스 조회 중 오류: ${selectError.message}`);
    }

    if (existingClass) {
      classId = existingClass.id;
    } else {
      // 3. Class 없으면 신규 생성
      const { data: newClass, error: insertError } = await supabaseAdmin
        .from("classes")
        .insert({ name: className })
        .select("id")
        .single();

      if (insertError || !newClass) {
        throw new Error(`클래스 생성 실패: ${insertError?.message}`);
      }
      classId = newClass.id;
    }

    // 4. Class Admin 계정 Profile 업데이트
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        class_id: classId,
        role: "class_admin",
        email: virtualEmail
      })
      .eq("id", userId);

    if (updateError) {
      throw new Error(
        `클래스 관리자 프로필 업데이트 실패: ${updateError.message}`
      );
    }

    return { userId, classId };
  } catch (error) {
    // 후속 작업 실패 시 생성된 Auth 유저 롤백 (선택 사항이지만 권장)
    await supabaseAdmin.auth.admin.deleteUser(userId);
    throw error;
  }
}
