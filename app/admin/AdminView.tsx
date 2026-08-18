import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import NoticeRegisterForm from "./NoticeRegisterForm";
import UserManagementTable from "./users/UserManagementTable";

export default function AdminView({ myUsername }: { myUsername: string }) {
  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"><ArrowLeft className="w-4 h-4" />메인으로 돌아가기</Link>
          <h1 className="text-xl font-bold text-slate-900">어드민 관리 센터</h1>
        </div>
        <UserManagementTable myUsername={myUsername} />
        <NoticeRegisterForm />
      </div>
    </main>
  );
}
