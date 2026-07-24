"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";

export default function UnauthorizedAlert() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const showModal = searchParams.get("unauthorized") === "true";

  if (!showModal) return null;

  const handleClose = () => {
    router.replace("/"); // 쿼리 파라미터 제거
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-slate-100 text-center space-y-4">
        <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800">접근 권한 제한</h3>
          <p className="text-xs text-slate-500 mt-1">
            관리자(Admin) 권한이 있는 계정만 접근할 수 있는 페이지입니다.
          </p>
        </div>
        <button
          onClick={handleClose}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm py-2.5 rounded-xl transition-colors"
        >
          확인
        </button>
      </div>
    </div>
  );
}
