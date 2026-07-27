"use client";

import { Trash2 } from "lucide-react";
import { deleteDashboardLink } from "@/app/admin/links/actions";

export default function DeleteLinkButton({ linkId }: { linkId: string }) {
  const handleDeleteLink = async (linkId: string) => {
    if (!confirm("정말로 이 링크를 삭제하시겠습니까?")) {
      return;
    } else {
      try {
        deleteDashboardLink(linkId);
        alert("링크가 삭제되었습니다.");
      } catch (err: any) {
        alert(`링크 삭제 실패: ${err.message}`);
      }
    }
  };
  return (
    <Trash2
      className="w-6 h-6 p-1 -mr-1 text-slate-400 mt-2 hover:text-red-500 transition-colors"
      onClick={(e) => {
        e.preventDefault();
        handleDeleteLink(linkId);
      }}
    />
  );
}
