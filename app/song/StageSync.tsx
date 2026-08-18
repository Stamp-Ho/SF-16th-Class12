"use client";

import { useEffect, useState } from "react";
import { getSongRecords, type SongRecord } from "./actions";
import SongMain from "./SongMain";
import StagePage from "./StagePage";

export default function StageSync({
  user
}: {
  user: { name: string; role: string };
}) {
  const [stageData, setStageData] = useState<SongRecord | null>(null);

  useEffect(() => {
    getSongRecords()
      .then((records) => setStageData(records.find((record) => record.status === "singing") ?? null))
      .catch(console.error);
  }, []);

  if (stageData) {
    return <StagePage stageData={stageData} user={user} onFinished={() => setStageData(null)} />;
  }

  return <SongMain user={user} onSongStarted={setStageData} />;
}
