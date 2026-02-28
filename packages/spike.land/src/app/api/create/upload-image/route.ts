import { NextResponse } from "next/server";
import { getClientIp } from "@/lib/rate-limit-presets";
import { uploadToR2 } from "@/lib/storage/r2-client";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// Simple rate limit: track per IP, 5 uploads per minute
const uploadCounts = new Map<string, { count: number; resetAt: number; }>();

function checkUploadRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = uploadCounts.get(ip);
  if (!entry || now > entry.resetAt) {
    uploadCounts.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 5) return false;
  entry.count++;
  return true;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (!checkUploadRateLimit(ip)) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429 },
    );
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "No file provided" },
      { status: 400 },
    );
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Invalid file type" },
      { status: 400 },
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File too large (max 10MB)" },
      { status: 400 },
    );
  }

  // Sanitize filename
  const safeFilename = file.name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 100);
  const imageId = crypto.randomUUID();
  const extension = file.type.split("/")[1] || "jpg";
  const r2Key = `composer/${imageId}.${extension}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const result = await uploadToR2({
    key: r2Key,
    buffer,
    contentType: file.type,
    metadata: { originalFilename: safeFilename },
  });

  if (!result.success) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }

  return NextResponse.json({
    url: result.url,
    imageId,
  });
}
