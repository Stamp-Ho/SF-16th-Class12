"use client";

import { useAuth } from "@/components/AuthProvider";
import AdminView from "./AdminView";

export default function AdminPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <main className="p-8 text-center text-slate-500">세션 확인 중...</main>;
  if (!user || (user.role !== "super_admin" && user.role !== "class_admin")) {
    return <main className="p-8 text-center text-rose-600">관리자 권한이 필요합니다.</main>;
  }

  return <AdminView myUsername={user.username} />;
}