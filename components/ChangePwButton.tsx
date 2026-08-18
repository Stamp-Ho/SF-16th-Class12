'use client';
import { useState } from 'react';
import { KeyRound } from 'lucide-react';
import ChangePwModal from './ChangePwModal';
export default function ChangePwButton({ username }: { username: string }) {
	const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
	return (
		<>
			<button
				type="button"
				onClick={() => setIsPasswordModalOpen(true)}
				className="p-2.5 cursor-pointer text-slate-500 hover:text-indigo-600 rounded-xl hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-xs font-semibold"
				title="비밀번호 변경"
			>
				<KeyRound className="w-5 h-5" />
				<span className="hidden sm:inline">비밀번호 변경</span>
			</button>
			{isPasswordModalOpen && (
				<ChangePwModal
					username={username}
					onClose={() => setIsPasswordModalOpen(false)}
				/>
			)}
		</>
	);
}
