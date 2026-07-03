import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const uploadDir = path.join(process.cwd(), "public", "uploads");
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function saveUpload(file: File | null): Promise<string | null> {
  if (!file || file.size === 0) {
    return null;
  }

  if (!allowedTypes.has(file.type)) {
    throw new Error("Only JPEG, PNG, WebP, and GIF images are supported");
  }

  await mkdir(uploadDir, { recursive: true });

  const extension = extensionFor(file.type);
  const filename = `${randomUUID()}${extension}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`uploads/${filename}`, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    return blob.url;
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  await writeFile(path.join(uploadDir, filename), bytes);

  return `/uploads/${filename}`;
}

function extensionFor(type: string) {
  if (type === "image/png") return ".png";
  if (type === "image/webp") return ".webp";
  if (type === "image/gif") return ".gif";
  return ".jpg";
}
