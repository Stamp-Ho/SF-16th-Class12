import { createClient } from "@/utils/supabase/server";
import LoginModal from "@/app/(auth)/LoginModal";
import StageSync from "./StageSync";

export default async function SongPage() {
  const supabase = await createClient();

  // 1. 현재 세션 유저 조회
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return <LoginModal />;
  }

  // 2. 로그인 유저의 profile (Role, Class) 조회
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.class_id) {
    return <div className="text-center text-red-500">권한이 없습니다.</div>;
  }

  // 3. 현재 라이브 중(singing)인 노래가 있는지 초기 조회
  // (single 대신 maybeSingle을 사용해야 결과가 없을 때 에러가 나지 않습니다)
  const { data: stageData } = await supabase
    .from("song_records")
    .select("*")
    .eq("status", "singing")
    .eq("class_id", profile.class_id)
    .maybeSingle();

  const userInfo = {
    name: profile.name,
    role: profile.role,
    classId: profile.class_id
  };

  // 4. 실시간 동기화 클라이언트 래퍼로 렌더링
  return <StageSync initialStageData={stageData} user={userInfo} />;
}
