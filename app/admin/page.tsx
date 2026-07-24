import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import AdminView from "./AdminView"; // 어드민 화면 컴포넌트

export default async function AdminPage({
  searchParams
}: {
  searchParams: Promise<{ unauthorized?: string }>;
}) {
  const supabase = await createClient();

  // 1. 로그인 확인
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/");
  }

  // 2. Admin 권한 확인
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // Admin이 아니면 메인으로 튕겨내기 (unauthorized 쿼리 파라미터 전달)
  if (profile?.role !== "admin") {
    redirect("/?unauthorized=true");
  }

  return <AdminView />;
}
