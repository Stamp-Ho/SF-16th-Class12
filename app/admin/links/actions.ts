"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// 공지/링크 추가
export async function createDashboardLink(formData: {
  title: string;
  url: string;
  description?: string;
  display_order?: number;
  class_id?: string | null;
}) {
  const supabase = await createClient();

  const { error } = await supabase.from("dashboard_links").insert({
    title: formData.title,
    url: formData.url,
    description: formData.description || "",
    display_order: formData.display_order || 0,
    class_id: formData.class_id || null
  });

  if (error) throw new Error(error.message);

  revalidatePath("/");
  return { success: true };
}

// 공지/링크 삭제
export async function deleteDashboardLink(linkId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("dashboard_links")
    .delete()
    .eq("id", linkId);

  if (error) throw new Error(error.message);

  revalidatePath("/");
  return { success: true };
}
