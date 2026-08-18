import { apiRequest, type UserInfo } from "@/utils/api/client";

export async function getAllUsers(_classId?: string | null) {
	void _classId;
  return apiRequest<UserInfo[]>("/api/users");
}

export async function bulkRegisterUsers(
  usernames: string[] | string,
  _className?: string,
  _classId?: string,
) {
  void _className;
  void _classId;
  const normalizedUsernames = Array.isArray(usernames)
    ? usernames
    : usernames.split(/[\s,]+/).map((username) => username.trim()).filter(Boolean);

  return apiRequest<UserInfo[]>("/api/users/register_batch", {
    method: "POST",
    body: JSON.stringify({ usernames: normalizedUsernames }),
  });
}

export async function updateUserStatus(username: string, role: string, status: string) {
  return apiRequest<UserInfo>(`/api/users/change_role_status/${encodeURIComponent(username)}`, {
    method: "PATCH",
    body: JSON.stringify({ role, status }),
  });
}

export async function resetUserPassword(username: string, newPassword: string) {
  return apiRequest<UserInfo>(`/api/users/change_password/${encodeURIComponent(username)}`, {
    method: "PATCH",
    body: JSON.stringify({ newPassword }),
  });
}

export async function getClasses(_classId?: string | null) {
  void _classId;
  return [] as { id: string; name: string }[];
}

export async function registerClassAdmin() {
  throw new Error("단일 반 모드에서는 반 생성과 반 관리자 등록을 지원하지 않습니다.");
}
