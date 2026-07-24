// app/seats/RealtimeSeats.tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function RealtimeSeats({
  initialSeats
}: {
  initialSeats: any[];
}) {
  const [seats, setSeats] = useState(initialSeats);
  const supabase = createClient();

  useEffect(() => {
    // Supabase Realtime 채널 구독
    const channel = supabase
      .channel("seat_db_changes")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "seat_allocations" },
        (payload) => {
          // 변경된 데이터만 찾아서 State 업데이트
          setSeats((prev) =>
            prev.map((item) =>
              item.id === payload.new.id ? payload.new : item
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return <div>{/* Realtime 업데이트가 반영되는 자리 목록 UI */}</div>;
}
