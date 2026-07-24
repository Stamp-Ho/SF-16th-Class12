// utils/supabase/admin.ts
import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service Role Key 사용
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false // 💡 핵심: 세션을 저장하지 않도록 설정
      }
    }
  );
}
