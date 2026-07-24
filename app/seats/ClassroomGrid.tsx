"use client";

import { useState } from "react";
import { placeOrMoveSeatBid, swapSeatPositions } from "./actions";
import { ArrowLeftRight, Sparkles, Star } from "lucide-react";

interface SeatData {
  id: string;
  seat_code: string;
  current_group_id: string | null;
  current_group_name: string | null;
  member_left: string | null;
  member_right: string | null;
  current_bid_price: number;
  is_closed: boolean;
}

const SEAT_MAP = [
  { num: 1, type: "restricted", name: "시야제한석" },
  { num: 2, type: "seat", code: "A", pos: "L" },
  { num: 3, type: "seat", code: "A", pos: "R" },
  { num: 4, type: "seat", code: "B", pos: "L" },
  { num: 5, type: "seat", code: "B", pos: "R" },
  { num: 6, type: "restricted", name: "안좋은 자리" },

  { num: 7, type: "seat", code: "C", pos: "L" },
  { num: 8, type: "seat", code: "C", pos: "R" },
  { num: 9, type: "seat", code: "D", pos: "L" },
  { num: 10, type: "seat", code: "D", pos: "R" },
  { num: 11, type: "seat", code: "E", pos: "L" },
  { num: 12, type: "seat", code: "E", pos: "R" },

  { num: 13, type: "seat", code: "F", pos: "L" },
  { num: 14, type: "seat", code: "F", pos: "R" },
  { num: 15, type: "seat", code: "G", pos: "L" },
  { num: 16, type: "seat", code: "G", pos: "R" },
  { num: 17, type: "seat", code: "H", pos: "L" },
  { num: 18, type: "seat", code: "H", pos: "R" },

  { num: 19, type: "seat", code: "I", pos: "L" },
  { num: 20, type: "seat", code: "I", pos: "R" },
  { num: 21, type: "seat", code: "J", pos: "L" },
  { num: 22, type: "seat", code: "J", pos: "R" },
  { num: 23, type: "seat", code: "K", pos: "L" },
  { num: 24, type: "seat", code: "K", pos: "R" },

  { num: 25, type: "thinking", name: "생각의자" },
  { num: 26, type: "seat", code: "L", pos: "L" },
  { num: 27, type: "seat", code: "L", pos: "R" },
  { num: 28, type: "seat", code: "M", pos: "L" },
  { num: 29, type: "seat", code: "M", pos: "R" },
  { num: 30, type: "thinking", name: "생각의자" }
];

// 일반 타일 기본 색상 (연한 배경)// 일반 타일 기본 색상 (연한 배경 - I, J 색상 명확히 구분)
const CODE_COLORS: Record<string, string> = {
  A: "bg-rose-50 border-rose-200 text-rose-900 hover:bg-rose-100",
  B: "bg-teal-50 border-teal-200 text-teal-900 hover:bg-teal-100",
  C: "bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100",
  D: "bg-indigo-50 border-indigo-200 text-indigo-900 hover:bg-indigo-100",
  E: "bg-orange-50 border-orange-200 text-orange-900 hover:bg-orange-100",
  F: "bg-purple-100 border-purple-300 text-purple-950 hover:bg-purple-200",
  G: "bg-yellow-50 border-yellow-200 text-yellow-900 hover:bg-yellow-100",
  H: "bg-blue-50 border-blue-200 text-blue-900 hover:bg-blue-100",
  // 💡 I: 진한 보라(Purple) / J: 화사한 핫핑크(Pink)로 구분감 강화
  I: "bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-100",
  J: "bg-fuchsia-100 border-fuchsia-300 text-fuchsia-950 hover:bg-fuchsia-200",
  K: "bg-lime-50 border-lime-200 text-lime-900 hover:bg-lime-100",
  L: "bg-sky-50 border-sky-200 text-sky-900 hover:bg-sky-100",
  M: "bg-green-50 border-green-200 text-green-900 hover:bg-green-100"
};

// 💡 내 그룹 타일 강조 색상 (I, J 선점시)
const MY_CODE_COLORS: Record<string, string> = {
  A: "bg-rose-500 text-white border-rose-600 ring-4 ring-rose-300 shadow-md",
  B: "bg-teal-600 text-white border-teal-700 ring-4 ring-teal-300 shadow-md",
  C: "bg-amber-500 text-white border-amber-600 ring-4 ring-amber-300 shadow-md",
  D: "bg-indigo-600 text-white border-indigo-700 ring-4 ring-indigo-300 shadow-md",
  E: "bg-orange-500 text-white border-orange-600 ring-4 ring-orange-300 shadow-md",
  F: "bg-purple-700 text-white border-purple-800 ring-4 ring-purple-300 shadow-md",
  G: "bg-yellow-500 text-slate-900 border-yellow-600 ring-4 ring-yellow-300 shadow-md",
  H: "bg-blue-600 text-white border-blue-700 ring-4 ring-blue-300 shadow-md",
  // 💡 I: 딥 퍼플 채움 / J: 핫 핑크(Fuchsia) 채움
  I: "bg-emerald-600 text-white border-emerald-700 ring-4 ring-emerald-300 shadow-md",
  J: "bg-fuchsia-600 text-white border-fuchsia-700 ring-4 ring-fuchsia-300 shadow-md",
  K: "bg-lime-600 text-white border-lime-700 ring-4 ring-lime-300 shadow-md",
  L: "bg-sky-600 text-white border-sky-700 ring-4 ring-sky-300 shadow-md",
  M: "bg-green-600 text-white border-green-700 ring-4 ring-green-300 shadow-md"
};

export default function ClassroomGrid({
  roundNumber,
  seatList,
  myGroupId,
  myGroupName,
  currentUserName,
  isAdmin
}: {
  roundNumber: number;
  seatList: SeatData[];
  myGroupId: string;
  myGroupName: string;
  currentUserName: string;
  isAdmin: boolean;
}) {
  const [loadingCode, setLoadingCode] = useState<string | null>(null);

  const getSeatInfo = (code: string) =>
    seatList.find((s) => s.seat_code === code);

  const handleSeatClick = async (code: string) => {
    setLoadingCode(code);
    try {
      await placeOrMoveSeatBid(roundNumber, code, myGroupId, myGroupName);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoadingCode(null);
    }
  };

  const handleSwapClick = async (e: React.MouseEvent, seatId: string) => {
    e.stopPropagation();
    try {
      await swapSeatPositions(seatId);
    } catch (err: any) {
      alert(`위치 변경 실패: ${err.message}`);
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 max-w-4xl mx-auto">
      {/* 스크린 / 문 / 강사님 */}
      <div className="space-y-3">
        <div className="grid grid-cols-12 gap-2 text-center text-xs font-bold">
          <div className="col-span-2 bg-slate-200 text-slate-700 py-2 rounded-xl border border-slate-300">
            문
          </div>
          <div className="col-span-10 bg-slate-800 text-white py-2 rounded-xl flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" /> 칠판 (스크린)
          </div>
        </div>
        <div className="flex justify-end">
          <div className="w-48 bg-amber-50 border-2 border-amber-300 text-amber-900 py-2.5 rounded-xl font-bold text-xs text-center">
            강사님 자~리
          </div>
        </div>
      </div>

      {/* 좌석 그리드 */}
      <div className="grid grid-cols-2 gap-12 pt-2">
        <div className="grid grid-cols-3 gap-2 gap-y-8">
          {SEAT_MAP.filter((s) =>
            [1, 2, 3, 7, 8, 9, 13, 14, 15, 19, 20, 21, 25, 26, 27].includes(
              s.num
            )
          ).map(renderTile)}
        </div>
        <div className="grid grid-cols-3 gap-2 gap-y-8">
          {SEAT_MAP.filter((s) =>
            [4, 5, 6, 10, 11, 12, 16, 17, 18, 22, 23, 24, 28, 29, 30].includes(
              s.num
            )
          ).map(renderTile)}
        </div>
      </div>
    </div>
  );

  function renderTile(tile: any) {
    if (tile.type === "restricted" || tile.type === "thinking") {
      return (
        <div
          key={tile.num}
          className="bg-slate-100 border-2 border-slate-300 text-slate-400 rounded-xl p-2.5 text-center flex flex-col justify-between h-20"
        >
          <span className="text-[10px] font-mono">{tile.num}</span>
          <span className="text-xs font-bold text-slate-500">{tile.name}</span>
        </div>
      );
    }

    const seatInfo = getSeatInfo(tile.code);
    const isOccupied = !!seatInfo?.current_group_name;

    // 내 그룹 소속 구역인지 체크
    const isMyGroup =
      isOccupied &&
      (seatInfo?.current_group_id === myGroupId ||
        seatInfo?.member_left === currentUserName ||
        seatInfo?.member_right === currentUserName);

    // 💡 내 그룹이면 원래 구역 색상의 '진한 톤(MY_CODE_COLORS)', 아니면 '연한 톤(CODE_COLORS)' 적용
    const colorClass = isMyGroup
      ? MY_CODE_COLORS[tile.code] ||
        "bg-indigo-600 text-white ring-4 ring-indigo-300"
      : CODE_COLORS[tile.code] || "bg-slate-50 border-slate-200";

    const personName =
      tile.pos === "L" ? seatInfo?.member_left : seatInfo?.member_right;

    const canSwap =
      isAdmin ||
      (isOccupied &&
        (currentUserName === seatInfo?.member_left ||
          currentUserName === seatInfo?.member_right));

    return (
      <div
        key={tile.num}
        onClick={() => handleSeatClick(tile.code)}
        className={`border-2 rounded-xl p-2 py-1 flex flex-col justify-between h-20 cursor-pointer transition-all relative z-0 ${
          isMyGroup ? "z-10 scale-[1.03]" : ""
        } ${colorClass}`}
      >
        <div className="flex justify-between items-start w-full">
          <span
            className={`text-[10px] font-mono font-bold ${
              isMyGroup ? "opacity-80" : "opacity-60"
            }`}
          >
            {tile.num}
          </span>
          <span
            className={`text-xs font-extrabold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
              isMyGroup
                ? "bg-black/20 text-white backdrop-blur-sm"
                : "bg-white/80 text-slate-800"
            }`}
          >
            {isMyGroup && (
              <Star className="w-3 h-3 text-amber-300 fill-amber-300 animate-pulse" />
            )}
            {tile.code}
          </span>
        </div>

        {/* 사용자 이름 표시 영역 */}
        <div className="my-auto text-center">
          {isOccupied ? (
            <p className="font-extrabold text-sm truncate">
              {personName || "배치 중"}
            </p>
          ) : (
            <span
              className={`text-[10px] font-semibold ${
                isMyGroup ? "text-white/70" : "text-slate-400"
              }`}
            >
              빈 자 리
            </span>
          )}
        </div>

        {/* 하단 가격 & 스위치 버튼 */}
        <div className="flex justify-between items-end text-[10px]">
          <span className="font-bold font-mono">
            {seatInfo?.current_bid_price
              ? `${seatInfo.current_bid_price.toLocaleString()}원`
              : "0원"}
          </span>

          {/* 스위치 (<->) 버튼 */}
          {canSwap && seatInfo && (
            <button
              onClick={(e) => handleSwapClick(e, seatInfo.id)}
              className={`p-1 rounded-md border transition-colors ${
                isMyGroup
                  ? "bg-black/20 hover:bg-black/30 border-white/30 text-white"
                  : "bg-white hover:bg-slate-100 border-slate-300 text-slate-700"
              }`}
              title="좌/우 자리 교환"
            >
              <ArrowLeftRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    );
  }
}
