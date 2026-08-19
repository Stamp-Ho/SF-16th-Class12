import { apiRequest } from "@/utils/api/client";

type UserResponse = {
  id: number;
  username: string;
  role: string;
  status: string;
};

type DrawResponse = {
  id: number;
  title: string;
  description: string | null;
  createdAt: string;
  results: {
    id: number;
    userName: string;
    drawOrder: number;
  }[];
};

type DrawSummary = Omit<DrawResponse, "results">;

// 1. 추첨 대상이 될 전체 유저 이름 목록 조회
export async function getTargetUsers(classId?: string) {
  void classId;
  const users = await apiRequest<UserResponse[]>("/api/users");

  return users
    .filter((user) => user.status === "ACTIVE" && user.role !== "teacher")
    .map((user) => ({
      id: String(user.id),
      name: user.username,
      role: user.role,
    }));
}

// 2. 추첨 결과 DB 저장 (JSONB 통째 저장)
export async function saveRandomDraw(
  title: string,
  description: string,
  resultData: { order: number; name: string }[],
  classId?: string
) {
  void classId;
  return apiRequest<DrawResponse>("/api/draws", {
    method: "POST",
    body: JSON.stringify({
      title: title.trim(),
      description: description.trim(),
      targetUserNames: resultData.map((item) => item.name),
    }),
  });
}

// 3. 과거 저장된 추첨 히스토리 목록 조회
export async function getRandomDrawHistory(classId?: string) {
  void classId;
  const draws = await apiRequest<DrawSummary[]>("/api/draws");

  return Promise.all(
    draws.map(async (draw) => {
      const detail = await apiRequest<DrawResponse>(`/api/draws/${draw.id}`);
      return {
        id: detail.id,
        title: detail.title,
        description: detail.description,
        created_at: detail.createdAt,
        creator: null,
        result_data: detail.results.map((result) => ({
          order: result.drawOrder,
          name: result.userName,
        })),
      };
    }),
  );
}
