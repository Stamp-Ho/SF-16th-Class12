import { apiRequest } from "@/utils/api/client";

export type SongRecord = {
  id: number;
  userName: string;
  songName: string | null;
  youtubeUrl: string | null;
  reason: string;
  status: "pending" | "singing" | "completed" | "canceled";
  displayOrder: number;
  createdAt: string;
};

export type SongChat = {
  id: number;
  songId: number;
  userName: string;
  nickname: string;
  message: string;
  createdAt: string;
};

export async function getSongRecords() {
  return apiRequest<SongRecord[]>("/api/karaoke/songs");
}

export async function addSongRecord(userName: string, reason: string) {
  return apiRequest<SongRecord>("/api/karaoke/songs", {
    method: "POST",
    body: JSON.stringify({ userName, reason }),
  });
}

export async function startTopSongRecord({
  id,
  songName,
  youtubeUrl,
}: {
  id: number;
  songName: string;
  youtubeUrl: string;
}) {
  await apiRequest<SongRecord>(`/api/karaoke/songs/${id}/songinfo`, {
    method: "PATCH",
    body: JSON.stringify({ songName, youtubeUrl }),
  });

  return apiRequest<SongRecord>(`/api/karaoke/songs/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: "singing" }),
  });
}

export async function completeSongRecord(id: number) {
  return apiRequest<SongRecord>(`/api/karaoke/songs/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: "completed" }),
  });
}

export async function cancelSongRecord(id: number) {
  return apiRequest<SongRecord>(`/api/karaoke/songs/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: "canceled" }),
  });
}

export async function getChatMessages(songId: number) {
  return apiRequest<SongChat[]>(`/api/karaoke/songs/${songId}/chats`);
}

export async function sendChatMessage({
  songId,
  userName,
  nickname,
  message,
}: {
  songId: number;
  userName: string;
  nickname: string;
  message: string;
}) {
  return apiRequest<SongChat>(`/api/karaoke/songs/${songId}/chats`, {
    method: "POST",
    body: JSON.stringify({ userName, nickname, message }),
  });
}

export async function reorderSongRecords(
  orderedSingers: { id: number; displayOrder: number }[],
) {
  await Promise.all(
    orderedSingers.map((singer) =>
      apiRequest<SongRecord>(`/api/karaoke/songs/${singer.id}/order`, {
        method: "PATCH",
        body: JSON.stringify({ displayOrder: singer.displayOrder }),
      }),
    ),
  );
}
