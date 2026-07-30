'use client';

import { useState, useEffect } from 'react';
import { getSongRecords } from './actions';

export default function RecordModal({
	onClose,
	classId,
}: {
	onClose: () => void;
	classId: number;
}) {
	const [records, setRecords] = useState<any[]>([]);

	useEffect(() => {
		// Fetch records from the server based on classId
		async function fetchRecords() {
			try {
				const data = await getSongRecords(classId);
				setRecords(data);
			} catch (error) {
				console.error('Error fetching records:', error);
			}
		}
		fetchRecords();
	}, [classId]);

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
			<div className="bg-white rounded-lg p-6 w-96">
				<h2 className="text-xl font-bold mb-4">노래 기록</h2>
				{records.length === 0 ? (
					<p className="text-gray-500">기록이 없습니다.</p>
				) : (
					<ul>
						{records.map((record) => (
							<li key={record.id}>{record.song_name}</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
}
