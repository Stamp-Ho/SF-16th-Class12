import { useState, useEffect } from 'react';
import { createNewSeatRound } from './actions';
import { Loader2, ChevronLeft, ChevronRight, Hash } from 'lucide-react';
import { LayoutGroup, motion } from 'framer-motion';

interface AllocationAddModalProps {
	onClose: () => void;
	rounds: any[];
	setGroups: (groups: any[]) => void;
	loadData: () => Promise<void>;
}

const firstOrder = [
	'이가은',
	'조동휘',
	'강정훈',
	'김태원',
	'차민수',
	'전승현',
	'박재윤',
	'김한나',
	'김태엽',
	'이상은',
	'정제영',
	'정인호',
	'장세정',
	'차은수',
	'이찬원',
	'이동원',
	'장익환',
	'이채원',
	'강명묵',
	'김민철',
	'박현도',
	'윤동현',
	'송강규',
	'박경진',
	'정승현',
	'장지현',
];

/**
 * 링 경로 인덱스 빌드: 0번 고정, 나머지는 지정 궤도 순서
 */
const ringOrder = [
	0, 2, 4, 1, 6, 3, 8, 5, 10, 7, 12, 9, 14, 11, 16, 13, 18, 15, 20, 17, 22, 19,
	24, 21, 25, 23,
];
function rotateOrder(baseList: string[], rotateTimes: number = 1): string[] {
	if (rotateTimes == 0) return baseList;
	const n = baseList.length;
	const result: string[] = [];

	for (let i = 0; i < n; i++) {
		result.push(baseList[ringOrder[i]]);
	}
	return rotateTimes > 0 ? rotateOrder(result, rotateTimes - 1) : result;
}

/**
 * 링 회전 후 짝 생성
 */
function generateCustomShiftPairs(baseList: string[], roundIndex: number) {
	const fullList = rotateOrder(baseList, roundIndex);
	const pairs: [string, string][] = [];

	for (let i = 0; i < fullList.length; i += 2) {
		pairs.push([fullList[i], fullList[i + 1]]);
	}

	return pairs;
}

/**
 * 💡 이름 셀 컴포넌트: layoutId와 layout 속성을 통해 위치 변경 시 이동 애니메이션 연출
 */
function NameCard({ name }: { name: string }) {
	return (
		<motion.div
			layout
			layoutId={`person-${name}`}
			transition={{
				type: 'spring',
				stiffness: 350,
				damping: 28,
			}}
			className="w-full text-center font-bold text-slate-800 bg-white border border-slate-200/90 rounded-lg py-1.5 shadow-sm hover:border-indigo-400 transition-colors"
		>
			{name}
		</motion.div>
	);
}
const dateList = [
	'07.20 ~ 07.31',
	'08.03 ~ 08.14',
	'08.17 ~ 08.28',
	'08.31 ~ 09.11',
	'09.14 ~ 09.25',
	'09.28 ~ 10.09',
	'10.12 ~ 10.23',
	'10.26 ~ 11.06',
	'11.09 ~ 11.20',
	'11.23 ~ 12.04',
	'12.07 ~ 12.18',
	'12.21 ~ 01.01',
];

export default function AllocationAddModal({
	onClose,
	rounds,
	setGroups,
	loadData,
}: AllocationAddModalProps) {
	const initialNextRound = rounds.length + 1;
	const [targetRound, setTargetRound] = useState<number>(initialNextRound);

	const [roundTitle, setRoundTitle] = useState(
		`${targetRound}회차 (${dateList[targetRound - 1]})`,
	);
	const [isCreating, setIsCreating] = useState(false);

	// 현재 선택된 회차 기준 짝 계산
	const previewPairs = generateCustomShiftPairs(firstOrder, targetRound - 1);

	const handleRoundChange = (newRound: number) => {
		if (newRound < 1) return;
		setTargetRound(newRound);
		setRoundTitle(`${newRound}회차 (${dateList[newRound - 1]})`);
	};

	const handleCreateSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!roundTitle) return;

		setIsCreating(true);
		try {
			const generatedOrder = previewPairs.flat();

			const result = await createNewSeatRound(
				targetRound,
				roundTitle,
				generatedOrder,
			);

			if (result?.groups) {
				setGroups(result.groups);
			}
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
			<div className="bg-white w-full max-w-xl rounded-2xl p-6 space-y-5 shadow-2xl max-h-[90vh] flex flex-col">
				{/* 모달 헤더 */}
				<div className="flex items-center justify-between border-b pb-3 border-slate-100">
					<div>
						<h3 className="text-lg font-bold text-slate-800">새 자리 배정</h3>
						<p className="text-xs text-indigo-600 font-medium">
							개별 애니메이션 이동 매핑 (마지막 생성: {rounds.length}회차)
						</p>
					</div>
					<span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full">
						총 {firstOrder.length}명 / 13개 조
					</span>
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
								<button
									type="button"
									onClick={() => handleRoundChange(targetRound - 1)}
									disabled={targetRound <= 1}
									className="p-2.5 text-slate-600 hover:bg-slate-200 disabled:opacity-30 transition-colors"
								>
									<ChevronLeft className="w-4 h-4" />
								</button>
								<div className="flex-1 flex items-center justify-center font-bold text-sm text-indigo-700">
									<input
										type="number"
										min={1}
										value={targetRound}
										onChange={(e) =>
											handleRoundChange(Number(e.target.value) || 1)
										}
										className="w-12 text-center bg-transparent focus:outline-none font-bold"
									/>
									<span className="text-xs text-slate-500 -ml-1">회차</span>
								</div>
								<button
									type="button"
									onClick={() => handleRoundChange(targetRound + 1)}
									className="p-2.5 text-slate-600 hover:bg-slate-200 transition-colors"
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

					{/* 3컬럼 리스트 (조 텍스트 고정, 개별 이름 애니메이션) */}
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
							{/* 💡 id를 고정값으로 지정하여 회차가 바뀌어도 레이아웃 변화를 추적하게 합니다 */}
							<LayoutGroup id="seat-allocation-group">
								{previewPairs.map(([p1, p2], idx) => (
									<div
										key={`group-row-${idx + 1}`}
										className="grid grid-cols-12 items-center text-xs gap-2 py-0.5 px-1"
									>
										{/* 1컬럼: 조 이름 (고정) */}
										<div className="col-span-2 text-center">
											<span className="font-mono text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full inline-block">
												{idx + 1}조
											</span>
										</div>

										{/* 2컬럼: 첫 번째 사람 컴포넌트 (key={p1} 추가) */}
										<div className="col-span-5 flex justify-center">
											<NameCard key={p1} name={p1} />
										</div>

										{/* 3컬럼: 두 번째 사람 컴포넌트 (key={p2} 추가) */}
										<div className="col-span-5 flex justify-center">
											<NameCard key={p2} name={p2} />
										</div>
									</div>
								))}
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
			</div>
		</div>
	);
}
