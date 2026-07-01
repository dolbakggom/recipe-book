import { execFileSync } from "node:child_process";
import { closeSync, mkdtempSync, openSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

export async function withTestDb<T>(
  run: (db: PrismaClient) => Promise<T>
): Promise<T> {
  const dir = mkdtempSync(path.join(tmpdir(), "recipe-book-test-"));
  const dbPath = path.join(dir, "test.db");
  const databaseUrl = `file:${dbPath}`;
  const previousUrl = process.env.DATABASE_URL;
  let db: PrismaClient | undefined;

  try {
    process.env.DATABASE_URL = databaseUrl;
    closeSync(openSync(dbPath, "a"));
    execFileSync("npx", ["prisma", "db", "push", "--skip-generate"], {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: "ignore"
    });

    db = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl
        }
      }
    });

    return await run(db);
  } finally {
    await db?.$disconnect();

    if (previousUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = previousUrl;
    }

    rmSync(dir, { recursive: true, force: true });
  }
}
