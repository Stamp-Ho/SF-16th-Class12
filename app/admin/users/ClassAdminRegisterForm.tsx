'use client';
import { useState, useTransition } from 'react';
import { registerClassAdmin } from './actions';
import { UserPlus, Loader2 } from 'lucide-react';

export default function ClassAdminRegisterForm() {
	const [isPending, startTransition] = useTransition();
	const [isLoading, setIsLoading] = useState(false);
	const [className, setClassName] = useState('');
	const [userName, setUserName] = useState('');

	return (
		<section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
			<div className="flex items-center gap-2 border-b border-slate-100 pb-3">
				<UserPlus className="w-5 h-5 text-indigo-600" />
				<h2 className="font-bold text-slate-800">클래스 관리자 등록</h2>
			</div>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					setIsLoading(true);
					startTransition(async () => {
						try {
							await registerClassAdmin(className, userName);
							alert('클래스 관리자 등록이 완료되었습니다!');
							setClassName('');
							setUserName('');
						} catch (err: any) {
							alert(`등록 에러: ${err.message}`);
						}
						setIsLoading(false);
					});
				}}
				className="space-y-4"
			>
				<div>
					<label className="block text-xs font-semibold text-slate-600 mb-1">
						반 이름
					</label>
					<input
						type="text"
						value={className}
						onChange={(e) => setClassName(e.target.value)}
						placeholder="예: 12-1"
						className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
						required
					/>
				</div>
				<div>
					<label className="block text-xs font-semibold text-slate-600 mb-1">
						관리자 이름
					</label>
					<input
						type="text"
						value={userName}
						onChange={(e) => setUserName(e.target.value)}
						placeholder="예: 홍길동"
						className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
						required
					/>
				</div>
				<button
					type="submit"
					disabled={isLoading}
					className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
						isLoading
							? 'bg-indigo-400 text-white cursor-not-allowed'
							: 'bg-indigo-600 hover:bg-indigo-700 text-white'
					}`}
				>
					{isLoading ? (
						<Loader2 className="w-4 h-4 animate-spin" />
					) : (
						'클래스 관리자 등록'
					)}
				</button>
			</form>
		</section>
	);
}
