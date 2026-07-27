import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import NoticeRegisterForm from "./NoticeRegisterForm";
import UserManagementTable from "./users/UserManagementTable";

export default function AdminView({
  role,
  myId,
  classId
}: {
  role: "super_admin" | "class_admin" | "user";
  myId?: string;
  classId: string | null;
}) {
  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* 상단 네비게이션 */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> 메인으로 돌아가기
          </Link>
          <h1 className="text-xl font-bold text-slate-900">어드민 관리 센터</h1>
        </div>

        <UserManagementTable
          initialUsers={[]}
          userRole={role}
          myId={myId}
          classId={classId}
        />
        <div className="mt-8">
          <NoticeRegisterForm classId={classId} />
        </div>
      </div>
    </main>
  );
}
