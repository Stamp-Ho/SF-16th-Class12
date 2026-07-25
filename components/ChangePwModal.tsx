'use client';
import { KeyRound, X, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
export default function ChangePwModal({ onClose }: { onClose: () => void }) {
	// 비밀번호 변경 모달 상태
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [isChanging, setIsChanging] = useState(false);

	// 비밀번호 변경 제출 처리
	const handleChangePasswordSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (newPassword.length < 6) {
			alert('비밀번호는 최소 6자리 이상이어야 합니다.');
			return;
		}

		if (newPassword !== confirmPassword) {
			alert('새 비밀번호와 비밀번호 확인이 일치하지 않습니다.');
			return;
		}

		setIsChanging(true);
		try {
			const supabase = createClient();
			const { error } = await supabase.auth.updateUser({
				password: newPassword,
			});

			if (error) throw error;

			alert('비밀번호가 성공적으로 변경되었습니다!');
			onClose(); // 모달 닫기
			setNewPassword('');
			setConfirmPassword('');
		} catch (err: any) {
			alert(`비밀번호 변경 실패: ${err.message}`);
		} finally {
			setIsChanging(false);
		}
	};
	return (
		<div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
			<div className="bg-white w-full max-w-sm rounded-2xl p-6 space-y-4 shadow-2xl relative">
				<div className="flex items-center justify-between border-b pb-3 border-slate-100">
					<h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
						<KeyRound className="w-5 h-5 text-indigo-600" />
						비밀번호 변경
					</h3>
					<button
						type="button"
						onClick={onClose}
						className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				<form onSubmit={handleChangePasswordSubmit} className="space-y-3">
					<div>
						<label className="block text-xs font-semibold text-slate-600 mb-1">
							새 비밀번호 (6자리 이상)
						</label>
						<input
							type="password"
							value={newPassword}
							onChange={(e) => setNewPassword(e.target.value)}
							placeholder="새 비밀번호 입력"
							className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
							required
							minLength={6}
						/>
					</div>

					<div>
						<label className="block text-xs font-semibold text-slate-600 mb-1">
							새 비밀번호 확인
						</label>
						<input
							type="password"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							placeholder="새 비밀번호 다시 입력"
							className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
							required
							minLength={6}
						/>
					</div>

					<div className="flex justify-end gap-2 pt-3">
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl"
						>
							취소
						</button>
						<button
							type="submit"
							disabled={isChanging}
							className="px-4 py-2 text-xs font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 flex items-center gap-1 shadow-md shadow-indigo-100"
						>
							{isChanging && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
							변경 완료
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
