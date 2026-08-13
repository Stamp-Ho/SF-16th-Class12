'use client';

import { useState, useEffect } from 'react';
import { acceptFate } from './actions';
import { Dices, Sparkles } from 'lucide-react';

interface GambleModalProps {
  seatId: string;
  seatPrice: number;
  onClose: () => void;
}

export default function GambleModal({ seatId, seatPrice, onClose }: GambleModalProps) {
  const [isSpinning, setIsSpinning] = useState(true);
  const [result, setResult] = useState<"loss" | "win" | null>(null);

  const [targetRotation, setTargetRotation] = useState(0);
  const [reelItems, setReelItems] = useState<string[]>([]);

  useEffect(() => {
    let isMounted = true;

    const isWin = Math.random() < 0.2;
    const finalResult = isWin ? "win" : "loss";
    const targetSymbol = isWin ? "+2,500" : "-500";

    const totalSlots = 12;
    const items = Array.from({ length: totalSlots }, (_, i) =>
      i % 3 === 0 ? "+2,500" : "-500"
    );
    
    items[0] = targetSymbol;
    setReelItems(items);

    const totalRounds = 5; 
    const finalAngle = totalRounds * 360;

    const spinTimer = setTimeout(() => {
      if (!isMounted) return;
      setTargetRotation(finalAngle);
    }, 100);

    const stopTimer = setTimeout(() => {
      if (!isMounted) return;
      setIsSpinning(false);
      setResult(finalResult);

      setTimeout(() => {
        if (!isMounted) return;
        acceptFate(seatId, isWin ? seatPrice + 2500 : seatPrice - 500);
        onClose();
      }, 1000);
    }, 5200);

    return () => {
      isMounted = false;
      clearTimeout(spinTimer);
      clearTimeout(stopTimer);
    };
  }, [seatId, onClose]);

  const getThemeColor = () => {
    if (isSpinning) return "text-yellow-400 border-yellow-500/50";
    return result === "loss"
      ? "text-emerald-400 border-emerald-500 bg-emerald-950/20 shadow-emerald-500/20"
      : "text-rose-500 border-rose-500 bg-rose-950/20 shadow-rose-500/20";
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl w-full max-w-sm shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-2 mb-6">
          <Dices className="w-6 h-6 text-yellow-400 animate-bounce" />
          <h2 className="text-xl font-black text-white">행운 노리기</h2>
        </div>

        {/* 🎰 3D 원통 슬롯 전광판 (높이 h-20 -> h-28로 확대) */}
        <div
          className={`w-full h-28 bg-slate-950 border-2 rounded-2xl my-2 shadow-inner relative overflow-hidden flex items-center justify-center transition-all duration-300 ${getThemeColor()}`}
        >
          {/* 입체감 상하 섀도우 */}
          <div className="absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-slate-950 via-slate-950/80 to-transparent z-20 pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent z-20 pointer-events-none" />

          {/* 🎡 3D 회전 원통 영역 */}
          <div className="h-full w-full relative [perspective:500px] flex items-center justify-center">
            <div
              className="w-full h-full absolute [transform-style:preserve-3d] will-change-transform"
              style={{
                transform: `rotateX(-${targetRotation}deg)`,
                transitionProperty: "transform",
                transitionDuration: isSpinning ? "5000ms" : "0ms",
                transitionTimingFunction: "cubic-bezier(0.15, 0.85, 0.35, 0.96)",
              }}
            >
              {reelItems.map((symbol, idx) => {
                const angle = (360 / reelItems.length) * idx;
                return (
                  <div
                    key={idx}
                    className="absolute inset-0 flex items-center justify-center text-3xl font-black [backface-visibility:hidden]"
                    style={{
                      /* 💡 translateZ(48px) -> translateZ(80px) 로 변경하여 위아래 간격을 넓힘 */
                      transform: `rotateX(${angle}deg) translateZ(80px)`,
                    }}
                  >
                    {symbol}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 h-6 flex items-center justify-center">
          {isSpinning ? (
            <p className="text-sm font-medium text-slate-400 animate-pulse">
              빙글빙글... 운명을 결정하는 중!
            </p>
          ) : result === "loss" ? (
            <p className="text-md font-extrabold text-emerald-400 flex items-center gap-1 animate-in slide-in-from-bottom-2">
              <Sparkles className="w-4 h-4" /> 축하합니다! (-500)
            </p>
          ) : (
            <p className="text-md font-extrabold text-rose-500 flex items-center gap-1 animate-in slide-in-from-bottom-2">
              <Sparkles className="w-4 h-4" /> 고맙습니다! (+2,500)
            </p>
          )}
        </div>
      </div>
    </div>
  );
}