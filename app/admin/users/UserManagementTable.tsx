'use client';

import { useState, useTransition, useEffect } from 'react';
import {
	updateUserStatus,
	getAllUsers,
	resetUserPassword,
	getClasses,
} from './actions';
import {
	ShieldCheck,
	User,
	Ban,
	CheckCircle2,
	Loader2,
	Search,
	UserCheck,
	RotateCcw,
	KeyRound,
	X,
} from 'lucide-react';

interface Profile {
	id: string;
	name: string;
	email: string | null;
	role: 'super_admin' | 'class_admin' | 'user';
	status: 'active' | 'blocked';
	class_id: string | null;
	className?: string; // 클래스 이름 (선택적)
	created_at: string;
}

export default function UserManagementTable({
	initialUsers,
}: {
	initialUsers: Profile[];
}) {
	const [users, setUsers] = useState<Profile[]>(initialUsers);
	const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
	const [searchTerm, setSearchTerm] = useState('');
	const [searchClass, setSearchClass] = useState('');
	const [isPending, startTransition] = useTransition();
	const [loadingId, setLoadingId] = useState<string | null>(null);
	const [isResetting, setIsResetting] = useState(false);
	const [resetTargetUser, setResetTargetUser] = useState<Profile | null>(null);

	// 검색 필터링 (이름/이메일기준)
	const filteredUsers = users.filter(
		(u) =>
			u.name.includes(searchTerm.toLowerCase()) &&
			u?.className?.includes(searchClass.toLowerCase()),
	);

	const fetchUsers = async () => {
		const users = await getAllUsers();
		const classes = await getClasses();
		setClasses(classes);
		setUsers(
			users.map((user) => {
				return {
					...user,
					className:
						classes.find((cls) => cls.id === user.class_id)?.name ?? '',
				};
			}),
		);
	};
	useEffect(() => {
		// 초기 유저 목록을 가져오는 로직 (예: API 호출)
		fetchUsers();
	}, []);

	// 권한 또는 상태 업데이트 핸들러
	const handleStatusChange = (
		userId: string,
		newRole: 'class_admin' | 'user',
		newStatus: 'active' | 'blocked',
	) => {
		setLoadingId(userId);

		startTransition(async () => {
			try {
				await updateUserStatus(userId, newRole, newStatus);

				// 로컬 State 업데이트
				setUsers((prev) =>
					prev.map((u) =>
						u.id === userId ? { ...u, role: newRole, status: newStatus } : u,
					),
				);
			} catch (err: any) {
				alert(`업데이트 실패: ${err.message}`);
			} finally {
				setLoadingId(null);
			}
		});
	};
	const handleResetPasswordSubmit = async () => {
		if (!resetTargetUser) {
			setIsResetting(false);
			setResetTargetUser(null);
			return;
		}
		try {
			await resetUserPassword(resetTargetUser.id, 'ssafy504');
			alert(
				`[${resetTargetUser?.name}] 님의 비밀번호가 성공적으로 변경되었습니다.`,
			);
		} catch (err: any) {
			alert(`초기화 실패: ${err.message}`);
		} finally {
			setIsResetting(false);
			setResetTargetUser(null);
		}
	};
	return (
		<section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6 col-span-1 md:col-span-2">
			{/* 상단 타이틀 & 검색 바 */}
			<div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-4">
				<div className="flex flex-row items-center justify-between gap-2 pr-4">
					<div>
						<h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
							<UserCheck className="w-5 h-5 text-indigo-600" />
							회원 목록 & 권한 관리 ({users.length}명)
						</h2>
						<p className="text-xs text-slate-500 mt-1">
							등록된 회원들의 권한 및 계정 활성화 상태를 관리합니다.
						</p>
					</div>
					<RotateCcw
						className="w-8 h-8 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
						onClick={fetchUsers}
					/>
				</div>

				{/* Class 검색 */}
				<div className="flex flex-wrap gap-2">
					<button
						onClick={() => setSearchClass('')}
						className={`px-3 py-1 text-[11px] font-medium rounded-lg border transition-colors ${
							searchClass === ''
								? 'bg-indigo-600 border-indigo-600 text-white'
								: 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
						}`}
					>
						전체
					</button>
					{classes.map(({ id, name }) => (
						<button
							key={id}
							onClick={() => setSearchClass(name)}
							className={`px-3 py-1 text-[11px] font-medium rounded-lg border transition-colors ${
								searchClass === name
									? 'bg-indigo-600 border-indigo-600 text-white'
									: 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
							}`}
						>
							{name}
						</button>
					))}
				</div>

				{/* 검색 창 */}
				<div className="relative w-full sm:w-64">
					<Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
					<input
						type="text"
						placeholder="이름으로 검색..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
					/>
				</div>
			</div>

			{/* 회원 테이블 */}
			<div className="overflow-x-hidden overflow-y-scroll max-h-[400px]">
				<table className="w-full text-left border-collapse">
					<thead>
						<tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
							<th className="py-3 px-4">반</th>
							<th className="py-3 px-4">이름</th>
							<th className="py-3 px-4">Role</th>
							<th className="py-3 px-4">상태</th>
							<th className="py-3 px-4 text-right">설정 제어</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-slate-100 text-xs text-slate-700">
						{filteredUsers.length > 0 ? (
							filteredUsers.map((user) => {
								const isLoading = loadingId === user.id;

								return (
									<tr
										key={user.id}
										className="hover:bg-slate-50/80 transition-colors"
									>
										<td className="py-3 px-1 font-semibold text-slate-600 items-center min-w-[50px]">
											{user.className || '미지정'}
										</td>
										{/* 이름 */}
										<td className="py-3 px-1 font-semibold text-sm text-slate-900 items-center min-w-[50px]">
											{user.name}
										</td>
										{/* 권한 뱃지 */}
										<td className="py-3 px-1">
											{user.role === 'super_admin' ? (
												<span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-200/60 py-0.5 px-1 rounded-full text-[11px] font-semibold">
													<ShieldCheck className="w-3 h-3 text-indigo-600" />{' '}
													Admin
												</span>
											) : user.role === 'class_admin' ? (
												<span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200/60 py-0.5 px-1 rounded-full text-[11px] font-semibold">
													<ShieldCheck className="w-3 h-3 text-amber-600" />C
													Admin
												</span>
											) : (
												<span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full text-[11px] font-medium">
													<User className="w-3 h-3 text-slate-400" /> User
												</span>
											)}
										</td>

										{/* 상태 뱃지 */}
										<td className="py-3">
											{user.status === 'active' ? (
												<span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md text-[11px] font-medium">
													<CheckCircle2 className="w-3 h-3" /> 정상
												</span>
											) : (
												<span className="inline-flex items-center gap-1 bg-rose-50 text-rose-600 px-2 py-0.5 rounded-md text-[11px] font-medium">
													<Ban className="w-3 h-3" /> 차단됨
												</span>
											)}
										</td>

										{/* 조작 버튼 영역 */}
										<td className="py-3 px-2 text-right">
											{isLoading ? (
												<div className="flex justify-end">
													<Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
												</div>
											) : (
												<div className="flex items-center justify-end gap-2">
													{/* 💡 비밀번호 초기화 버튼 */}
													<button
														type="button"
														onClick={() => {
															setResetTargetUser(user);
															setIsResetting(true);
														}}
														className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
														title="비밀번호 초기화"
													>
														<KeyRound className="w-3.5 h-3.5" />
													</button>
													{/* 권한 토글 버튼 */}
													{user.role !== 'super_admin' && (
														<>
															<button
																onClick={() =>
																	handleStatusChange(
																		user.id,
																		user.role === 'class_admin'
																			? 'user'
																			: 'class_admin',
																		user.status,
																	)
																}
																className={`px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-colors ${
																	user.role === 'class_admin'
																		? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
																		: 'bg-amber-500 border-amber-500 text-white hover:bg-amber-600'
																}`}
															>
																{user.role === 'class_admin'
																	? 'User로 변경'
																	: 'Admin 지정'}
															</button>
															{/* 차단 토글 버튼 */}
															<button
																onClick={() =>
																	handleStatusChange(
																		user.id,
																		user.role === 'super_admin'
																			? 'class_admin'
																			: user.role,
																		user.status === 'active'
																			? 'blocked'
																			: 'active',
																	)
																}
																className={`px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-colors ${
																	user.status === 'active'
																		? 'bg-white border-rose-200 text-rose-600 hover:bg-rose-50'
																		: 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700'
																}`}
															>
																{user.status === 'active'
																	? '차단'
																	: '차단 해제'}
															</button>
														</>
													)}
												</div>
											)}
										</td>
									</tr>
								);
							})
						) : (
							<tr>
								<td
									colSpan={5}
									className="py-8 text-center text-slate-400 text-xs"
								>
									검색 결과 또는 등록된 유저가 없습니다.
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>

			{isResetting && resetTargetUser && (
				<div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
					<div className="bg-white w-full max-w-sm rounded-2xl p-6 space-y-4 shadow-2xl relative">
						<div className="flex items-center justify-between ">
							<h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
								<KeyRound className="w-4 h-4 text-indigo-600" />[
								{resetTargetUser.name}]의 비밀번호를 초기화 하겠습니까?
							</h3>
							<button
								type="button"
								onClick={() => setResetTargetUser(null)}
								className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
							>
								<X className="w-4 h-4" />
							</button>
						</div>

						<form onSubmit={handleResetPasswordSubmit} className="space-y-4">
							<div className="flex justify-end gap-2 pt-2 mr-1">
								<button
									type="button"
									onClick={() => setResetTargetUser(null)}
									className="cursor-pointer px-4.5 py-2.25 text-md font-semibold text-slate-500 hover:bg-slate-100 rounded-xl"
								>
									취소
								</button>
								<button
									type="submit"
									className="cursor-pointer px-4.5 py-2.25 text-md font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 flex items-center gap-1 shadow-md shadow-indigo-100"
								>
									초기화
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</section>
	);
}
