'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { ArrowLeft, DiscAlbum, MicVocal, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import RecordModal from './RecordModal';

export default function SongMain({
	user,
}: {
	user: { name: string; role: string; classId: number };
}) {
	const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

	const isAdmin = user.role.includes('admin');

	return (
		<main className="min-h-screen bg-slate-50 p-6 md:p-12">
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
							<MicVocal className="w-7 h-7 text-ssafy-blue" />
							SSAFY <strong>12반</strong> 노래 큐
						</h1>
						<p className="text-xs text-slate-500 mt-1">
							2주 단위 자리 배정 및 선착순/경매 구역(A~M) 입찰 시스템
						</p>
					</div>

					<button
						onClick={() => setIsRecordModalOpen(true)}
						className="flex items-center ml-auto gap-2 px-4 py-2.5 bg-ssafy-blue hover:bg-ssafy-blue/70 text-white text-lg font-bold rounded-xl shadow-md transition-all self-start sm:self-auto"
					>
						<DiscAlbum className="w-6 h-6" />
						노래 기록
					</button>
				</div>

				{/* 4. 어드민 제어 패널 */}
				{isAdmin && <></>}
				{isRecordModalOpen && (
					<RecordModal
						onClose={() => setIsRecordModalOpen(false)}
						classId={user.classId}
					/>
				)}
			</div>
		</main>
	);
}
