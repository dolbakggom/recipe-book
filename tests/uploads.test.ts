import { readFile, rm } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { saveUpload } from "@/lib/uploads";

describe("uploads", () => {
  it("stores images locally when Vercel Blob is not configured", async () => {
    const previousToken = process.env.BLOB_READ_WRITE_TOKEN;
    delete process.env.BLOB_READ_WRITE_TOKEN;

    let savedPath: string | null = null;

    try {
      const file = new File(["cover"], "cover.png", { type: "image/png" });

      savedPath = await saveUpload(file);

      expect(savedPath).toMatch(
        /^\/uploads\/[0-9a-f-]{36}\.png$/
      );

      const bytes = await readFile(path.join(process.cwd(), "public", savedPath!));
      expect(bytes.toString()).toBe("cover");
    } finally {
      if (savedPath) {
        await rm(path.join(process.cwd(), "public", savedPath), {
          force: true
        });
      }

      if (previousToken === undefined) {
        delete process.env.BLOB_READ_WRITE_TOKEN;
      } else {
        process.env.BLOB_READ_WRITE_TOKEN = previousToken;
      }
    }
  });

  it("rejects unsupported file types", async () => {
    await expect(
      saveUpload(new File(["x"], "cover.txt", { type: "text/plain" }))
    ).rejects.toThrow("Only JPEG, PNG, WebP, and GIF images are supported");
  });
});
