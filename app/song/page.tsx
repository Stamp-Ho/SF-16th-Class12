"use client";

import LoginModal from "@/components/LoginModal";
import { useAuth } from "@/components/AuthProvider";
import StageSync from "./StageSync";

export default function SongPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <main className="p-8 text-center text-slate-500">세션 확인 중...</main>;
  }

  if (!user) return <LoginModal />;

  return <StageSync user={{ name: user.username, role: user.role }} />;
}
