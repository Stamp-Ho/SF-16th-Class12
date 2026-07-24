"use client";

import { useState } from "react";
import { X, Calendar, User, FileText } from "lucide-react";

interface DrawHistoryItem {
  id: string;
  title: string;
  description: string | null;
  result_data: { order: number; name: string }[];
  created_at: string;
  creator: { name: string } | null;
}

export default function HistoryModal({
  isOpen,
  onClose,
  history
}: {
  isOpen: boolean;
  onClose: () => void;
  history: DrawHistoryItem[];
}) {
  const [selectedDraw, setSelectedDraw] = useState<DrawHistoryItem | null>(
    history[0] || null
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[85vh]">
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            과거 추첨 기록
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 모달 본문 */}
        <div className="grid grid-cols-1 md:grid-cols-3 flex-1 overflow-hidden">
          {/* 좌측 히스토리 회차 목록 */}
          <div className="border-r border-slate-100 overflow-y-auto p-3 space-y-2 bg-slate-50/50">
            {history.length > 0 ? (
              history.map((item) => {
                const isSelected = selectedDraw?.id === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedDraw(item)}
                    className={`w-full text-left p-3 rounded-xl transition-all border ${
                      isSelected
                        ? "bg-white border-indigo-300 shadow-sm text-indigo-900"
                        : "border-transparent hover:bg-white/80 text-slate-600"
                    }`}
                  >
                    <p className="font-bold text-xs truncate">{item.title}</p>
                    <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </button>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 text-center py-8">
                저장된 기록이 없습니다.
              </p>
            )}
          </div>

          {/* 우측 선택된 회차 결과 세부 */}
          <div className="col-span-2 p-6 overflow-y-auto space-y-4">
            {selectedDraw ? (
              <>
                <div>
                  <h4 className="text-xl font-bold text-slate-800">
                    {selectedDraw.title}
                  </h4>
                  {selectedDraw.description && (
                    <p className="text-xs text-slate-500 mt-1">
                      {selectedDraw.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2 border-b border-slate-100 pb-3">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" /> 생성자:{" "}
                      {selectedDraw.creator?.name || "관리자"}
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(selectedDraw.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* 순서 테이블 */}
                <div className="grid grid-cols-2 gap-2">
                  {selectedDraw.result_data.map((item) => (
                    <div
                      key={item.order}
                      className="flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs"
                    >
                      <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[11px]">
                        {item.order}
                      </span>
                      <span className="font-semibold text-slate-800">
                        {item.name}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs">
                목록에서 기록을 선택해 주세요.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
