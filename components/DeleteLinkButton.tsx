"use client";

import { Trash2 } from "lucide-react";
import { apiRequest } from "@/utils/api/client";

export default function DeleteLinkButton({
  linkId,
  onDeleted,
}: {
  linkId: number;
  onDeleted: () => Promise<void>;
}) {
  const handleDeleteLink = async () => {
    if (!confirm("정말로 이 링크를 삭제하시겠습니까?")) {
      return;
    } else {
      try {
        await apiRequest<void>(`/api/links/${linkId}`, { method: "DELETE" });
        await onDeleted();
        alert("링크가 삭제되었습니다.");
      } catch (error) {
        alert(
          `링크 삭제 실패: ${
            error instanceof Error ? error.message : "알 수 없는 오류"
          }`,
        );
      }
    }
  };
  return (
    <Trash2
      className="w-6 h-6 p-1 -mr-1 text-slate-400 mt-2 hover:text-red-500 transition-colors"
      onClick={(e) => {
        e.preventDefault();
				void handleDeleteLink();
      }}
    />
  );
}
