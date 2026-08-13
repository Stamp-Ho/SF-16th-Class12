"use client";

import { useState, useEffect } from "react";
import { createNewSeatRound } from "./actions";
import { createClient } from "@/utils/supabase/client";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Hash,
  RotateCcw,
  Edit3,
  Trash2,
  GripVertical
} from "lucide-react";
import { LayoutGroup, motion } from "framer-motion";
import ImportShuffleModal from "./ImportShuffleMdoal"; 
import { generateRingOrder, generateReverseRingOrder } from "./utils/order";
import { getTargetUsers } from "../shuffle/actions";

interface AllocationAddModalProps {
  onClose: () => void;
  rounds: any[];
  loadData: () => Promise<void>;
  classId: string;
}

// const ringOrder = [
//   0, 2, 4, 1, 6, 3, 8, 5, 10, 7, 12, 9, 14, 11, 16, 13, 18, 15, 20, 17, 22, 19,
//   24, 21, 25, 23
// ];

// const reverseRingOrder = [
//   0, 3, 1, 5, 2, 7, 4, 9, 6, 11, 8, 13, 10, 15, 12, 17, 14, 19, 16, 21, 18, 23,
//   20, 25, 22, 24
// ];

const dateList = [
  "07.20 ~ 07.31",
  "08.03 ~ 08.14",
  "08.17 ~ 08.28",
  "08.31 ~ 09.11",
  "09.14 ~ 09.25",
  "09.28 ~ 10.09",
  "10.12 ~ 10.23",
  "10.26 ~ 11.06",
  "11.09 ~ 11.20",
  "11.23 ~ 12.04",
  "12.07 ~ 12.18",
  "12.21 ~ 01.01"
];

export default function AllocationAddModal({
  onClose,
  rounds,
  loadData,
  classId
}: AllocationAddModalProps) {
  const initialNextRound = rounds.length + 1;
  const [targetRound, setTargetRound] = useState<number>(initialNextRound);
  const [roundTitle, setRoundTitle] = useState(
    `${targetRound}회차 (${dateList[targetRound - 1] || "2주 배정"})`
  );
  const [isCreating, setIsCreating] = useState(false);
  const [isLoadingLast, setIsLoadingLast] = useState(false);

  const [firstOrder, setFirstOrder] = useState<string[]>([]); // 첫 회차 순서 저장
  // 💡 1차원 배정 배열 관리 (커스텀 드래그/삭제용)
  const [flatMembers, setFlatMembers] = useState<
    { name: string; status: boolean }[]
  >(() => firstOrder.flat().map((name) => ({ name, status: true })));

  useEffect(() => {
    const getProfiles = async () => {
      const profiles = await getTargetUsers(classId);
      if (profiles.length % 2 == 1)
        profiles.push({ name: "빈자리", id: "empty", role: "user" });
      setFlatMembers(
        profiles.map((p) => ({
          name: p.name,
          status: p.name == "빈자리" ? false : true
        }))
      );
      setFirstOrder(profiles.map((p) => p?.name));

      setRingOrder(generateRingOrder(profiles.length));
      console.log(generateRingOrder(profiles.length));
      setReverseRingOrder(generateReverseRingOrder(profiles.length));
    };
    getProfiles();
  }, []);

  // 💡 커스텀 편집 모드 토글
  const [isCustomMode, setIsCustomMode] = useState(false);
  // 드래그 중인 인덱스
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const [isSelectShuffleModalOpen, setIsSelectShuffleModalOpen] =
    useState(false);
  const [drawHistory, setDrawHistory] = useState<any>(null);

  useEffect(() => {
    console.log(drawHistory);
    if (drawHistory && drawHistory.result_data.length > 0) {
      setFlatMembers(
        drawHistory.result_data.map((d: { name: string; order: number }) => ({
          name: d.name,
          status: d.name == "빈자리" ? false : true
        }))
      );
    }
  }, [drawHistory]);
  // 💡 기본 1회차 순서 (별도의 수정이 없다면 이름 순서)

  const [ringOrder, setRingOrder] = useState<number[]>(
    generateRingOrder(firstOrder.length)
  );
  const [reverseRingOrder, setReverseRingOrder] = useState<number[]>(
    generateReverseRingOrder(firstOrder.length)
  );

  useEffect(() => {
    if (flatMembers.length % 2 === 1) {
      setFlatMembers((prev) => [...prev, { name: "빈자리", status: false }]);
    }

    setRingOrder(generateRingOrder(flatMembers.length));
    setReverseRingOrder(generateReverseRingOrder(flatMembers.length));
  }, [flatMembers]);

  function rotateOrder(baseList: string[], rotateRight: boolean): string[] {
    const n = baseList.length;
    const result: string[] = [];

    for (let i = 0; i < n; i++) {
      result.push(baseList[rotateRight ? ringOrder[i] : reverseRingOrder[i]]);
    }
    return result;
  }

  function generateCustomShiftPairs(baseList: string[], rotateRight: boolean) {
    const fullList = rotateOrder(baseList, rotateRight);
    const pairs: [string, string][] = [];

    for (let i = 0; i < fullList.length; i += 2) {
      pairs.push([fullList[i] || "빈자리", fullList[i + 1] || "빈자리"]);
    }

    return pairs;
  }

  const handleRoundChange = (newRound: number) => {
    setTargetRound(newRound);
    setRoundTitle(`${newRound}회차 (${dateList[newRound - 1] || "2주 배정"})`);
  };
  // 회차 변경시 자동 링 회전 목록 업데이트 (커스텀 모드가 아닐 때만)
  const handleRotateRight = (rotateRight: boolean) => {
    const newRound = targetRound + (rotateRight ? 1 : -1);
    // 1. 마지막 경매 이전 회차로는 이동 불가
    if (!rotateRight && targetRound <= initialNextRound) {
      alert("마지막 경매 회차보다 이전 회차로는 이동할 수 없습니다.");
      return;
    }
    // 커스텀 모드일 때의 1회만 이동 가능
    if (isCustomMode) {
      if (newRound > initialNextRound + 1) {
        alert("커스텀 편집 모드에서는 다음 회차로 1회만 이동 가능합니다.");
        return;
      }
    }

    setTargetRound(newRound);
    setRoundTitle(`${newRound}회차 (${dateList[newRound - 1] || "2주 배정"})`);

    // 링 계산 반영
    const newPairs = generateCustomShiftPairs(
      flatMembers.map(({ name }) => name),
      rotateRight
    );
    setFlatMembers(
      newPairs
        .flat()
        .map((name) => ({ name, status: name === "빈자리" ? false : true }))
    );
  };

  // 💡 1. DB에서 가장 높은 회차 데이터 불러오기
  const handleLoadLastRoundFromDB = async () => {
    setIsLoadingLast(true);
    try {
      const supabase = createClient();
      // seat_allocations 테이블에서 가장 최신/높은 round_number 구하기
      const { data, error } = await supabase
        .from("seat_allocations")
        .select("round_number, current_group_id, initial_groups")
        .order("round_number", { ascending: false })
        .limit(30);

      if (error) throw error;

      if (!data || data.length === 0) {
        alert("저장된 지난 회차 배정 데이터가 없습니다.");
        return;
      }
      const latestRoundNum = data[0].round_number;
      const latestRoundSeats = data[0].initial_groups.reduce(
        (acc: string[], group: { m1?: string; m2?: string }) => {
          if (group.m1) acc.push(group.m1);
          if (group.m2) acc.push(group.m2);
          return acc;
        },
        [] as string[]
      );
      setFirstOrder(latestRoundSeats.map((name: string) => name));

      if (latestRoundSeats.length > 0) {
        setFlatMembers(
          latestRoundSeats.map((name: string) => ({
            name,
            status: name === "빈자리" ? false : true
          }))
        );
        setIsCustomMode(true); // 불러온 후 커스텀 모드로 전환
        setTargetRound(latestRoundNum);
        setRoundTitle(
          `${latestRoundNum}회차 (${dateList[latestRoundNum - 1] || "2주 배정"})`
        );
        alert(`최신(${latestRoundNum}회차) 데이터를 성공적으로 불러왔습니다!`);
      }
    } catch (err: any) {
      alert(`불러오기 실패: ${err.message}`);
    } finally {
      setIsLoadingLast(false);
    }
  };

  // 💡 2. 삭제 처리 (빈자리로 변경)
  const handleRemoveMember = (indexToRemove: number) => {
    setFlatMembers((prev) =>
      prev.map((m, idx) =>
        idx === indexToRemove ? { name: m.name, status: false } : m
      )
    );
  };

  // 💡 3. 드래그 앤 드롭 순서 변경
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetIndex: number) => {
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const updated = [...flatMembers];

    // 두 위치의 원소를 서로 맞바꿈 (Swap)
    const temp = updated[draggedIndex];
    updated[draggedIndex] = updated[targetIndex];
    updated[targetIndex] = temp;

    setFlatMembers(updated);
    setDraggedIndex(null);
  };

  // 2차원 짝 리스트로 변환
  const currentPairs: [
    { name: string; status: boolean },
    { name: string; status: boolean }
  ][] = [];
  for (let i = 0; i < flatMembers.length; i += 2) {
    currentPairs.push([
      flatMembers[i] || { name: "빈자리", status: false },
      flatMembers[i + 1] || { name: "빈자리", status: false }
    ]);
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roundTitle) return;

    setIsCreating(true);
    try {
      const result = await createNewSeatRound(
        targetRound,
        roundTitle,
        flatMembers.map((m) => (m.status ? m.name : "")),
        classId
      );

      onClose();
      await loadData();
    } catch (err: any) {
      alert(`생성 실패: ${err.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-2xl p-6 space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between border-b pb-3 border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              새 자리 배정 생성
            </h3>
            <p className="text-xs text-indigo-600 font-medium">
              {isCustomMode
                ? "✏️ 사용자 커스텀 순서 편집 중"
                : "🔄 자동 링 순환 적용 중"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* 추첨 이력 불러오기 버튼 */}
            <button
              type="button"
              onClick={() => setIsSelectShuffleModalOpen(true)}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              title="이전 추첨 이력 불러오기"
            >
              <span>추첨 이력 불러오기</span>
            </button>
            {/* 마지막 회차 불러오기 버튼 */}
            <button
              type="button"
              onClick={handleLoadLastRoundFromDB}
              disabled={isLoadingLast}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              title="DB의 최신 회차 배정 불러오기"
            >
              {isLoadingLast ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
              ) : (
                <RotateCcw className="w-3.5 h-3.5 text-indigo-600" />
              )}
              <span>직전 회차 불러오기</span>
            </button>

            {/* 커스텀 토글 버튼 */}
            <button
              type="button"
              onClick={() => setIsCustomMode(!isCustomMode)}
              className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors ${
                isCustomMode
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isCustomMode ? "자동 링 적용" : "커스텀 수정"}</span>
            </button>
          </div>
        </div>

        <form
          onSubmit={handleCreateSubmit}
          className="space-y-4 flex-1 flex flex-col min-h-0"
        >
          {/* 회차 선택 컨트롤러 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                생성할 회차 선택
              </label>
              <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50 focus-within:ring-2 focus-within:ring-indigo-500">
                {/* 이전 회차 버튼: 커스텀 모드이거나 1회차일 때 disabled */}
                <button
                  type="button"
                  onClick={() => handleRotateRight(false)}
                  disabled={targetRound <= 1 || initialNextRound >= targetRound}
                  className="p-2.5 text-slate-600 hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                  title={
                    isCustomMode
                      ? "커스텀 모드에서는 이전 회차로 이동할 수 없습니다."
                      : ""
                  }
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex-1 flex items-center justify-center font-bold text-sm text-indigo-700">
                  <input
                    type="number"
                    min={1}
                    max={isCustomMode ? initialNextRound + 1 : undefined}
                    value={targetRound}
                    disabled={isCustomMode} // 커스텀 모드에서는 direct input 차단
                    onChange={(e) =>
                      handleRoundChange(Number(e.target.value) || 1)
                    }
                    className="w-12 text-center bg-transparent focus:outline-none font-bold disabled:opacity-80"
                  />
                  <span className="text-xs text-slate-500 -ml-1">회차</span>
                </div>

                {/* 다음 회차 버튼: 커스텀 모드이고 이미 1회 올라갔으면 disabled */}
                <button
                  type="button"
                  onClick={() => handleRotateRight(true)}
                  disabled={isCustomMode && targetRound >= initialNextRound + 1}
                  className="p-2.5 text-slate-600 hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                  title={
                    isCustomMode && targetRound >= initialNextRound + 1
                      ? "커스텀 모드에서는 다음 회차로 1회만 이동 가능합니다."
                      : ""
                  }
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                회차 제목
              </label>
              <input
                type="text"
                value={roundTitle}
                onChange={(e) => setRoundTitle(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          {/* 3컬럼 리스트 (드래그 & 삭제 커스텀 지원) */}
          <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 flex-1 flex flex-col min-h-0">
            {/* 헤더 */}
            <div className="grid grid-cols-12 text-[11px] font-bold text-slate-400 pb-2 border-b border-slate-200/60 px-2 text-center">
              <div className="col-span-2 flex items-center justify-center gap-1">
                <Hash className="w-3 h-3" /> 조
              </div>
              <div className="col-span-5">첫 번째 사람 (A)</div>
              <div className="col-span-5">두 번째 사람 (B)</div>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 pt-1 space-y-1.5">
              <LayoutGroup id="seat-allocation-group">
                {currentPairs.map(([p1, p2], pairIdx) => {
                  const idx1 = pairIdx * 2;
                  const idx2 = pairIdx * 2 + 1;

                  return (
                    <div
                      key={`pair-row-${pairIdx}`}
                      className="grid grid-cols-12 items-center text-xs gap-2 py-0.5 px-1"
                    >
                      {/* 1컬럼: 조 이름 */}
                      <div className="col-span-2 text-center">
                        <span className="font-mono text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full inline-block">
                          {pairIdx + 1}조
                        </span>
                      </div>

                      {/* 2컬럼: 첫 번째 사람 셀 */}
                      <div
                        className="col-span-5 flex items-center gap-1 relative group"
                        draggable={isCustomMode}
                        onDragStart={(e) => handleDragStart(e, idx1)}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(idx1)}
                      >
                        {isCustomMode && (
                          <GripVertical className="w-3.5 h-3.5 text-slate-300 cursor-grab active:cursor-grabbing shrink-0" />
                        )}
                        <div className="flex-1 relative">
                          <NameCard name={p1.name} status={p1.status} />
                          {isCustomMode && p1.status && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(idx1)}
                              className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                              title="삭제"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* 3컬럼: 두 번째 사람 셀 */}
                      <div
                        className="col-span-5 flex items-center gap-1 relative group"
                        draggable={isCustomMode}
                        onDragStart={(e) => handleDragStart(e, idx2)}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(idx2)}
                      >
                        {isCustomMode && (
                          <GripVertical className="w-3.5 h-3.5 text-slate-300 cursor-grab active:cursor-grabbing shrink-0" />
                        )}
                        <div className="flex-1 relative">
                          <NameCard name={p2.name} status={p2.status} />
                          {isCustomMode && p2.status && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(idx2)}
                              className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                              title="삭제"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </LayoutGroup>
            </div>
          </div>

          {/* 하단 버튼 */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="px-5 py-2 text-xs font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 flex items-center gap-1 shadow-md shadow-indigo-200"
            >
              {isCreating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {targetRound}회차 생성 및 적용
            </button>
          </div>
        </form>
        {isSelectShuffleModalOpen && (
          <ImportShuffleModal
            setDrawHistory={setDrawHistory}
            onClose={() => setIsSelectShuffleModalOpen(false)}
            classId={classId}
          />
        )}
      </div>
    </div>
  );
}

function NameCard({ name, status }: { name: string; status: boolean }) {
  const isBlank = !status || name === "빈자리";

  return (
    <motion.div
      layout="position"
      layoutId={`person-${name}`}
      key={`person-${name}`}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 26
      }}
      className={`w-full text-center font-bold py-1.5 rounded-lg text-xs shadow-sm transition-colors select-none ${
        isBlank
          ? "bg-slate-100 text-slate-400 border border-dashed border-slate-300"
          : "bg-white text-slate-800 border border-slate-200/90 hover:border-indigo-400"
      }`}
    >
      {status ? name : "빈자리"}
    </motion.div>
  );
}
