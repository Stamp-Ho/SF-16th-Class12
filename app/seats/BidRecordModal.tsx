"use client";

import { useEffect, useState } from "react";
import { History, Loader2, X } from "lucide-react";
import { getBidHistory } from "./actions";

type BidHistoryRecord = Record<string, unknown>;

export default function BidRecordModal({
	roundId,
	onClose
}: {
	roundId: number;
	onClose: () => void;
}) {
	const [records, setRecords] = useState<BidHistoryRecord[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	useEffect(() => {
		let isActive = true;

		const loadHistory = async () => {
			setIsLoading(true);
			setErrorMessage(null);

			try {
				const history = await getBidHistory(roundId);
				if (isActive) setRecords(history as BidHistoryRecord[]);
			} catch (error) {
				if (isActive) {
					setErrorMessage(
						error instanceof Error ? error.message : "기록을 불러오지 못했습니다."
					);
				}
			} finally {
				if (isActive) setIsLoading(false);
			}
		};

		void loadHistory();

		return () => {
			isActive = false;
		};
	}, [roundId]);

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
			<div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
				<div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 p-5">
					<h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
						<History className="h-5 w-5 text-indigo-600" />
						입찰 기록
					</h2>
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700"
						title="닫기"
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				<div className="flex-1 overflow-y-auto p-5">
					{isLoading ? (
						<div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
							<Loader2 className="h-4 w-4 animate-spin" />
							기록을 불러오는 중...
						</div>
					) : errorMessage ? (
						<p className="py-12 text-center text-sm text-rose-500">{errorMessage}</p>
					) : records.length === 0 ? (
						<p className="py-12 text-center text-sm text-slate-400">
							저장된 입찰 기록이 없습니다.
						</p>
					) : (
						<div className="space-y-3">
							{records.map((record, index) => {
								const date = record.createdAt ?? record.created_at ?? record.timestamp;
								const user = record.userName ?? record.user_name ?? record.username;
								const seat = record.seatCode ?? record.seat_code;
								const price = record.bidPrice ?? record.bid_price ?? record.price;

								return (
									<div
										key={`${String(record.id ?? index)}-${index}`}
										className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
									>
										<div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                                            <p className={`text-slate-600 text-xs border-2 rounded-full pl-1.5 pr-1.25 py-0.5 font-semibold
                                                ${record.priceChange === 0 ? "bg-slate-100 border-slate-300 !text-slate-600" : record.method === "BID"
                                                ? "bg-emerald-100 border-emerald-300 !text-emerald-600"
                                                : "bg-rose-100 border-rose-300 !text-rose-800"}`}
                                            >{record.priceChange === 0 ? "이동" : record.method === "BID" ? "입찰" : "도박"}</p>
                                            <p className="text-slate-600 text-xs border-2 rounded-full pl-1.5 pr-1.25 py-0.5 font-semibold bg-slate-100 border-slate-300 !text-slate-600">{seat != null ? `좌석 ${String(seat)}` : ""}</p>
											{user != null && <span className="font-bold text-slate-800">{String(user)}</span>}
                                            <p className={`${!!Number(record.priceChange) && Number(record.priceChange) > 0 ? "text-emerald-600" : "text-rose-600"}`}>{!!Number(record.priceChange) && (Number(record.priceChange) > 0 ? `+${String(record.priceChange)}` : String(record.priceChange))}</p>
                                            <p>{seat != null && `좌석 ${record.prevGroupName}`}  to {seat != null && `좌석 ${record.nextGroupName}`} </p>
											{price != null && <span className="font-semibold text-amber-600"> {String(price)}원</span>}
											{date != null && <span className="ml-auto text-xs text-slate-400">{String(date)}</span>}
										</div>
										<pre className="mt-3 overflow-x-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
											{JSON.stringify(record, null, 2)}
										</pre>
									</div>
								);
							})}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
