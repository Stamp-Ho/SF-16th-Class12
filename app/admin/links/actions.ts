import { apiRequest } from "@/utils/api/client";

export async function createDashboardLink(input: {
  title: string;
  url: string;
  description?: string;
  displayOrder?: number;
}) {
  return apiRequest("/api/links", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
