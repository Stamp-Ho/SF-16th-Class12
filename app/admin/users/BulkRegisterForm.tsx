"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { bulkRegisterUsers } from "./actions";

export default function BulkRegisterForm({ onClose, onRegistered }: { onClose: () => void; onRegistered: () => Promise<void> }) {
  const [value, setValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const usernames = value.split(/[\s,]+/).map((username) => username.trim()).filter(Boolean);
    if (usernames.length === 0) return;
    setIsSubmitting(true);
    try {
      const users = await bulkRegisterUsers(usernames);
      alert(`${users.length}명을 등록했습니다.`);
      await onRegistered();
      onClose();
    } catch (error) {
      alert(error instanceof Error ? error.message : "사용자를 등록하지 못했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4"><form onSubmit={submit} className="w-full max-w-md bg-white rounded-xl p-6 space-y-4"><div className="flex justify-between"><h3 className="font-bold">회원 일괄 등록</h3><button type="button" onClick={onClose}><X className="w-5 h-5" /></button></div><textarea required rows={5} value={value} onChange={(event) => setValue(event.target.value)} placeholder="user1, user2, user3" className="w-full border rounded-lg p-3 text-sm" /><p className="text-xs text-slate-500">초기 비밀번호는 `ssafy16`입니다.</p><button disabled={isSubmitting} className="w-full py-2.5 bg-indigo-600 text-white rounded-lg">{isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "등록"}</button></form></div>;
}
