# Recipe Book Local MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the local single-user Recipe Book MVP with Kitchen, Recipe, Ingredient block, image upload, Markdown, and read-only share flows.

**Architecture:** Use a Next.js App Router full-stack app with server components for read pages, server actions for mutations, Prisma for data access, and SQLite for local persistence. Keep domain logic in `src/features/*` so page components stay small and future external services can replace local storage without rewriting UI flows.

**Tech Stack:** Next.js, React, TypeScript, Prisma, SQLite, Zod, React Markdown, remark-gfm, lucide-react, Vitest, Playwright.

---

## Scope

This plan implements the approved local MVP design in `docs/superpowers/specs/2026-06-30-recipe-book-local-mvp-design.md`. It does not add authentication, external database hosting, external image storage, collaboration, edit permissions on shares, or PDF export.

## File Structure

Create the app in the existing repository root. Do not move `develop-plan.md` or the approved design spec.

- Create `package.json`: project scripts and dependencies.
- Create `tsconfig.json`: TypeScript settings for Next.js.
- Create `next.config.ts`: Next.js config.
- Create `eslint.config.mjs`: lint config.
- Create `vitest.config.ts`: unit/integration test config.
- Create `playwright.config.ts`: smoke test config.
- Modify `.gitignore`: ignore local DB files and generated output.
- Create `.env.example`: documents the local SQLite database URL.
- Create `prisma/schema.prisma`: Kitchen, Recipe, Ingredient, RecipeIngredient, RecipeStep, and ShareLink models.
- Create `prisma/seed.ts`: sample local data for manual testing.
- Create `src/lib/db.ts`: singleton Prisma client.
- Create `src/lib/paths.ts`: route builders.
- Create `src/lib/uploads.ts`: local upload helper.
- Create `src/lib/form.ts`: form parsing helpers.
- Create `src/features/kitchens/data.ts`: Kitchen data functions.
- Create `src/features/kitchens/actions.ts`: Kitchen server actions.
- Create `src/features/ingredients/data.ts`: Ingredient data functions.
- Create `src/features/ingredients/actions.ts`: Ingredient server actions.
- Create `src/features/recipes/data.ts`: Recipe data functions.
- Create `src/features/recipes/actions.ts`: Recipe server actions.
- Create `src/features/shares/data.ts`: ShareLink data functions.
- Create `src/features/shares/actions.ts`: ShareLink server actions.
- Create `src/components/ui/SubmitButton.tsx`: client submit button with pending state.
- Create `src/components/ui/ConfirmSubmitButton.tsx`: client delete button with confirmation.
- Create `src/components/MarkdownPreview.tsx`: Markdown preview using GFM.
- Create `src/components/ImageField.tsx`: image upload field.
- Create `src/app/layout.tsx`: root shell.
- Create `src/app/page.tsx`: redirect to `/kitchens`.
- Create `src/app/globals.css`: mobile-first functional styling.
- Create `src/app/kitchens/page.tsx`: Kitchen list and create form.
- Create `src/app/kitchens/[id]/page.tsx`: Kitchen recipe gallery.
- Create `src/app/kitchens/[id]/recipes/new/page.tsx`: Recipe create form.
- Create `src/app/kitchens/[id]/recipes/[recipeId]/page.tsx`: Recipe detail/edit page.
- Create `src/app/ingredients/page.tsx`: Ingredient list with Kitchen filter.
- Create `src/app/ingredients/[id]/page.tsx`: Ingredient detail and connected recipes.
- Create `src/app/shared/[shareId]/page.tsx`: read-only share page.
- Create `tests/helpers/test-db.ts`: isolated SQLite test helper.
- Create `tests/kitchens.test.ts`: Kitchen data tests.
- Create `tests/ingredients.test.ts`: Ingredient relation tests.
- Create `tests/recipes.test.ts`: Recipe creation and ingredient ordering tests.
- Create `tests/shares.test.ts`: share creation and resolution tests.
- Create `tests/smoke.spec.ts`: Playwright core flow smoke test.
- Create `public/uploads/.gitkeep`: keeps upload directory in Git while excluding uploaded files.

## Task 1: Project Foundation

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `eslint.config.mjs`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Modify: `.gitignore`
- Create: `.env.example`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`
- Create: `public/uploads/.gitkeep`

- [ ] **Step 1: Write package and config files**

Create `package.json`:

```json
{
  "name": "recipe-book",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "prisma:generate": "prisma generate",
    "prisma:push": "prisma db push",
    "prisma:seed": "tsx prisma/seed.ts",
    "verify": "npm run lint && npm run typecheck && npm run test && npm run build"
  },
  "dependencies": {
    "@prisma/client": "latest",
    "clsx": "latest",
    "lucide-react": "latest",
    "next": "latest",
    "react": "latest",
    "react-dom": "latest",
    "react-markdown": "latest",
    "remark-gfm": "latest",
    "zod": "latest"
  },
  "devDependencies": {
    "@playwright/test": "latest",
    "@types/node": "latest",
    "@types/react": "latest",
    "@types/react-dom": "latest",
    "@vitejs/plugin-react": "latest",
    "eslint": "latest",
    "eslint-config-next": "latest",
    "jsdom": "latest",
    "prisma": "latest",
    "tsx": "latest",
    "typescript": "latest",
    "vitest": "latest"
  },
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "es2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

Create `next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;
```

Create `eslint.config.mjs`:

```js
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  globalIgnores([".next/**", "node_modules/**", "coverage/**"])
]);
```

Create `vitest.config.ts`:

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    globals: true,
    include: ["tests/**/*.test.ts"],
    testTimeout: 30000
  },
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname
    }
  }
});
```

Create `playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  timeout: 60000,
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry"
  },
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: true,
    timeout: 120000
  },
  projects: [
    {
      name: "mobile",
      use: { ...devices["Pixel 7"] }
    },
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
```

Create `.env.example`:

```dotenv
DATABASE_URL="file:./dev.db"
```

Update `.gitignore` so it contains these entries:

```gitignore
.DS_Store
node_modules/
.next/
dist/
coverage/
.env
.env.local
prisma/*.db
prisma/*.db-journal
prisma/*.db-wal
prisma/*.db-shm
test-results/
playwright-report/
public/uploads/*
!public/uploads/.gitkeep
```

Create `public/uploads/.gitkeep` as an empty file.

- [ ] **Step 2: Write the app shell**

Create `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Recipe Book",
  description: "Local recipe book for Kitchens, Recipes, and Ingredient blocks"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <header className="app-header">
          <Link href="/kitchens" className="brand">
            Recipe Book
          </Link>
          <nav className="top-nav" aria-label="Primary navigation">
            <Link href="/kitchens">Kitchens</Link>
            <Link href="/ingredients">Ingredients</Link>
          </nav>
        </header>
        <main className="app-main">{children}</main>
      </body>
    </html>
  );
}
```

Create `src/app/page.tsx`:

```tsx
import { redirect } from "next/navigation";

export default function HomePage() {
  redirect("/kitchens");
}
```

Create `src/app/globals.css`:

```css
:root {
  color-scheme: light;
  --bg: #f7f3ec;
  --surface: #ffffff;
  --surface-muted: #f0eee9;
  --text: #211f1a;
  --muted: #716b61;
  --border: #ddd5c8;
  --accent: #27745e;
  --accent-strong: #155744;
  --danger: #b42318;
  --shadow: 0 10px 30px rgba(29, 24, 18, 0.08);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: Arial, Helvetica, sans-serif;
  letter-spacing: 0;
}

a {
  color: inherit;
  text-decoration: none;
}

button,
input,
textarea,
select {
  font: inherit;
}

.app-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 18px;
  border-bottom: 1px solid var(--border);
  background: rgba(247, 243, 236, 0.94);
  backdrop-filter: blur(10px);
}

.brand {
  font-weight: 800;
}

.top-nav {
  display: flex;
  gap: 12px;
  color: var(--muted);
  font-size: 14px;
}

.app-main {
  width: min(1120px, 100%);
  margin: 0 auto;
  padding: 18px;
}

.page-header {
  display: grid;
  gap: 8px;
  margin-bottom: 18px;
}

.eyebrow {
  margin: 0;
  color: var(--accent);
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
}

.page-title {
  margin: 0;
  font-size: clamp(26px, 4vw, 42px);
  line-height: 1.08;
}

.muted {
  color: var(--muted);
}

.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}

@media (min-width: 720px) {
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1040px) {
  .grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.card {
  display: grid;
  gap: 10px;
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  box-shadow: var(--shadow);
}

.form {
  display: grid;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
}

.field {
  display: grid;
  gap: 6px;
}

.field label {
  font-size: 13px;
  font-weight: 700;
}

.input,
.textarea,
.select {
  width: 100%;
  min-height: 42px;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: #fff;
  color: var(--text);
}

.textarea {
  min-height: 120px;
  resize: vertical;
}

.button-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 42px;
  padding: 0 14px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: var(--accent);
  color: #fff;
  cursor: pointer;
  font-weight: 700;
}

.button.secondary {
  border-color: var(--border);
  background: var(--surface);
  color: var(--text);
}

.button.danger {
  background: var(--danger);
}

.media {
  width: 100%;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border-radius: 8px;
  background: var(--surface-muted);
}

.media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 9px;
  border-radius: 999px;
  background: var(--surface-muted);
  color: var(--muted);
  font-size: 13px;
}

.split {
  display: grid;
  gap: 14px;
}

@media (min-width: 980px) {
  .split {
    grid-template-columns: minmax(0, 1.3fr) minmax(280px, 0.7fr);
    align-items: start;
  }
}
```

- [ ] **Step 3: Install dependencies**

Run:

```bash
npm install
```

Expected: `package-lock.json` is created and dependencies install successfully.

- [ ] **Step 4: Verify the foundation**

Run:

```bash
npm run typecheck
npm run lint
```

Expected: both commands exit 0.

- [ ] **Step 5: Commit**

```bash
git add .gitignore .env.example package.json package-lock.json tsconfig.json next.config.ts eslint.config.mjs vitest.config.ts playwright.config.ts src/app/layout.tsx src/app/page.tsx src/app/globals.css public/uploads/.gitkeep
git commit -m "feat: scaffold next app"
```

## Task 2: Prisma Schema And Test Database

**Files:**
- Create: `prisma/schema.prisma`
- Create: `prisma/seed.ts`
- Create: `src/lib/db.ts`
- Create: `src/lib/paths.ts`
- Create: `tests/helpers/test-db.ts`

- [ ] **Step 1: Write the Prisma schema**

Create `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

enum KitchenType {
  PERSONAL
  STORE
}

enum Visibility {
  PRIVATE
  SHARED
}

enum ShareTargetType {
  RECIPE
  KITCHEN
}

enum SharePermission {
  VIEW
}

model Kitchen {
  id          String       @id @default(cuid())
  name        String
  description String       @default("")
  coverImage  String?
  type        KitchenType  @default(PERSONAL)
  visibility  Visibility   @default(PRIVATE)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  recipes     Recipe[]
  ingredients Ingredient[]

  @@index([updatedAt])
}

model Recipe {
  id                String             @id @default(cuid())
  kitchenId         String
  title             String
  description       String             @default("")
  coverImage        String?
  markdownContent   String             @default("")
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt
  kitchen           Kitchen            @relation(fields: [kitchenId], references: [id], onDelete: Cascade)
  recipeIngredients RecipeIngredient[]
  steps             RecipeStep[]

  @@index([kitchenId, updatedAt])
}

model Ingredient {
  id                String             @id @default(cuid())
  kitchenId         String
  name              String
  category          String             @default("")
  defaultUnit       String             @default("")
  description       String             @default("")
  allergenInfo      String             @default("")
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt
  kitchen           Kitchen            @relation(fields: [kitchenId], references: [id], onDelete: Cascade)
  recipeIngredients RecipeIngredient[]

  @@unique([kitchenId, name])
  @@index([kitchenId, updatedAt])
}

model RecipeIngredient {
  id           String     @id @default(cuid())
  recipeId     String
  ingredientId String
  amount       String     @default("")
  unit         String     @default("")
  note         String     @default("")
  order        Int        @default(0)
  recipe       Recipe     @relation(fields: [recipeId], references: [id], onDelete: Cascade)
  ingredient   Ingredient @relation(fields: [ingredientId], references: [id], onDelete: Restrict)

  @@unique([recipeId, ingredientId])
  @@index([ingredientId])
  @@index([recipeId, order])
}

model RecipeStep {
  id          String   @id @default(cuid())
  recipeId    String
  title       String   @default("")
  description String   @default("")
  order       Int      @default(0)
  recipe      Recipe   @relation(fields: [recipeId], references: [id], onDelete: Cascade)

  @@index([recipeId, order])
}

model ShareLink {
  id         String          @id @default(cuid())
  type       ShareTargetType
  targetId   String
  token      String          @unique
  permission SharePermission @default(VIEW)
  expiresAt  DateTime?
  createdAt  DateTime        @default(now())

  @@index([type, targetId])
}
```

- [ ] **Step 2: Write database and path helpers**

Create `src/lib/db.ts`:

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

Create `src/lib/paths.ts`:

```ts
export const paths = {
  kitchens: () => "/kitchens",
  kitchen: (kitchenId: string) => `/kitchens/${kitchenId}`,
  newRecipe: (kitchenId: string) => `/kitchens/${kitchenId}/recipes/new`,
  recipe: (kitchenId: string, recipeId: string) =>
    `/kitchens/${kitchenId}/recipes/${recipeId}`,
  ingredients: (kitchenId?: string) =>
    kitchenId ? `/ingredients?kitchenId=${kitchenId}` : "/ingredients",
  ingredient: (ingredientId: string) => `/ingredients/${ingredientId}`,
  shared: (token: string) => `/shared/${token}`
};
```

- [ ] **Step 3: Write the isolated test DB helper**

Create `tests/helpers/test-db.ts`:

```ts
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
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

  process.env.DATABASE_URL = databaseUrl;
  execFileSync("npx", ["prisma", "db", "push", "--skip-generate"], {
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: "ignore"
  });

  const db = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl
      }
    }
  });

  try {
    return await run(db);
  } finally {
    await db.$disconnect();
    if (previousUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = previousUrl;
    }
    rmSync(dir, { recursive: true, force: true });
  }
}
```

- [ ] **Step 4: Write seed data**

Create `prisma/seed.ts`:

```ts
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const kitchen = await db.kitchen.upsert({
    where: { id: "seed-kitchen" },
    update: {},
    create: {
      id: "seed-kitchen",
      name: "My Kitchen",
      description: "Local sample recipe book",
      type: "PERSONAL"
    }
  });

  const gochujang = await db.ingredient.upsert({
    where: {
      kitchenId_name: {
        kitchenId: kitchen.id,
        name: "고추장"
      }
    },
    update: {},
    create: {
      kitchenId: kitchen.id,
      name: "고추장",
      category: "Sauce",
      defaultUnit: "tbsp",
      description: "매콤한 한식 양념장"
    }
  });

  const recipe = await db.recipe.upsert({
    where: { id: "seed-recipe" },
    update: {},
    create: {
      id: "seed-recipe",
      kitchenId: kitchen.id,
      title: "제육볶음",
      description: "고추장 양념 돼지고기 볶음",
      markdownContent: "## 조리 메모\n\n- 센 불에서 빠르게 볶기\n- 양파는 마지막에 넣기"
    }
  });

  await db.recipeIngredient.upsert({
    where: {
      recipeId_ingredientId: {
        recipeId: recipe.id,
        ingredientId: gochujang.id
      }
    },
    update: {
      amount: "2",
      unit: "tbsp",
      note: "양념 베이스",
      order: 1
    },
    create: {
      recipeId: recipe.id,
      ingredientId: gochujang.id,
      amount: "2",
      unit: "tbsp",
      note: "양념 베이스",
      order: 1
    }
  });
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await db.$disconnect();
    process.exit(1);
  });
```

- [ ] **Step 5: Generate Prisma and push schema**

Run:

```bash
cp .env.example .env
npm run prisma:generate
npm run prisma:push
npm run prisma:seed
```

Expected: Prisma Client is generated, `prisma/dev.db` is created locally, and seed data is inserted.

- [ ] **Step 6: Verify schema and tests can start**

Run:

```bash
npx prisma validate
npm run typecheck
```

Expected: both commands exit 0.

- [ ] **Step 7: Commit**

```bash
git add .env.example package.json package-lock.json prisma/schema.prisma prisma/seed.ts src/lib/db.ts src/lib/paths.ts tests/helpers/test-db.ts
git commit -m "feat: add prisma schema"
```

## Task 3: Kitchen Domain And Pages

**Files:**
- Create: `src/features/kitchens/data.ts`
- Create: `src/features/kitchens/actions.ts`
- Create: `tests/kitchens.test.ts`
- Create: `src/app/kitchens/page.tsx`

- [ ] **Step 1: Write failing Kitchen data tests**

Create `tests/kitchens.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createKitchen, deleteKitchen, listKitchens, updateKitchen } from "@/features/kitchens/data";
import { withTestDb } from "./helpers/test-db";

describe("kitchen data", () => {
  it("creates, lists, updates, and deletes a kitchen", async () => {
    await withTestDb(async (db) => {
      const created = await createKitchen(
        {
          name: "OO식당 Kitchen",
          description: "매장용 레시피북",
          type: "STORE",
          visibility: "PRIVATE"
        },
        db
      );

      expect(created.name).toBe("OO식당 Kitchen");

      const list = await listKitchens(db);
      expect(list).toHaveLength(1);
      expect(list[0].description).toBe("매장용 레시피북");

      const updated = await updateKitchen(
        created.id,
        {
          name: "OO식당 본점",
          description: "본점 레시피북",
          type: "STORE",
          visibility: "PRIVATE"
        },
        db
      );
      expect(updated.name).toBe("OO식당 본점");

      await deleteKitchen(created.id, db);
      await expect(listKitchens(db)).resolves.toHaveLength(0);
    });
  });

  it("rejects an empty kitchen name", async () => {
    await withTestDb(async (db) => {
      await expect(
        createKitchen(
          {
            name: "",
            description: "",
            type: "PERSONAL",
            visibility: "PRIVATE"
          },
          db
        )
      ).rejects.toThrow("Kitchen name is required");
    });
  });
});
```

- [ ] **Step 2: Run the failing Kitchen tests**

Run:

```bash
npm run test -- tests/kitchens.test.ts
```

Expected: FAIL because `src/features/kitchens/data.ts` does not exist.

- [ ] **Step 3: Implement Kitchen data functions**

Create `src/features/kitchens/data.ts`:

```ts
import type { KitchenType, PrismaClient, Visibility } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";

type Db = PrismaClient;

const kitchenInputSchema = z.object({
  name: z.string().trim().min(1, "Kitchen name is required"),
  description: z.string().trim().optional().default(""),
  coverImage: z.string().trim().optional().nullable(),
  type: z.enum(["PERSONAL", "STORE"]).default("PERSONAL"),
  visibility: z.enum(["PRIVATE", "SHARED"]).default("PRIVATE")
});

export type KitchenInput = z.input<typeof kitchenInputSchema>;

export async function listKitchens(db: Db = prisma) {
  return db.kitchen.findMany({
    orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
    include: {
      _count: {
        select: {
          recipes: true,
          ingredients: true
        }
      }
    }
  });
}

export async function getKitchen(id: string, db: Db = prisma) {
  return db.kitchen.findUnique({
    where: { id },
    include: {
      recipes: {
        orderBy: [{ updatedAt: "desc" }],
        include: {
          recipeIngredients: {
            take: 4,
            orderBy: { order: "asc" },
            include: { ingredient: true }
          }
        }
      },
      ingredients: {
        orderBy: { name: "asc" }
      }
    }
  });
}

export async function createKitchen(input: KitchenInput, db: Db = prisma) {
  const parsed = kitchenInputSchema.parse(input);
  return db.kitchen.create({
    data: {
      name: parsed.name,
      description: parsed.description,
      coverImage: parsed.coverImage || null,
      type: parsed.type as KitchenType,
      visibility: parsed.visibility as Visibility
    }
  });
}

export async function updateKitchen(id: string, input: KitchenInput, db: Db = prisma) {
  const parsed = kitchenInputSchema.parse(input);
  return db.kitchen.update({
    where: { id },
    data: {
      name: parsed.name,
      description: parsed.description,
      coverImage: parsed.coverImage || null,
      type: parsed.type as KitchenType,
      visibility: parsed.visibility as Visibility
    }
  });
}

export async function deleteKitchen(id: string, db: Db = prisma) {
  return db.kitchen.delete({
    where: { id }
  });
}
```

- [ ] **Step 4: Run Kitchen tests**

Run:

```bash
npm run test -- tests/kitchens.test.ts
```

Expected: PASS.

- [ ] **Step 5: Implement Kitchen server actions**

Create `src/features/kitchens/actions.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createKitchen, deleteKitchen, updateKitchen } from "./data";
import { paths } from "@/lib/paths";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

export async function createKitchenAction(formData: FormData) {
  const kitchen = await createKitchen({
    name: value(formData, "name"),
    description: value(formData, "description"),
    type: value(formData, "type") === "STORE" ? "STORE" : "PERSONAL",
    visibility: "PRIVATE"
  });
  revalidatePath(paths.kitchens());
  redirect(paths.kitchen(kitchen.id));
}

export async function updateKitchenAction(kitchenId: string, formData: FormData) {
  await updateKitchen(kitchenId, {
    name: value(formData, "name"),
    description: value(formData, "description"),
    type: value(formData, "type") === "STORE" ? "STORE" : "PERSONAL",
    visibility: value(formData, "visibility") === "SHARED" ? "SHARED" : "PRIVATE"
  });
  revalidatePath(paths.kitchen(kitchenId));
  revalidatePath(paths.kitchens());
}

export async function deleteKitchenAction(kitchenId: string) {
  await deleteKitchen(kitchenId);
  revalidatePath(paths.kitchens());
  redirect(paths.kitchens());
}
```

- [ ] **Step 6: Implement the Kitchen list page**

Create `src/app/kitchens/page.tsx`:

```tsx
import { Plus } from "lucide-react";
import Link from "next/link";
import { createKitchenAction } from "@/features/kitchens/actions";
import { listKitchens } from "@/features/kitchens/data";
import { paths } from "@/lib/paths";

export default async function KitchensPage() {
  const kitchens = await listKitchens();

  return (
    <>
      <section className="page-header">
        <p className="eyebrow">Recipe archive</p>
        <h1 className="page-title">Kitchens</h1>
        <p className="muted">레시피를 Kitchen 단위로 묶고 관리합니다.</p>
      </section>

      <section className="split">
        <form action={createKitchenAction} className="form">
          <h2>New Kitchen</h2>
          <div className="field">
            <label htmlFor="name">Kitchen 이름</label>
            <input className="input" id="name" name="name" required />
          </div>
          <div className="field">
            <label htmlFor="description">설명</label>
            <textarea className="textarea" id="description" name="description" />
          </div>
          <div className="field">
            <label htmlFor="type">구분</label>
            <select className="select" id="type" name="type" defaultValue="PERSONAL">
              <option value="PERSONAL">개인용</option>
              <option value="STORE">매장용</option>
            </select>
          </div>
          <button className="button" type="submit">
            <Plus size={18} aria-hidden="true" />
            Kitchen 생성
          </button>
        </form>

        <div className="grid">
          {kitchens.map((kitchen) => (
            <Link href={paths.kitchen(kitchen.id)} className="card" key={kitchen.id}>
              <h2>{kitchen.name}</h2>
              <p className="muted">{kitchen.description || "설명이 없습니다."}</p>
              <div className="tag-row">
                <span className="tag">{kitchen.type === "STORE" ? "매장용" : "개인용"}</span>
                <span className="tag">Recipes {kitchen._count.recipes}</span>
                <span className="tag">Ingredients {kitchen._count.ingredients}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
```

- [ ] **Step 7: Verify Kitchen page compiles**

Run:

```bash
npm run typecheck
npm run lint
npm run test -- tests/kitchens.test.ts
```

Expected: all commands exit 0.

- [ ] **Step 8: Commit**

```bash
git add src/features/kitchens/data.ts src/features/kitchens/actions.ts tests/kitchens.test.ts src/app/kitchens/page.tsx
git commit -m "feat: add kitchen management"
```

## Task 4: Ingredient Domain And Pages

**Files:**
- Create: `src/features/ingredients/data.ts`
- Create: `src/features/ingredients/actions.ts`
- Create: `tests/ingredients.test.ts`
- Create: `src/app/ingredients/page.tsx`
- Create: `src/app/ingredients/[id]/page.tsx`

- [ ] **Step 1: Write failing Ingredient relationship tests**

Create `tests/ingredients.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createKitchen } from "@/features/kitchens/data";
import {
  createIngredient,
  getIngredientWithRecipes,
  listIngredients
} from "@/features/ingredients/data";
import { withTestDb } from "./helpers/test-db";

describe("ingredient data", () => {
  it("creates ingredients per kitchen and lists them by kitchen", async () => {
    await withTestDb(async (db) => {
      const kitchen = await createKitchen({ name: "My Kitchen" }, db);
      await createIngredient(
        {
          kitchenId: kitchen.id,
          name: "고추장",
          category: "Sauce",
          defaultUnit: "tbsp",
          description: "매운 양념",
          allergenInfo: ""
        },
        db
      );

      const ingredients = await listIngredients({ kitchenId: kitchen.id }, db);
      expect(ingredients).toHaveLength(1);
      expect(ingredients[0].name).toBe("고추장");
    });
  });

  it("shows recipes connected to an ingredient", async () => {
    await withTestDb(async (db) => {
      const kitchen = await createKitchen({ name: "Store Kitchen" }, db);
      const ingredient = await createIngredient(
        {
          kitchenId: kitchen.id,
          name: "간장",
          category: "Sauce",
          defaultUnit: "ml",
          description: "",
          allergenInfo: "대두"
        },
        db
      );
      const recipe = await db.recipe.create({
        data: {
          kitchenId: kitchen.id,
          title: "간장 닭갈비",
          recipeIngredients: {
            create: {
              ingredientId: ingredient.id,
              amount: "60",
              unit: "ml",
              order: 1
            }
          }
        }
      });

      const detail = await getIngredientWithRecipes(ingredient.id, db);
      expect(detail?.recipeIngredients).toHaveLength(1);
      expect(detail?.recipeIngredients[0].recipe.title).toBe(recipe.title);
    });
  });
});
```

- [ ] **Step 2: Run the failing Ingredient tests**

Run:

```bash
npm run test -- tests/ingredients.test.ts
```

Expected: FAIL because `src/features/ingredients/data.ts` does not exist.

- [ ] **Step 3: Implement Ingredient data functions**

Create `src/features/ingredients/data.ts`:

```ts
import type { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";

type Db = PrismaClient;

const ingredientInputSchema = z.object({
  kitchenId: z.string().min(1, "Kitchen is required"),
  name: z.string().trim().min(1, "Ingredient name is required"),
  category: z.string().trim().optional().default(""),
  defaultUnit: z.string().trim().optional().default(""),
  description: z.string().trim().optional().default(""),
  allergenInfo: z.string().trim().optional().default("")
});

export type IngredientInput = z.input<typeof ingredientInputSchema>;

export async function listIngredients(
  filters: { kitchenId?: string; query?: string } = {},
  db: Db = prisma
) {
  return db.ingredient.findMany({
    where: {
      kitchenId: filters.kitchenId || undefined,
      name: filters.query
        ? {
            contains: filters.query
          }
        : undefined
    },
    orderBy: [{ name: "asc" }]
  });
}

export async function getIngredientWithRecipes(id: string, db: Db = prisma) {
  return db.ingredient.findUnique({
    where: { id },
    include: {
      kitchen: true,
      recipeIngredients: {
        orderBy: { recipe: { updatedAt: "desc" } },
        include: {
          recipe: {
            include: {
              kitchen: true
            }
          }
        }
      }
    }
  });
}

export async function createIngredient(input: IngredientInput, db: Db = prisma) {
  const parsed = ingredientInputSchema.parse(input);
  return db.ingredient.create({
    data: parsed
  });
}

export async function updateIngredient(id: string, input: IngredientInput, db: Db = prisma) {
  const parsed = ingredientInputSchema.parse(input);
  return db.ingredient.update({
    where: { id },
    data: parsed
  });
}

export async function deleteIngredient(id: string, db: Db = prisma) {
  return db.ingredient.delete({
    where: { id }
  });
}
```

- [ ] **Step 4: Run Ingredient tests**

Run:

```bash
npm run test -- tests/ingredients.test.ts
```

Expected: PASS.

- [ ] **Step 5: Implement Ingredient server actions**

Create `src/features/ingredients/actions.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createIngredient, deleteIngredient, updateIngredient } from "./data";
import { paths } from "@/lib/paths";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

export async function createIngredientAction(formData: FormData) {
  const ingredient = await createIngredient({
    kitchenId: value(formData, "kitchenId"),
    name: value(formData, "name"),
    category: value(formData, "category"),
    defaultUnit: value(formData, "defaultUnit"),
    description: value(formData, "description"),
    allergenInfo: value(formData, "allergenInfo")
  });
  revalidatePath(paths.ingredients(ingredient.kitchenId));
  redirect(paths.ingredient(ingredient.id));
}

export async function updateIngredientAction(ingredientId: string, formData: FormData) {
  const ingredient = await updateIngredient(ingredientId, {
    kitchenId: value(formData, "kitchenId"),
    name: value(formData, "name"),
    category: value(formData, "category"),
    defaultUnit: value(formData, "defaultUnit"),
    description: value(formData, "description"),
    allergenInfo: value(formData, "allergenInfo")
  });
  revalidatePath(paths.ingredient(ingredient.id));
  revalidatePath(paths.ingredients(ingredient.kitchenId));
}

export async function deleteIngredientAction(ingredientId: string) {
  await deleteIngredient(ingredientId);
  revalidatePath(paths.ingredients());
  redirect(paths.ingredients());
}
```

- [ ] **Step 6: Implement Ingredient pages**

Create `src/app/ingredients/page.tsx` with Kitchen filtering and create form:

```tsx
import { Plus } from "lucide-react";
import Link from "next/link";
import { createIngredientAction } from "@/features/ingredients/actions";
import { listIngredients } from "@/features/ingredients/data";
import { listKitchens } from "@/features/kitchens/data";
import { paths } from "@/lib/paths";

export default async function IngredientsPage({
  searchParams
}: {
  searchParams: Promise<{ kitchenId?: string; q?: string }>;
}) {
  const params = await searchParams;
  const kitchens = await listKitchens();
  const selectedKitchenId = params.kitchenId || kitchens[0]?.id;
  const ingredients = await listIngredients({
    kitchenId: selectedKitchenId,
    query: params.q
  });

  return (
    <>
      <section className="page-header">
        <p className="eyebrow">Ingredient blocks</p>
        <h1 className="page-title">Ingredients</h1>
        <p className="muted">재사용 가능한 재료 블록을 관리합니다.</p>
      </section>

      <section className="split">
        <form action={createIngredientAction} className="form">
          <h2>New Ingredient</h2>
          <div className="field">
            <label htmlFor="kitchenId">Kitchen</label>
            <select className="select" id="kitchenId" name="kitchenId" defaultValue={selectedKitchenId}>
              {kitchens.map((kitchen) => (
                <option value={kitchen.id} key={kitchen.id}>
                  {kitchen.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="name">재료명</label>
            <input className="input" id="name" name="name" required />
          </div>
          <div className="field">
            <label htmlFor="category">카테고리</label>
            <input className="input" id="category" name="category" />
          </div>
          <div className="field">
            <label htmlFor="defaultUnit">기본 단위</label>
            <input className="input" id="defaultUnit" name="defaultUnit" />
          </div>
          <div className="field">
            <label htmlFor="description">설명</label>
            <textarea className="textarea" id="description" name="description" />
          </div>
          <div className="field">
            <label htmlFor="allergenInfo">알레르기 정보</label>
            <input className="input" id="allergenInfo" name="allergenInfo" />
          </div>
          <button className="button" type="submit">
            <Plus size={18} aria-hidden="true" />
            재료 생성
          </button>
        </form>

        <div className="grid">
          {ingredients.map((ingredient) => (
            <Link className="card" href={paths.ingredient(ingredient.id)} key={ingredient.id}>
              <h2>{ingredient.name}</h2>
              <p className="muted">{ingredient.description || "설명이 없습니다."}</p>
              <div className="tag-row">
                {ingredient.category && <span className="tag">{ingredient.category}</span>}
                {ingredient.defaultUnit && <span className="tag">{ingredient.defaultUnit}</span>}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
```

Create `src/app/ingredients/[id]/page.tsx`:

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { getIngredientWithRecipes } from "@/features/ingredients/data";
import { paths } from "@/lib/paths";

export default async function IngredientDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ingredient = await getIngredientWithRecipes(id);

  if (!ingredient) {
    notFound();
  }

  return (
    <>
      <section className="page-header">
        <p className="eyebrow">{ingredient.kitchen.name}</p>
        <h1 className="page-title">{ingredient.name}</h1>
        <p className="muted">{ingredient.description || "설명이 없습니다."}</p>
      </section>

      <section className="split">
        <article className="card">
          <h2>재료 정보</h2>
          <div className="tag-row">
            {ingredient.category && <span className="tag">{ingredient.category}</span>}
            {ingredient.defaultUnit && <span className="tag">기본 단위 {ingredient.defaultUnit}</span>}
            {ingredient.allergenInfo && <span className="tag">알레르기 {ingredient.allergenInfo}</span>}
          </div>
        </article>

        <section className="grid">
          {ingredient.recipeIngredients.map((item) => (
            <Link
              className="card"
              href={paths.recipe(item.recipe.kitchenId, item.recipe.id)}
              key={item.id}
            >
              <h2>{item.recipe.title}</h2>
              <p className="muted">{item.recipe.description || item.recipe.kitchen.name}</p>
              <span className="tag">
                {[item.amount, item.unit].filter(Boolean).join(" ") || "수량 없음"}
              </span>
            </Link>
          ))}
        </section>
      </section>
    </>
  );
}
```

- [ ] **Step 7: Verify Ingredient flow**

Run:

```bash
npm run typecheck
npm run lint
npm run test -- tests/ingredients.test.ts
```

Expected: all commands exit 0.

- [ ] **Step 8: Commit**

```bash
git add src/features/ingredients/data.ts src/features/ingredients/actions.ts tests/ingredients.test.ts src/app/ingredients/page.tsx src/app/ingredients/[id]/page.tsx
git commit -m "feat: add ingredient blocks"
```

## Task 5: Uploads, Markdown, And Shared UI Components

**Files:**
- Create: `src/lib/uploads.ts`
- Create: `src/lib/form.ts`
- Create: `src/components/ui/SubmitButton.tsx`
- Create: `src/components/ui/ConfirmSubmitButton.tsx`
- Create: `src/components/ImageField.tsx`
- Create: `src/components/MarkdownPreview.tsx`

- [ ] **Step 1: Implement local upload helper**

Create `src/lib/uploads.ts`:

```ts
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

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
```

- [ ] **Step 2: Implement form helper**

Create `src/lib/form.ts`:

```ts
export function formValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

export function formFile(formData: FormData, key: string) {
  const value = formData.get(key);
  return value instanceof File ? value : null;
}

export function orderedValues(formData: FormData, key: string) {
  return formData.getAll(key).map((value) => String(value));
}
```

- [ ] **Step 3: Implement client submit components**

Create `src/components/ui/SubmitButton.tsx`:

```tsx
"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button className="button" type="submit" disabled={pending}>
      {pending && <Loader2 size={18} aria-hidden="true" />}
      {children}
    </button>
  );
}
```

Create `src/components/ui/ConfirmSubmitButton.tsx`:

```tsx
"use client";

export function ConfirmSubmitButton({
  children,
  message
}: {
  children: React.ReactNode;
  message: string;
}) {
  return (
    <button
      className="button danger"
      type="submit"
      onClick={(event) => {
        if (!window.confirm(message)) {
          event.preventDefault();
        }
      }}
    >
      {children}
    </button>
  );
}
```

- [ ] **Step 4: Implement image and Markdown components**

Create `src/components/ImageField.tsx`:

```tsx
export function ImageField({ currentImage }: { currentImage?: string | null }) {
  return (
    <div className="field">
      <label htmlFor="coverImage">대표 이미지</label>
      {currentImage && (
        <div className="media">
          <img src={currentImage} alt="" />
        </div>
      )}
      <input className="input" id="coverImage" name="coverImage" type="file" accept="image/*" />
    </div>
  );
}
```

Create `src/components/MarkdownPreview.tsx`:

```tsx
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownPreview({ content }: { content: string }) {
  if (!content.trim()) {
    return <p className="muted">Markdown 내용이 없습니다.</p>;
  }

  return (
    <article className="markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </article>
  );
}
```

- [ ] **Step 5: Add Markdown styles**

Append to `src/app/globals.css`:

```css
.markdown {
  display: grid;
  gap: 10px;
  line-height: 1.65;
}

.markdown h1,
.markdown h2,
.markdown h3 {
  margin: 14px 0 4px;
}

.markdown ul,
.markdown ol {
  padding-left: 22px;
}

.markdown table {
  width: 100%;
  border-collapse: collapse;
  overflow-x: auto;
}

.markdown th,
.markdown td {
  padding: 8px;
  border: 1px solid var(--border);
  text-align: left;
}

.markdown blockquote {
  margin: 0;
  padding-left: 12px;
  border-left: 4px solid var(--accent);
  color: var(--muted);
}
```

- [ ] **Step 6: Verify components**

Run:

```bash
npm run typecheck
npm run lint
```

Expected: both commands exit 0.

- [ ] **Step 7: Commit**

```bash
git add src/lib/uploads.ts src/lib/form.ts src/components/ui/SubmitButton.tsx src/components/ui/ConfirmSubmitButton.tsx src/components/ImageField.tsx src/components/MarkdownPreview.tsx src/app/globals.css
git commit -m "feat: add upload and markdown helpers"
```

## Task 6: Recipe Domain And Editing Pages

**Files:**
- Create: `src/features/recipes/data.ts`
- Create: `src/features/recipes/actions.ts`
- Create: `tests/recipes.test.ts`
- Create: `src/app/kitchens/[id]/page.tsx`
- Create: `src/app/kitchens/[id]/recipes/new/page.tsx`
- Create: `src/app/kitchens/[id]/recipes/[recipeId]/page.tsx`

- [ ] **Step 1: Write failing Recipe tests**

Create `tests/recipes.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createIngredient } from "@/features/ingredients/data";
import { createKitchen } from "@/features/kitchens/data";
import { createRecipe, getRecipeDetail, updateRecipe } from "@/features/recipes/data";
import { withTestDb } from "./helpers/test-db";

describe("recipe data", () => {
  it("creates a recipe with ordered ingredient blocks and steps", async () => {
    await withTestDb(async (db) => {
      const kitchen = await createKitchen({ name: "My Kitchen" }, db);
      const chicken = await createIngredient({ kitchenId: kitchen.id, name: "닭다리살" }, db);
      const butter = await createIngredient({ kitchenId: kitchen.id, name: "버터" }, db);

      const recipe = await createRecipe(
        {
          kitchenId: kitchen.id,
          title: "크림 치킨",
          description: "팬 하나로 만드는 메뉴",
          markdownContent: "## 메모\n약불 유지",
          ingredients: [
            { ingredientId: chicken.id, amount: "300", unit: "g", note: "한입 크기", order: 1 },
            { ingredientId: butter.id, amount: "20", unit: "g", note: "약불", order: 2 }
          ],
          steps: [
            { title: "손질", description: "닭다리살을 자른다.", order: 1 },
            { title: "조리", description: "버터에 굽는다.", order: 2 }
          ]
        },
        db
      );

      const detail = await getRecipeDetail(recipe.id, db);
      expect(detail?.recipeIngredients.map((item) => item.ingredient.name)).toEqual([
        "닭다리살",
        "버터"
      ]);
      expect(detail?.steps.map((step) => step.title)).toEqual(["손질", "조리"]);
    });
  });

  it("replaces recipe ingredient rows when updating", async () => {
    await withTestDb(async (db) => {
      const kitchen = await createKitchen({ name: "My Kitchen" }, db);
      const salt = await createIngredient({ kitchenId: kitchen.id, name: "소금" }, db);
      const pepper = await createIngredient({ kitchenId: kitchen.id, name: "후추" }, db);
      const recipe = await createRecipe(
        {
          kitchenId: kitchen.id,
          title: "시즈닝",
          ingredients: [{ ingredientId: salt.id, amount: "1", unit: "tsp", note: "", order: 1 }],
          steps: []
        },
        db
      );

      await updateRecipe(
        recipe.id,
        {
          kitchenId: kitchen.id,
          title: "기본 시즈닝",
          description: "",
          markdownContent: "",
          ingredients: [{ ingredientId: pepper.id, amount: "1", unit: "tsp", note: "", order: 1 }],
          steps: []
        },
        db
      );

      const detail = await getRecipeDetail(recipe.id, db);
      expect(detail?.recipeIngredients).toHaveLength(1);
      expect(detail?.recipeIngredients[0].ingredient.name).toBe("후추");
    });
  });
});
```

- [ ] **Step 2: Run the failing Recipe tests**

Run:

```bash
npm run test -- tests/recipes.test.ts
```

Expected: FAIL because `src/features/recipes/data.ts` does not exist.

- [ ] **Step 3: Implement Recipe data functions**

Create `src/features/recipes/data.ts`:

```ts
import type { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";

type Db = PrismaClient;

const recipeIngredientInputSchema = z.object({
  ingredientId: z.string().min(1),
  amount: z.string().trim().optional().default(""),
  unit: z.string().trim().optional().default(""),
  note: z.string().trim().optional().default(""),
  order: z.number().int().nonnegative()
});

const recipeStepInputSchema = z.object({
  title: z.string().trim().optional().default(""),
  description: z.string().trim().optional().default(""),
  order: z.number().int().nonnegative()
});

const recipeInputSchema = z.object({
  kitchenId: z.string().min(1, "Kitchen is required"),
  title: z.string().trim().min(1, "Recipe title is required"),
  description: z.string().trim().optional().default(""),
  coverImage: z.string().trim().optional().nullable(),
  markdownContent: z.string().optional().default(""),
  ingredients: z.array(recipeIngredientInputSchema).default([]),
  steps: z.array(recipeStepInputSchema).default([])
});

export type RecipeInput = z.input<typeof recipeInputSchema>;

export async function listRecipesForKitchen(kitchenId: string, db: Db = prisma) {
  return db.recipe.findMany({
    where: { kitchenId },
    orderBy: [{ updatedAt: "desc" }],
    include: {
      recipeIngredients: {
        take: 4,
        orderBy: { order: "asc" },
        include: { ingredient: true }
      }
    }
  });
}

export async function getRecipeDetail(id: string, db: Db = prisma) {
  return db.recipe.findUnique({
    where: { id },
    include: {
      kitchen: true,
      recipeIngredients: {
        orderBy: { order: "asc" },
        include: { ingredient: true }
      },
      steps: {
        orderBy: { order: "asc" }
      }
    }
  });
}

export async function createRecipe(input: RecipeInput, db: Db = prisma) {
  const parsed = recipeInputSchema.parse(input);
  return db.recipe.create({
    data: {
      kitchenId: parsed.kitchenId,
      title: parsed.title,
      description: parsed.description,
      coverImage: parsed.coverImage || null,
      markdownContent: parsed.markdownContent,
      recipeIngredients: {
        create: parsed.ingredients.map((item) => ({
          ingredientId: item.ingredientId,
          amount: item.amount,
          unit: item.unit,
          note: item.note,
          order: item.order
        }))
      },
      steps: {
        create: parsed.steps.map((step) => ({
          title: step.title,
          description: step.description,
          order: step.order
        }))
      }
    }
  });
}

export async function updateRecipe(id: string, input: RecipeInput, db: Db = prisma) {
  const parsed = recipeInputSchema.parse(input);
  await db.recipeIngredient.deleteMany({ where: { recipeId: id } });
  await db.recipeStep.deleteMany({ where: { recipeId: id } });
  return db.recipe.update({
    where: { id },
    data: {
      kitchenId: parsed.kitchenId,
      title: parsed.title,
      description: parsed.description,
      coverImage: parsed.coverImage || null,
      markdownContent: parsed.markdownContent,
      recipeIngredients: {
        create: parsed.ingredients.map((item) => ({
          ingredientId: item.ingredientId,
          amount: item.amount,
          unit: item.unit,
          note: item.note,
          order: item.order
        }))
      },
      steps: {
        create: parsed.steps.map((step) => ({
          title: step.title,
          description: step.description,
          order: step.order
        }))
      }
    }
  });
}

export async function deleteRecipe(id: string, db: Db = prisma) {
  return db.recipe.delete({
    where: { id }
  });
}
```

- [ ] **Step 4: Run Recipe tests**

Run:

```bash
npm run test -- tests/recipes.test.ts
```

Expected: PASS.

- [ ] **Step 5: Implement Recipe server actions**

Create `src/features/recipes/actions.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { formFile, formValue, orderedValues } from "@/lib/form";
import { paths } from "@/lib/paths";
import { saveUpload } from "@/lib/uploads";
import { createRecipe, deleteRecipe, updateRecipe } from "./data";

function recipeInputFromForm(formData: FormData, imagePath: string | null) {
  const ingredientIds = orderedValues(formData, "ingredientId").filter(Boolean);
  const amounts = orderedValues(formData, "amount");
  const units = orderedValues(formData, "unit");
  const notes = orderedValues(formData, "note");
  const stepTitles = orderedValues(formData, "stepTitle");
  const stepDescriptions = orderedValues(formData, "stepDescription");

  return {
    kitchenId: formValue(formData, "kitchenId"),
    title: formValue(formData, "title"),
    description: formValue(formData, "description"),
    coverImage: imagePath || formValue(formData, "existingCoverImage") || null,
    markdownContent: formValue(formData, "markdownContent"),
    ingredients: ingredientIds.map((ingredientId, index) => ({
      ingredientId,
      amount: amounts[index] || "",
      unit: units[index] || "",
      note: notes[index] || "",
      order: index + 1
    })),
    steps: stepTitles
      .map((title, index) => ({
        title,
        description: stepDescriptions[index] || "",
        order: index + 1
      }))
      .filter((step) => step.title.trim() || step.description.trim())
  };
}

export async function createRecipeAction(formData: FormData) {
  const imagePath = await saveUpload(formFile(formData, "coverImage"));
  const recipe = await createRecipe(recipeInputFromForm(formData, imagePath));
  revalidatePath(paths.kitchen(recipe.kitchenId));
  redirect(paths.recipe(recipe.kitchenId, recipe.id));
}

export async function updateRecipeAction(recipeId: string, formData: FormData) {
  const imagePath = await saveUpload(formFile(formData, "coverImage"));
  const recipe = await updateRecipe(recipeId, recipeInputFromForm(formData, imagePath));
  revalidatePath(paths.recipe(recipe.kitchenId, recipe.id));
  revalidatePath(paths.kitchen(recipe.kitchenId));
}

export async function deleteRecipeAction(recipeId: string, kitchenId: string) {
  await deleteRecipe(recipeId);
  revalidatePath(paths.kitchen(kitchenId));
  redirect(paths.kitchen(kitchenId));
}
```

- [ ] **Step 6: Implement Kitchen recipe gallery page**

Create `src/app/kitchens/[id]/page.tsx`:

```tsx
import { Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getKitchen } from "@/features/kitchens/data";
import { paths } from "@/lib/paths";

export default async function KitchenDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const kitchen = await getKitchen(id);

  if (!kitchen) {
    notFound();
  }

  return (
    <>
      <section className="page-header">
        <p className="eyebrow">{kitchen.type === "STORE" ? "Store Kitchen" : "Personal Kitchen"}</p>
        <h1 className="page-title">{kitchen.name}</h1>
        <p className="muted">{kitchen.description || "설명이 없습니다."}</p>
        <div className="button-row">
          <Link className="button" href={paths.newRecipe(kitchen.id)}>
            <Plus size={18} aria-hidden="true" />
            Recipe 생성
          </Link>
          <Link className="button secondary" href={paths.ingredients(kitchen.id)}>
            재료 보기
          </Link>
        </div>
      </section>

      <section className="grid">
        {kitchen.recipes.map((recipe) => (
          <Link className="card" href={paths.recipe(kitchen.id, recipe.id)} key={recipe.id}>
            <div className="media">
              {recipe.coverImage && (
                <Image src={recipe.coverImage} alt="" width={600} height={450} />
              )}
            </div>
            <h2>{recipe.title}</h2>
            <p className="muted">{recipe.description || "설명이 없습니다."}</p>
            <div className="tag-row">
              {recipe.recipeIngredients.map((item) => (
                <span className="tag" key={item.id}>
                  {item.ingredient.name}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </section>
    </>
  );
}
```

- [ ] **Step 7: Implement new recipe and edit recipe pages**

Create `src/app/kitchens/[id]/recipes/new/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { ImageField } from "@/components/ImageField";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { createRecipeAction } from "@/features/recipes/actions";
import { listIngredients } from "@/features/ingredients/data";
import { getKitchen } from "@/features/kitchens/data";

export default async function NewRecipePage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const kitchen = await getKitchen(id);
  if (!kitchen) notFound();
  const ingredients = await listIngredients({ kitchenId: id });

  return (
    <>
      <section className="page-header">
        <p className="eyebrow">{kitchen.name}</p>
        <h1 className="page-title">New Recipe</h1>
      </section>

      <form action={createRecipeAction} className="form">
        <input type="hidden" name="kitchenId" value={id} />
        <ImageField />
        <div className="field">
          <label htmlFor="title">메뉴명</label>
          <input className="input" id="title" name="title" required />
        </div>
        <div className="field">
          <label htmlFor="description">간단 설명</label>
          <textarea className="textarea" id="description" name="description" />
        </div>
        <h2>재료 블록</h2>
        {[0, 1, 2, 3, 4].map((index) => (
          <div className="grid" key={index}>
            <select className="select" name="ingredientId" defaultValue="">
              <option value="">재료 선택</option>
              {ingredients.map((ingredient) => (
                <option value={ingredient.id} key={ingredient.id}>
                  {ingredient.name}
                </option>
              ))}
            </select>
            <input className="input" name="amount" placeholder="수량" />
            <input className="input" name="unit" placeholder="단위" />
            <input className="input" name="note" placeholder="메모" />
          </div>
        ))}
        <h2>조리 순서</h2>
        {[0, 1, 2, 3].map((index) => (
          <div className="grid" key={index}>
            <input className="input" name="stepTitle" placeholder={`Step ${index + 1}`} />
            <textarea className="textarea" name="stepDescription" placeholder="설명" />
          </div>
        ))}
        <div className="field">
          <label htmlFor="markdownContent">Markdown 본문</label>
          <textarea className="textarea" id="markdownContent" name="markdownContent" />
        </div>
        <SubmitButton>Recipe 저장</SubmitButton>
      </form>
    </>
  );
}
```

Create `src/app/kitchens/[id]/recipes/[recipeId]/page.tsx`:

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { ImageField } from "@/components/ImageField";
import { MarkdownPreview } from "@/components/MarkdownPreview";
import { ConfirmSubmitButton } from "@/components/ui/ConfirmSubmitButton";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { listIngredients } from "@/features/ingredients/data";
import { deleteRecipeAction, updateRecipeAction } from "@/features/recipes/actions";
import { getRecipeDetail } from "@/features/recipes/data";
import { paths } from "@/lib/paths";

export default async function RecipeDetailPage({
  params
}: {
  params: Promise<{ id: string; recipeId: string }>;
}) {
  const { id: kitchenId, recipeId } = await params;
  const recipe = await getRecipeDetail(recipeId);

  if (!recipe || recipe.kitchenId !== kitchenId) {
    notFound();
  }

  const ingredients = await listIngredients({ kitchenId });
  const updateAction = updateRecipeAction.bind(null, recipe.id);
  const deleteAction = deleteRecipeAction.bind(null, recipe.id, kitchenId);
  const selectedRows = [
    ...recipe.recipeIngredients.map((item) => ({
      ingredientId: item.ingredientId,
      amount: item.amount,
      unit: item.unit,
      note: item.note
    })),
    ...Array.from({
      length: Math.max(3, 5 - recipe.recipeIngredients.length)
    }).map(() => ({
      ingredientId: "",
      amount: "",
      unit: "",
      note: ""
    }))
  ];
  const stepRows = [
    ...recipe.steps.map((step) => ({
      title: step.title,
      description: step.description
    })),
    ...Array.from({
      length: Math.max(2, 4 - recipe.steps.length)
    }).map(() => ({
      title: "",
      description: ""
    }))
  ];

  return (
    <>
      <section className="page-header">
        <p className="eyebrow">{recipe.kitchen.name}</p>
        <h1 className="page-title">{recipe.title}</h1>
        <p className="muted">{recipe.description || "설명이 없습니다."}</p>
      </section>

      <section className="split">
        <form action={updateAction} className="form">
          <input type="hidden" name="kitchenId" value={kitchenId} />
          <input type="hidden" name="existingCoverImage" value={recipe.coverImage || ""} />
          <ImageField currentImage={recipe.coverImage} />
          <div className="field">
            <label htmlFor="title">메뉴명</label>
            <input className="input" id="title" name="title" defaultValue={recipe.title} required />
          </div>
          <div className="field">
            <label htmlFor="description">간단 설명</label>
            <textarea className="textarea" id="description" name="description" defaultValue={recipe.description} />
          </div>
          <h2>재료 블록</h2>
          {selectedRows.map((row, index) => (
            <div className="grid" key={`${row.ingredientId}-${index}`}>
              <select className="select" name="ingredientId" defaultValue={row.ingredientId}>
                <option value="">재료 선택</option>
                {ingredients.map((ingredient) => (
                  <option value={ingredient.id} key={ingredient.id}>
                    {ingredient.name}
                  </option>
                ))}
              </select>
              <input className="input" name="amount" defaultValue={row.amount} placeholder="수량" />
              <input className="input" name="unit" defaultValue={row.unit} placeholder="단위" />
              <input className="input" name="note" defaultValue={row.note} placeholder="메모" />
            </div>
          ))}
          <h2>조리 순서</h2>
          {stepRows.map((row, index) => (
            <div className="grid" key={`${row.title}-${index}`}>
              <input className="input" name="stepTitle" defaultValue={row.title} placeholder={`Step ${index + 1}`} />
              <textarea className="textarea" name="stepDescription" defaultValue={row.description} placeholder="설명" />
            </div>
          ))}
          <div className="field">
            <label htmlFor="markdownContent">Markdown 본문</label>
            <textarea
              className="textarea"
              id="markdownContent"
              name="markdownContent"
              defaultValue={recipe.markdownContent}
            />
          </div>
          <div className="button-row">
            <SubmitButton>Recipe 저장</SubmitButton>
          </div>
        </form>

        <aside className="card">
          <h2>재료 연결</h2>
          <div className="tag-row">
            {recipe.recipeIngredients.map((item) => (
              <Link className="tag" href={paths.ingredient(item.ingredientId)} key={item.id}>
                {item.ingredient.name}
              </Link>
            ))}
          </div>
          <h2>Markdown Preview</h2>
          <MarkdownPreview content={recipe.markdownContent} />
          <form action={deleteAction}>
            <ConfirmSubmitButton message="이 레시피를 삭제할까요?">Recipe 삭제</ConfirmSubmitButton>
          </form>
        </aside>
      </section>
    </>
  );
}
```

- [ ] **Step 8: Verify Recipe flow**

Run:

```bash
npm run typecheck
npm run lint
npm run test -- tests/recipes.test.ts
```

Expected: all commands exit 0.

- [ ] **Step 9: Commit**

```bash
git add src/features/recipes/data.ts src/features/recipes/actions.ts tests/recipes.test.ts src/app/kitchens/[id]/page.tsx src/app/kitchens/[id]/recipes/new/page.tsx src/app/kitchens/[id]/recipes/[recipeId]/page.tsx
git commit -m "feat: add recipe editing"
```

## Task 7: Share Links And Read-Only Shared Pages

**Files:**
- Create: `src/features/shares/data.ts`
- Create: `src/features/shares/actions.ts`
- Create: `tests/shares.test.ts`
- Create: `src/app/shared/[shareId]/page.tsx`
- Modify: `src/app/kitchens/[id]/page.tsx`
- Modify: `src/app/kitchens/[id]/recipes/[recipeId]/page.tsx`

- [ ] **Step 1: Write failing ShareLink tests**

Create `tests/shares.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createKitchen } from "@/features/kitchens/data";
import { createRecipe } from "@/features/recipes/data";
import { createShareLink, resolveShareLink } from "@/features/shares/data";
import { withTestDb } from "./helpers/test-db";

describe("share links", () => {
  it("creates and resolves a recipe share link", async () => {
    await withTestDb(async (db) => {
      const kitchen = await createKitchen({ name: "My Kitchen" }, db);
      const recipe = await createRecipe({ kitchenId: kitchen.id, title: "김치찌개" }, db);

      const share = await createShareLink({ type: "RECIPE", targetId: recipe.id }, db);
      const resolved = await resolveShareLink(share.token, db);

      expect(resolved?.share.type).toBe("RECIPE");
      expect(resolved?.recipe?.title).toBe("김치찌개");
    });
  });

  it("rejects expired share links", async () => {
    await withTestDb(async (db) => {
      const kitchen = await createKitchen({ name: "My Kitchen" }, db);
      const share = await createShareLink(
        { type: "KITCHEN", targetId: kitchen.id, expiresAt: new Date(Date.now() - 1000) },
        db
      );

      const resolved = await resolveShareLink(share.token, db);
      expect(resolved?.expired).toBe(true);
      expect(resolved?.kitchen).toBeNull();
    });
  });
});
```

- [ ] **Step 2: Run failing ShareLink tests**

Run:

```bash
npm run test -- tests/shares.test.ts
```

Expected: FAIL because `src/features/shares/data.ts` does not exist.

- [ ] **Step 3: Implement ShareLink data functions**

Create `src/features/shares/data.ts`:

```ts
import { randomUUID } from "node:crypto";
import type { PrismaClient, ShareTargetType } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";

type Db = PrismaClient;

const shareInputSchema = z.object({
  type: z.enum(["RECIPE", "KITCHEN"]),
  targetId: z.string().min(1),
  expiresAt: z.date().optional().nullable()
});

export type ShareInput = z.input<typeof shareInputSchema>;

export async function createShareLink(input: ShareInput, db: Db = prisma) {
  const parsed = shareInputSchema.parse(input);
  return db.shareLink.create({
    data: {
      type: parsed.type as ShareTargetType,
      targetId: parsed.targetId,
      token: randomUUID().replaceAll("-", ""),
      permission: "VIEW",
      expiresAt: parsed.expiresAt || null
    }
  });
}

export async function resolveShareLink(token: string, db: Db = prisma) {
  const share = await db.shareLink.findUnique({
    where: { token }
  });

  if (!share) {
    return null;
  }

  const expired = Boolean(share.expiresAt && share.expiresAt.getTime() < Date.now());
  if (expired) {
    return { share, expired: true, recipe: null, kitchen: null };
  }

  if (share.type === "RECIPE") {
    const recipe = await db.recipe.findUnique({
      where: { id: share.targetId },
      include: {
        kitchen: true,
        recipeIngredients: { orderBy: { order: "asc" }, include: { ingredient: true } },
        steps: { orderBy: { order: "asc" } }
      }
    });
    return { share, expired: false, recipe, kitchen: null };
  }

  const kitchen = await db.kitchen.findUnique({
    where: { id: share.targetId },
    include: {
      recipes: {
        orderBy: { updatedAt: "desc" },
        include: {
          recipeIngredients: {
            take: 4,
            orderBy: { order: "asc" },
            include: { ingredient: true }
          }
        }
      }
    }
  });
  return { share, expired: false, recipe: null, kitchen };
}
```

- [ ] **Step 4: Run ShareLink tests**

Run:

```bash
npm run test -- tests/shares.test.ts
```

Expected: PASS.

- [ ] **Step 5: Implement ShareLink server actions**

Create `src/features/shares/actions.ts`:

```ts
"use server";

import { redirect } from "next/navigation";
import { createShareLink } from "./data";
import { paths } from "@/lib/paths";

export async function createRecipeShareAction(recipeId: string) {
  const share = await createShareLink({ type: "RECIPE", targetId: recipeId });
  redirect(paths.shared(share.token));
}

export async function createKitchenShareAction(kitchenId: string) {
  const share = await createShareLink({ type: "KITCHEN", targetId: kitchenId });
  redirect(paths.shared(share.token));
}
```

- [ ] **Step 6: Implement shared page**

Create `src/app/shared/[shareId]/page.tsx`:

```tsx
import Image from "next/image";
import Link from "next/link";
import { MarkdownPreview } from "@/components/MarkdownPreview";
import { resolveShareLink } from "@/features/shares/data";
import { paths } from "@/lib/paths";

export default async function SharedPage({
  params
}: {
  params: Promise<{ shareId: string }>;
}) {
  const { shareId } = await params;
  const resolved = await resolveShareLink(shareId);

  if (!resolved) {
    return <p className="card">공유 링크를 찾을 수 없습니다.</p>;
  }

  if (resolved.expired) {
    return <p className="card">공유 링크가 만료되었습니다.</p>;
  }

  if (resolved.recipe) {
    const recipe = resolved.recipe;
    return (
      <>
        <section className="page-header">
          <p className="eyebrow">Shared Recipe</p>
          <h1 className="page-title">{recipe.title}</h1>
          <p className="muted">{recipe.description}</p>
        </section>
        <article className="card">
          {recipe.coverImage && (
            <div className="media">
              <Image src={recipe.coverImage} alt="" width={900} height={675} />
            </div>
          )}
          <div className="tag-row">
            {recipe.recipeIngredients.map((item) => (
              <span className="tag" key={item.id}>
                {item.ingredient.name} {[item.amount, item.unit].filter(Boolean).join(" ")}
              </span>
            ))}
          </div>
          <MarkdownPreview content={recipe.markdownContent} />
        </article>
      </>
    );
  }

  if (resolved.kitchen) {
    return (
      <>
        <section className="page-header">
          <p className="eyebrow">Shared Kitchen</p>
          <h1 className="page-title">{resolved.kitchen.name}</h1>
          <p className="muted">{resolved.kitchen.description}</p>
        </section>
        <section className="grid">
          {resolved.kitchen.recipes.map((recipe) => (
            <Link className="card" href={paths.recipe(recipe.kitchenId, recipe.id)} key={recipe.id}>
              <h2>{recipe.title}</h2>
              <p className="muted">{recipe.description}</p>
              <div className="tag-row">
                {recipe.recipeIngredients.map((item) => (
                  <span className="tag" key={item.id}>
                    {item.ingredient.name}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </section>
      </>
    );
  }

  return <p className="card">공유 대상을 찾을 수 없습니다.</p>;
}
```

- [ ] **Step 7: Add share buttons to Kitchen and Recipe pages**

Modify `src/app/kitchens/[id]/page.tsx`:

```tsx
import { createKitchenShareAction } from "@/features/shares/actions";
```

Inside `KitchenDetailPage`, after `if (!kitchen) { notFound(); }`, add:

```tsx
const shareAction = createKitchenShareAction.bind(null, kitchen.id);
```

Inside the existing `.button-row`, add:

```tsx
<form action={shareAction}>
  <button className="button secondary" type="submit">
    공유 링크 만들기
  </button>
</form>
```

Modify `src/app/kitchens/[id]/recipes/[recipeId]/page.tsx`:

```tsx
import { createRecipeShareAction } from "@/features/shares/actions";
```

Inside `RecipeDetailPage`, after `const deleteAction = deleteRecipeAction.bind(null, recipe.id, kitchenId);`, add:

```tsx
const shareAction = createRecipeShareAction.bind(null, recipe.id);
```

Inside the aside card before the delete form, add:

```tsx
<form action={shareAction}>
  <button className="button secondary" type="submit">
    공유 링크 만들기
  </button>
</form>
```

- [ ] **Step 8: Verify ShareLink flow**

Run:

```bash
npm run typecheck
npm run lint
npm run test -- tests/shares.test.ts
```

Expected: all commands exit 0.

- [ ] **Step 9: Commit**

```bash
git add src/features/shares/data.ts src/features/shares/actions.ts tests/shares.test.ts src/app/shared/[shareId]/page.tsx src/app/kitchens/[id]/page.tsx src/app/kitchens/[id]/recipes/[recipeId]/page.tsx
git commit -m "feat: add read-only share links"
```

## Task 8: Smoke Test And Final Verification

**Files:**
- Create: `tests/smoke.spec.ts`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Write Playwright smoke test**

Create `tests/smoke.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("core local MVP flow", async ({ page }) => {
  await page.goto("/kitchens");
  await page.getByLabel("Kitchen 이름").fill("Smoke Kitchen");
  await page.getByLabel("설명").fill("Smoke test recipe archive");
  await page.getByRole("button", { name: "Kitchen 생성" }).click();

  await expect(page.getByRole("heading", { name: "Smoke Kitchen" })).toBeVisible();
  await page.getByRole("link", { name: /Recipe 생성/ }).click();

  await page.getByLabel("메뉴명").fill("Smoke Recipe");
  await page.getByLabel("간단 설명").fill("Smoke recipe description");
  await page.getByLabel("Markdown 본문").fill("## Smoke\n- Works");
  await page.getByRole("button", { name: "Recipe 저장" }).click();

  await expect(page.getByRole("heading", { name: "Smoke Recipe" })).toBeVisible();
  await expect(page.getByText("Smoke recipe description")).toBeVisible();
});
```

- [ ] **Step 2: Run full verification**

Run:

```bash
npm run prisma:push
npm run verify
```

Expected: Prisma push exits 0, lint exits 0, typecheck exits 0, unit tests pass, and build exits 0.

- [ ] **Step 3: Run smoke test**

Run:

```bash
npm run test:e2e
```

Expected: mobile and desktop smoke projects pass. If Playwright browsers are missing, run `npx playwright install chromium` and repeat `npm run test:e2e`.

- [ ] **Step 4: Review diff**

Run:

```bash
git status -sb
git diff --stat
```

Expected: only files from this plan are changed.

- [ ] **Step 5: Commit**

```bash
git add tests/smoke.spec.ts src/app/globals.css
git commit -m "test: add mvp smoke coverage"
```

- [ ] **Step 6: Push**

```bash
git push
```

Expected: local `main` pushes to `origin/main`.

## Final Checklist

- [ ] `/` redirects to `/kitchens`.
- [ ] `/kitchens` creates and lists Kitchens.
- [ ] `/kitchens/[id]` shows a recipe gallery for one Kitchen.
- [ ] `/kitchens/[id]/recipes/new` creates a Recipe.
- [ ] `/kitchens/[id]/recipes/[recipeId]` shows and edits a Recipe.
- [ ] `/ingredients` lists Ingredient blocks with Kitchen filtering.
- [ ] `/ingredients/[id]` shows connected Recipes for an Ingredient.
- [ ] `/shared/[shareId]` renders Recipe or Kitchen shares read-only.
- [ ] Representative images save to `public/uploads`.
- [ ] Markdown renders headings, lists, checklists, tables, emphasis, blockquotes, and horizontal rules through `react-markdown` and `remark-gfm`.
- [ ] `npm run verify` exits 0.
- [ ] `npm run test:e2e` exits 0 or the missing browser install command has been run and the test has been repeated successfully.
