"use client";

import LoginModal from "@/components/LoginModal";
import { useAuth } from "@/components/AuthProvider";
import ShuffleMain from "./ShuffleMain";

export default function RandomizerPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <main className="p-8 text-center text-slate-500">세션 확인 중...</main>;
  }

  if (!user) return <LoginModal />;

  return <ShuffleMain />;
}
