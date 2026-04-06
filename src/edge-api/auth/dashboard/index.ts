import type { Env } from "../db-auth/auth";
import { requireSuperAdmin } from "./auth-guard";
import { handleDashboardApi } from "./api";
import { renderDashboard } from "./html";

export async function handleDashboard(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);

  // Auth check
  const authResult = await requireSuperAdmin(request, env);
  if (authResult instanceof Response) return authResult;

  // TypeScript narrows authResult to AuthResult after the Response guard above.
  const auth = authResult;

  // API routes
  if (url.pathname.startsWith("/dashboard/api/")) {
    return handleDashboardApi(request, env, auth);
  }

  // Dashboard HTML
  if (url.pathname === "/dashboard") {
    return new Response(renderDashboard(auth.user), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  return new Response("Not found", { status: 404 });
}
