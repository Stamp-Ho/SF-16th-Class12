"use client";

import { useEffect, useState } from "react";
import { Ban, CheckCircle2, KeyRound, Loader2, Search, UserCheck } from "lucide-react";
import { getAllUsers, resetUserPassword, updateUserStatus } from "./actions";
import BulkRegisterForm from "./BulkRegisterForm";
import type { UserInfo } from "@/utils/api/client";

export default function UserManagementTable({ myUsername }: { myUsername: string }) {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isBulkRegistering, setIsBulkRegistering] = useState(false);

  async function loadUsers() {
    setIsLoading(true);
    try {
      setUsers(await getAllUsers());
    } catch (error) {
      alert(error instanceof Error ? error.message : "사용자 목록을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    getAllUsers()
      .then(setUsers)
      .catch((error: unknown) => alert(error instanceof Error ? error.message : "사용자 목록을 불러오지 못했습니다."))
      .finally(() => setIsLoading(false));
  }, []);

  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(query.toLowerCase()),
  );

  async function changeUser(user: UserInfo, role: string, status: string) {
    try {
      const updated = await updateUserStatus(user.username, role, status);
      setUsers((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (error) {
      alert(error instanceof Error ? error.message : "사용자 정보를 변경하지 못했습니다.");
    }
  }

  async function resetPassword(user: UserInfo) {
    try {
      await resetUserPassword(user.username, "ssafy16");
      alert(`${user.username}의 비밀번호를 초기화했습니다.`);
    } catch (error) {
      alert(error instanceof Error ? error.message : "비밀번호를 초기화하지 못했습니다.");
    }
  }

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><UserCheck className="w-5 h-5 text-indigo-600" />사용자 관리</h2>
          <p className="text-xs text-slate-500 mt-1">단일 반의 계정, 권한, 상태를 관리합니다.</p>
        </div>
        <button type="button" onClick={() => setIsBulkRegistering(true)} className="px-3 py-2 text-xs font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">회원 일괄 등록</button>
      </div>

      <div className="relative max-w-sm">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="아이디로 검색" className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg" />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead><tr className="border-b text-slate-500"><th className="py-3">아이디</th><th>권한</th><th>상태</th><th className="text-right">관리</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? <tr><td colSpan={4} className="py-8 text-center"><Loader2 className="w-4 h-4 animate-spin inline" /></td></tr> : filteredUsers.map((user) => (
              <tr key={user.id}>
                <td className="py-3 font-semibold text-slate-800">{user.username}</td>
                <td><select value={user.role} disabled={user.username === myUsername || user.role === "super_admin"} onChange={(event) => void changeUser(user, event.target.value, user.status)} className="border rounded px-2 py-1"><option value="user">user</option><option value="song_admin">song_admin</option><option value="class_admin">class_admin</option><option value="teacher">teacher</option></select></td>
                <td><button type="button" disabled={user.username === myUsername || user.role === "super_admin"} onClick={() => void changeUser(user, user.role, user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE")} className="inline-flex items-center gap-1"><>{user.status === "ACTIVE" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Ban className="w-4 h-4 text-rose-600" />}</>{user.status}</button></td>
                <td className="text-right"><button type="button" onClick={() => void resetPassword(user)} className="p-1.5 text-slate-500 hover:text-indigo-600" title="비밀번호 초기화"><KeyRound className="w-4 h-4" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isBulkRegistering && <BulkRegisterForm onClose={() => setIsBulkRegistering(false)} onRegistered={loadUsers} />}
    </section>
  );
}
