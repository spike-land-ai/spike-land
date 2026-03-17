/**
 * Resend Email Client
 *
 * Minimal client for sending emails via Resend API.
 * No SDK — one HTTP POST, same pattern as stripe-client.ts.
 */

export interface EmailPayload {
  from: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
  reply_to?: string;
}

export interface ResendResponse {
  ok: boolean;
  id?: string;
  error?: string;
}

export async function sendEmail(apiKey: string, payload: EmailPayload): Promise<ResendResponse> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await res.json()) as Record<string, unknown>;

  if (!res.ok) {
    const message =
      typeof data["message"] === "string" ? data["message"] : `Resend API error ${res.status}`;
    return { ok: false, error: message };
  }

  return { ok: true, id: data["id"] as string };
}
