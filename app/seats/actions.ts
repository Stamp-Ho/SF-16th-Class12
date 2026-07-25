'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

// ==========================================
// 1. 과거 및 현재 자리 배정 회차 목록 전체 조회
// ==========================================
export async function getSeatRounds() {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from('seat_allocations')
		.select('*')
		.order('round_number', { ascending: false });

	if (error) {
		throw new Error(`자리 배정 데이터 조회 실패: ${error.message}`);
	}

	const roundsMap = new Map<number, any[]>();
	data.forEach((item) => {
		if (!roundsMap.has(item.round_number)) {
			roundsMap.set(item.round_number, []);
		}
		roundsMap.get(item.round_number)!.push(item);
	});

	return Array.from(roundsMap.entries()).map(([round, seats]) => {
		// 💡 회차 레코드 중 저장된 initial_groups 목록 추출
		const savedGroups = seats[0]?.initial_groups || [];

		return {
			roundNumber: round,
			title: seats[0]?.title || `${round}차시 자리 배정`,
			createdAt: seats[0]?.created_at,
			isClosed: seats.every((s) => s.is_closed),
			groups: savedGroups, // 💡 DB에서 영구 저장된 그룹 짝 목록 반환
			seats,
		};
	});
}

// ==========================================
// 2. 새 자리 배정 시작 (그룹명 대신 사람 이름 직접 매핑)
// ==========================================
export async function createNewSeatRound(
	roundNumber: number,
	title: string,
	generatedOrder: string[],
) {
	const supabase = await createClient();

	// 2명씩 짝 매핑
	const groups: {
		groupId: string;
		groupName: string; // 예: "홍길동, 김철수"
		m1: string;
		m2: string;
	}[] = [];

	for (let i = 0; i < generatedOrder.length; i += 2) {
		const groupNum = Math.floor(i / 2) + 1;
		const m1 = generatedOrder[i] || '';
		const m2 = generatedOrder[i + 1] || '';
		const combinedName = [m1, m2].filter(Boolean).join(', ');

		groups.push({
			groupId: `GROUP_${groupNum}`,
			groupName: combinedName,
			m1,
			m2,
		});
	}

	const seatCodes = [
		'A',
		'B',
		'C',
		'D',
		'E',
		'F',
		'G',
		'H',
		'I',
		'J',
		'K',
		'L',
		'M',
	];

	// 💡 initial_groups 컬럼에 생성된 groups JSONB 데이터를 함께 INSERT
	const insertPayload = seatCodes.map((code) => ({
		round_number: roundNumber,
		title,
		seat_code: code,
		current_bid_price: 0,
		current_group_id: null,
		current_group_name: null,
		member_left: null,
		member_right: null,
		is_closed: false,
		initial_groups: groups, // 💡 DB 영구 저장!
	}));

	const { error: insertError } = await supabase
		.from('seat_allocations')
		.insert(insertPayload);

	if (insertError) {
		throw new Error(`새 자리 배정 회차 생성 실패: ${insertError.message}`);
	}

	revalidatePath('/seats');
	return { success: true, groups };
}

// ==========================================
// 3. 구역 선점 및 입찰 실행 (1그룹 1좌석 제약)
// ==========================================
export async function placeOrMoveSeatBid(
	roundNumber: number,
	targetSeatCode: string,
	myGroupId: string,
	myGroupName: string,
) {
	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) throw new Error('로그인이 필요합니다.');

	const { data: seats, error: fetchError } = await supabase
		.from('seat_allocations')
		.select('*')
		.eq('round_number', roundNumber);

	if (fetchError || !seats) throw new Error('좌석 정보를 불러올 수 없습니다.');

	const targetSeat = seats.find((s) => s.seat_code === targetSeatCode);
	if (!targetSeat) throw new Error('대상 구역을 찾을 수 없습니다.');
	if (targetSeat.is_closed) throw new Error('마감된 경매 구역입니다.');

	const currentMySeat = seats.find((s) => s.current_group_id === myGroupId);

	if (currentMySeat?.seat_code === targetSeatCode) {
		return { success: true, message: '이미 선점하고 있는 구역입니다.' };
	}

	// 다른 자리로 이동하려는 경우
	if (currentMySeat) {
		if (currentMySeat.current_bid_price === 0) {
			// 기존 선점 구역 초기화 (반납)
			await supabase
				.from('seat_allocations')
				.update({
					current_group_id: null,
					current_group_name: null,
					member_left: null,
					member_right: null,
					current_bidder_id: null,
					current_bid_price: 0,
				})
				.eq('id', currentMySeat.id);
		} else {
			throw new Error(
				'현재 선점 중인 자리를 낙찰받을 예정입니다.\n다른 구역에 입찰할 수 없습니다.',
			);
		}
	}

	const nextPrice =
		targetSeat.current_bid_price === 0 && !targetSeat.current_group_id
			? 0
			: targetSeat.current_bid_price + 500;

	// 이름 추출
	const names = myGroupName.split(',').map((n) => n.trim());

	const { error: updateError } = await supabase
		.from('seat_allocations')
		.update({
			current_group_id: myGroupId,
			current_group_name: myGroupName,
			member_left: names[0] || null,
			member_right: names[1] || null,
			current_bidder_id: user.id,
			current_bid_price: nextPrice,
			updated_at: new Date().toISOString(),
		})
		.eq('id', targetSeat.id);

	if (updateError) throw new Error(updateError.message);

	revalidatePath('/seats');
	return { success: true };
}

// ==========================================
// 4. 구역 내 2명 좌/우 위치 스위치 (<->)
// ==========================================
export async function swapSeatPositions(seatId: string) {
	const supabase = await createClient();

	const { data: seat, error: fetchError } = await supabase
		.from('seat_allocations')
		.select('member_left, member_right')
		.eq('id', seatId)
		.single();

	if (fetchError || !seat) throw new Error('좌석 정보를 찾을 수 없습니다.');

	const { error } = await supabase
		.from('seat_allocations')
		.update({
			member_left: seat.member_right,
			member_right: seat.member_left,
		})
		.eq('id', seatId);

	if (error) throw new Error(`위치 스위치 실패: ${error.message}`);

	revalidatePath('/seats');
	return { success: true };
}

// ==========================================
// 5. Admin 전용: 경매 상태 수동 종료 / 재개
// ==========================================
export async function toggleAuctionStatus(
	roundNumber: number,
	isClosed: boolean,
) {
	const supabase = await createClient();

	const { error } = await supabase
		.from('seat_allocations')
		.update({ is_closed: isClosed })
		.eq('round_number', roundNumber);

	if (error) throw new Error(`경매 상태 변경 실패: ${error.message}`);

	revalidatePath('/seats');
	return { success: true };
}
// ==========================================
// 6. Admin 전용: 미배정 그룹 빈 구역에 무작위 일괄 배치
// ==========================================
export async function assignUnallocatedGroupsRandomly(roundNumber: number) {
	const supabase = await createClient();

	// 1. 해당 회차의 전체 좌석 데이터 조회
	const { data: seats, error } = await supabase
		.from('seat_allocations')
		.select('*')
		.eq('round_number', roundNumber);

	if (error || !seats || seats.length === 0) {
		throw new Error('좌석 데이터를 가져올 수 없습니다.');
	}

	// 2. 저장되어 있는 initial_groups 추출 (첫 번째 좌석 레코드에서 가져옴)
	const initialGroups = (seats[0]?.initial_groups || []) as {
		groupId: string;
		groupName: string;
		m1: string;
		m2: string;
	}[];
	console.log(initialGroups);

	if (initialGroups.length === 0) {
		throw new Error('해당 회차에 등록된 그룹 짝 정보가 없습니다.');
	}

	// 3. 이미 자리를 점유하고 있는 그룹 ID Set 생성
	const allocatedGroupIds = new Set(
		seats.filter((s) => s.current_group_id).map((s) => s.current_group_id),
	);

	// 4. 아직 자리를 못 잡은 미배정 그룹 추출
	const unallocatedGroups = initialGroups.filter(
		(g) => !allocatedGroupIds.has(g.groupId),
	);

	if (unallocatedGroups.length === 0) {
		return { success: true, message: '이미 모든 그룹이 자리를 선점했습니다.' };
	}

	// 5. 비어있는 구역(A~M) 추출 및 무작위 셔플 (Fisher-Yates)
	const emptySeats = seats.filter((s) => !s.current_group_id);
	const shuffledEmptySeats = [...emptySeats].sort(() => Math.random() - 0.5);

	if (emptySeats.length < unallocatedGroups.length) {
		throw new Error('남은 빈 구역의 수보다 미배정 그룹이 더 많습니다.');
	}

	// 6. Promise.all을 활용한 비동기 병렬 배치 실행
	const updatePromises = unallocatedGroups.map((group, index) => {
		const targetSeat = shuffledEmptySeats[index];
		return supabase
			.from('seat_allocations')
			.update({
				current_group_id: group.groupId,
				current_group_name: group.groupName,
				member_left: group.m1,
				member_right: group.m2,
				current_bid_price: 0,
				updated_at: new Date().toISOString(),
			})
			.eq('id', targetSeat.id);
	});

	const results = await Promise.all(updatePromises);
	const hasError = results.some((r) => r.error);

	if (hasError) {
		throw new Error('일부 미배정 그룹 배치 중 에러가 발생했습니다.');
	}

	revalidatePath('/seats');
	return { success: true };
}
