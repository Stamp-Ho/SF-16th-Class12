"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import SongMain from "./SongMain";
import StagePage from "./StagePage";

export default function StageSync({
  initialStageData,
  user
}: {
  initialStageData: any | null;
  user: { name: string; role: string; classId: string };
}) {
  const [stageData, setStageData] = useState<any | null>(initialStageData);
  const supabase = createClient();

  useEffect(() => {
    // 같은 반(classId)의 song_records 테이블 변경사항 구독
    const channel = supabase
      .channel(`karaoke-sync-${user.classId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "song_records",
          filter: `class_id=eq.${user.classId}`
        },
        (payload) => {
          const record = payload.new as any;

          // 어드민이 노래 시작을 눌러 status가 'singing'이 된 경우 -> StagePage
          if (record && record.status === "singing") {
            setStageData(record);
          }

          // 진행 중이던 노래가 완료(completed)되거나 취소(canceled)된 경우 -> SongMain
          if (
            record &&
            record.status !== "singing" &&
            stageData?.id === record.id
          ) {
            setStageData(null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.classId, stageData?.id]);

  // singing 중인 곡이 있으면 무대 화면, 없으면 대기열 화면
  if (stageData) {
    return <StagePage stageData={stageData} user={user} />;
  }

  return <SongMain user={user} />;
}
