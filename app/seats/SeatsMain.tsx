'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { getSeatRounds } from './actions';
import ClassroomGrid from './ClassroomGrid';
import AdminControlPanel from './AdminControlPanel';
import { createClient } from '@/utils/supabase/client';
import {
	Armchair,
	PlusCircle,
	Users,
	MapPin,
	Coins,
	CheckCircle2,
	Clock,
	ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import AllocationAddModal from './AllocationAddModal';

export default function SeatsMain({ classId }: { classId: string }) {
	const supabase = useMemo(() => createClient(), []);

	const [rounds, setRounds] = useState<any[]>([]);
	const [selectedRound, setSelectedRound] = useState<any | null>(null);
	const [groups, setGroups] = useState<any[]>([]); // 💡 생성된 그룹 짝 목록

	// 모달 상태
	const [isModalOpen, setIsModalOpen] = useState(false);

	// 로그인 사용자 정보
	const [currentUser, setCurrentUser] = useState({ name: '', isAdmin: false });
	useEffect(() => {
		loadData();
		fetchCurrentUser();
		// 💡 Supabase Realtime 구독 설정
		const channel = supabase
			.channel('realtime-seats')
			.on(
				'postgres_changes',
				{
					event: 'UPDATE',
					schema: 'public',
					table: 'seat_allocations',
					filter: `class_id=eq.${classId}`,
				},
				(payload) => {
					const updatedSeat = payload.new;
					const currentCode = myOccupiedCodeRef.current;
					const currentGroupId = myGroupIdRef.current;

					// 내가 선점 중이던 자리를 다른 팀이 뺏어간 경우 알림
					if (
						currentCode &&
						updatedSeat.seat_code === currentCode &&
						updatedSeat.current_group_id !== currentGroupId &&
						updatedSeat.current_group_id !== null &&
						updatedSeat.round_number === selectedRound?.roundNumber
					) {
						alert(
							`⚠️ [경고] ${updatedSeat.seat_code}구역 자리를 다른 팀이 상향 입찰하여 뺏어갔습니다!`,
						);
					}

					loadData();
				},
			)
			.subscribe();

		// 컴포넌트 언마운트 시 구독 해제 (메모리 누수 방지)
		return () => {
			supabase.removeChannel(channel);
		};
	}, []);
	// 💡 1. 현재 로그인한 유저 프로필 및 Admin 권한 조회
	async function fetchCurrentUser() {
		try {
			const {
				data: { user },
			} = await supabase.auth.getUser();

			if (!user) return;

			// profiles 테이블에서 name과 role 조회
			const { data: profile } = await supabase
				.from('profiles')
				.select('name, role')
				.eq('id', user.id)
				.single();

			if (profile) {
				setCurrentUser({
					name: profile.name,
					isAdmin:
						profile.role === 'super_admin' || profile.role === 'class_admin',
				});
			}
		} catch (err) {
			console.error('유저 정보 조회 실패:', err);
		}
	}

	async function loadData() {
		try {
			const data = await getSeatRounds(classId);
			setRounds(data);
			if (
				data.filter((r) => r.roundNumber === selectedRound?.roundNumber)
					.length === 0 ||
				(!selectedRound && data.length > 0)
			) {
				setSelectedRound((prevSelected: any) => {
					// 1. 이미 선택된 회차가 있다면, DB에서 새로 받아온 data 중 같은 회차(roundNumber)를 찾아 최신 상태로 업데이트
					if (prevSelected) {
						const matchedRound = data.find(
							(r) => r.roundNumber === prevSelected.roundNumber,
						);
						return matchedRound || data[0]; // 혹시 삭제되었으면 1회차로
					}

					return data[0];
				});
			}
		} catch (err: any) {
			console.error('데이터 로드 에러:', err);
		}
	}

	// 신규 배정 모달 열기
	const handleOpenCreateModal = () => {
		setIsModalOpen(true);
	};

	const myOccupiedCodeRef = useRef<string | null>(null);
	const myGroupIdRef = useRef<string>('');

	// 1. 현재 회차의 영구 저장된 전체 짝 목록 (initial_groups)
	const currentGroups = selectedRound?.groups || [];

	// 💡 2. 동명이인이 없으므로 currentGroups에서 내 이름(currentUser.name)이 속한 짝 찾기
	const myMatchedGroup = currentGroups.find(
		(g: any) => g.m1 === currentUser.name || g.m2 === currentUser.name,
	);

	// 내 그룹 ID 및 그룹명 (예: groupId: "GROUP_1", groupName: "정인호, 김철수")
	const myGroupId = myMatchedGroup?.groupId || '';
	const myGroupName = myMatchedGroup?.groupName || currentUser.name;

	// 3. 내가 속한 그룹이 현재 선점하고 있는 구역(A~M) 및 입찰가 정보 검색
	const myOccupiedSeat = selectedRound?.seats?.find(
		(s: any) => s.current_group_id === myGroupId && myGroupId !== '',
	);
	const myOccupiedCode = myOccupiedSeat?.seat_code || null;
	const myCurrentBidPrice = myOccupiedSeat?.current_bid_price || 0;
	useEffect(() => {
		myOccupiedCodeRef.current = myOccupiedCode;
		myGroupIdRef.current = myGroupId;
	}, [myOccupiedCode, myGroupId]);
	return (
		<main className="min-h-screen bg-slate-50 p-6 md:p-6">
			<div className="max-w-6xl mx-auto space-y-6">
				{/* 1. 상단 헤더 */}
				<div className="flex flex-col sm:flex-row sm:items-center gap-4">
					<Link
						href="/"
						className="flex items-center -ml-15 mr-2.5 gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors mb-2 py-2"
					>
						<ArrowLeft className="w-4 h-4" /> 홈
					</Link>
					<div>
						<h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
							<Armchair className="w-7 h-7 text-indigo-600" />
							자리 배정 경매
						</h1>
						<p className="text-xs text-slate-500 mt-1">
							2주 단위 자리 배정 및 선착순/경매 구역(A~M) 입찰 시스템
						</p>
					</div>

					{currentUser.isAdmin && (
						<button
							onClick={handleOpenCreateModal}
							className="flex items-center ml-auto gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all self-start sm:self-auto"
						>
							<PlusCircle className="w-4 h-4" />새 자리 배정 시작
						</button>
					)}
				</div>

				{/* 2. 회차 선택 탭 */}
				<div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
					{rounds.map((r) => (
						<button
							key={r.roundNumber}
							onClick={() => setSelectedRound(r)}
							className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
								selectedRound?.roundNumber === r.roundNumber
									? 'bg-slate-900 text-white shadow-sm'
									: 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
							}`}
						>
							{r.title} ({r.isClosed ? '마감됨' : '진행중'})
						</button>
					))}
				</div>

				{/* 3. 내 그룹 및 선점 위치 요약 카드 */}

				{/* 4. 어드민 제어 패널 */}
				{currentUser.isAdmin && selectedRound && (
					<AdminControlPanel
						roundNumber={selectedRound.roundNumber}
						isClosed={selectedRound.isClosed}
						loadData={loadData}
						classId={classId}
					/>
				)}

				{/* 💡 5. [메인 2열 레이아웃] 좌측: 배치도 / 우측: 전체 그룹 현황 */}
				{selectedRound ? (
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
						{/* 좌측 (2열 차지): 배치도 */}
						<div className="lg:col-span-2">
							<ClassroomGrid
								roundNumber={selectedRound.roundNumber}
								seatList={selectedRound.seats}
								myGroupId={myGroupId}
								myGroupName={myGroupName}
								currentUserName={currentUser.name}
								isAdmin={currentUser.isAdmin}
								loadData={loadData}
								classId={classId}
							/>
						</div>

						{/* 💡 우측 (1열 차지): 전체 2인 짝 그룹 현황 리스트 */}
						<div className="space-y-3">
							{/* 내 소속 짝 카드 */}
							<div className="bg-linear-to-br from-indigo-500 to-indigo-600 text-white px-5 py-3 rounded-2xl shadow-md flex items-center justify-between">
								<div className="space-y-1">
									<span className="text-[10px] font-bold bg-white/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
										MY PAIR
									</span>
									<h3 className="text-xl font-black">{myGroupName}</h3>
									<p className="text-indigo-100 text-xs">
										본인:{' '}
										<span className="font-bold underline">
											{currentUser.name}
										</span>
									</p>
								</div>
								<div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
									<Users className="w-6 h-6 text-indigo-100" />
								</div>
							</div>

							{/* 현재 선점 위치 카드 */}
							<div
								className={`px-5 py-3 rounded-2xl shadow-md flex items-center justify-between border  ${
									myOccupiedCode
										? 'bg-linear-to-br from-amber-500 to-orange-600 text-white border-amber-400'
										: 'bg-white text-slate-800 border-slate-200'
								}`}
							>
								<div className="space-y-1">
									<span
										className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
											myOccupiedCode
												? 'bg-white/20 text-white'
												: 'bg-slate-100 text-slate-500'
										}`}
									>
										CURRENT SEAT
									</span>
									<h3 className="text-xl font-black flex items-center gap-2">
										{myOccupiedCode ? (
											<>
												<span>{myOccupiedCode} 구역 선점 중</span>
												<span className="text-xs font-normal bg-black/20 px-2 py-0.5 rounded-lg flex items-center gap-1">
													<Coins className="w-3 h-3 text-amber-200" />
													{myCurrentBidPrice.toLocaleString()}원
												</span>
											</>
										) : (
											<span className="text-slate-400">
												선점한 자리가 없습니다
											</span>
										)}
									</h3>
									<p
										className={`text-xs ${
											myOccupiedCode ? 'text-amber-100' : 'text-slate-400'
										}`}
									>
										{myCurrentBidPrice > 0
											? '낙찰 예정이므로 다른 구역 입찰이 불가합니다.'
											: myOccupiedCode
												? '빈 자리 클릭시 0원으로 자유 이동 가능합니다.'
												: '빈 자리를 눌러 0원으로 빠르게 선점하세요!'}
									</p>
								</div>
								<div
									className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
										myOccupiedCode
											? 'bg-white/10'
											: 'bg-slate-100 text-slate-400'
									}`}
								>
									<MapPin className="w-6 h-6" />
								</div>
							</div>
							<div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
								<div className="flex items-center justify-between border-b border-slate-100 pb-3">
									<h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
										<Users className="w-4 h-4 text-indigo-600" />
										전체 짝 목록 ({groups.length > 0 ? groups.length : 13})
									</h3>
								</div>

								<div className="space-y-2 max-h-85.5 overflow-y-auto pr-1">
									{/* 우측 짝 카드 리스트 내부 */}
									{currentGroups.map((g: any, idx: number) => {
										const occupiedSeat = selectedRound.seats.find(
											(s: any) => s.current_group_id === g.groupId,
										);

										return (
											<div
												key={g.groupId || idx}
												// 💡 드래그 가능 속성 및 드래그 시작 시 groupId 저장
												draggable={!selectedRound.isClosed}
												onDragStart={(e) => {
													e.dataTransfer.setData('text/plain', g.groupId);
													e.dataTransfer.setData(
														'groupName',
														g.groupName || `${g.m1}, ${g.m2}`,
													);
													e.dataTransfer.effectAllowed = 'move';
												}}
												className={`p-3 rounded-2xl border text-xs flex items-center min-h-12.25 justify-between transition-all cursor-grab active:cursor-grabbing ${
													occupiedSeat
														? 'bg-slate-50 border-slate-200'
														: 'bg-amber-50/50 border-amber-200/60'
												}`}
											>
												<div>
													<p className="font-bold text-slate-800">
														{g.m1} • {g.m2}
													</p>
												</div>

												{occupiedSeat ? (
													<span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2 py-1 rounded-lg font-extrabold text-[11px]">
														<CheckCircle2 className="w-3 h-3" />
														{occupiedSeat.seat_code} 구역
													</span>
												) : (
													<span className="inline-flex items-center gap-1 bg-rose-100 text-rose-700 px-2 py-1 rounded-lg font-bold text-[10px]">
														<Clock className="w-3 h-3" /> 미배정
													</span>
												)}
											</div>
										);
									})}
								</div>
							</div>
						</div>
					</div>
				) : (
					<div className="bg-white p-12 rounded-3xl text-center text-slate-400 text-xs border border-dashed border-slate-200">
						진행 중인 자리 배정이 없습니다. [새 자리 배정 시작] 버튼을
						눌러주세요.
					</div>
				)}

				{/* 신규 자리 배정 생성 모달 */}
				{isModalOpen && (
					<AllocationAddModal
						onClose={() => setIsModalOpen(false)}
						rounds={rounds}
						setGroups={setGroups}
						loadData={loadData}
						classId={classId}
					/>
				)}
			</div>
		</main>
	);
}
