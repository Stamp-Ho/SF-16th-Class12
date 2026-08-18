import { apiRequest } from "@/utils/api/client";

const SEAT_CODES = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "가", "나", "다",
];

type RoundResponse = {
  id: number;
  round: number;
  title: string;
  peoplePerGroup: number;
  isClosed: boolean;
  isGambleEnabled: boolean;
  createdAt: string;
};

type GroupResponse = {
  id: number;
  roundId: number;
  groupName: string;
  member1: string;
  member2: string | null;
  member3: string | null;
};

type AllocationResponse = {
  id: number;
  roundId: number;
  seatCode: string;
  bidPrice: number;
  isLocked: boolean;
  groupId: number | null;
  memberLeft: string | null;
  memberMiddle: string | null;
  memberRight: string | null;
};

export type SeatData = {
  id: number;
  seat_code: string;
  current_group_id: number | null;
  current_group_name: string | null;
  member_left: string | null;
  member_middle: string | null;
  member_right: string | null;
  current_bid_price: number;
  locked: boolean;
};

export type SeatGroup = {
  groupId: number;
  groupName: string;
  m1: string;
  m2: string | null;
  m3: string | null;
};

export type SeatRound = {
  id: number;
  roundNumber: number;
  title: string;
  createdAt: string;
  isClosed: boolean;
  isGambleEnabled: boolean;
  groups: SeatGroup[];
  seats: SeatData[];
};

function toSeatData(allocation: AllocationResponse, groups: GroupResponse[]): SeatData {
  const group = groups.find((item) => item.id === allocation.groupId);

  return {
    id: allocation.id,
    seat_code: allocation.seatCode,
    current_group_id: allocation.groupId,
    current_group_name: group?.groupName ?? null,
    member_left: allocation.memberLeft,
    member_middle: allocation.memberMiddle,
    member_right: allocation.memberRight,
    current_bid_price: allocation.bidPrice,
    locked: allocation.isLocked,
  };
}

export async function getSeatRounds() {
  const rounds = await apiRequest<RoundResponse[]>("/api/seats/rounds");

  return Promise.all(
    rounds.map(async (round): Promise<SeatRound> => {
      const [groups, allocations] = await Promise.all([
        apiRequest<GroupResponse[]>(`/api/seats/rounds/${round.id}/groups`),
        apiRequest<AllocationResponse[]>(`/api/seats/rounds/${round.id}/allocations`),
      ]);

      return {
        id: round.id,
        roundNumber: round.round,
        title: round.title,
        createdAt: round.createdAt,
        isClosed: round.isClosed,
        isGambleEnabled: round.isGambleEnabled,
        groups: groups.map((group) => ({
          groupId: group.id,
          groupName: group.groupName,
          m1: group.member1,
          m2: group.member2,
          m3: group.member3,
        })),
        seats: allocations.map((allocation) => toSeatData(allocation, groups)),
      };
    }),
  );
}

export async function createNewSeatRound(
  roundNumber: number,
  title: string,
  generatedOrder: string[],
) {
  const round = await apiRequest<RoundResponse>("/api/seats/rounds", {
    method: "POST",
    body: JSON.stringify({
      round: roundNumber,
      title: title.trim(),
      peoplePerGroup: 2,
      isGambleEnabled: true,
      seatCodes: SEAT_CODES,
    }),
  });

  const groups = [];
  for (let index = 0; index < generatedOrder.length; index += 2) {
    const members = generatedOrder.slice(index, index + 2).filter(Boolean);
    if (members.length === 0) continue;

    groups.push(
      await apiRequest<GroupResponse>(`/api/seats/rounds/${round.id}/groups`, {
        method: "POST",
        body: JSON.stringify({
          groupName: members.join(", "),
          member1: members[0],
          member2: members[1] ?? null,
        }),
      }),
    );
  }

  return { round, groups };
}

export async function placeOrMoveSeatBid(
  allocationId: number,
  userName: string,
  groupId: number,
) {
  return apiRequest<AllocationResponse>(`/api/seats/allocations/${allocationId}/bid`, {
    method: "POST",
    body: JSON.stringify({ userName, nextGroupId: groupId }),
  });
}

export async function swapSeatPositions(seat: SeatData) {
  return apiRequest<AllocationResponse>(`/api/seats/allocations/${seat.id}/details`, {
    method: "PATCH",
    body: JSON.stringify({
      memberLeft: seat.member_right,
      memberMiddle: seat.member_middle,
      memberRight: seat.member_left,
    }),
  });
}

export async function toggleAuctionStatus(roundId: number, isClosed: boolean) {
  return apiRequest<void>(`/api/seats/rounds/${roundId}/${isClosed ? "close" : "open"}`, {
    method: "PATCH",
  });
}

export async function deleteSeatRound(roundId: number) {
  return apiRequest<void>(`/api/seats/rounds/${roundId}`, { method: "DELETE" });
}

export async function toggleSeatLock(_seatId: number, _lockStatus: boolean) {
  void _seatId;
  void _lockStatus;
}

export async function processGamble(
  allocationId: number,
  userName: string,
  groupId: number,
) {
  return apiRequest<AllocationResponse>(`/api/seats/allocations/${allocationId}/gamble`, {
    method: "POST",
    body: JSON.stringify({ userName, nextGroupId: groupId }),
  });
}
